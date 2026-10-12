import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { expect, it } from 'vitest';
import { ContentRepository } from '../../../src/main/content/contentRepository';
import { syncBundledContent } from '../../../src/main/content/bundledContentSync';
import { openDatabase } from '../../../src/main/persistence/database';
import { selectMatchContent } from '../../../src/shared/game/boardSelector';
import { gameConfig } from '../../fixtures/contentFactory';

const seedPath = resolve('resources/content/seed.sqlite');
const isNewClue = (id: string) => id.includes('-all-level-expansion-');

it('selects complete matches from the additional topics at every difficulty in both languages', () => {
  const database = openDatabase({ filePath: seedPath, readonly: true });
  try {
    const library = new ContentRepository(database).loadLibrary();
    const additions = library.categorySets.filter((set) => set.clues.every((clue) => isNewClue(clue.id)));
    expect(additions).toHaveLength(600);
    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      for (const language of ['en', 'et'] as const) {
        const selected = selectMatchContent({
          config: gameConfig({ difficulty, language, packIds: library.packs.map((pack) => pack.id) }),
          seed: `additional-content-${difficulty}-${language}`,
          categorySets: additions,
          finalClues: library.finalClues,
        });
        expect(selected.ok, `${difficulty}/${language}`).toBe(true);
        if (!selected.ok) throw new Error('Expected a complete match');
        expect(selected.categorySets).toHaveLength(12);
        expect(selected.categorySets.every((set) => set.difficulty === difficulty && set.name[language]?.trim()
          && set.clues.every((clue) => isNewClue(clue.id) && clue.prompt[language]?.trim() && clue.response[language]?.trim()))).toBe(true);
      }
    }
  } finally {
    database.close();
  }
});

it('adds all three thousand clues to an existing database while preserving user content and history', () => {
  const directory = mkdtempSync(join(tmpdir(), 'quiz-stage-all-difficulty-upgrade-'));
  const filePath = join(directory, 'quiz-stage.sqlite');
  copyFileSync(seedPath, filePath);
  const database = openDatabase({ filePath });
  try {
    const categories = database.prepare("SELECT DISTINCT category_set_id FROM clues WHERE id LIKE '%-all-level-expansion-%'").pluck().all() as string[];
    expect(categories).toHaveLength(600);
    database.prepare("DELETE FROM clues WHERE id LIKE '%-all-level-expansion-%'").run();
    const removeCategory = database.prepare('DELETE FROM category_sets WHERE id = ?');
    database.transaction(() => categories.forEach((id) => removeCategory.run(id)))();
    expect(database.prepare('SELECT COUNT(*) FROM clues').pluck().get()).toBe(8_374);
    database.prepare("INSERT INTO content_packs (id, name, version, source, enabled) VALUES ('user-pack', 'My questions', '1', 'custom', 1)").run();
    database.prepare("INSERT INTO category_sets (id, pack_id, round, difficulty, name_json, macro_topic, enabled) VALUES ('user-set', 'user-pack', 'round-one', 'easy', '{\"en\":\"My topic\",\"et\":\"Minu teema\"}', 'user', 1)").run();
    database.prepare("INSERT INTO clues SELECT 'user-clue', 'user-set', round, tier, value, prompt_json, response_json, explanation_json, accepted_responses_json, source, enabled FROM clues WHERE id = 'built-in-history-easy-expansion-001'").run();
    database.prepare("INSERT INTO matches (id, started_at, updated_at) VALUES ('user-match', 1, 1)").run();
    database.prepare("INSERT INTO seen_clues (clue_id, match_id, seen_at) VALUES ('user-clue', 'user-match', 1)").run();
    database.prepare("UPDATE content_packs SET enabled = 0 WHERE id = 'built-in-history'").run();
    syncBundledContent(database, seedPath);
    syncBundledContent(database, seedPath);
    expect(database.prepare("SELECT COUNT(*) FROM clues WHERE id LIKE '%-all-level-expansion-%'").pluck().get()).toBe(3_000);
    expect(database.prepare('SELECT COUNT(*) FROM clues').pluck().get()).toBe(11_375);
    expect(database.prepare("SELECT COUNT(*) FROM seen_clues WHERE clue_id = 'user-clue' AND match_id = 'user-match'").pluck().get()).toBe(1);
    expect(database.prepare("SELECT enabled FROM content_packs WHERE id = 'built-in-history'").pluck().get()).toBe(0);
    expect(database.pragma('quick_check', { simple: true })).toBe('ok');
  } finally {
    database.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

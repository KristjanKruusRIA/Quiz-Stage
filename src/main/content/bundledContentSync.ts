import type { DatabaseConnection } from '../persistence/database';

export function syncBundledContent(
  database: DatabaseConnection,
  seedPath: string,
): void {
  database.prepare('ATTACH DATABASE ? AS bundled_content').run(seedPath);
  try {
    const bundledPackIds = database.prepare(`
      SELECT id FROM bundled_content.content_packs WHERE id LIKE 'built-in-%' ORDER BY id
    `).pluck().all() as string[];

    const upsertPack = database.prepare(`
      INSERT INTO main.content_packs (id, name, version, source, enabled)
      SELECT id, name, version, source, enabled
      FROM bundled_content.content_packs
      WHERE id = ?
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        version = excluded.version,
        source = excluded.source
    `);
    const upsertCategorySets = database.prepare(`
      INSERT INTO main.category_sets (id, pack_id, round, difficulty, name_json, macro_topic, enabled)
      SELECT id, pack_id, round, difficulty, name_json, macro_topic, enabled
      FROM bundled_content.category_sets
      WHERE pack_id = ?
      ON CONFLICT(id) DO UPDATE SET
        pack_id = excluded.pack_id,
        round = excluded.round,
        difficulty = excluded.difficulty,
        name_json = excluded.name_json,
        macro_topic = excluded.macro_topic,
        enabled = excluded.enabled
    `);
    const upsertClues = database.prepare(`
      INSERT INTO main.clues (
        id, category_set_id, round, tier, value, prompt_json, response_json,
        explanation_json, accepted_responses_json, source, enabled
      )
      SELECT
        clues.id, clues.category_set_id, clues.round, clues.tier, clues.value,
        clues.prompt_json, clues.response_json, clues.explanation_json,
        clues.accepted_responses_json, clues.source, clues.enabled
      FROM bundled_content.clues
      JOIN bundled_content.category_sets ON category_sets.id = clues.category_set_id
      WHERE category_sets.pack_id = ?
      ON CONFLICT(id) DO UPDATE SET
        category_set_id = excluded.category_set_id,
        round = excluded.round,
        tier = excluded.tier,
        value = excluded.value,
        prompt_json = excluded.prompt_json,
        response_json = excluded.response_json,
        explanation_json = excluded.explanation_json,
        accepted_responses_json = excluded.accepted_responses_json,
        source = excluded.source,
        enabled = excluded.enabled
    `);
    const disableObsoleteClues = database.prepare(`
      UPDATE main.clues SET enabled = 0
      WHERE category_set_id IN (SELECT id FROM main.category_sets WHERE pack_id = ?)
        AND id NOT IN (
          SELECT clues.id
          FROM bundled_content.clues
          JOIN bundled_content.category_sets ON category_sets.id = clues.category_set_id
          WHERE category_sets.pack_id = ?
        )
    `);
    const disableObsoleteCategorySets = database.prepare(`
      UPDATE main.category_sets SET enabled = 0
      WHERE pack_id = ?
        AND id NOT IN (SELECT id FROM bundled_content.category_sets WHERE pack_id = ?)
    `);
    const disableRetiredPackClues = database.prepare(`
      UPDATE main.clues SET enabled = 0
      WHERE category_set_id IN (
        SELECT category_sets.id
        FROM main.category_sets
        JOIN main.content_packs ON content_packs.id = category_sets.pack_id
        WHERE content_packs.id LIKE 'built-in-%'
          AND content_packs.id NOT IN (
            SELECT id FROM bundled_content.content_packs WHERE id LIKE 'built-in-%'
          )
      )
    `);
    const disableRetiredPackCategorySets = database.prepare(`
      UPDATE main.category_sets SET enabled = 0
      WHERE pack_id LIKE 'built-in-%'
        AND pack_id NOT IN (
          SELECT id FROM bundled_content.content_packs WHERE id LIKE 'built-in-%'
        )
    `);
    const disableRetiredPacks = database.prepare(`
      UPDATE main.content_packs SET enabled = 0
      WHERE id LIKE 'built-in-%'
        AND id NOT IN (SELECT id FROM bundled_content.content_packs WHERE id LIKE 'built-in-%')
    `);
    const sync = database.transaction(() => {
      for (const packId of bundledPackIds) {
        upsertPack.run(packId);
        upsertCategorySets.run(packId);
        upsertClues.run(packId);
        disableObsoleteClues.run(packId, packId);
        disableObsoleteCategorySets.run(packId, packId);
      }
      disableRetiredPackClues.run();
      disableRetiredPackCategorySets.run();
      disableRetiredPacks.run();
    });
    sync();
  } finally {
    database.exec('DETACH DATABASE bundled_content');
  }
}

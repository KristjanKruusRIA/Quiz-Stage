import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseConnection } from '../persistence/database';
import {
  contentClueActionSchema,
  createContentPackRequestSchema,
  deleteContentPackRequestSchema,
  editorCategorySetSchema,
  editorFinalClueSchema,
  editorLibrarySchema,
  editorPackSchema,
  reportContentClueRequestSchema,
  saveCategorySetRequestSchema,
  saveFinalClueRequestSchema,
  type EditorCategorySet,
  type EditorClue,
  type EditorFinalClue,
  type EditorLibrary,
  type EditorPack,
  type EditorSource,
} from '../../shared/content/editor';
import { contentOverrideSchema, localizedTextSchema } from '../../shared/content/schema';
import type { ContentRepository } from './contentRepository';
import { isLocalizedClueComplete } from '../../shared/content/localizedCompleteness';

interface PackRow { id: string; name: string; version: string; source: string; enabled: number }
interface CategoryRow {
  id: string; pack_id: string; round: 'round-one' | 'round-two' | 'final' | 'tiebreaker';
  difficulty: 'easy' | 'medium' | 'hard'; name_json: string; macro_topic: string; enabled: number;
  category_override_json: string | null;
}
interface ClueRow {
  id: string; category_set_id: string; round: 'round-one' | 'round-two' | 'final' | 'tiebreaker';
  tier: number; value: number; prompt_json: string; response_json: string; explanation_json: string;
  accepted_responses_json: string | null; source: string; enabled: number; override_json: string | null;
  reported: number;
  report_id: number | null; report_created_at: number | null;
}

interface StoredSource {
  format: 'quiz-stage-csv-v1'; title: string; url: string; license: string;
  retrievedAt: string; translationStatus: 'untranslated' | 'machine' | 'reviewed';
}

const isCustom = (source: string) => source === 'custom-csv' || source === 'custom-editor';
const revision = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
type WritableClue = Omit<EditorClue, 'id'> & { id: string | null };

function parseLocalized(value: string) {
  return localizedTextSchema.parse(JSON.parse(value));
}

function parseSource(value: string, overrideTitle?: string): EditorSource {
  try {
    const parsed = JSON.parse(value) as Partial<StoredSource>;
    if (parsed.format === 'quiz-stage-csv-v1'
      && typeof parsed.title === 'string' && typeof parsed.url === 'string'
      && typeof parsed.license === 'string' && typeof parsed.retrievedAt === 'string'
      && (parsed.translationStatus === 'untranslated' || parsed.translationStatus === 'machine'
        || parsed.translationStatus === 'reviewed')) {
      return {
        title: overrideTitle ?? parsed.title,
        url: parsed.url,
        license: parsed.license,
        retrievedAt: parsed.retrievedAt,
        translationStatus: parsed.translationStatus,
      };
    }
  } catch {
    // Legacy bundled sources are plain authoring titles.
  }
  return { title: overrideTitle ?? value, url: null, license: null, retrievedAt: null, translationStatus: null };
}

function storeSource(source: EditorSource): string {
  if (source.url === null || source.license === null || source.retrievedAt === null
    || source.translationStatus === null) throw new Error('Custom clues require complete source metadata');
  return JSON.stringify({
    format: 'quiz-stage-csv-v1', title: source.title, url: source.url, license: source.license,
    retrievedAt: source.retrievedAt, translationStatus: source.translationStatus,
  } satisfies StoredSource);
}

function languageEligible(name: { en: string; et?: string }, clues: readonly EditorClue[]) {
  const enabled = clues.every((clue) => clue.enabled && !clue.reported);
  return {
    en: enabled && clues.length > 0,
    et: enabled && name.et !== undefined && clues.every((clue) => isLocalizedClueComplete(clue, 'et')),
  };
}

export interface ContentEditorServiceOptions { now?: () => number; createId?: () => string }

export class ContentEditorService {
  private readonly now: () => number;
  private readonly createId: () => string;

  constructor(
    private readonly database: DatabaseConnection,
    private readonly repository: ContentRepository,
    options: ContentEditorServiceOptions = {},
  ) {
    this.now = options.now ?? Date.now;
    this.createId = options.createId ?? randomUUID;
  }

  list(): EditorLibrary {
    const packRows = this.database.prepare(
      'SELECT id, name, version, source, enabled FROM content_packs ORDER BY id',
    ).all() as PackRow[];
    const categoryRows = this.database.prepare(`
      SELECT category_sets.id, category_sets.pack_id, category_sets.round, category_sets.difficulty,
        category_sets.name_json, category_sets.macro_topic, category_sets.enabled,
        category_set_overrides.override_json AS category_override_json
      FROM category_sets LEFT JOIN category_set_overrides
        ON category_set_overrides.category_set_id = category_sets.id
      ORDER BY category_sets.id
    `).all() as CategoryRow[];
    const clueRows = this.database.prepare(`
      SELECT clues.id, clues.category_set_id, clues.round, clues.tier, clues.value,
        clues.prompt_json, clues.response_json, clues.explanation_json, clues.accepted_responses_json,
        clues.source, clues.enabled, content_overrides.override_json,
        EXISTS (SELECT 1 FROM content_reports
          WHERE content_reports.clue_id = clues.id AND content_reports.resolved_at IS NULL) AS reported,
        (SELECT id FROM content_reports WHERE content_reports.clue_id = clues.id
          AND resolved_at IS NULL ORDER BY id DESC LIMIT 1) AS report_id,
        (SELECT created_at FROM content_reports WHERE content_reports.clue_id = clues.id
          AND resolved_at IS NULL ORDER BY id DESC LIMIT 1) AS report_created_at
      FROM clues LEFT JOIN content_overrides ON content_overrides.clue_id = clues.id
      ORDER BY clues.category_set_id, clues.tier, clues.id
    `).all() as ClueRow[];
    const cluesByCategory = new Map<string, ClueRow[]>();
    for (const clue of clueRows) {
      const rows = cluesByCategory.get(clue.category_set_id) ?? [];
      rows.push(clue);
      cluesByCategory.set(clue.category_set_id, rows);
    }
    const categoriesByPack = new Map<string, CategoryRow[]>();
    for (const category of categoryRows) {
      const rows = categoriesByPack.get(category.pack_id) ?? [];
      rows.push(category);
      categoriesByPack.set(category.pack_id, rows);
    }

    const packs = packRows.map((packRow) => this.mapPack(
      packRow, categoriesByPack.get(packRow.id) ?? [], cluesByCategory,
    ));
    packs.sort((left, right) => {
      const leftReported = left.categorySets.some((set) => set.clues.some((clue) => clue.reported))
        || left.finalClues.some((final) => final.clue.reported);
      const rightReported = right.categorySets.some((set) => set.clues.some((clue) => clue.reported))
        || right.finalClues.some((final) => final.clue.reported);
      return Number(rightReported) - Number(leftReported) || left.name.localeCompare(right.name);
    });
    return editorLibrarySchema.parse({ packs, reports: this.repository.listReported() });
  }

  createPack(input: unknown): EditorPack {
    const { name } = createContentPackRequestSchema.parse(input);
    return this.repository.runTransaction(() => {
      let id = '';
      for (let attempt = 0; attempt < 100; attempt += 1) {
        const candidate = `custom-${this.createId()}`;
        const exists = this.database.prepare(`
          SELECT 1 FROM content_packs WHERE id = ?
          UNION SELECT 1 FROM category_sets WHERE id = ?
          UNION SELECT 1 FROM clues WHERE id = ?
        `).get(candidate, candidate, candidate);
        if (exists === undefined) { id = candidate; break; }
      }
      if (id === '') throw new Error('Could not create a unique custom pack ID');
      this.database.prepare(`
        INSERT INTO content_packs (id, name, version, source, enabled) VALUES (?, ?, '1', 'custom-editor', 1)
      `).run(id, name);
      return this.requirePack(id);
    });
  }

  deletePack(input: unknown): { packId: string } {
    const parsed = deleteContentPackRequestSchema.parse(input);
    return this.repository.runTransaction(() => {
      const pack = this.requirePack(parsed.packId);
      if (pack.ownership !== 'custom') throw new Error('Bundled packs cannot be deleted');
      if (pack.revision !== parsed.expectedRevision) throw new Error('STALE_CONTENT_REVISION');
      const protectedCount = this.database.prepare(`
        SELECT
          (SELECT COUNT(*) FROM content_overrides WHERE clue_id IN (
            SELECT clues.id FROM clues JOIN category_sets ON category_sets.id = clues.category_set_id
            WHERE category_sets.pack_id = ?))
          + (SELECT COUNT(*) FROM content_reports WHERE clue_id IN (
            SELECT clues.id FROM clues JOIN category_sets ON category_sets.id = clues.category_set_id
            WHERE category_sets.pack_id = ?))
          + (SELECT COUNT(*) FROM seen_clues WHERE clue_id IN (
            SELECT clues.id FROM clues JOIN category_sets ON category_sets.id = clues.category_set_id
            WHERE category_sets.pack_id = ?))
      `).pluck().get(parsed.packId, parsed.packId, parsed.packId) as number;
      if (protectedCount > 0) throw new Error('Custom pack is protected by reports, overrides, or match history');
      this.database.prepare('DELETE FROM content_packs WHERE id = ?').run(parsed.packId);
      return { packId: parsed.packId };
    });
  }

  saveCategorySet(input: unknown): EditorCategorySet {
    const parsed = saveCategorySetRequestSchema.parse(input);
    return this.repository.runTransaction(() => {
      const draft = parsed.categorySet;
      if (draft.id === null) {
        const pack = this.requirePack(draft.packId);
        if (pack.ownership !== 'custom') throw new Error('New category sets require a custom pack');
        if (pack.revision !== parsed.expectedRevision) throw new Error('STALE_CONTENT_REVISION');
        this.validateCustomCategory(draft);
        const categoryId = this.newId('category');
        this.database.prepare(`
          INSERT INTO category_sets (id, pack_id, round, difficulty, name_json, macro_topic, enabled)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(categoryId, draft.packId, draft.round, draft.difficulty, JSON.stringify(draft.name), draft.macroTopic, Number(draft.enabled));
        for (const clue of draft.clues) this.insertCustomClue(categoryId, draft.round, clue);
        return this.requireCategory(categoryId);
      }

      const current = this.requireCategory(draft.id);
      if (current.revision !== parsed.expectedRevision) throw new Error('STALE_CONTENT_REVISION');
      this.assertCategoryIdentity(current, draft);
      if (current.ownership === 'bundled') {
        const metadata = {
          id: draft.id, packId: draft.packId, round: draft.round, difficulty: draft.difficulty,
          name: draft.name, macroTopic: draft.macroTopic, enabled: draft.enabled,
        };
        this.database.prepare(`
          INSERT INTO category_set_overrides (category_set_id, override_json, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(category_set_id) DO UPDATE SET override_json = excluded.override_json,
            updated_at = excluded.updated_at WHERE override_json <> excluded.override_json
        `).run(draft.id, JSON.stringify(metadata), this.now());
        for (const clue of draft.clues) {
          if (clue.id === null) throw new Error('Bundled clue identity is required');
          const oldClue = current.clues.find((candidate) => candidate.id === clue.id)!;
          if (JSON.stringify(clue) === JSON.stringify(oldClue)) continue;
          contentOverrideSchema.parse({
            id: clue.id, categoryId: draft.id, round: draft.round, tier: clue.tier, value: clue.value,
            prompt: clue.prompt, response: clue.response, explanation: clue.explanation,
            ...(clue.acceptedResponses === undefined ? {} : { acceptedResponses: clue.acceptedResponses }),
            source: clue.source.title, enabled: clue.enabled,
          });
          this.repository.saveOverride({
            id: clue.id, categoryId: draft.id, round: draft.round, tier: clue.tier, value: clue.value,
            prompt: clue.prompt, response: clue.response, explanation: clue.explanation,
            ...(clue.acceptedResponses === undefined ? {} : { acceptedResponses: clue.acceptedResponses }),
            source: clue.source.title, enabled: clue.enabled,
          });
          this.repository.resolveReport(clue.id, this.now());
        }
      } else {
        this.validateCustomCategory(draft);
        this.database.prepare(`
          UPDATE category_sets SET difficulty = ?, name_json = ?, macro_topic = ?, enabled = ? WHERE id = ?
        `).run(draft.difficulty, JSON.stringify(draft.name), draft.macroTopic, Number(draft.enabled), draft.id);
        for (const clue of draft.clues) {
          this.database.prepare(`
            UPDATE clues SET prompt_json = ?, response_json = ?, explanation_json = ?, accepted_responses_json = ?,
              source = ?, enabled = ? WHERE id = ? AND category_set_id = ?
          `).run(
            JSON.stringify(clue.prompt), JSON.stringify(clue.response), JSON.stringify(clue.explanation),
            clue.acceptedResponses === undefined ? null : JSON.stringify(clue.acceptedResponses),
            storeSource(clue.source), Number(clue.enabled), clue.id, draft.id,
          );
          if (clue.id !== null) this.repository.resolveReport(clue.id, this.now());
        }
      }
      return this.requireCategory(draft.id);
    });
  }

  saveFinalClue(input: unknown): EditorFinalClue {
    const parsed = saveFinalClueRequestSchema.parse(input);
    return this.repository.runTransaction(() => {
      const draft = parsed.finalClue;
      if (draft.id === null) {
        const pack = this.requirePack(draft.packId);
        if (pack.ownership !== 'custom' || pack.revision !== parsed.expectedRevision) {
          throw new Error(pack.ownership !== 'custom' ? 'New Finals require a custom pack' : 'STALE_CONTENT_REVISION');
        }
        const source = storeSource(draft.clue.source);
        const categoryId = this.newId('final-category');
        const clueId = this.newId('final-clue');
        this.database.prepare(`
          INSERT INTO category_sets (id, pack_id, round, difficulty, name_json, macro_topic, enabled)
          VALUES (?, ?, 'final', ?, ?, ?, ?)
        `).run(categoryId, draft.packId, draft.difficulty, JSON.stringify(draft.categoryName), draft.macroTopic, Number(draft.enabled));
        this.database.prepare(`
          INSERT INTO clues (id, category_set_id, round, tier, value, prompt_json, response_json,
            explanation_json, accepted_responses_json, source, enabled)
          VALUES (?, ?, 'final', 0, 0, ?, ?, ?, ?, ?, ?)
        `).run(clueId, categoryId, JSON.stringify(draft.clue.prompt), JSON.stringify(draft.clue.response),
          JSON.stringify(draft.clue.explanation), draft.clue.acceptedResponses === undefined ? null : JSON.stringify(draft.clue.acceptedResponses),
          source, Number(draft.clue.enabled));
        return this.requireFinal(clueId);
      }
      const current = this.requireFinal(draft.id);
      if (current.revision !== parsed.expectedRevision) throw new Error('STALE_CONTENT_REVISION');
      if (draft.packId !== current.packId || draft.categoryId !== current.categoryId
        || draft.clue.id !== current.clue.id || draft.clue.tier !== 0 || draft.clue.value !== 0) {
        throw new Error('Stable Final identity cannot change');
      }
      if (current.ownership === 'bundled') {
        const metadata = { id: draft.categoryId, packId: draft.packId, round: 'final', difficulty: draft.difficulty,
          name: draft.categoryName, macroTopic: draft.macroTopic, enabled: draft.enabled };
        this.database.prepare(`
          INSERT INTO category_set_overrides (category_set_id, override_json, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(category_set_id) DO UPDATE SET override_json = excluded.override_json,
            updated_at = excluded.updated_at WHERE override_json <> excluded.override_json
        `).run(draft.categoryId, JSON.stringify(metadata), this.now());
        if (JSON.stringify(draft.clue) !== JSON.stringify(current.clue)) {
          this.repository.saveOverride({
            id: draft.clue.id, packId: draft.packId, categoryId: draft.categoryId,
            categoryName: draft.categoryName, difficulty: draft.difficulty, round: 'final', tier: 0, value: 0,
            prompt: draft.clue.prompt, response: draft.clue.response, explanation: draft.clue.explanation,
            ...(draft.clue.acceptedResponses === undefined ? {} : { acceptedResponses: draft.clue.acceptedResponses }),
            source: draft.clue.source.title, enabled: draft.clue.enabled,
          });
          this.repository.resolveReport(draft.clue.id, this.now());
        }
      } else {
        storeSource(draft.clue.source);
        this.database.prepare('UPDATE category_sets SET difficulty = ?, name_json = ?, macro_topic = ?, enabled = ? WHERE id = ?')
          .run(draft.difficulty, JSON.stringify(draft.categoryName), draft.macroTopic, Number(draft.enabled), draft.categoryId);
        this.database.prepare(`UPDATE clues SET prompt_json = ?, response_json = ?, explanation_json = ?,
          accepted_responses_json = ?, source = ?, enabled = ? WHERE id = ?`).run(
          JSON.stringify(draft.clue.prompt), JSON.stringify(draft.clue.response), JSON.stringify(draft.clue.explanation),
          draft.clue.acceptedResponses === undefined ? null : JSON.stringify(draft.clue.acceptedResponses),
          storeSource(draft.clue.source), Number(draft.clue.enabled), draft.clue.id,
        );
        this.repository.resolveReport(draft.clue.id, this.now());
      }
      return this.requireFinal(draft.id);
    });
  }

  reportClue(input: unknown) {
    const parsed = reportContentClueRequestSchema.parse(input);
    return this.repository.runTransaction(() => {
      const current = this.findEditorForClue(parsed.clueId);
      if (current.revision !== parsed.expectedRevision) throw new Error('STALE_CONTENT_REVISION');
      return this.repository.reportClue({ clueId: parsed.clueId, matchId: null, note: parsed.note, createdAt: this.now() });
    });
  }

  resolveReport(input: unknown): { resolved: boolean } {
    const parsed = contentClueActionSchema.parse(input);
    return this.repository.runTransaction(() => {
      const current = this.findEditorForClue(parsed.clueId);
      if (current.revision !== parsed.expectedRevision) throw new Error('STALE_CONTENT_REVISION');
      const clue = 'clues' in current ? current.clues.find((candidate) => candidate.id === parsed.clueId) : current.clue;
      if (clue?.report?.id !== parsed.reportId) throw new Error('STALE_CONTENT_REPORT');
      return { resolved: this.repository.resolveReportById(parsed.clueId, parsed.reportId, this.now()) };
    });
  }

  private mapPack(pack: PackRow, categories: CategoryRow[], cluesByCategory: Map<string, ClueRow[]>): EditorPack {
    const ownership = isCustom(pack.source) ? 'custom' as const : 'bundled' as const;
    const categorySets: EditorCategorySet[] = [];
    const finalClues: EditorFinalClue[] = [];
    for (const category of categories) {
      const metadata = category.category_override_json === null ? null : JSON.parse(category.category_override_json) as {
        id: string; packId: string; round: string; difficulty: CategoryRow['difficulty'];
        name: { en: string; et?: string }; macroTopic: string; enabled: boolean;
      };
      if (metadata !== null && (metadata.id !== category.id || metadata.packId !== pack.id || metadata.round !== category.round)) {
        throw new Error(`Invalid category metadata override identity: ${category.id}`);
      }
      const categoryName = metadata?.name ?? parseLocalized(category.name_json);
      const categoryDifficulty = metadata?.difficulty ?? category.difficulty;
      const categoryMacroTopic = metadata?.macroTopic ?? category.macro_topic;
      const categoryEnabled = metadata?.enabled ?? category.enabled === 1;
      const clues = (cluesByCategory.get(category.id) ?? []).map((row) => this.mapClue(row));
      if (category.round === 'round-one' || category.round === 'round-two') {
        const eligible = languageEligible(categoryName, clues);
        categorySets.push(editorCategorySetSchema.parse({
          id: category.id, packId: pack.id, revision: revision({ category, metadata, clues }), ownership,
          round: category.round, difficulty: categoryDifficulty, macroTopic: categoryMacroTopic,
          name: categoryName, enabled: categoryEnabled,
          eligibility: { en: pack.enabled === 1 && categoryEnabled && clues.length === 5 && eligible.en,
            et: pack.enabled === 1 && categoryEnabled && clues.length === 5 && eligible.et }, clues,
        }));
      } else if (category.round === 'final' && clues.length === 1) {
        const clue = clues[0];
        const eligible = languageEligible(categoryName, [clue]);
        finalClues.push(editorFinalClueSchema.parse({
          id: clue.id, packId: pack.id, categoryId: category.id,
          revision: revision({ category, metadata, clue }), ownership, difficulty: categoryDifficulty,
          categoryName, macroTopic: categoryMacroTopic,
          enabled: categoryEnabled, eligibility: {
            en: pack.enabled === 1 && categoryEnabled && eligible.en,
            et: pack.enabled === 1 && categoryEnabled && eligible.et,
          }, clue,
        }));
      }
    }
    categorySets.sort((left, right) =>
      Number(right.clues.some((clue) => clue.reported)) - Number(left.clues.some((clue) => clue.reported))
      || left.name.en.localeCompare(right.name.en));
    finalClues.sort((left, right) => Number(right.clue.reported) - Number(left.clue.reported)
      || left.categoryName.en.localeCompare(right.categoryName.en));
    return editorPackSchema.parse({
      id: pack.id, name: pack.name, ownership, enabled: pack.enabled === 1,
      revision: revision({ pack, categories: categorySets.map((set) => set.revision), finals: finalClues.map((final) => final.revision) }),
      categorySets, finalClues,
    });
  }

  private mapClue(row: ClueRow): EditorClue {
    const base = {
      prompt: parseLocalized(row.prompt_json), response: parseLocalized(row.response_json),
      explanation: parseLocalized(row.explanation_json),
      acceptedResponses: row.accepted_responses_json === null ? undefined : parseLocalized(row.accepted_responses_json),
      source: row.source, enabled: row.enabled === 1,
    };
    const override = row.override_json === null ? null : contentOverrideSchema.parse(JSON.parse(row.override_json));
    return {
      id: row.id, tier: row.tier, value: row.value,
      prompt: override?.prompt ?? base.prompt,
      response: override?.response ?? base.response,
      explanation: override?.explanation ?? base.explanation,
      ...((override?.acceptedResponses ?? base.acceptedResponses) === undefined ? {} : {
        acceptedResponses: override?.acceptedResponses ?? base.acceptedResponses,
      }),
      source: parseSource(row.source, override?.source),
      enabled: override?.enabled ?? base.enabled,
      reported: row.reported === 1,
      report: row.report_id === null || row.report_created_at === null ? null : { id: row.report_id, createdAt: row.report_created_at },
    };
  }

  private requirePack(id: string): EditorPack {
    const pack = this.list().packs.find((candidate) => candidate.id === id);
    if (pack === undefined) throw new Error(`Unknown content pack: ${id}`);
    return pack;
  }

  private findEditorForClue(clueId: string): EditorCategorySet | EditorFinalClue {
    for (const pack of this.list().packs) {
      for (const category of pack.categorySets) if (category.clues.some((clue) => clue.id === clueId)) return category;
      const final = pack.finalClues.find((candidate) => candidate.clue.id === clueId);
      if (final !== undefined) return final;
    }
    throw new Error(`Unknown content clue: ${clueId}`);
  }

  private requireCategory(id: string): EditorCategorySet {
    for (const pack of this.list().packs) {
      const category = pack.categorySets.find((candidate) => candidate.id === id);
      if (category !== undefined) return category;
    }
    throw new Error(`Unknown category set: ${id}`);
  }

  private requireFinal(id: string): EditorFinalClue {
    for (const pack of this.list().packs) {
      const clue = pack.finalClues.find((candidate) => candidate.id === id);
      if (clue !== undefined) return clue;
    }
    throw new Error(`Unknown Final clue: ${id}`);
  }

  private newId(prefix: string): string {
    for (let attempt = 0; attempt < 100; attempt += 1) {
      const id = `${prefix}-${this.createId()}`;
      const exists = this.database.prepare(`
        SELECT 1 FROM content_packs WHERE id = ? UNION SELECT 1 FROM category_sets WHERE id = ?
        UNION SELECT 1 FROM clues WHERE id = ?
      `).get(id, id, id);
      if (exists === undefined) return id;
    }
    throw new Error('Could not generate a unique content ID');
  }

  private validateCustomCategory(category: { round: 'round-one' | 'round-two'; clues: readonly WritableClue[] }) {
    const tiers = category.clues.map((clue) => clue.tier).sort((left, right) => left - right);
    if (tiers.join(',') !== '1,2,3,4,5') throw new Error('A category set must contain tiers 1 through 5');
    for (const clue of category.clues) {
      const expected = clue.tier * (category.round === 'round-one' ? 200 : 400);
      if (clue.value !== expected) throw new Error(`Tier ${clue.tier} has an invalid clue value`);
      storeSource(clue.source);
    }
  }

  private insertCustomClue(categoryId: string, round: 'round-one' | 'round-two', clue: WritableClue) {
    const id = this.newId('clue');
    this.database.prepare(`
      INSERT INTO clues (id, category_set_id, round, tier, value, prompt_json, response_json,
        explanation_json, accepted_responses_json, source, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, categoryId, round, clue.tier, clue.value, JSON.stringify(clue.prompt), JSON.stringify(clue.response),
      JSON.stringify(clue.explanation), clue.acceptedResponses === undefined ? null : JSON.stringify(clue.acceptedResponses),
      storeSource(clue.source), Number(clue.enabled));
  }

  private assertCategoryIdentity(current: EditorCategorySet, draft: EditorCategorySet) {
    if (draft.packId !== current.packId || draft.round !== current.round || draft.clues.length !== 5) {
      throw new Error('Stable category identity cannot change');
    }
    for (let index = 0; index < 5; index += 1) {
      if (draft.clues[index].id !== current.clues[index].id || draft.clues[index].tier !== current.clues[index].tier
        || draft.clues[index].value !== current.clues[index].value) throw new Error('Stable clue identity cannot change');
    }
  }
}

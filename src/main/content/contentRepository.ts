import type { DatabaseConnection } from '../persistence/database';
import {
  contentCategorySetSchema,
  contentClueSchema,
  contentFinalClueSchema,
  contentPackSchema,
  localizedTextSchema,
  type ContentCategorySetRecord,
  type ContentClueRecord,
  type ContentFinalClueRecord,
  type ContentPackRecord,
} from '../../shared/content/schema';

interface PackRow {
  id: string;
  name: string;
  version: string;
  source: string;
  enabled: number;
}

interface CategoryRow {
  category_id: string;
  pack_id: string;
  category_round: 'round-one' | 'round-two';
  difficulty: 'easy' | 'medium' | 'hard';
  name_json: string;
  macro_topic: string;
  category_enabled: number;
  category_last_seen_at: number | null;
  clue_id: string;
  clue_round: 'round-one' | 'round-two';
  tier: number;
  value: number;
  prompt_json: string;
  response_json: string;
  explanation_json: string;
  accepted_responses_json: string | null;
  source: string;
  clue_enabled: number;
}

interface FinalRow {
  clue_id: string;
  pack_id: string;
  clue_enabled: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category_id: string;
  category_name_json: string;
  tier: number;
  value: number;
  prompt_json: string;
  response_json: string;
  explanation_json: string;
  accepted_responses_json: string | null;
  source: string;
  last_seen_at: number | null;
}

export interface PersistedContentLibrary {
  packs: ContentPackRecord[];
  categorySets: ContentCategorySetRecord[];
  finalClues: ContentFinalClueRecord[];
}

export class ContentRepository {
  constructor(private readonly database: DatabaseConnection) {}

  loadLibrary(): PersistedContentLibrary {
    return {
      packs: this.loadPacks(),
      categorySets: this.loadCategorySets(),
      finalClues: this.loadFinalClues(),
    };
  }

  private loadPacks(): ContentPackRecord[] {
    const rows = this.database.prepare(`
      SELECT id, name, version, source, enabled
      FROM content_packs
      ORDER BY id
    `).all() as PackRow[];
    return rows.map((row) => contentPackSchema.parse({
      id: row.id,
      name: row.name,
      version: row.version,
      source: row.source,
      enabled: row.enabled === 1,
    }));
  }

  private loadCategorySets(): ContentCategorySetRecord[] {
    const rows = this.database.prepare(`
      SELECT
        category_sets.id AS category_id,
        category_sets.pack_id,
        category_sets.round AS category_round,
        category_sets.difficulty,
        category_sets.name_json,
        category_sets.macro_topic,
        category_sets.enabled AS category_enabled,
        (
          SELECT MAX(seen_clues.seen_at)
          FROM seen_clues
          JOIN clues AS seen_category_clues ON seen_category_clues.id = seen_clues.clue_id
          WHERE seen_category_clues.category_set_id = category_sets.id
        ) AS category_last_seen_at,
        clues.id AS clue_id,
        clues.round AS clue_round,
        clues.tier,
        clues.value,
        clues.prompt_json,
        clues.response_json,
        clues.explanation_json,
        clues.accepted_responses_json,
        clues.source,
        clues.enabled AS clue_enabled
      FROM category_sets
      JOIN content_packs ON content_packs.id = category_sets.pack_id
      JOIN clues ON clues.category_set_id = category_sets.id
      WHERE content_packs.enabled = 1
        AND category_sets.round IN ('round-one', 'round-two')
      ORDER BY category_sets.id, clues.tier, clues.id
    `).all() as CategoryRow[];
    const grouped = new Map<string, { row: CategoryRow; clues: ContentClueRecord[] }>();

    for (const row of rows) {
      const group = grouped.get(row.category_id) ?? { row, clues: [] };
      group.clues.push(this.mapClue(row));
      grouped.set(row.category_id, group);
    }

    return [...grouped.values()].map(({ row, clues }) => contentCategorySetSchema.parse({
      id: row.category_id,
      packId: row.pack_id,
      round: row.category_round,
      difficulty: row.difficulty,
      name: this.parseLocalized(row.name_json),
      macroTopic: row.macro_topic,
      enabled: row.category_enabled === 1,
      clues,
      lastSeenAt: row.category_last_seen_at,
    }));
  }

  private loadFinalClues(): ContentFinalClueRecord[] {
    const rows = this.database.prepare(`
      SELECT
        clues.id AS clue_id,
        category_sets.pack_id,
        clues.enabled AS clue_enabled,
        category_sets.difficulty,
        category_sets.id AS category_id,
        category_sets.name_json AS category_name_json,
        clues.tier,
        clues.value,
        clues.prompt_json,
        clues.response_json,
        clues.explanation_json,
        clues.accepted_responses_json,
        clues.source,
        MAX(seen_clues.seen_at) AS last_seen_at
      FROM clues
      JOIN category_sets ON category_sets.id = clues.category_set_id
      JOIN content_packs ON content_packs.id = category_sets.pack_id
      LEFT JOIN seen_clues ON seen_clues.clue_id = clues.id
      WHERE content_packs.enabled = 1
        AND category_sets.enabled = 1
        AND category_sets.round = 'final'
        AND clues.round = 'final'
      GROUP BY clues.id
      ORDER BY clues.id
    `).all() as FinalRow[];

    return rows.map((row) => contentFinalClueSchema.parse({
      id: row.clue_id,
      packId: row.pack_id,
      enabled: row.clue_enabled === 1,
      difficulty: row.difficulty,
      categoryId: row.category_id,
      categoryName: this.parseLocalized(row.category_name_json),
      round: 'final',
      tier: row.tier,
      value: row.value,
      prompt: this.parseLocalized(row.prompt_json),
      response: this.parseLocalized(row.response_json),
      explanation: this.parseLocalized(row.explanation_json),
      acceptedResponses: row.accepted_responses_json === null
        ? undefined
        : this.parseLocalized(row.accepted_responses_json),
      source: row.source,
      lastSeenAt: row.last_seen_at,
    }));
  }

  private mapClue(row: CategoryRow): ContentClueRecord {
    return contentClueSchema.parse({
      id: row.clue_id,
      categoryId: row.category_id,
      round: row.clue_round,
      tier: row.tier,
      value: row.value,
      prompt: this.parseLocalized(row.prompt_json),
      response: this.parseLocalized(row.response_json),
      explanation: this.parseLocalized(row.explanation_json),
      acceptedResponses: row.accepted_responses_json === null
        ? undefined
        : this.parseLocalized(row.accepted_responses_json),
      source: row.source,
      enabled: row.clue_enabled === 1,
    });
  }

  private parseLocalized(value: string) {
    return localizedTextSchema.parse(JSON.parse(value));
  }
}

import type { DatabaseConnection } from '../persistence/database';
import {
  contentIdSchema,
  contentOverrideSchema,
  contentReportInputSchema,
  contentReportRecordSchema,
  contentCategorySetSchema,
  contentClueSchema,
  contentFinalClueSchema,
  contentPackSchema,
  localizedTextSchema,
  type ContentCategorySetRecord,
  type ContentClueRecord,
  type ContentFinalClueRecord,
  type ContentPackRecord,
  type ContentReportInput,
  type ContentReportRecord,
} from '../../shared/content/schema';
import { validateContentOverride } from '../../shared/content/validation';

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
  category_override_json: string | null;
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
  override_json: string | null;
  has_unresolved_report: number;
}

interface FinalRow {
  clue_id: string;
  pack_id: string;
  clue_enabled: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category_id: string;
  category_enabled: number;
  category_name_json: string;
  tier: number;
  value: number;
  prompt_json: string;
  response_json: string;
  explanation_json: string;
  accepted_responses_json: string | null;
  source: string;
  last_seen_at: number | null;
  override_json: string | null;
  has_unresolved_report: number;
  category_override_json: string | null;
}

interface ReportRow {
  id: number;
  clue_id: string;
  match_id: string | null;
  note: string;
  created_at: number;
  resolved_at: number | null;
}

interface ClueLookupRow {
  clue_id: string;
  category_id: string;
  pack_id: string;
  category_round: 'round-one' | 'round-two' | 'final' | 'tiebreaker';
  difficulty: 'easy' | 'medium' | 'hard';
  category_name_json: string;
  category_enabled: number;
  pack_enabled: number;
  clue_round: 'round-one' | 'round-two' | 'final' | 'tiebreaker';
  tier: number;
  value: number;
  prompt_json: string;
  response_json: string;
  explanation_json: string;
  accepted_responses_json: string | null;
  source: string;
  clue_enabled: number;
  last_seen_at: number | null;
  override_json: string | null;
  has_unresolved_report: number;
  category_override_json: string | null;
}

interface CategoryMetadataOverride {
  id: string; packId: string; round: string; difficulty: 'easy' | 'medium' | 'hard';
  name: { en: string; et?: string }; macroTopic: string; enabled: boolean;
}

export interface PersistedContentLibrary {
  packs: ContentPackRecord[];
  categorySets: ContentCategorySetRecord[];
  finalClues: ContentFinalClueRecord[];
}

export interface ContentRepositoryOptions {
  now?: () => number;
}

type PersistedClue = ContentClueRecord | ContentFinalClueRecord;

export class ContentRepository {
  private readonly now: () => number;

  constructor(
    private readonly database: DatabaseConnection,
    options: ContentRepositoryOptions = {},
  ) {
    this.now = options.now ?? Date.now;
  }

  loadLibrary(): PersistedContentLibrary {
    return {
      packs: this.loadPacks(),
      categorySets: this.loadCategorySets(),
      finalClues: this.loadFinalClues(),
    };
  }

  getClue(input: unknown): PersistedClue | null {
    const clueId = contentIdSchema.parse(input);
    const lookup = this.lookupClue(clueId);
    if (lookup === null) return null;
    const { bundled, row } = lookup;
    const metadata = this.categoryMetadata(row.category_override_json, row.category_id, row.pack_id, row.category_round);
    const parentEnabled = row.pack_enabled === 1 && (metadata?.enabled ?? row.category_enabled === 1);
    if (row.override_json === null) {
      return { ...bundled, enabled: bundled.enabled && parentEnabled && row.has_unresolved_report === 0 };
    }
    const override = validateContentOverride(JSON.parse(row.override_json), bundled);
    const enabled = override.enabled && parentEnabled && row.has_unresolved_report === 0;
    if (override.round === 'final') {
      if (bundled.round !== 'final') throw new Error(`Invalid Final override target: ${bundled.id}`);
      return contentFinalClueSchema.parse({ ...override, enabled, lastSeenAt: bundled.lastSeenAt });
    }
    if (bundled.round === 'final') throw new Error(`Invalid board override target: ${bundled.id}`);
    return contentClueSchema.parse({ ...override, enabled });
  }

  isEligible(input: unknown): boolean {
    return this.getClue(input)?.enabled === true;
  }

  saveOverride(input: unknown): PersistedClue {
    const parsed = contentOverrideSchema.parse(input);
    return this.runTransaction(() => {
      const bundled = this.getBundledClue(parsed.id);
      if (bundled === null) throw new Error(`Unknown bundled clue: ${parsed.id}`);
      const override = validateContentOverride(parsed, bundled);
      const updatedAt = this.now();
      this.database.prepare(`
        INSERT INTO content_overrides (clue_id, override_json, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT (clue_id) DO UPDATE SET
          override_json = excluded.override_json,
          updated_at = excluded.updated_at
        WHERE content_overrides.override_json <> excluded.override_json
      `).run(override.id, JSON.stringify(override), updatedAt);
      if (override.enabled) this.resolveReports(override.id, updatedAt);
      return this.getClue(override.id)!;
    });
  }

  reportClue(input: unknown): ContentReportRecord {
    const report = contentReportInputSchema.parse(input) as ContentReportInput;
    return this.runTransaction(() => {
      if (!this.clueExists(report.clueId)) {
        throw new Error(`Unknown bundled clue: ${report.clueId}`);
      }
      const existing = this.database.prepare(`
        SELECT id, clue_id, match_id, note, created_at, resolved_at
        FROM content_reports
        WHERE clue_id = ? AND resolved_at IS NULL
        ORDER BY id
        LIMIT 1
      `).get(report.clueId) as ReportRow | undefined;
      if (existing !== undefined) return this.mapReport(existing);

      const result = this.database.prepare(`
        INSERT INTO content_reports (clue_id, match_id, note, created_at)
        VALUES (?, ?, ?, ?)
      `).run(report.clueId, report.matchId, report.note, report.createdAt);
      return contentReportRecordSchema.parse({
        id: Number(result.lastInsertRowid),
        ...report,
        resolvedAt: null,
      });
    });
  }

  resolveReport(input: unknown, resolvedAt = this.now()): boolean {
    const clueId = contentIdSchema.parse(input);
    const timestamp = contentReportInputSchema.shape.createdAt.parse(resolvedAt);
    return this.runTransaction(() => {
      if (!this.clueExists(clueId)) throw new Error(`Unknown bundled clue: ${clueId}`);
      return this.resolveReports(clueId, timestamp);
    });
  }

  resolveReportById(clueIdInput: unknown, reportIdInput: unknown, resolvedAt = this.now()): boolean {
    const clueId = contentIdSchema.parse(clueIdInput);
    const reportId = contentReportRecordSchema.shape.id.parse(reportIdInput);
    const timestamp = contentReportInputSchema.shape.createdAt.parse(resolvedAt);
    const result = this.database.prepare(`
      UPDATE content_reports SET resolved_at = ?
      WHERE id = ? AND clue_id = ? AND resolved_at IS NULL
    `).run(timestamp, reportId, clueId);
    return result.changes === 1;
  }

  listReported(): ContentReportRecord[] {
    const rows = this.database.prepare(`
      SELECT id, clue_id, match_id, note, created_at, resolved_at
      FROM content_reports
      WHERE resolved_at IS NULL
      ORDER BY created_at DESC, id DESC
    `).all() as ReportRow[];
    return rows.map((row) => this.mapReport(row));
  }

  runTransaction<T>(action: () => T): T {
    return this.database.transaction(action).immediate();
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

  private loadCategorySets(applyUserState = true): ContentCategorySetRecord[] {
    const rows = this.database.prepare(`
      SELECT
        category_sets.id AS category_id,
        category_sets.pack_id,
        category_sets.round AS category_round,
        category_sets.difficulty,
        category_sets.name_json,
        category_sets.macro_topic,
        category_sets.enabled AS category_enabled,
        category_set_overrides.override_json AS category_override_json,
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
        clues.enabled AS clue_enabled,
        content_overrides.override_json,
        EXISTS (
          SELECT 1 FROM content_reports
          WHERE content_reports.clue_id = clues.id
            AND content_reports.resolved_at IS NULL
        ) AS has_unresolved_report
      FROM category_sets
      JOIN content_packs ON content_packs.id = category_sets.pack_id
      JOIN clues ON clues.category_set_id = category_sets.id
      LEFT JOIN content_overrides ON content_overrides.clue_id = clues.id
      LEFT JOIN category_set_overrides ON category_set_overrides.category_set_id = category_sets.id
      WHERE content_packs.enabled = 1
        AND category_sets.round IN ('round-one', 'round-two')
      ORDER BY category_sets.id, clues.tier, clues.id
    `).all() as CategoryRow[];
    const grouped = new Map<string, { row: CategoryRow; clues: ContentClueRecord[] }>();

    for (const row of rows) {
      const group = grouped.get(row.category_id) ?? { row, clues: [] };
      group.clues.push(this.mapClue(row, applyUserState));
      grouped.set(row.category_id, group);
    }

    return [...grouped.values()].map(({ row, clues }) => {
      const metadata = this.categoryMetadata(row.category_override_json, row.category_id, row.pack_id, row.category_round);
      return contentCategorySetSchema.parse({
      id: row.category_id,
      packId: row.pack_id,
      round: row.category_round,
      difficulty: metadata?.difficulty ?? row.difficulty,
      name: metadata?.name ?? this.parseLocalized(row.name_json),
      macroTopic: metadata?.macroTopic ?? row.macro_topic,
      enabled: metadata?.enabled ?? row.category_enabled === 1,
      clues,
      lastSeenAt: row.category_last_seen_at,
      });
    });
  }

  private loadFinalClues(applyUserState = true): ContentFinalClueRecord[] {
    const rows = this.database.prepare(`
      SELECT
        clues.id AS clue_id,
        category_sets.pack_id,
        clues.enabled AS clue_enabled,
        category_sets.difficulty,
        category_sets.id AS category_id,
        category_sets.enabled AS category_enabled,
        category_sets.name_json AS category_name_json,
        clues.tier,
        clues.value,
        clues.prompt_json,
        clues.response_json,
        clues.explanation_json,
        clues.accepted_responses_json,
        clues.source,
        MAX(seen_clues.seen_at) AS last_seen_at,
        content_overrides.override_json,
        category_set_overrides.override_json AS category_override_json,
        EXISTS (
          SELECT 1 FROM content_reports
          WHERE content_reports.clue_id = clues.id
            AND content_reports.resolved_at IS NULL
        ) AS has_unresolved_report
      FROM clues
      JOIN category_sets ON category_sets.id = clues.category_set_id
      JOIN content_packs ON content_packs.id = category_sets.pack_id
      LEFT JOIN seen_clues ON seen_clues.clue_id = clues.id
      LEFT JOIN content_overrides ON content_overrides.clue_id = clues.id
      LEFT JOIN category_set_overrides ON category_set_overrides.category_set_id = category_sets.id
      WHERE content_packs.enabled = 1
        AND category_sets.round = 'final'
        AND clues.round = 'final'
      GROUP BY clues.id
      ORDER BY clues.id
    `).all() as FinalRow[];

    return rows.map((row) => {
      const metadata = this.categoryMetadata(row.category_override_json, row.category_id, row.pack_id, 'final');
      const categoryEnabled = metadata?.enabled ?? row.category_enabled === 1;
      const bundled = contentFinalClueSchema.parse({
      id: row.clue_id,
      packId: row.pack_id,
      enabled: row.clue_enabled === 1,
      difficulty: metadata?.difficulty ?? row.difficulty,
      categoryId: row.category_id,
      categoryName: metadata?.name ?? this.parseLocalized(row.category_name_json),
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
      });
      if (!applyUserState) return { ...bundled, enabled: bundled.enabled && row.category_enabled === 1 };
      if (row.override_json === null) {
        return { ...bundled, enabled: bundled.enabled && categoryEnabled && row.has_unresolved_report === 0 };
      }
      const override = validateContentOverride(JSON.parse(row.override_json), bundled);
      if (override.round !== 'final') throw new Error(`Invalid Final override kind: ${bundled.id}`);
      return contentFinalClueSchema.parse({
        ...override,
        enabled: override.enabled && categoryEnabled && row.has_unresolved_report === 0,
        lastSeenAt: bundled.lastSeenAt,
      });
    });
  }

  private mapClue(row: CategoryRow, applyUserState: boolean): ContentClueRecord {
    const bundled = contentClueSchema.parse({
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
    if (!applyUserState) return bundled;
    if (row.override_json === null) {
      return { ...bundled, enabled: bundled.enabled && row.has_unresolved_report === 0 };
    }
    const override = validateContentOverride(JSON.parse(row.override_json), bundled);
    if (override.round === 'final') throw new Error(`Invalid board override kind: ${bundled.id}`);
    return contentClueSchema.parse({
      ...override,
      enabled: override.enabled && row.has_unresolved_report === 0,
    });
  }

  private getBundledClue(clueId: string): PersistedClue | null {
    return this.lookupClue(clueId)?.bundled ?? null;
  }

  private lookupClue(clueId: string): { bundled: PersistedClue; row: ClueLookupRow } | null {
    const row = this.database.prepare(`
      SELECT
        clues.id AS clue_id,
        category_sets.id AS category_id,
        category_sets.pack_id,
        category_sets.round AS category_round,
        category_sets.difficulty,
        category_sets.name_json AS category_name_json,
        category_sets.enabled AS category_enabled,
        content_packs.enabled AS pack_enabled,
        clues.round AS clue_round,
        clues.tier,
        clues.value,
        clues.prompt_json,
        clues.response_json,
        clues.explanation_json,
        clues.accepted_responses_json,
        clues.source,
        clues.enabled AS clue_enabled,
        MAX(seen_clues.seen_at) AS last_seen_at,
        content_overrides.override_json,
        category_set_overrides.override_json AS category_override_json,
        EXISTS (
          SELECT 1 FROM content_reports
          WHERE content_reports.clue_id = clues.id
            AND content_reports.resolved_at IS NULL
        ) AS has_unresolved_report
      FROM clues
      JOIN category_sets ON category_sets.id = clues.category_set_id
      JOIN content_packs ON content_packs.id = category_sets.pack_id
      LEFT JOIN seen_clues ON seen_clues.clue_id = clues.id
      LEFT JOIN content_overrides ON content_overrides.clue_id = clues.id
      LEFT JOIN category_set_overrides ON category_set_overrides.category_set_id = category_sets.id
      WHERE clues.id = ?
      GROUP BY clues.id
    `).get(clueId) as ClueLookupRow | undefined;
    if (row === undefined) return null;
    const metadata = this.categoryMetadata(row.category_override_json, row.category_id, row.pack_id, row.category_round);
    if (row.category_round === 'final' && row.clue_round === 'final') {
      return {
        row,
        bundled: contentFinalClueSchema.parse({
          id: row.clue_id,
          packId: row.pack_id,
          enabled: row.clue_enabled === 1,
          difficulty: metadata?.difficulty ?? row.difficulty,
          categoryId: row.category_id,
          categoryName: metadata?.name ?? this.parseLocalized(row.category_name_json),
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
        }),
      };
    }
    if (
      (row.category_round !== 'round-one' && row.category_round !== 'round-two')
      || row.clue_round !== row.category_round
    ) {
      throw new Error(`Unsupported bundled clue structure: ${clueId}`);
    }
    return {
      row,
      bundled: contentClueSchema.parse({
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
      }),
    };
  }

  private clueExists(clueId: string): boolean {
    return this.database.prepare('SELECT 1 FROM clues WHERE id = ?').pluck().get(clueId) === 1;
  }

  private categoryMetadata(value: string | null, id: string, packId: string, round: string): CategoryMetadataOverride | null {
    if (value === null) return null;
    const parsed = JSON.parse(value) as CategoryMetadataOverride;
    if (parsed.id !== id || parsed.packId !== packId || parsed.round !== round) {
      throw new Error(`Invalid category metadata override identity: ${id}`);
    }
    return parsed;
  }

  private resolveReports(clueId: string, resolvedAt: number): boolean {
    const result = this.database.prepare(`
      UPDATE content_reports
      SET resolved_at = ?
      WHERE clue_id = ? AND resolved_at IS NULL
    `).run(resolvedAt, clueId);
    return result.changes > 0;
  }

  private mapReport(row: ReportRow): ContentReportRecord {
    return contentReportRecordSchema.parse({
      id: row.id,
      clueId: row.clue_id,
      matchId: row.match_id,
      note: row.note,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
    });
  }

  private parseLocalized(value: string) {
    return localizedTextSchema.parse(JSON.parse(value));
  }
}

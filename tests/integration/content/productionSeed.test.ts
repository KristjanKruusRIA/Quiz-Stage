import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { openDatabase, type DatabaseConnection } from '../../../src/main/persistence/database';
import { ContentRepository } from '../../../src/main/content/contentRepository';
import { ContentService } from '../../../src/main/content/contentService';
import { RELEASE_THRESHOLDS, type ReleaseSummary } from '../../../scripts/content/releaseThresholds';

interface InventoryReport {
  validation: {
    mode: string;
    blocking: boolean;
    summary: ReleaseSummary;
    issues: ReadonlyArray<{
      code: string;
      severity: 'error' | 'warning' | 'info';
      message: string;
      row: number;
      file: string;
    }>;
  };
}

interface SeedInventory {
  boardClues: number;
  categorySets: number;
  distinctCategoryNames: number;
  finalClues: number;
  easySets: number;
  mediumSets: number;
  hardSets: number;
}

const seedPath = resolve('resources/content/seed.sqlite');
const inventoryReportPath = resolve('content/reports/release-inventory.json');

const connections: DatabaseConnection[] = [];

afterEach(() => {
  for (const connection of connections.splice(0)) connection.close();
});

function openSeed() {
  const database = openDatabase({ filePath: seedPath, readonly: true });
  const repository = new ContentRepository(database);
  const service = new ContentService(repository);
  const packIds = repository.loadLibrary().packs.filter((pack) => pack.enabled).map((pack) => pack.id);
  connections.push(database);
  return { database, service, packIds };
}

function querySeedInventory(database: DatabaseConnection): SeedInventory {
  return {
    boardClues: database.prepare("SELECT COUNT(*) FROM clues WHERE round IN ('round-one', 'round-two')").pluck().get() as number,
    categorySets: database.prepare("SELECT COUNT(*) FROM category_sets WHERE round IN ('round-one', 'round-two')").pluck().get() as number,
    finalClues: database.prepare("SELECT COUNT(*) FROM clues WHERE round = 'final'").pluck().get() as number,
    distinctCategoryNames: database.prepare(
      "SELECT COUNT(DISTINCT(json_extract(name_json, '$.en'))) FROM category_sets WHERE round IN ('round-one', 'round-two')",
    ).pluck().get() as number,
    easySets: database.prepare(
      "SELECT COUNT(*) FROM category_sets WHERE round IN ('round-one', 'round-two') AND difficulty = 'easy'",
    ).pluck().get() as number,
    mediumSets: database.prepare(
      "SELECT COUNT(*) FROM category_sets WHERE round IN ('round-one', 'round-two') AND difficulty = 'medium'",
    ).pluck().get() as number,
    hardSets: database.prepare(
      "SELECT COUNT(*) FROM category_sets WHERE round IN ('round-one', 'round-two') AND difficulty = 'hard'",
    ).pluck().get() as number,
  };
}

function loadInventoryReport(): InventoryReport {
  const raw = JSON.parse(readFileSync(inventoryReportPath, 'utf8')) as InventoryReport;
  return raw;
}

describe('production seed', () => {
  it('matches the release inventory thresholds and passes seeded selection in all difficulties', () => {
    const report = loadInventoryReport();
    const summary = report.validation.summary;
    expect(report.validation.mode).toBe('release');
    expect(report.validation.blocking).toBe(false);
    expect(report.validation.issues.filter((issue) => issue.severity === 'error')).toEqual([]);
    expect(summary).toEqual(expect.objectContaining(RELEASE_THRESHOLDS));

    const { service, packIds } = openSeed();
    const baseConfig = {
      language: 'en' as const,
      clueSeconds: 15,
      teams: [
        { id: 'team-1', name: 'Alpha', color: '#E3B341' },
        { id: 'team-2', name: 'Beta', color: '#50A7F5' },
      ],
      packIds,
      displayMode: 'single' as const,
    };

    for (const difficulty of ['easy', 'medium', 'hard'] as const) {
      for (let seed = 0; seed < 100; seed += 1) {
        const config = { ...baseConfig, difficulty };
        expect(service.checkAvailability(config)).toEqual({ ok: true });
        const selection = service.selectForMatch(config, `${difficulty}-${seed}`);
        expect(selection).toMatchObject({ ok: true, seed: `${difficulty}-${seed}` });
        if (selection.ok) {
          expect(selection.roundOne.categories).toHaveLength(6);
          expect(selection.roundTwo.categories).toHaveLength(6);
          expect(selection.final.round).toBe('final');
        }
      }
    }
  });

  it('supports a healthy production database inventory with SQLite integrity', () => {
    const summary = loadInventoryReport().validation.summary;
    const database = openDatabase({ filePath: seedPath, readonly: true });
    connections.push(database);
    const checks = database.pragma('integrity_check') as Array<{ integrity_check: string }>;
    expect(checks.length > 0 ? checks[0]?.integrity_check : undefined).toBe('ok');

    const inventory = querySeedInventory(database);
    expect(inventory).toEqual(expect.objectContaining({
      boardClues: summary.boardClues,
      categorySets: summary.categorySets,
      distinctCategoryNames: summary.distinctCategoryNames,
      finalClues: summary.finalClues,
      easySets: summary.easySets,
      mediumSets: summary.mediumSets,
      hardSets: summary.hardSets,
    }));
  });
});

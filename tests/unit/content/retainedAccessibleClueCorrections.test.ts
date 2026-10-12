import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import { describe, expect, it } from 'vitest';
import { applyAccessibleCorpus } from '../../../scripts/content/accessibility/apply';
import { buildAccessibleCorpus } from '../../../scripts/content/accessibility/bank';
import { ACCESSIBLE_CATEGORY_TITLES } from '../../../scripts/content/accessibility/categoryNames';
import { LEGACY_EASY_TARGETS } from '../../../scripts/content/accessibility/targets';
import type { ContentEvidence } from '../../../scripts/content/evidence';
import { readPreRepairContent } from './preRepairContent';

const AFFECTED_BATCHES = [
  '02-geography',
  '03-science-nature',
  '07-film-television',
  '09-food-drink',
  '11-politics-economics-society',
] as const;

const RETIRED_CLUE_IDS = [
  'built-in-film-television-accessible-easy-009',
  'built-in-geography-accessible-easy-031',
  'built-in-science-nature-accessible-easy-031',
  'built-in-food-drink-accessible-easy-008',
  'built-in-food-drink-accessible-easy-019',
  'built-in-food-drink-accessible-easy-030',
  'built-in-politics-economics-society-accessible-easy-006',
  'built-in-politics-economics-society-accessible-easy-033',
  'built-in-politics-economics-society-accessible-easy-034',
] as const;

function readRows(path: string): readonly Record<string, string>[] {
  return parse(readPreRepairContent(path), {
    columns: true,
    skip_empty_lines: true,
  }) as Record<string, string>[];
}

function readEvidence(path: string): readonly ContentEvidence[] {
  return readPreRepairContent(path)
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line) as ContentEvidence);
}

function acceptedBatch(batchId: (typeof AFFECTED_BATCHES)[number]) {
  const targets = LEGACY_EASY_TARGETS.filter((target) => target.batchId === batchId);
  // This completed authoring phase uses the corpus before the all-level expansion.
  return {
    authoredRows: readRows(resolve('content', 'authored', `${batchId}.csv`))
      .filter((row) => !row.clue_id.includes('-all-level-expansion-')),
    generatedRows: readRows(resolve('content', 'generated', `${batchId}.en-et.csv`))
      .filter((row) => !row.clue_id.includes('-all-level-expansion-')),
    evidence: readEvidence(resolve('content', 'evidence', `${batchId}.jsonl`))
      .filter((record) => !record.clueId.includes('-all-level-expansion-')),
    targetCategorySetIds: new Set(targets.map(({ categorySetId }) => categorySetId)),
    titles: ACCESSIBLE_CATEGORY_TITLES.filter((title) => title.batchId === batchId),
    categories: buildAccessibleCorpus().filter((category) => category.batchId === batchId),
  };
}

describe('reauthored retained Easy clues', () => {
  it('removes the retired accessible-easy clue identities from accepted content', () => {
    const currentIds = AFFECTED_BATCHES.flatMap((batchId) =>
      readRows(resolve('content', 'generated', `${batchId}.en-et.csv`)).map((row) => row.clue_id));

    expect(currentIds.filter((clueId) => clueId.includes('-accessible-easy-'))).toEqual([]);
    for (const retiredClueId of RETIRED_CLUE_IDS) {
      expect(currentIds).not.toContain(retiredClueId);
    }
  });

  it('keeps the published reauthored batches idempotent before the separately approved content repairs', () => {
    for (const batchId of AFFECTED_BATCHES) {
      const input = acceptedBatch(batchId);
      const result = applyAccessibleCorpus(input);

      expect(result.authoredRows).toEqual(input.authoredRows);
      expect(result.generatedRows).toEqual(input.generatedRows);
      expect(result.evidence).toEqual(input.evidence);
    }
  });
});

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import { describe, expect, it } from 'vitest';
import { applyAccessibleCorpus } from '../../../scripts/content/accessibility/apply';
import { GEOGRAPHY_SCIENCE_FOOD_CATEGORIES } from '../../../scripts/content/accessibility/banks/geographyScienceFood';
import { SOCIETY_TECHNOLOGY_CULTURE_CATEGORIES } from '../../../scripts/content/accessibility/banks/societyTechnologyCulture';
import { ACCESSIBLE_CATEGORY_TITLES } from '../../../scripts/content/accessibility/categoryNames';
import { LEGACY_EASY_TARGETS } from '../../../scripts/content/accessibility/targets';
import type { AccessibleCategory } from '../../../scripts/content/accessibility/types';
import type { ContentEvidence } from '../../../scripts/content/evidence';

const CORRECTED_CLUES = {
  'built-in-food-drink-accessible-easy-008': {
    en: 'Horiatiki combines tomatoes, cucumber, olives, and feta. Which country is this salad associated with?',
    et: 'Horiatiki sisaldab tomateid, kurki, oliive ja fetat. Millise riigiga seda salatit seostatakse?',
  },
  'built-in-food-drink-accessible-easy-019': {
    en: 'Which starchy vegetable is boiled and crushed with milk or butter to make a common side dish?',
    et: 'Millist tärkliserikast köögivilja keedetakse ja tambitakse piima või võiga tavaliseks lisandiks?',
  },
  'built-in-food-drink-accessible-easy-030': {
    en: 'Which tangy fermented milk drink is cultured with grains containing bacteria and yeast?',
    et: 'Millist hapukat hapendatud piimajooki valmistatakse baktereid ja pärmi sisaldavate teradega?',
  },
  'built-in-politics-economics-society-accessible-easy-033': {
    en: 'Which language, closely related to Finnish, is the sole official language of Estonia?',
    et: 'Milline soome keelega lähedalt suguluses olev keel on Eestis ainus riigikeel?',
  },
  'built-in-politics-economics-society-accessible-easy-034': {
    en: 'Tanel Padar, Dave Benton, and 2XL won the 2001 Eurovision Song Contest representing which country?',
    et: 'Millist riiki esindasid Tanel Padar, Dave Benton ja 2XL, kui nad võitsid 2001. aasta Eurovisiooni lauluvõistluse?',
  },
} as const;

const CATEGORIES: readonly AccessibleCategory[] = [
  ...GEOGRAPHY_SCIENCE_FOOD_CATEGORIES,
  ...SOCIETY_TECHNOLOGY_CULTURE_CATEGORIES,
];

function readRows(path: string): readonly Record<string, string>[] {
  return parse(readFileSync(path, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
  }) as Record<string, string>[];
}

function readEvidence(path: string): readonly ContentEvidence[] {
  return readFileSync(path, 'utf8')
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line) as ContentEvidence);
}

function acceptedBatch(batchId: '09-food-drink' | '11-politics-economics-society') {
  const authoredRows = readRows(resolve('content', 'authored', `${batchId}.csv`));
  const generatedRows = readRows(resolve('content', 'generated', `${batchId}.en-et.csv`));
  const evidence = readEvidence(resolve('content', 'evidence', `${batchId}.jsonl`));
  const targets = LEGACY_EASY_TARGETS.filter((target) => target.batchId === batchId);
  return {
    authoredRows,
    generatedRows,
    evidence,
    targetCategorySetIds: new Set(targets.map(({ categorySetId }) => categorySetId)),
    titles: ACCESSIBLE_CATEGORY_TITLES.filter((title) => title.batchId === batchId),
    categories: CATEGORIES.filter((category) => category.batchId === batchId),
  };
}

describe('retained accessible easy clue corrections', () => {
  it('corrects the five bilingual clues while preserving every other retained value and evidence record', () => {
    for (const batchId of ['09-food-drink', '11-politics-economics-society'] as const) {
      const input = acceptedBatch(batchId);
      const result = applyAccessibleCorpus(input);
      const titles = new Map<string, { readonly en: string; readonly et: string }>();
      for (const title of input.titles) titles.set(title.categorySetId, title.name);

      for (const [index, beforeGenerated] of input.generatedRows.entries()) {
        if (!beforeGenerated.clue_id.includes('-accessible-easy-')) continue;
        const correction = CORRECTED_CLUES[
          beforeGenerated.clue_id as keyof typeof CORRECTED_CLUES
        ];
        const title = titles.get(beforeGenerated.category_set_id)!;
        expect(result.generatedRows[index]).toEqual({
          ...beforeGenerated,
          category_name_en: title.en,
          category_name_et: title.et,
          ...(correction === undefined ? {} : {
            clue_en: correction.en,
            clue_et: correction.et,
          }),
        });
        expect(result.authoredRows[index]).toEqual({
          ...input.authoredRows[index],
          category_name_en: title.en,
          category_name_et: '',
          ...(correction === undefined ? {} : {
            clue_en: correction.en,
            clue_et: correction.et,
          }),
        });
        expect(result.evidence.find(({ clueId }) => clueId === beforeGenerated.clue_id)).toEqual(
          input.evidence.find(({ clueId }) => clueId === beforeGenerated.clue_id),
        );
      }
    }
  });

  it('produces identical rows and evidence when applied again', () => {
    for (const batchId of ['09-food-drink', '11-politics-economics-society'] as const) {
      const input = acceptedBatch(batchId);
      const first = applyAccessibleCorpus(input);
      const second = applyAccessibleCorpus({
        ...input,
        authoredRows: first.authoredRows,
        generatedRows: first.generatedRows,
        evidence: first.evidence,
      });

      expect(second.authoredRows).toEqual(first.authoredRows);
      expect(second.generatedRows).toEqual(first.generatedRows);
      expect(second.evidence).toEqual(first.evidence);
    }
  });
});

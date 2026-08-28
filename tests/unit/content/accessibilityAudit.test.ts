import { describe, expect, it } from 'vitest';
import { auditAccessibility } from '../../../scripts/content/accessibility/audit';
import type { AccessibilityAudit, AccessibilityReason } from '../../../scripts/content/accessibility/types';

const row = (overrides: Record<string, string>): Record<string, string> => ({
  clue_id: 'clue-default',
  category_set_id: 'category-default',
  category_name_en: 'Art',
  category_name_et: 'Kunst',
  clue_en: 'Who painted the Mona Lisa?',
  clue_et: 'Kes maalis Mona Lisa?',
  response_en: 'Leonardo da Vinci',
  response_et: 'Leonardo da Vinci',
  source_title: 'Mona Lisa',
  ...overrides,
});

describe('accessibility audit', () => {
  it('reports each approved clue and category signal without flagging accessible counterexamples', () => {
    const rows = [
      row({
        clue_id: 'clue-source-prefix',
        clue_en: 'Mona Lisa: Who painted it?',
        source_title: 'Mona Lisa',
      }),
      row({
        clue_id: 'clue-infobox-residue',
        clue_en: 'Who was Ada Lovelace (10 December 1815 – 27 November 1852)?',
        source_title: 'Ada Lovelace',
      }),
      row({
        clue_id: 'clue-exact-date',
        clue_en: 'On what exact date was the first Moon landing?',
        response_en: 'July twentieth nineteen sixty-nine',
      }),
      row({
        clue_id: 'clue-numeric-answer',
        clue_en: 'What is the answer to this number question?',
        response_en: '42',
      }),
      row({
        clue_id: 'clue-long-answer',
        clue_en: 'Which animal is the largest alive today?',
        response_en: 'A blue whale is the largest animal alive',
      }),
      row({
        clue_id: 'clue-multi-item-answer',
        clue_en: 'What colors appear on this flag?',
        response_en: 'red, white; blue',
      }),
      row({
        clue_id: 'clue-binary-question',
        clue_en: 'Is the Pacific Ocean larger than the Atlantic Ocean?',
        response_en: 'Yes',
      }),
      row({
        clue_id: 'clue-generic-category',
        category_set_id: 'category-generic',
        category_name_en: 'General Knowledge',
        category_name_et: 'Üldteadmised',
        clue_en: 'What is the capital of Finland?',
        source_title: 'Helsinki',
      }),
      row({
        clue_id: 'clue-accessible-art',
        clue_en: 'Who painted the Mona Lisa?',
        source_title: 'Mona Lisa',
      }),
      row({
        clue_id: 'clue-accessible-geography',
        clue_en: 'What is the capital of Finland?',
        source_title: 'Helsinki',
      }),
      row({
        clue_id: 'clue-accessible-iconic-year',
        clue_en: 'When did the Berlin Wall fall?',
        response_en: '1989',
        source_title: 'Berlin Wall',
      }),
    ];

    const audit: AccessibilityAudit = auditAccessibility(rows);

    expect([...audit.clueReasons]).toEqual([
      ['clue-binary-question', ['binary-question']],
      ['clue-exact-date', ['exact-date-or-number']],
      ['clue-infobox-residue', ['infobox-residue']],
      ['clue-long-answer', ['long-answer']],
      ['clue-multi-item-answer', ['multi-item-answer']],
      ['clue-numeric-answer', ['numeric-answer']],
      ['clue-source-prefix', ['source-prefix']],
    ]);
    expect([...audit.categoryReasons]).toEqual([
      ['category-generic', ['generic-category-title']],
    ]);
    const expectedCounts: Record<AccessibilityReason, number> = {
      'binary-question': 1,
      'exact-date-or-number': 1,
      'generic-category-title': 1,
      'infobox-residue': 1,
      'long-answer': 1,
      'multi-item-answer': 1,
      'numeric-answer': 1,
      'source-prefix': 1,
    };
    expect(audit.counts).toEqual(expectedCounts);
  });

  it('normalizes only for inspection and leaves supplied rows unchanged', () => {
    const rows = [row({
      clue_id: 'clue-whitespace',
      clue_en: '  Mona Lisa:   Who painted it?  ',
      source_title: 'Mona Lisa',
    })];
    const before = structuredClone(rows);

    const audit = auditAccessibility(rows);

    expect([...audit.clueReasons]).toEqual([
      ['clue-whitespace', ['source-prefix']],
    ]);
    expect(rows).toEqual(before);
  });
});

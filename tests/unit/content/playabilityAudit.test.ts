import { describe, expect, it } from 'vitest';
import { auditPlayability } from '../../../scripts/content/playability/audit';
import type { PlayabilityReason } from '../../../scripts/content/playability/types';

const row = (overrides: Record<string, string> = {}): Record<string, string> => {
  const clueId = overrides.clue_id ?? 'clue-default';
  return {
    clue_id: clueId,
    category_set_id: `category-${clueId}`,
    category_name_en: `Theme ${clueId}`,
    category_name_et: `Teema ${clueId}`,
    clue_en: 'Which city stands on the River Vltava?',
    clue_et: 'Milline linn asub Vltava jõe ääres?',
    response_en: 'Prague',
    response_et: 'Praha',
    source_title: `Source ${clueId}`,
    source_url: `https://example.com/${clueId}`,
    ...overrides,
  };
};

const reasonsFor = (
  audit: ReturnType<typeof auditPlayability>,
  clueId: string,
): readonly PlayabilityReason[] => audit.clueReasons.get(clueId) ?? [];

describe('playability audit', () => {
  it('detects every approved per-clue playability signal with stable reason codes', () => {
    const audit = auditPlayability([
      row({
        clue_id: 'source-heading',
        clue_en: 'Ada Lovelace: Her notes described an algorithm for which proposed machine?',
        response_en: 'The Analytical Engine',
        source_title: 'Ada Lovelace — Wikipedia',
      }),
      row({
        clue_id: 'raw-field',
        clue_en: 'Country of citizenship: France. Name this scientist.',
        response_en: 'Marie Curie',
      }),
      row({
        clue_id: 'associated-with',
        clue_en: 'Which composer is associated with The Four Seasons?',
        response_en: 'Antonio Vivaldi',
      }),
      row({
        clue_id: 'associated-with-plural',
        clue_en: 'Which painters are associated with the Blue Rider group?',
        response_en: 'Wassily Kandinsky and Franz Marc',
      }),
      row({
        clue_id: 'exact-date',
        clue_en: 'On what exact date was the Bastille stormed?',
        response_en: '14 July 1789',
      }),
      row({
        clue_id: 'arbitrary-number',
        clue_en: 'How many seats are in the Palais Garnier auditorium?',
        response_en: '1,979',
      }),
      row({
        clue_id: 'minor-credit',
        clue_en: 'Who was the second assistant director on the film?',
        response_en: 'A production crew member',
      }),
      row({
        clue_id: 'binary',
        clue_en: 'Is basalt an igneous rock?',
        response_en: 'Yes',
      }),
      row({
        clue_id: 'multiple-choice',
        clue_en: 'Which of these is igneous: basalt, limestone, or marble?',
        response_en: 'Basalt',
      }),
      row({
        clue_id: 'answer-in-clue',
        clue_en: 'Claude Monet founded which French painting movement?',
        response_en: 'Claude Monet',
      }),
      row({
        clue_id: 'answer-in-title',
        category_name_en: 'Mozart Masterpieces',
        clue_en: 'Which composer completed the opera The Magic Flute?',
        response_en: 'Mozart',
      }),
      row({
        clue_id: 'changing-fact',
        clue_en: 'Which country currently has the largest population?',
        response_en: 'India',
      }),
    ]);

    expect(reasonsFor(audit, 'source-heading')).toEqual(['source-heading-prefix']);
    expect(reasonsFor(audit, 'raw-field')).toEqual(['raw-field-prompt']);
    expect(reasonsFor(audit, 'associated-with')).toEqual(['associated-with-prompt']);
    expect(reasonsFor(audit, 'associated-with-plural')).toEqual(['associated-with-prompt']);
    expect(reasonsFor(audit, 'exact-date')).toEqual(['arbitrary-exact-value']);
    expect(reasonsFor(audit, 'arbitrary-number')).toEqual(['arbitrary-exact-value']);
    expect(reasonsFor(audit, 'minor-credit')).toEqual(['minor-credit-prompt']);
    expect(reasonsFor(audit, 'binary')).toEqual(['binary-or-multiple-choice']);
    expect(reasonsFor(audit, 'multiple-choice')).toEqual(['answer-leak', 'binary-or-multiple-choice']);
    expect(reasonsFor(audit, 'answer-in-clue')).toEqual(['answer-leak']);
    expect(reasonsFor(audit, 'answer-in-title')).toEqual(['answer-leak']);
    expect(reasonsFor(audit, 'changing-fact')).toEqual(['undated-changing-fact']);

    expect(audit.diagnostics).toContainEqual({
      code: 'raw-field-prompt',
      entity: 'clue',
      id: 'raw-field',
      message: 'Clue exposes a raw source field instead of a standalone trivia prompt.',
    });
  });

  it('detects generic titles, repeated answers, and one-source category fanout', () => {
    const repeatedRows = [
      row({ clue_id: 'repeated-one', response_en: 'Mercury', response_et: 'Merkuur' }),
      row({ clue_id: 'repeated-two', response_en: 'Mercury', response_et: 'Merkuur' }),
    ];
    const fanoutRows = Array.from({ length: 5 }, (_, index) => row({
      clue_id: `fanout-${index + 1}`,
      category_set_id: 'fanout-category',
      category_name_en: 'A Famous Novelist',
      category_name_et: 'Kuulus romaanikirjanik',
      clue_en: `Which distinct fact number ${index + 1} describes this novelist?`,
      clue_et: `Milline erinev fakt number ${index + 1} kirjeldab seda romaanikirjanikku?`,
      response_en: `Distinct response ${index + 1}`,
      response_et: `Erinev vastus ${index + 1}`,
      source_title: 'Virginia Woolf — Wikipedia',
      source_url: 'https://en.wikipedia.org/wiki/Virginia_Woolf',
    }));

    const audit = auditPlayability([
      row({
        clue_id: 'generic-title',
        category_set_id: 'generic-category',
        category_name_en: 'History: Mix 12',
        category_name_et: 'Ajalugu: segu 12',
      }),
      ...repeatedRows,
      ...fanoutRows,
    ]);

    expect(audit.categoryReasons.get('generic-category')).toEqual(['generic-category-title']);
    expect(audit.categoryReasons.get('fanout-category')).toEqual(['incoherent-source-fanout']);
    expect(reasonsFor(audit, 'repeated-one')).toEqual(['repeated-answer']);
    expect(reasonsFor(audit, 'repeated-two')).toEqual(['repeated-answer']);
    expect(audit.counts).toEqual({
      'answer-leak': 0,
      'arbitrary-exact-value': 0,
      'associated-with-prompt': 0,
      'binary-or-multiple-choice': 0,
      'generic-category-title': 1,
      'incoherent-source-fanout': 1,
      'minor-credit-prompt': 0,
      'raw-field-prompt': 0,
      'repeated-answer': 2,
      'source-heading-prefix': 0,
      'undated-changing-fact': 0,
    });
  });

  it('keeps fair medium and hard clue constructions free of keyword-only findings', () => {
    const fairRows = [
      row({
        clue_id: 'fair-source-name',
        clue_en: 'The element polonium was named for which country by Marie Curie?',
        response_en: 'Poland',
        source_title: 'Marie Curie — Wikipedia',
      }),
      row({
        clue_id: 'fair-occupation',
        clue_en: 'Which occupation did Johannes Gutenberg practise before developing movable type?',
        response_en: 'Goldsmith',
      }),
      row({
        clue_id: 'fair-associated',
        clue_en: 'Strong contrasts associated with chiaroscuro distinguish which two visual elements?',
        response_en: 'Light and dark',
      }),
      row({
        clue_id: 'fair-significant-number',
        clue_en: 'Which element has atomic number 79?',
        response_en: 'Gold',
      }),
      row({
        clue_id: 'fair-cinematography',
        clue_en: 'Which film won the Academy Award for cinematography for its candlelit scenes?',
        response_en: 'Barry Lyndon',
      }),
      row({
        clue_id: 'fair-open-question',
        clue_en: 'Which process changes liquid water into vapour?',
        response_en: 'Evaporation',
      }),
      row({
        clue_id: 'fair-short-answer',
        clue_en: 'Who recorded the rock opera Tommy?',
        response_en: 'The Who',
      }),
      row({
        clue_id: 'fair-dated-current',
        clue_en: 'As of 2024, which country had the largest population?',
        response_en: 'India',
      }),
      row({
        clue_id: 'fair-specific-title',
        category_name_en: 'The Chemistry Challenge',
        category_name_et: 'Keemia väljakutse',
      }),
    ];

    const audit = auditPlayability(fairRows);

    expect([...audit.clueReasons]).toEqual([]);
    expect([...audit.categoryReasons]).toEqual([]);
    expect(audit.diagnostics).toEqual([]);
  });

  it('is read-only and emits the same sorted diagnostics for any input order', () => {
    const rows = [
      row({
        clue_id: 'z-clue',
        clue_en: 'Is this a binary prompt?',
        response_en: 'Yes',
      }),
      row({
        clue_id: 'a-clue',
        clue_en: 'Occupation: chemist.',
        response_en: 'Antoine Lavoisier',
      }),
    ];
    const before = structuredClone(rows);

    const forward = auditPlayability(rows);
    const reverse = auditPlayability([...rows].reverse());

    expect(forward).toEqual(reverse);
    expect(rows).toEqual(before);
    expect(forward.diagnostics.map(({ entity, id, code }) => `${entity}:${id}:${code}`)).toEqual([
      'clue:a-clue:raw-field-prompt',
      'clue:z-clue:binary-or-multiple-choice',
    ]);
  });
});

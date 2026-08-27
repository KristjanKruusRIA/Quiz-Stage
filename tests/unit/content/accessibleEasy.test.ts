import { describe, expect, it } from 'vitest';
import {
  applyAccessibleEasyQuestions,
  buildAccessibleEasyQuestions,
} from '../../../scripts/content/accessibleEasy';

const EXPECTED_BATCHES = [
  '01-history',
  '02-geography',
  '03-science-nature',
  '04-literature-language',
  '06-music',
  '07-film-television',
  '08-sports-games',
  '09-food-drink',
  '10-technology-inventions',
  '11-politics-economics-society',
] as const;

describe('accessible easy question bank', () => {
  it('provides 400 bilingual, source-backed questions balanced across ten familiar topics', () => {
    const questions = buildAccessibleEasyQuestions();

    expect(questions).toHaveLength(400);
    expect(new Set(questions.map((question) => question.key)).size).toBe(400);
    expect(new Set(questions.map((question) => `${question.clue.en}\0${question.response.en}`)).size).toBe(400);

    for (const batchId of EXPECTED_BATCHES) {
      const batch = questions.filter((question) => question.batchId === batchId);
      expect(batch, batchId).toHaveLength(40);
      for (let offset = 0; offset < batch.length; offset += 5) {
        expect(new Set(batch.slice(offset, offset + 5).map((question) => question.subjectKey)).size).toBe(5);
      }
    }

    for (const question of questions) {
      expect(question.difficulty).toBe('easy');
      expect(question.clue.en.trim()).not.toBe('');
      expect(question.clue.et.trim()).not.toBe('');
      expect(question.response.en.trim()).not.toBe('');
      expect(question.response.et.trim()).not.toBe('');
      expect(question.explanation.en.trim()).not.toBe('');
      expect(question.explanation.et.trim()).not.toBe('');
      expect(question.source.url).toMatch(/^https:\/\/en\.wikipedia\.org\/wiki\//);
      expect(question.source.title.trim()).not.toBe('');
    }
  });

  it('replaces eight easy category sets per batch without changing their board slots', () => {
    const rows = Array.from({ length: 9 }, (_, setIndex) =>
      Array.from({ length: 5 }, (_, tierIndex) => ({
        clue_id: `old-${setIndex}-${tierIndex + 1}`,
        category_set_id: `set-${setIndex}`,
        pack_id: 'built-in-history',
        pack_name: 'History Pack',
        content_kind: 'board',
        round: setIndex < 4 ? 'round-one' : 'round-two',
        tier: String(tierIndex + 1),
        difficulty: setIndex === 8 ? 'medium' : 'easy',
        macro_topic: 'history',
        category_name_en: `History Mix ${setIndex}`,
        category_name_et: `Ajaloosegu ${setIndex}`,
        clue_en: `Old clue ${setIndex}-${tierIndex + 1}`,
        clue_et: `Vana küsimus ${setIndex}-${tierIndex + 1}`,
        response_en: 'Old answer',
        response_et: 'Vana vastus',
        accepted_variants_en: '',
        accepted_variants_et: '',
        explanation_en: 'Old explanation',
        explanation_et: 'Vana selgitus',
        source_title: 'Old source',
        source_url: 'https://example.com/old',
        source_license: 'CC0-1.0',
        source_retrieved_at: '2026-01-01',
        translation_status: 'reviewed',
        enabled: 'true',
      }))).flat();

    const result = applyAccessibleEasyQuestions(
      rows,
      buildAccessibleEasyQuestions().filter((question) => question.batchId === '01-history'),
    );

    expect(result.rows).toHaveLength(45);
    expect(result.evidence).toHaveLength(40);
    expect(result.replacedClueIds).toHaveLength(40);
    expect(result.rows.filter((row) => row.clue_id.includes('accessible-easy'))).toHaveLength(40);
    expect(result.rows.filter((row) => row.difficulty === 'medium')).toEqual(rows.slice(40));
    expect(new Set(result.rows.slice(0, 40).map((row) => row.category_set_id))).toEqual(
      new Set(Array.from({ length: 8 }, (_, index) => `set-${index}`)),
    );

    for (let offset = 0; offset < result.evidence.length; offset += 5) {
      expect(new Set(result.evidence.slice(offset, offset + 5).map((item) => item.subjectKey)).size).toBe(5);
    }

    const rerun = applyAccessibleEasyQuestions(
      result.rows,
      buildAccessibleEasyQuestions().filter((question) => question.batchId === '01-history'),
    );
    expect(rerun.replacedClueIds).toHaveLength(40);
  });

  it('retains the batch OpenTDB quota when inspiration records are supplied', () => {
    const rows = Array.from({ length: 8 }, (_, setIndex) =>
      Array.from({ length: 5 }, (_, tierIndex) => ({
        clue_id: `old-${setIndex}-${tierIndex + 1}`,
        category_set_id: `set-${setIndex}`,
        pack_id: 'built-in-history',
        content_kind: 'board',
        round: 'round-one',
        tier: String(tierIndex + 1),
        difficulty: 'easy',
      }))).flat();
    const inspirations = Array.from({ length: 3 }, (_, index) => ({
      system: 'OpenTDB' as const,
      candidateId: `candidate-${index}`,
      license: 'CC-BY-SA-4.0' as const,
    }));

    const result = applyAccessibleEasyQuestions(
      rows,
      buildAccessibleEasyQuestions().filter((question) => question.batchId === '01-history'),
      inspirations,
    );

    expect(result.evidence.filter((item) => item.origin === 'openTdbInspired')).toHaveLength(3);
    expect(result.evidence.slice(0, 3).map((item) => item.inspiration)).toEqual(inspirations);
  });
});

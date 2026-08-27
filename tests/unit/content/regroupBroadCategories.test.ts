import { describe, expect, it } from 'vitest';
import { regroupBroadCategories } from '../../../scripts/content/regroupBroadCategories';

function sourceRows() {
  return Array.from({ length: 6 }, (_, setIndex) =>
    Array.from({ length: 5 }, (_, tierIndex) => ({
      clue_id: `clue-${setIndex}-${tierIndex + 1}`,
      category_set_id: `set-${setIndex}`,
      pack_id: 'built-in-food-drink',
      difficulty: 'easy',
      round: 'round-one',
      tier: String(tierIndex + 1),
      macro_topic: `subtheme-${setIndex}`,
      category_name_en: `Food ${setIndex}`,
      category_name_et: `Toit ${setIndex}`,
      source_title: `Source ${setIndex} — Example reference`,
      clue_en: `Question ${setIndex}-${tierIndex + 1}?`,
      clue_et: `Küsimus ${setIndex}-${tierIndex + 1}?`,
    }))).flat();
}

describe('broad-category regrouping', () => {
  it('rotates tiers across five distinct source subjects while preserving every clue', () => {
    const original = sourceRows();

    const result = regroupBroadCategories(original, {
      topicNameEn: 'Food & Drink',
      topicNameEt: 'Toit ja jook',
    });

    expect(result.rows).toHaveLength(30);
    expect(new Set(result.rows.map((row) => row.clue_id))).toEqual(new Set(original.map((row) => row.clue_id)));

    const firstSet = result.rows.filter((row) => row.category_set_id === 'set-0');
    expect(firstSet.map((row) => row.tier)).toEqual(['1', '2', '3', '4', '5']);
    expect(firstSet.map((row) => result.subjectKeyByClueId.get(row.clue_id))).toEqual([
      'set-0', 'set-1', 'set-2', 'set-3', 'set-4',
    ]);
    expect(firstSet.map((row) => row.category_name_en)).toEqual(Array(5).fill('Food & Drink: Quick Mix'));
    expect(firstSet.map((row) => row.category_name_et)).toEqual(Array(5).fill('Toit ja jook: kiire segu'));
    expect(firstSet.map((row) => row.clue_en)).toEqual([
      'Source 0 — Question 0-1?',
      'Source 1 — Question 1-2?',
      'Source 2 — Question 2-3?',
      'Source 3 — Question 3-4?',
      'Source 4 — Question 4-5?',
    ]);
    expect(firstSet.map((row) => row.clue_et)).toEqual([
      'Source 0 — Küsimus 0-1?',
      'Source 1 — Küsimus 1-2?',
      'Source 2 — Küsimus 2-3?',
      'Source 3 — Küsimus 3-4?',
      'Source 4 — Küsimus 4-5?',
    ]);

    for (const categoryId of new Set(result.rows.map((row) => row.category_set_id))) {
      const subjects = result.rows
        .filter((row) => row.category_set_id === categoryId)
        .map((row) => result.subjectKeyByClueId.get(row.clue_id));
      expect(new Set(subjects).size).toBe(5);
    }
  });
});

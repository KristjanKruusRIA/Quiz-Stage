import {
  contentOverrideSchema,
  type ContentClueRecord,
  type ContentFinalClueRecord,
  type ContentOverrideRecord,
} from './schema';

type BundledClue = ContentClueRecord | ContentFinalClueRecord;

export function validateContentOverride(input: unknown, bundled: BundledClue): ContentOverrideRecord {
  const override = contentOverrideSchema.parse(input);
  if (override.round === 'final') {
    if (bundled.round !== 'final') throw new Error('A local override cannot change bundled clue kind');
    if (override.id !== bundled.id
      || override.packId !== bundled.packId
      || override.difficulty !== bundled.difficulty
      || override.categoryId !== bundled.categoryId
      || override.tier !== bundled.tier
      || override.value !== bundled.value) {
      throw new Error('A local override cannot change bundled Final clue identity');
    }
  } else {
    if (bundled.round === 'final') throw new Error('A local override cannot change bundled clue kind');
    if (override.id !== bundled.id
      || override.categoryId !== bundled.categoryId
      || override.round !== bundled.round
      || override.tier !== bundled.tier
      || override.value !== bundled.value) {
      throw new Error('A local override cannot change bundled board clue identity');
    }
  }
  return override;
}

import { z } from 'zod';

const nonEmptyText = z.string().trim().min(1);
const boardRoundSchema = z.enum(['round-one', 'round-two']);
const difficultySchema = z.enum(['easy', 'medium', 'hard']);

export const contentIdSchema = z.string()
  .min(1)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/, 'Expected a stable content ID');

export const localizedTextSchema = z.object({
  en: nonEmptyText,
  et: nonEmptyText.optional(),
}).strict();

export const bilingualLocalizedTextSchema = localizedTextSchema.extend({
  et: nonEmptyText,
});

export const contentPackSchema = z.object({
  id: contentIdSchema,
  name: nonEmptyText,
  version: nonEmptyText,
  source: nonEmptyText,
  enabled: z.boolean(),
}).strict();

export const contentClueSchema = z.object({
  id: contentIdSchema,
  categoryId: contentIdSchema,
  round: boardRoundSchema,
  tier: z.number().int().min(1).max(5),
  value: z.number().int().positive(),
  prompt: localizedTextSchema,
  response: localizedTextSchema,
  explanation: localizedTextSchema,
  acceptedResponses: localizedTextSchema.optional(),
  source: nonEmptyText,
  enabled: z.boolean(),
}).strict();

export const contentCategorySetSchema = z.object({
  id: contentIdSchema,
  packId: contentIdSchema,
  round: boardRoundSchema,
  difficulty: difficultySchema,
  name: localizedTextSchema,
  macroTopic: nonEmptyText,
  enabled: z.boolean(),
  clues: z.array(contentClueSchema),
  lastSeenAt: z.number().int().nonnegative().nullable(),
}).strict();

export const contentFinalClueSchema = z.object({
  id: contentIdSchema,
  packId: contentIdSchema,
  enabled: z.boolean(),
  difficulty: difficultySchema,
  categoryId: contentIdSchema,
  categoryName: localizedTextSchema,
  round: z.literal('final'),
  tier: z.literal(0),
  value: z.literal(0),
  prompt: localizedTextSchema,
  response: localizedTextSchema,
  explanation: localizedTextSchema,
  acceptedResponses: localizedTextSchema.optional(),
  source: nonEmptyText,
  lastSeenAt: z.number().int().nonnegative().nullable(),
}).strict();

const fixtureCategorySetSchema = contentCategorySetSchema.omit({ lastSeenAt: true }).superRefine((set, context) => {
  const tiers = set.clues.map((clue) => clue.tier).sort((left, right) => left - right);
  if (tiers.join(',') !== '1,2,3,4,5') {
    context.addIssue({ code: 'custom', message: 'A category set must contain exactly tiers 1 through 5' });
  }
  for (const clue of set.clues) {
    if (clue.categoryId !== set.id || clue.round !== set.round) {
      context.addIssue({ code: 'custom', message: 'A clue must match its category set and round' });
    }
  }
});

const fixtureFinalSchema = contentFinalClueSchema.omit({ lastSeenAt: true });

export const developmentContentFixtureSchema = z.object({
  packs: z.array(contentPackSchema),
  categorySets: z.array(fixtureCategorySetSchema),
  finals: z.array(fixtureFinalSchema),
}).strict().superRefine((fixture, context) => {
  const localizedValues = [
    ...fixture.categorySets.flatMap((set) => [
      set.name,
      ...set.clues.flatMap((clue) => [
        clue.prompt,
        clue.response,
        clue.explanation,
        ...(clue.acceptedResponses === undefined ? [] : [clue.acceptedResponses]),
      ]),
    ]),
    ...fixture.finals.flatMap((clue) => [
      clue.categoryName,
      clue.prompt,
      clue.response,
      clue.explanation,
      ...(clue.acceptedResponses === undefined ? [] : [clue.acceptedResponses]),
    ]),
  ];
  if (localizedValues.some((value) => value.et === undefined)) {
    context.addIssue({ code: 'custom', message: 'Development fixture content must include English and Estonian' });
  }
  for (const difficulty of difficultySchema.options) {
    for (const round of boardRoundSchema.options) {
      const count = fixture.categorySets.filter((set) =>
        set.difficulty === difficulty && set.round === round).length;
      if (count !== 6) {
        context.addIssue({ code: 'custom', message: `Expected 6 ${difficulty} ${round} category sets` });
      }
    }
    const expectedFinals = difficulty === 'hard' ? 12 : 1;
    if (fixture.finals.filter((clue) => clue.difficulty === difficulty).length !== expectedFinals) {
      context.addIssue({ code: 'custom', message: `Expected ${expectedFinals} ${difficulty} Finals` });
    }
  }
  if (fixture.categorySets.length !== 36 || fixture.finals.length !== 14) {
    context.addIssue({ code: 'custom', message: 'Development fixture must contain 36 category sets and 14 Finals' });
  }
});

export const contentBoardOverrideSchema = contentClueSchema.extend({
  prompt: bilingualLocalizedTextSchema,
  response: bilingualLocalizedTextSchema,
  explanation: bilingualLocalizedTextSchema,
  acceptedResponses: bilingualLocalizedTextSchema.optional(),
});

export const contentFinalOverrideSchema = contentFinalClueSchema.omit({ lastSeenAt: true }).extend({
  categoryName: bilingualLocalizedTextSchema,
  prompt: bilingualLocalizedTextSchema,
  response: bilingualLocalizedTextSchema,
  explanation: bilingualLocalizedTextSchema,
  acceptedResponses: bilingualLocalizedTextSchema.optional(),
});

export const contentOverrideSchema = z.union([
  contentBoardOverrideSchema,
  contentFinalOverrideSchema,
]);

export const contentReportInputSchema = z.object({
  clueId: contentIdSchema,
  matchId: contentIdSchema.nullable(),
  note: nonEmptyText,
  createdAt: z.number().int().nonnegative(),
}).strict();

export const contentReportRecordSchema = contentReportInputSchema.extend({
  id: z.number().int().positive(),
  resolvedAt: z.number().int().nonnegative().nullable(),
});

export type ContentPackRecord = z.infer<typeof contentPackSchema>;
export type ContentClueRecord = z.infer<typeof contentClueSchema>;
export type ContentCategorySetRecord = z.infer<typeof contentCategorySetSchema>;
export type ContentFinalClueRecord = z.infer<typeof contentFinalClueSchema>;
export type DevelopmentContentFixture = z.infer<typeof developmentContentFixtureSchema>;
export type ContentOverrideRecord = z.infer<typeof contentOverrideSchema>;
export type ContentReportInput = z.infer<typeof contentReportInputSchema>;
export type ContentReportRecord = z.infer<typeof contentReportRecordSchema>;

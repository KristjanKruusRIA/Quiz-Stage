import { z } from 'zod';

const nonEmptyText = z.string().trim().min(1);
const boardRoundSchema = z.enum(['round-one', 'round-two']);
const difficultySchema = z.enum(['easy', 'medium', 'hard']);

export const localizedTextSchema = z.object({
  en: nonEmptyText,
  et: nonEmptyText.optional(),
}).strict();

export const contentPackSchema = z.object({
  id: nonEmptyText,
  name: nonEmptyText,
  version: nonEmptyText,
  source: nonEmptyText,
  enabled: z.boolean(),
}).strict();

export const contentClueSchema = z.object({
  id: nonEmptyText,
  categoryId: nonEmptyText,
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
  id: nonEmptyText,
  packId: nonEmptyText,
  round: boardRoundSchema,
  difficulty: difficultySchema,
  name: localizedTextSchema,
  macroTopic: nonEmptyText,
  enabled: z.boolean(),
  clues: z.array(contentClueSchema),
  lastSeenAt: z.number().int().nonnegative().nullable(),
}).strict();

export const contentFinalClueSchema = z.object({
  id: nonEmptyText,
  packId: nonEmptyText,
  enabled: z.boolean(),
  difficulty: difficultySchema,
  categoryId: nonEmptyText,
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
    if (fixture.finals.filter((clue) => clue.difficulty === difficulty).length !== 1) {
      context.addIssue({ code: 'custom', message: `Expected 1 ${difficulty} Final` });
    }
  }
  if (fixture.categorySets.length !== 36 || fixture.finals.length !== 3) {
    context.addIssue({ code: 'custom', message: 'Development fixture must contain 36 category sets and 3 Finals' });
  }
});

export type ContentPackRecord = z.infer<typeof contentPackSchema>;
export type ContentClueRecord = z.infer<typeof contentClueSchema>;
export type ContentCategorySetRecord = z.infer<typeof contentCategorySetSchema>;
export type ContentFinalClueRecord = z.infer<typeof contentFinalClueSchema>;
export type DevelopmentContentFixture = z.infer<typeof developmentContentFixtureSchema>;

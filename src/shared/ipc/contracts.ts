import { z } from 'zod';
import { APP_VERSION } from '../appMeta';
import type { GameCommand } from '../game/commands';
import type { GameEvent } from '../game/events';
import type { GameConfig, GameState } from '../game/types';

const identifierSchema = z.string().trim().min(1);
const timestampSchema = z.number().int().nonnegative();
const localizedTextSchema = z.strictObject({
  en: z.string().trim().min(1),
  et: z.string().trim().min(1).optional(),
});
const teamSchema = z.strictObject({
  id: identifierSchema,
  name: z.string().trim().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const gameConfigSchema = z.strictObject({
  language: z.enum(['en', 'et']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  clueSeconds: z.number().int().min(5).max(60).multipleOf(5),
  teams: z.array(teamSchema).min(2).max(8),
  packIds: z.array(identifierSchema).min(1),
  displayMode: z.enum(['single', 'dual']),
}).superRefine((config, context) => {
  const unique = (values: string[]) => new Set(values).size === values.length;

  if (!unique(config.teams.map((team) => team.id))) {
    context.addIssue({ code: 'custom', message: 'Team IDs must be unique', path: ['teams'] });
  }
  if (!unique(config.teams.map((team) => team.name.toLocaleLowerCase()))) {
    context.addIssue({ code: 'custom', message: 'Team names must be unique', path: ['teams'] });
  }
  if (!unique(config.teams.map((team) => team.color.toLowerCase()))) {
    context.addIssue({ code: 'custom', message: 'Team colors must be unique', path: ['teams'] });
  }
  if (!unique(config.packIds)) {
    context.addIssue({ code: 'custom', message: 'Pack IDs must be unique', path: ['packIds'] });
  }
});

export const gameCommandSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('SelectClue'), clueId: identifierSchema }),
  z.strictObject({ type: z.literal('LockTeam'), teamId: identifierSchema, at: timestampSchema }),
  z.strictObject({ type: z.literal('JudgeResponse'), correct: z.boolean(), at: timestampSchema }),
  z.strictObject({ type: z.literal('SubmitDailyDoubleWager'), wager: z.number().int() }),
  z.strictObject({ type: z.literal('SubmitFinalWager'), teamId: identifierSchema, wager: z.number().int() }),
  z.strictObject({ type: z.literal('RevealFinalTeam'), teamId: identifierSchema, correct: z.boolean() }),
  z.strictObject({ type: z.literal('PauseTimer'), at: timestampSchema }),
  z.strictObject({ type: z.literal('ResumeTimer'), at: timestampSchema }),
  z.strictObject({ type: z.literal('ResetTimer'), at: timestampSchema }),
  z.strictObject({ type: z.literal('RevealResponse') }),
  z.strictObject({ type: z.literal('UndoLast') }),
  z.strictObject({ type: z.literal('ReopenClue') }),
  z.strictObject({ type: z.literal('EndIncompleteMatch') }),
  z.strictObject({ type: z.literal('AdjustScore'), teamId: identifierSchema, score: z.number().int(), reason: z.string().trim().min(1) }),
  z.strictObject({ type: z.literal('ReportClue'), clueId: identifierSchema, reason: z.string().trim().min(1) }),
]);

const clueSchema = z.strictObject({
  id: identifierSchema,
  categoryId: identifierSchema,
  round: z.enum(['round-one', 'round-two', 'final', 'tiebreaker']),
  tier: z.number().int().min(1).max(5),
  value: z.number().int().positive(),
  prompt: localizedTextSchema,
  response: localizedTextSchema,
  explanation: localizedTextSchema,
  source: z.string().trim().min(1),
  acceptedResponses: localizedTextSchema.optional(),
});

const boardSchema = z.strictObject({
  id: identifierSchema,
  round: z.enum(['round-one', 'round-two']),
  categories: z.array(z.strictObject({
    id: identifierSchema,
    name: localizedTextSchema,
    macroTopic: z.string().trim().min(1),
    clues: z.array(clueSchema),
  })),
});

export const gameStateSchema = z.strictObject({
  appVersion: z.literal(APP_VERSION),
  id: identifierSchema,
  config: gameConfigSchema,
  phase: z.enum([
    'round-one-board', 'ordinary-clue', 'round-two-board', 'daily-double-wager',
    'daily-double-clue', 'final-category', 'final-wagers', 'final-clue',
    'final-reveal', 'tiebreaker', 'complete',
  ]),
  boards: z.array(boardSchema),
  finalClue: clueSchema.nullable(),
  scores: z.record(identifierSchema, z.number().int()),
  controllingTeamId: identifierSchema.nullable(),
  activeClue: z.strictObject({
    clueId: identifierSchema,
    lockedOutTeamIds: z.array(identifierSchema),
    responseRevealed: z.boolean(),
  }).nullable(),
  usedClueIds: z.array(identifierSchema),
  finalWagers: z.record(identifierSchema, z.number().int().nonnegative()),
});

export const gameEventSchema = z.discriminatedUnion('type', [
  z.strictObject({
    id: identifierSchema,
    matchId: identifierSchema,
    at: timestampSchema,
    type: z.literal('CommandApplied'),
    command: gameCommandSchema,
  }),
  z.strictObject({ id: identifierSchema, matchId: identifierSchema, at: timestampSchema, type: z.literal('TimerExpired') }),
  z.strictObject({ id: identifierSchema, matchId: identifierSchema, at: timestampSchema, type: z.literal('ActionUndone'), eventId: identifierSchema }),
  z.strictObject({ id: identifierSchema, matchId: identifierSchema, at: timestampSchema, type: z.literal('MatchEnded') }),
]);

export type ValidatedGameConfig = z.infer<typeof gameConfigSchema> & GameConfig;
export type ValidatedGameCommand = z.infer<typeof gameCommandSchema> & GameCommand;
export type ValidatedGameState = z.infer<typeof gameStateSchema> & GameState;
export type ValidatedGameEvent = z.infer<typeof gameEventSchema> & GameEvent;

import { z } from 'zod';
import type {
  ContentExportResult, ContentImportPreview, ContentImportResult, EditorCategorySet,
  EditorFinalClue, EditorLibrary, EditorPack, SaveCategorySetRequest, SaveFinalClueRequest,
} from '../content/editor';
import type { ContentReportRecord } from '../content/schema';
import { APP_VERSION } from '../appMeta';
import type { GameCommand } from '../game/commands';
import type { GameEvent } from '../game/events';
import type { DisplayMode, GameConfig, GameState, HostGameView, PublicGameView } from '../game/types';
import { normalizeTeamName, TEAM_NAME_MAX_LENGTH } from '../game/teamNames';
import { audioSettingsSchema, type AudioSettings, type MediaStatusEvent } from '../media/contracts';
import type { AppearanceSettings } from '../settings/appearance';

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
const authoredTeamSchema = teamSchema.extend({ name: z.string().trim().min(1).max(TEAM_NAME_MAX_LENGTH) });

const gameConfigShape = {
  language: z.enum(['en', 'et']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  clueSeconds: z.number().int().min(5).max(60).multipleOf(5),
  packIds: z.array(identifierSchema).min(1),
  displayMode: z.enum(['single', 'dual']),
};

const validateGameConfig = (config: { teams: Array<{ id: string; name: string; color: string }>; packIds: string[] }, context: z.RefinementCtx) => {
  const unique = (values: string[]) => new Set(values).size === values.length;

  if (!unique(config.teams.map((team) => team.id))) {
    context.addIssue({ code: 'custom', message: 'Team IDs must be unique', path: ['teams'] });
  }
  if (!unique(config.teams.map((team) => normalizeTeamName(team.name)))) {
    context.addIssue({ code: 'custom', message: 'Team names must be unique', path: ['teams'] });
  }
  if (!unique(config.teams.map((team) => team.color.toLowerCase()))) {
    context.addIssue({ code: 'custom', message: 'Team colors must be unique', path: ['teams'] });
  }
  if (!unique(config.packIds)) {
    context.addIssue({ code: 'custom', message: 'Pack IDs must be unique', path: ['packIds'] });
  }
};

export const gameConfigSchema = z.strictObject({
  ...gameConfigShape,
  teams: z.array(authoredTeamSchema).min(2).max(8),
}).superRefine(validateGameConfig);

const persistedGameConfigSchema = z.strictObject({
  ...gameConfigShape,
  teams: z.array(teamSchema).min(2).max(8),
}).superRefine(validateGameConfig);

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
  z.strictObject({ type: z.literal('AdvanceAfterReveal') }),
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
  tier: z.number().int().min(0).max(5),
  value: z.number().int().nonnegative(),
  prompt: localizedTextSchema,
  response: localizedTextSchema,
  explanation: localizedTextSchema,
  source: z.string().trim().min(1),
  acceptedResponses: localizedTextSchema.optional(),
  categoryName: localizedTextSchema.optional(),
}).superRefine((clue, context) => {
  const isBoardClue = clue.round === 'round-one' || clue.round === 'round-two';
  if (isBoardClue && clue.tier === 0) {
    context.addIssue({ code: 'custom', message: 'Board clue tiers must be 1 through 5', path: ['tier'] });
  }
  if (isBoardClue && clue.value === 0) {
    context.addIssue({ code: 'custom', message: 'Board clue values must be positive', path: ['value'] });
  }
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

const gameTimerSchema = z.strictObject({
  durationMs: z.number().int().positive(),
  remainingMs: z.number().int().nonnegative(),
  startedAt: timestampSchema.nullable(),
  status: z.enum(['idle', 'running', 'paused', 'expired']),
}).refine((timer) => timer.remainingMs <= timer.durationMs, {
  message: 'Timer remaining time cannot exceed its duration',
  path: ['remainingMs'],
});

const activeClueSchema = z.strictObject({
  clueId: identifierSchema,
  lockedOutTeamIds: z.array(identifierSchema),
  lockedTeamId: identifierSchema.nullable().default(null),
  responseRevealed: z.boolean(),
});

const gamePhaseSchema = z.enum([
  'round-one-board', 'ordinary-clue', 'round-two-board', 'daily-double-wager',
  'daily-double-clue', 'final-category', 'final-wagers', 'final-clue',
  'clue-reveal',
  'final-reveal', 'tiebreaker', 'complete',
]);

const undoMutableStateSchema = z.strictObject({
  phase: gamePhaseSchema,
  scores: z.record(identifierSchema, z.number().int()),
  controllingTeamId: identifierSchema.nullable(),
  activeClue: activeClueSchema.nullable(),
  timer: gameTimerSchema,
  usedClueIds: z.array(identifierSchema),
  dailyDoubleWager: z.number().int().nullable(),
  finalEligibleTeamIds: z.array(identifierSchema),
  finalWagers: z.record(identifierSchema, z.number().int().nonnegative()),
  finalRevealOrder: z.array(identifierSchema),
  finalRevealedTeamIds: z.array(identifierSchema),
  finalJudgments: z.record(identifierSchema, z.boolean()).default({}),
  tiebreakerTeamIds: z.array(identifierSchema),
  usedTiebreakerClueIds: z.array(identifierSchema).default([]),
  suddenDeathClueNumber: z.number().int().nonnegative(),
  winnerTeamId: identifierSchema.nullable(),
  endedIncomplete: z.boolean(),
  lastClosedClueId: identifierSchema.nullable(),
  lastClosedPhase: z.enum(['round-one-board', 'round-two-board']).nullable().default(null),
  lastClosedControllingTeamId: identifierSchema.nullable().default(null),
  disabledClueIds: z.array(identifierSchema),
});

const undoFrameSchema = z.strictObject({
  eventId: identifierSchema,
  state: undoMutableStateSchema,
});

export const gameStateSchema = z.strictObject({
  appVersion: z.literal(APP_VERSION),
  id: identifierSchema,
  config: persistedGameConfigSchema,
  seed: z.string(),
  phase: gamePhaseSchema,
  boards: z.array(boardSchema),
  finalClue: clueSchema.nullable(),
  scores: z.record(identifierSchema, z.number().int()),
  controllingTeamId: identifierSchema.nullable(),
  activeClue: activeClueSchema.nullable(),
  timer: gameTimerSchema.optional(),
  usedClueIds: z.array(identifierSchema),
  dailyDoubleClueIds: z.array(identifierSchema),
  dailyDoubleWager: z.number().int().nullable().default(null),
  finalWagers: z.record(identifierSchema, z.number().int().nonnegative()),
  finalEligibleTeamIds: z.array(identifierSchema).default([]),
  finalRevealOrder: z.array(identifierSchema).default([]),
  finalRevealedTeamIds: z.array(identifierSchema).default([]),
  finalJudgments: z.record(identifierSchema, z.boolean()).default({}),
  tiebreakerClues: z.array(clueSchema).default([]),
  tiebreakerTeamIds: z.array(identifierSchema).default([]),
  usedTiebreakerClueIds: z.array(identifierSchema).default([]),
  suddenDeathClueNumber: z.number().int().nonnegative().default(0),
  winnerTeamId: identifierSchema.nullable().default(null),
  endedIncomplete: z.boolean().default(false),
  lastClosedClueId: identifierSchema.nullable().default(null),
  lastClosedPhase: z.enum(['round-one-board', 'round-two-board']).nullable().default(null),
  lastClosedControllingTeamId: identifierSchema.nullable().default(null),
  disabledClueIds: z.array(identifierSchema).default([]),
  eventSequence: z.number().int().nonnegative().default(0),
  undoStack: z.array(undoFrameSchema).default([]),
}).superRefine((state, context) => {
  const teamIds = new Set(state.config.teams.map((team) => team.id));
  for (const teamId of Object.keys(state.finalJudgments)) {
    if (!teamIds.has(teamId) || !state.finalRevealedTeamIds.includes(teamId)) {
      context.addIssue({ code: 'custom', message: 'Final judgments must belong to already revealed match teams', path: ['finalJudgments', teamId] });
    }
  }
}).transform((state) => ({
  ...state,
  timer: state.timer ?? {
    durationMs: state.config.clueSeconds * 1000,
    remainingMs: state.config.clueSeconds * 1000,
    startedAt: null,
    status: 'idle' as const,
  },
}));

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

const recoveryIssueSchema = z.strictObject({
  sequence: z.number().int().nonnegative(),
  reason: z.enum(['missing-sequence', 'invalid-event', 'match-mismatch', 'row-mismatch']),
});

export const hostGameViewSchema = z.strictObject({
  appVersion: z.literal(APP_VERSION),
  state: gameStateSchema,
  replayIssue: recoveryIssueSchema.nullable(),
  recovery: z.strictObject({
    recoveredFromSnapshotSequence: z.number().int().positive(),
    skippedInvalidSnapshotSequences: z.array(z.number().int().positive()),
  }).nullable(),
});

const publicActiveClueSchema = z.discriminatedUnion('responseRevealed', [
  z.strictObject({
    id: identifierSchema,
    prompt: z.string(),
    responseRevealed: z.literal(false),
  }),
  z.strictObject({
    id: identifierSchema,
    prompt: z.string(),
    responseRevealed: z.literal(true),
    response: z.string(),
    explanation: z.string(),
    source: z.string().trim().min(1),
  }),
]);

const publicBoardSchema = z.strictObject({
  id: identifierSchema,
  round: z.enum(['round-one', 'round-two']),
  categories: z.array(z.strictObject({
    id: identifierSchema,
    name: z.string(),
    clues: z.array(z.strictObject({
      id: identifierSchema,
      value: z.number().int().nonnegative(),
      selected: z.boolean(),
    })).length(5),
  })).length(6),
});

export const publicGameViewSchema = z.strictObject({
  appVersion: z.literal(APP_VERSION),
  language: z.enum(['en', 'et']),
  phase: z.enum([
    'round-one-board', 'ordinary-clue', 'round-two-board', 'clue-reveal', 'final-category',
    'final-wagers', 'final-clue', 'final-reveal', 'tiebreaker', 'complete',
  ]),
  displayMode: z.enum(['single', 'dual']),
  teams: z.array(z.strictObject({
    id: identifierSchema,
    name: z.string().trim().min(1),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    score: z.number().int(),
  })).min(2).max(8),
  board: publicBoardSchema.nullable(),
  activeClue: publicActiveClueSchema.nullable(),
  timer: gameTimerSchema,
  controllingTeamId: identifierSchema.nullable(),
  winnerTeamId: identifierSchema.nullable(),
  tiebreakerTeamIds: z.array(identifierSchema),
  final: z.strictObject({
    category: z.string().trim().min(1),
    eligibleTeamIds: z.array(identifierSchema).min(1),
    revealed: z.array(z.strictObject({
      teamId: identifierSchema,
      wager: z.number().int().nonnegative(),
      correct: z.boolean(),
    })),
  }).nullable(),
}).superRefine((view, context) => {
  const teamIds = new Set(view.teams.map((team) => team.id));
  const add = (message: string) => context.addIssue({ code: 'custom', message });
  const unique = (ids: readonly string[]) => new Set(ids).size === ids.length;
  if (!unique(view.teams.map((team) => team.id))) add('Team ids must be unique');
  if (view.controllingTeamId !== null && !teamIds.has(view.controllingTeamId)) add('Unknown controlling team');
  if (view.winnerTeamId !== null && !teamIds.has(view.winnerTeamId)) add('Unknown winner team');
  if (!unique(view.tiebreakerTeamIds) || view.tiebreakerTeamIds.some((id) => !teamIds.has(id))) add('Invalid tiebreaker teams');
  if (view.final !== null) {
    const eligible = new Set(view.final.eligibleTeamIds);
    if (!unique(view.final.eligibleTeamIds) || view.final.eligibleTeamIds.some((id) => !teamIds.has(id))) add('Invalid Final eligible teams');
    if (!unique(view.final.revealed.map((entry) => entry.teamId))
      || view.final.revealed.some((entry) => !eligible.has(entry.teamId))) add('Invalid Final reveals');
  }

  const boardPhase = view.phase === 'round-one-board' || view.phase === 'round-two-board';
  if (boardPhase) {
    const expectedRound = view.phase === 'round-one-board' ? 'round-one' : 'round-two';
    if (view.board?.round !== expectedRound || view.activeClue !== null || view.final !== null
      || view.winnerTeamId !== null || view.tiebreakerTeamIds.length !== 0 || view.controllingTeamId === null) add('Invalid board projection');
    return;
  }
  if (view.board !== null) add('Board is only public during a board phase');

  if (view.phase === 'ordinary-clue') {
    if (view.activeClue?.responseRevealed === true || view.final !== null || view.winnerTeamId !== null
      || view.tiebreakerTeamIds.length !== 0 || view.controllingTeamId === null) add('Invalid ordinary clue projection');
  } else if (view.phase === 'clue-reveal') {
    if (view.activeClue === null || !view.activeClue.responseRevealed || view.final !== null
      || view.winnerTeamId !== null || view.tiebreakerTeamIds.length !== 0 || view.controllingTeamId === null) add('Invalid clue reveal projection');
  } else if (view.phase === 'final-category' || view.phase === 'final-wagers') {
    if (view.activeClue !== null || view.final === null || view.final.revealed.length !== 0
      || view.controllingTeamId !== null || view.winnerTeamId !== null || view.tiebreakerTeamIds.length !== 0) add('Invalid Final wager projection');
  } else if (view.phase === 'final-clue') {
    if (view.activeClue === null || view.activeClue.responseRevealed || view.final === null || view.final.revealed.length !== 0
      || view.controllingTeamId !== null || view.winnerTeamId !== null || view.tiebreakerTeamIds.length !== 0) add('Invalid Final clue projection');
  } else if (view.phase === 'final-reveal') {
    if (view.activeClue === null || !view.activeClue.responseRevealed || view.final === null || view.final.revealed.length === 0
      || view.controllingTeamId !== null || view.winnerTeamId !== null || view.tiebreakerTeamIds.length !== 0) add('Invalid Final reveal projection');
  } else if (view.phase === 'tiebreaker') {
    if (view.activeClue === null || view.activeClue.responseRevealed || view.final !== null
      || view.controllingTeamId !== null || view.winnerTeamId !== null || view.tiebreakerTeamIds.length < 2) add('Invalid tiebreaker projection');
  } else if (view.phase === 'complete') {
    if (view.controllingTeamId !== null || view.tiebreakerTeamIds.length !== 0
      || (view.activeClue !== null && !view.activeClue.responseRevealed)
      || (view.winnerTeamId === null && (view.activeClue !== null || view.final !== null))
      || (view.final !== null && view.activeClue === null)) add('Invalid completed projection');
  }
});

export const hostStateUpdateSchema = z.strictObject({
  revision: z.number().int().nonnegative(),
  view: hostGameViewSchema,
});

export const publicStateUpdateSchema = z.strictObject({
  revision: z.number().int().nonnegative(),
  view: publicGameViewSchema,
});

export const contentAvailabilitySchema = z.discriminatedUnion('ok', [
  z.strictObject({ ok: z.literal(true) }),
  z.strictObject({
    ok: z.literal(false),
    roundOneMissing: z.number().int().nonnegative(),
    roundTwoMissing: z.number().int().nonnegative(),
    finalMissing: z.union([z.literal(0), z.literal(1)]),
  }),
]);

export const setupOptionsSchema = z.strictObject({
  packs: z.array(z.strictObject({
    id: identifierSchema,
    name: z.string().trim().min(1),
    enabled: z.boolean(),
  })),
  automaticDisplayMode: z.enum(['single', 'dual']),
});

export const noArgsSchema = z.undefined();
export const hasResumableMatchSchema = z.boolean();
export { audioSettingsSchema };

const matchStandingSchema = z.strictObject({
  teamId: identifierSchema,
  name: z.string().trim().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  score: z.number().int(),
  rank: z.number().int().positive(),
});

export const matchHistoryEntrySchema = z.strictObject({
  id: identifierSchema,
  startedAt: timestampSchema,
  completedAt: timestampSchema,
  durationMs: timestampSchema,
  completionState: z.enum(['complete', 'incomplete']),
  language: z.enum(['en', 'et']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  packIds: z.array(identifierSchema).min(1),
  seed: z.string(),
  teams: z.array(teamSchema).min(2).max(8),
  standings: z.array(matchStandingSchema).min(2).max(8),
  winnerTeamId: identifierSchema.nullable(),
}).superRefine((entry, context) => {
  const teamIds = new Set(entry.teams.map((team) => team.id));
  const standingIds = entry.standings.map((standing) => standing.teamId);
  if (new Set(standingIds).size !== standingIds.length
    || standingIds.some((teamId) => !teamIds.has(teamId))
    || standingIds.length !== teamIds.size) {
    context.addIssue({ code: 'custom', message: 'History standings must contain every match team exactly once' });
  }
  if (entry.winnerTeamId !== null && !teamIds.has(entry.winnerTeamId)) {
    context.addIssue({ code: 'custom', message: 'History winner must be a match team' });
  }
});

export const matchHistorySchema = z.array(matchHistoryEntrySchema);

export type HostStateUpdate = z.infer<typeof hostStateUpdateSchema>;
export type PublicStateUpdate = z.infer<typeof publicStateUpdateSchema>;
export type ContentAvailabilityResponse = z.infer<typeof contentAvailabilitySchema>;
export type SetupOptions = z.infer<typeof setupOptionsSchema> & { automaticDisplayMode: DisplayMode };
export type MatchHistoryEntry = z.infer<typeof matchHistoryEntrySchema>;

export type ValidatedGameConfig = z.infer<typeof gameConfigSchema> & GameConfig;
export type ValidatedGameCommand = z.infer<typeof gameCommandSchema> & GameCommand;
export type ValidatedGameState = z.infer<typeof gameStateSchema> & GameState;
export type ValidatedGameEvent = z.infer<typeof gameEventSchema> & GameEvent;

interface StateSubscriptionApi {
  subscribeToState(listener: (view: HostGameView | PublicGameView) => void): () => void;
  subscribeToAppearance(listener: (settings: AppearanceSettings) => void, onError?: () => void): () => void;
}

export interface HostQuizStageApi extends StateSubscriptionApi {
  dispatch(command: GameCommand): Promise<HostGameView>;
  startMatch(config: GameConfig): Promise<HostGameView>;
  checkContentAvailability(config: GameConfig): Promise<ContentAvailabilityResponse>;
  getSetupOptions(): Promise<SetupOptions>;
  hasResumableMatch(): Promise<boolean>;
  resumeMatch(): Promise<HostGameView | null>;
  listHistory(): Promise<MatchHistoryEntry[]>;
  saveAndQuit(): Promise<void>;
  listContent(): Promise<EditorLibrary>;
  saveCategorySet(input: SaveCategorySetRequest): Promise<EditorCategorySet>;
  saveFinalClue(input: SaveFinalClueRequest): Promise<EditorFinalClue>;
  createContentPack(input: unknown): Promise<EditorPack>;
  deleteContentPack(input: unknown): Promise<{ packId: string }>;
  reportContentClue(input: unknown): Promise<ContentReportRecord>;
  resolveContentReport(input: unknown): Promise<{ resolved: boolean }>;
  previewContentImport(): Promise<ContentImportPreview>;
  commitContentImport(input: unknown): Promise<ContentImportResult>;
  discardContentImport(input: unknown): Promise<{ discarded: boolean }>;
  exportContentPack(input: unknown): Promise<ContentExportResult>;
  getAudioSettings(): Promise<AudioSettings>;
  updateAudioSettings(settings: AudioSettings): Promise<AudioSettings>;
  getAppearanceSettings(): Promise<AppearanceSettings>;
  updateAppearanceSettings(settings: AppearanceSettings): Promise<AppearanceSettings>;
  subscribeToMediaWarnings(listener: (event: MediaStatusEvent) => void): () => void;
}

export type PublicQuizStageApi = StateSubscriptionApi;
export type QuizStageApi = HostQuizStageApi | PublicQuizStageApi;

declare global {
  interface Window {
    quizStage: QuizStageApi;
  }
}

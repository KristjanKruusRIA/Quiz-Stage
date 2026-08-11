import { randomUUID } from 'node:crypto';
import type { SelectedMatchContent } from '../../shared/game/boardSelector';
import type { ContentReportInput, ContentReportRecord } from '../../shared/content/schema';
import type { GameCommand } from '../../shared/game/commands';
import { applyGameCommand, createGame, tickTimer, type SelectedBoards } from '../../shared/game/engine';
import type { GameEvent } from '../../shared/game/events';
import { GameRuleError } from '../../shared/game/reducer';
import type {
  Clue,
  GameConfig,
  GameState,
  HostGameView,
  PublicGameView,
  RecoveryMetadata,
  RecoveryIssue,
} from '../../shared/game/types';
import { toHostGameView, toPublicGameView } from '../../shared/game/views';
import { sourceCitation } from '../../shared/content/sourceCitation';
import {
  gameCommandSchema,
  gameConfigSchema,
  type HostStateUpdate,
  type PublicStateUpdate,
} from '../../shared/ipc/contracts';

export interface CoordinatorContentService {
  selectForMatch(config: GameConfig, seed: string): SelectedMatchContent;
  selectNextTiebreaker(
    config: GameConfig,
    seed: string,
    excludedIds: readonly string[],
    tieIndex: number,
  ): Clue;
  reportClue(input: ContentReportInput): ContentReportRecord;
  runTransaction<T>(action: () => T): T;
}

export interface CoordinatorResumableMatch {
  matchId: string;
  snapshotSequence: number;
  eventSequence: number;
  state: GameState;
  events: GameEvent[];
  replayIssue: RecoveryIssue | null;
}

export interface CoordinatorRecoveredMatch extends CoordinatorResumableMatch {
  recoveredFromSnapshotSequence: number;
  skippedInvalidSnapshotSequence: number | null;
  skippedInvalidSnapshotSequences: number[];
}

export interface CoordinatorMatchRepository {
  persistTransition(matchId: string, events: GameEvent[], state: GameState, completedAt?: number): void;
  loadResumable(): CoordinatorResumableMatch | null;
  recoverLatest(): CoordinatorRecoveredMatch | null;
  completeMatch(matchId: string, completedAt?: number, recoveredState?: GameState): void;
}

export interface GameCoordinatorOptions {
  repository: CoordinatorMatchRepository;
  contentService: CoordinatorContentService;
  now?: () => number;
  createSeed?: () => string;
  setTimeout?: (callback: () => void, delayMs: number) => unknown;
  clearTimeout?: (handle: unknown) => void;
  expiryRetryDelayMs?: number;
}

type HostSubscriber = (view: HostGameView, revision: number) => void;
type PublicSubscriber = (view: PublicGameView, revision: number) => void;

export class GameCoordinator {
  private state: GameState | null = null;
  private replayIssue: RecoveryIssue | null = null;
  private recovery: RecoveryMetadata | null = null;
  private readonly hostSubscribers = new Set<HostSubscriber>();
  private readonly publicSubscribers = new Set<PublicSubscriber>();
  private publishing = false;
  private publicationPending = false;
  private revision = 0;
  private readonly now: () => number;
  private readonly createSeed: () => string;
  private readonly setTimeout: (callback: () => void, delayMs: number) => unknown;
  private readonly clearTimeout: (handle: unknown) => void;
  private readonly expiryRetryDelayMs: number;
  private timerHandle: unknown | null = null;
  private timerGeneration = 0;
  private disposed = false;

  constructor(private readonly options: GameCoordinatorOptions) {
    this.now = options.now ?? Date.now;
    this.createSeed = options.createSeed ?? randomUUID;
    this.setTimeout = options.setTimeout ?? ((callback, delayMs) => {
      const handle = globalThis.setTimeout(callback, delayMs);
      handle.unref();
      return handle;
    });
    this.clearTimeout = options.clearTimeout ?? ((handle) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>));
    const retryDelay = options.expiryRetryDelayMs ?? 1_000;
    this.expiryRetryDelayMs = Number.isFinite(retryDelay)
      ? Math.max(100, Math.min(10_000, Math.trunc(retryDelay)))
      : 1_000;
  }

  async startMatch(input: unknown): Promise<HostGameView> {
    const config = gameConfigSchema.parse(input) as GameConfig;
    const seed = this.createSeed();
    const selected = this.options.contentService.selectForMatch(config, seed);
    if (!selected.ok) {
      throw new Error(`CONTENT_SHORTAGE:${selected.roundOneMissing}:${selected.roundTwoMissing}:${selected.finalMissing}`);
    }
    const nextState = createGame(config, toCanonicalBoards(selected), this.now());
    this.options.repository.persistTransition(nextState.id, [], nextState);
    this.state = nextState;
    this.replayIssue = null;
    this.recovery = null;
    this.revision += 1;
    this.scheduleTimer();
    this.publish();
    return this.getHostView()!;
  }

  async dispatch(input: unknown): Promise<HostGameView> {
    const command = gameCommandSchema.parse(input) as GameCommand;
    const currentState = this.state;
    if (currentState === null) throw new Error('MATCH_REQUIRED');
    const occurrenceAt = this.now();

    const prepareTransition = (): {
      baseState: GameState;
      transition: { state: GameState; events: GameEvent[] };
    } => {
      let baseState = structuredClone(currentState);
      let transition: { state: GameState; events: GameEvent[] };
      try {
        transition = applyGameCommand(baseState, command, occurrenceAt);
      } catch (error) {
        if (!(error instanceof GameRuleError) || error.code !== 'TIEBREAKER_CLUE_REQUIRED') throw error;
        baseState = this.appendNextTiebreaker(baseState);
        transition = applyGameCommand(baseState, command, occurrenceAt);
      }
      return { baseState, transition };
    };
    const persistTransition = ({ baseState, transition }: ReturnType<typeof prepareTransition>): void => {
      this.options.repository.persistTransition(
        baseState.id,
        transition.events,
        transition.state,
        transition.state.phase === 'complete' ? occurrenceAt : undefined,
      );
    };
    let transition: { state: GameState; events: GameEvent[] };
    if (command.type === 'ReportClue') {
      transition = this.options.contentService.runTransaction(() => {
        const prepared = prepareTransition();
        this.options.contentService.reportClue({
          clueId: command.clueId,
          matchId: prepared.baseState.id,
          note: command.reason,
          createdAt: occurrenceAt,
        });
        persistTransition(prepared);
        return prepared.transition;
      });
    } else {
      const prepared = prepareTransition();
      persistTransition(prepared);
      transition = prepared.transition;
    }
    this.state = transition.state;
    this.revision += 1;
    this.scheduleTimer();
    this.publish();
    return this.getHostView()!;
  }

  async resume(): Promise<HostGameView | null> {
    const resumable = this.options.repository.loadResumable();
    if (resumable === null) return null;
    return this.adoptRecovered(resumable, null);
  }

  async resumeLatest(): Promise<HostGameView | null> {
    const durablyReconciledMatchIds = new Set<string>();
    while (true) {
      const resumable = this.options.repository.recoverLatest();
      if (resumable === null) return null;
      if (durablyReconciledMatchIds.has(resumable.matchId)) throw new Error('RECOVERY_DID_NOT_PROGRESS');
      const recovered = this.adoptRecovered(resumable, {
        recoveredFromSnapshotSequence: resumable.recoveredFromSnapshotSequence,
        skippedInvalidSnapshotSequences: [...resumable.skippedInvalidSnapshotSequences],
      });
      if (recovered !== null) return recovered;
      durablyReconciledMatchIds.add(resumable.matchId);
    }
  }

  private adoptRecovered(
    resumable: CoordinatorResumableMatch,
    recovery: RecoveryMetadata | null,
  ): HostGameView | null {
    let state = structuredClone(resumable.state);
    let replayIssue = resumable.replayIssue;
    let terminalEventAt: number | null = null;

    for (const [index, event] of resumable.events.entries()) {
      try {
        const replayed = replayEvent(structuredClone(state), event);
        if (state.phase !== 'complete' && replayed.phase === 'complete') terminalEventAt = event.at;
        state = replayed;
      } catch {
        replayIssue = { sequence: resumable.eventSequence + index + 1, reason: 'invalid-event' };
        break;
      }
    }

    if (state.phase === 'complete') {
      this.options.repository.completeMatch(state.id, terminalEventAt ?? this.now(), state);
      return null;
    }

    if (state.timer.status === 'running' && state.timer.startedAt === null) {
      const anchored = structuredClone(state);
      anchored.timer.startedAt = this.now();
      this.options.repository.persistTransition(anchored.id, [], anchored);
      state = anchored;
    }

    this.state = state;
    this.replayIssue = replayIssue;
    this.recovery = recovery;
    this.revision += 1;
    this.scheduleTimer();
    this.publish();
    return this.getHostView()!;
  }

  subscribe(surface: 'host', subscriber: HostSubscriber): () => void;
  subscribe(surface: 'public', subscriber: PublicSubscriber): () => void;
  subscribe(surface: 'host' | 'public', subscriber: HostSubscriber | PublicSubscriber): () => void {
    if (surface === 'host') {
      const hostSubscriber = subscriber as HostSubscriber;
      this.hostSubscribers.add(hostSubscriber);
      const view = this.getHostView();
      if (view !== null) this.notify(hostSubscriber, view, this.revision);
      return () => this.hostSubscribers.delete(hostSubscriber);
    }
    const publicSubscriber = subscriber as PublicSubscriber;
    this.publicSubscribers.add(publicSubscriber);
    const view = this.getPublicView();
    if (view !== null) this.notify(publicSubscriber, view, this.revision);
    return () => this.publicSubscribers.delete(publicSubscriber);
  }

  getHostView(): HostGameView | null {
    return this.state === null ? null : toHostGameView(this.state, this.replayIssue, this.recovery);
  }

  getPublicView(): PublicGameView | null {
    return this.state === null ? null : toPublicGameView(this.state);
  }

  getHostStateUpdate(): HostStateUpdate | null {
    const view = this.getHostView();
    return view === null ? null : { revision: this.revision, view };
  }

  getPublicStateUpdate(): PublicStateUpdate | null {
    const view = this.getPublicView();
    return view === null ? null : { revision: this.revision, view };
  }

  dispose(): void {
    this.disposed = true;
    this.cancelTimer();
  }

  private appendNextTiebreaker(state: GameState): GameState {
    const excludedIds = [
      ...state.boards.flatMap((board) => board.categories.flatMap((category) => category.clues.map((clue) => clue.id))),
      ...(state.finalClue === null ? [] : [state.finalClue.id]),
      ...state.tiebreakerClues.map((clue) => clue.id),
      ...state.usedClueIds,
      ...state.usedTiebreakerClueIds,
    ];
    const clue = toCanonicalClue(this.options.contentService.selectNextTiebreaker(
      state.config,
      state.seed,
      excludedIds,
      state.tiebreakerClues.length,
    ));
    return { ...state, tiebreakerClues: [...state.tiebreakerClues, clue] };
  }

  private cancelTimer(): void {
    this.timerGeneration += 1;
    if (this.timerHandle !== null) {
      this.clearTimeout(this.timerHandle);
      this.timerHandle = null;
    }
  }

  private scheduleTimer(): void {
    this.cancelTimer();
    if (this.disposed || this.state?.timer.status !== 'running' || this.state.timer.startedAt === null) return;
    const generation = this.timerGeneration;
    const deadline = this.state.timer.startedAt + this.state.timer.remainingMs;
    const delayMs = Math.max(0, deadline - this.now());
    this.timerHandle = this.setTimeout(() => {
      void this.expireTimer(generation);
    }, delayMs);
  }

  private async expireTimer(generation: number): Promise<void> {
    if (this.disposed || generation !== this.timerGeneration || this.state === null) return;
    this.timerHandle = null;
    const candidate = structuredClone(this.state);
    const events = tickTimer(candidate, this.now());
    if (events.length === 0) {
      this.scheduleTimer();
      return;
    }
    try {
      this.options.repository.persistTransition(candidate.id, events, candidate);
    } catch {
      if (!this.disposed && generation === this.timerGeneration) {
        this.timerHandle = this.setTimeout(() => {
          void this.expireTimer(generation);
        }, this.expiryRetryDelayMs);
      }
      return;
    }
    if (this.disposed || generation !== this.timerGeneration) return;
    this.state = candidate;
    this.revision += 1;
    this.scheduleTimer();
    this.publish();
  }

  private publish(): void {
    this.publicationPending = true;
    if (this.publishing) return;
    this.publishing = true;
    try {
      while (this.publicationPending) {
        this.publicationPending = false;
        if (this.state === null) continue;
        const revision = this.revision;
        const hostView = toHostGameView(this.state, this.replayIssue, this.recovery);
        const publicView = toPublicGameView(this.state);
        for (const subscriber of [...this.hostSubscribers]) {
          this.notify(subscriber, hostView, revision);
          if (this.publicationPending) break;
        }
        if (this.publicationPending) continue;
        for (const subscriber of [...this.publicSubscribers]) {
          this.notify(subscriber, publicView, revision);
          if (this.publicationPending) break;
        }
      }
    } finally {
      this.publishing = false;
    }
  }

  private notify<T>(subscriber: (view: T, revision: number) => void, view: T, revision: number): void {
    try {
      subscriber(view, revision);
    } catch {
      // Renderer/listener failures cannot roll back or reject an already committed state.
    }
  }
}

function replayEvent(state: GameState, event: GameEvent): GameState {
  let transition: { state: GameState; events: GameEvent[] };
  if (event.type === 'CommandApplied') {
    transition = applyGameCommand(state, event.command, event.at);
  } else if (event.type === 'TimerExpired') {
    const replayState = structuredClone(state);
    transition = { state: replayState, events: tickTimer(replayState, event.at) };
  } else if (event.type === 'ActionUndone') {
    transition = applyGameCommand(state, { type: 'UndoLast' }, event.at);
  } else {
    transition = applyGameCommand(state, { type: 'EndIncompleteMatch' }, event.at);
  }
  if (transition.events.length !== 1 || JSON.stringify(transition.events[0]) !== JSON.stringify(event)) {
    throw new Error('Persisted replay event does not match the authoritative engine transition');
  }
  return transition.state;
}

function toCanonicalBoards(selected: Extract<SelectedMatchContent, { ok: true }>): SelectedBoards {
  if (selected.finalClue.categoryName.en.trim() === '') {
    throw new Error('FINAL_CATEGORY_REQUIRED');
  }
  return {
    seed: selected.seed,
    dailyDoubleClueIds: [...selected.dailyDoubleClueIds],
    boards: selected.boards.map((board) => ({
      id: board.id,
      round: board.round,
      categories: board.categories.map((category) => ({
        id: category.id,
        name: { ...category.name },
        macroTopic: category.macroTopic,
        clues: category.clues.map(toCanonicalClue),
      })),
    })),
    finalClue: toCanonicalClue(selected.finalClue),
    tiebreakerClues: [],
  };
}

function toCanonicalClue(clue: Clue): Clue {
  return {
    id: clue.id,
    categoryId: clue.categoryId,
    round: clue.round,
    tier: clue.tier,
    value: clue.value,
    prompt: { ...clue.prompt },
    response: { ...clue.response },
    explanation: { ...clue.explanation },
    source: sourceCitation(clue.source),
    ...(clue.acceptedResponses === undefined ? {} : { acceptedResponses: { ...clue.acceptedResponses } }),
    ...(clue.categoryName === undefined ? {} : { categoryName: { ...clue.categoryName } }),
  };
}

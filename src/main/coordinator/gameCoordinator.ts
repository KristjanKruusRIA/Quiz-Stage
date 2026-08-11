import { randomUUID } from 'node:crypto';
import type { SelectedMatchContent } from '../../shared/game/boardSelector';
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
  RecoveryIssue,
} from '../../shared/game/types';
import { toHostGameView, toPublicGameView } from '../../shared/game/views';
import { gameCommandSchema, gameConfigSchema } from '../../shared/ipc/contracts';

export interface CoordinatorContentService {
  selectForMatch(config: GameConfig, seed: string): SelectedMatchContent;
  selectNextTiebreaker(
    config: GameConfig,
    seed: string,
    excludedIds: readonly string[],
    tieIndex: number,
  ): Clue;
}

export interface CoordinatorResumableMatch {
  matchId: string;
  snapshotSequence: number;
  eventSequence: number;
  state: GameState;
  events: GameEvent[];
  replayIssue: RecoveryIssue | null;
}

export interface CoordinatorMatchRepository {
  persistTransition(matchId: string, events: GameEvent[], state: GameState): void;
  loadResumable(): CoordinatorResumableMatch | null;
  completeMatch(matchId: string, completedAt?: number): void;
}

interface GameCoordinatorOptions {
  repository: CoordinatorMatchRepository;
  contentService: CoordinatorContentService;
  now?: () => number;
  createSeed?: () => string;
}

type HostSubscriber = (view: HostGameView) => void;
type PublicSubscriber = (view: PublicGameView) => void;

export class GameCoordinator {
  private state: GameState | null = null;
  private replayIssue: RecoveryIssue | null = null;
  private readonly hostSubscribers = new Set<HostSubscriber>();
  private readonly publicSubscribers = new Set<PublicSubscriber>();
  private readonly now: () => number;
  private readonly createSeed: () => string;

  constructor(private readonly options: GameCoordinatorOptions) {
    this.now = options.now ?? Date.now;
    this.createSeed = options.createSeed ?? randomUUID;
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
    this.publish();
    return this.getHostView()!;
  }

  async dispatch(input: unknown): Promise<HostGameView> {
    const command = gameCommandSchema.parse(input) as GameCommand;
    if (this.state === null) throw new Error('MATCH_REQUIRED');

    let baseState = structuredClone(this.state);
    let transition: { state: GameState; events: GameEvent[] };
    try {
      transition = applyGameCommand(baseState, command);
    } catch (error) {
      if (!(error instanceof GameRuleError) || error.code !== 'TIEBREAKER_CLUE_REQUIRED') throw error;
      baseState = this.persistNextTiebreaker(baseState);
      transition = applyGameCommand(baseState, command);
    }

    this.options.repository.persistTransition(baseState.id, transition.events, transition.state);
    if (transition.state.phase === 'complete') {
      this.options.repository.completeMatch(baseState.id, this.now());
    }
    this.state = transition.state;
    this.publish();
    return this.getHostView()!;
  }

  async resume(): Promise<HostGameView | null> {
    const resumable = this.options.repository.loadResumable();
    if (resumable === null) return null;
    let state = structuredClone(resumable.state);
    let replayIssue = resumable.replayIssue;

    for (const [index, event] of resumable.events.entries()) {
      try {
        state = replayEvent(state, event);
      } catch {
        replayIssue = { sequence: resumable.eventSequence + index + 1, reason: 'invalid-event' };
        break;
      }
    }

    this.state = state;
    this.replayIssue = replayIssue;
    if (state.phase === 'complete') this.options.repository.completeMatch(state.id, this.now());
    this.publish();
    return this.getHostView();
  }

  subscribe(surface: 'host', subscriber: HostSubscriber): () => void;
  subscribe(surface: 'public', subscriber: PublicSubscriber): () => void;
  subscribe(surface: 'host' | 'public', subscriber: HostSubscriber | PublicSubscriber): () => void {
    if (surface === 'host') {
      const hostSubscriber = subscriber as HostSubscriber;
      this.hostSubscribers.add(hostSubscriber);
      const view = this.getHostView();
      if (view !== null) hostSubscriber(view);
      return () => this.hostSubscribers.delete(hostSubscriber);
    }
    const publicSubscriber = subscriber as PublicSubscriber;
    this.publicSubscribers.add(publicSubscriber);
    const view = this.getPublicView();
    if (view !== null) publicSubscriber(view);
    return () => this.publicSubscribers.delete(publicSubscriber);
  }

  getHostView(): HostGameView | null {
    return this.state === null ? null : toHostGameView(this.state, this.replayIssue);
  }

  getPublicView(): PublicGameView | null {
    return this.state === null ? null : toPublicGameView(this.state);
  }

  private persistNextTiebreaker(state: GameState): GameState {
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
    const augmented = { ...state, tiebreakerClues: [...state.tiebreakerClues, clue] };
    this.options.repository.persistTransition(state.id, [], augmented);
    this.state = augmented;
    return augmented;
  }

  private publish(): void {
    if (this.state === null) return;
    const hostView = toHostGameView(this.state, this.replayIssue);
    const publicView = toPublicGameView(this.state);
    for (const subscriber of this.hostSubscribers) subscriber(hostView);
    for (const subscriber of this.publicSubscribers) subscriber(publicView);
  }
}

function replayEvent(state: GameState, event: GameEvent): GameState {
  let transition: { state: GameState; events: GameEvent[] };
  if (event.type === 'CommandApplied') {
    transition = applyGameCommand(state, event.command);
  } else if (event.type === 'TimerExpired') {
    const replayState = structuredClone(state);
    transition = { state: replayState, events: tickTimer(replayState, event.at) };
  } else if (event.type === 'ActionUndone') {
    transition = applyGameCommand(state, { type: 'UndoLast' });
  } else {
    transition = applyGameCommand(state, { type: 'EndIncompleteMatch' });
  }
  if (transition.events.length !== 1 || JSON.stringify(transition.events[0]) !== JSON.stringify(event)) {
    throw new Error('Persisted replay event does not match the authoritative engine transition');
  }
  return transition.state;
}

function toCanonicalBoards(selected: Extract<SelectedMatchContent, { ok: true }>): SelectedBoards {
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
    source: clue.source,
    ...(clue.acceptedResponses === undefined ? {} : { acceptedResponses: { ...clue.acceptedResponses } }),
  };
}

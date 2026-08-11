import { describe, expect, it, vi } from 'vitest';
import { selectMatchContent } from '../../../src/shared/game/boardSelector';
import { applyGameCommand, createGame } from '../../../src/shared/game/engine';
import type { GameCommand } from '../../../src/shared/game/commands';
import type { GameState } from '../../../src/shared/game/types';
import { GameCoordinator, type CoordinatorContentService, type CoordinatorMatchRepository } from '../../../src/main/coordinator/gameCoordinator';
import { selectionInput } from '../../fixtures/contentFactory';

function dependencies() {
  const input = selectionInput();
  const selected = selectMatchContent(input);
  if (!selected.ok) throw new Error('fixture selection failed');
  let resumable: ReturnType<CoordinatorMatchRepository['loadResumable']> = null;
  const persistenceOrder: string[] = [];
  const repository: CoordinatorMatchRepository = {
    persistTransition: vi.fn(() => {
      persistenceOrder.push('persist');
    }),
    loadResumable: vi.fn(() => resumable),
    completeMatch: vi.fn(() => persistenceOrder.push('complete')),
  };
  const contentService: CoordinatorContentService = {
    selectForMatch: vi.fn(() => selected),
    selectNextTiebreaker: vi.fn(() => ({
      ...input.finalClues[1],
      round: 'tiebreaker' as const,
    })),
  };
  const coordinator = new GameCoordinator({
    repository,
    contentService,
    now: () => 42,
    createSeed: () => 'authoritative-seed',
  });
  return { coordinator, repository, contentService, selected, persistenceOrder, setResumable: (value: typeof resumable) => { resumable = value; } };
}

function timerDependencies() {
  const input = selectionInput();
  const selected = selectMatchContent(input);
  if (!selected.ok) throw new Error('fixture selection failed');
  let now = 1_000;
  let nextHandle = 1;
  const callbacks = new Map<number, () => void>();
  const repository: CoordinatorMatchRepository = {
    persistTransition: vi.fn(),
    loadResumable: vi.fn(() => null),
    completeMatch: vi.fn(),
  };
  const coordinator = new GameCoordinator({
    repository,
    contentService: {
      selectForMatch: () => selected,
      selectNextTiebreaker: () => ({ ...input.finalClues[1], round: 'tiebreaker' as const }),
    },
    now: () => now,
    createSeed: () => 'authoritative-seed',
    setTimeout: (callback) => {
      const handle = nextHandle++;
      callbacks.set(handle, callback);
      return handle;
    },
    clearTimeout: (handle) => typeof handle === 'number' && callbacks.delete(handle),
  });
  return {
    coordinator,
    repository,
    callbacks,
    setNow: (value: number) => { now = value; },
    runNext: async () => {
      const entry = callbacks.entries().next().value as [number, () => void] | undefined;
      if (entry === undefined) throw new Error('no scheduled timer');
      callbacks.delete(entry[0]);
      entry[1]();
      await Promise.resolve();
      await Promise.resolve();
    },
  };
}

describe('GameCoordinator', () => {
  it('anchors, persists, and expires an ordinary clue exactly once at the authoritative deadline', async () => {
    const { coordinator, repository, callbacks, setNow, runNext } = timerDependencies();
    await coordinator.startMatch(selectionInput().config);
    vi.mocked(repository.persistTransition).mockClear();
    const clueId = coordinator.getHostView()!.state.boards[0].categories[0].clues[0].id;

    const opened = await coordinator.dispatch({ type: 'SelectClue', clueId });
    expect(opened.state.timer.startedAt).toBe(1_000);
    expect(callbacks).toHaveLength(1);

    setNow(16_000);
    await runNext();
    await vi.waitFor(() => expect(coordinator.getHostView()!.state.timer.status).toBe('expired'));

    const calls = vi.mocked(repository.persistTransition).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[1][1]).toMatchObject([{ type: 'TimerExpired', at: 16_000 }]);
    expect(callbacks).toHaveLength(0);
  });

  it('does not publish or adopt an expiry when persistence fails', async () => {
    const { coordinator, repository, setNow, runNext } = timerDependencies();
    await coordinator.startMatch(selectionInput().config);
    const clueId = coordinator.getHostView()!.state.boards[0].categories[0].clues[0].id;
    await coordinator.dispatch({ type: 'SelectClue', clueId });
    const before = coordinator.getHostView();
    const published: unknown[] = [];
    coordinator.subscribe('public', (view) => published.push(view));
    published.length = 0;
    vi.mocked(repository.persistTransition).mockImplementationOnce(() => { throw new Error('disk full'); });

    setNow(16_000);
    await runNext();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(coordinator.getHostView()).toEqual(before);
    expect(published).toEqual([]);
  });

  it('cancels and reschedules timers for pause, resume, reset, undo, and disposal', async () => {
    const { coordinator, callbacks, setNow } = timerDependencies();
    await coordinator.startMatch(selectionInput().config);
    const clueId = coordinator.getHostView()!.state.boards[0].categories[0].clues[0].id;
    await coordinator.dispatch({ type: 'SelectClue', clueId });
    expect(callbacks).toHaveLength(1);

    setNow(2_000);
    await coordinator.dispatch({ type: 'PauseTimer', at: 2_000 });
    expect(callbacks).toHaveLength(0);
    await coordinator.dispatch({ type: 'ResumeTimer', at: 3_000 });
    expect(callbacks).toHaveLength(1);
    await coordinator.dispatch({ type: 'ResetTimer', at: 4_000 });
    expect(callbacks).toHaveLength(1);
    await coordinator.dispatch({ type: 'UndoLast' });
    expect(callbacks).toHaveLength(1);
    coordinator.dispose();
    expect(callbacks).toHaveLength(0);
  });

  it('reschedules an early scheduler callback instead of expiring authority early', async () => {
    const { coordinator, callbacks, setNow, runNext } = timerDependencies();
    await coordinator.startMatch(selectionInput().config);
    const clueId = coordinator.getHostView()!.state.boards[0].categories[0].clues[0].id;
    await coordinator.dispatch({ type: 'SelectClue', clueId });

    setNow(15_999);
    await runNext();

    expect(coordinator.getHostView()!.state.timer.status).toBe('running');
    expect(callbacks).toHaveLength(1);
  });
  it('validates setup, selects content, persists the initial snapshot, then publishes both projections', async () => {
    const { coordinator, contentService, persistenceOrder, selected } = dependencies();
    const published: string[] = [];
    coordinator.subscribe('host', () => published.push('host'));
    coordinator.subscribe('public', () => published.push('public'));

    const started = await coordinator.startMatch(selectionInput().config);

    expect(contentService.selectForMatch).toHaveBeenCalledWith(selectionInput().config, 'authoritative-seed');
    expect(persistenceOrder).toEqual(['persist']);
    expect(published).toEqual(['host', 'public']);
    expect(started.state.finalClue?.categoryName).toEqual(selected.finalClue.categoryName);
    expect(JSON.stringify(coordinator.getPublicView())).not.toContain(selected.finalClue.categoryName.en);
    await expect(coordinator.startMatch({ ...selectionInput().config, teams: [] })).rejects.toThrow();
  });

  it('does not publish or replace canonical state when atomic persistence fails', async () => {
    const { coordinator, repository } = dependencies();
    await coordinator.startMatch(selectionInput().config);
    const before = coordinator.getHostView();
    const published: unknown[] = [];
    coordinator.subscribe('public', (view) => published.push(view));
    published.length = 0;
    vi.mocked(repository.persistTransition).mockImplementationOnce(() => { throw new Error('disk full'); });

    await expect(coordinator.dispatch({ type: 'SelectClue', clueId: before!.state.boards[0].categories[0].clues[0].id }))
      .rejects.toThrow('disk full');

    expect(coordinator.getHostView()).toEqual(before);
    expect(published).toEqual([]);
  });

  it('isolates engine-side timer mutation when persistence fails', async () => {
    const { coordinator, repository } = dependencies();
    await coordinator.startMatch(selectionInput().config);
    const clueId = coordinator.getHostView()!.state.boards[0].categories[0].clues[0].id;
    await coordinator.dispatch({ type: 'SelectClue', clueId });
    const before = coordinator.getHostView();
    vi.mocked(repository.persistTransition).mockImplementationOnce(() => { throw new Error('disk full'); });

    await expect(coordinator.dispatch({ type: 'LockTeam', teamId: 'team-1', at: 100 }))
      .rejects.toThrow('disk full');

    expect(coordinator.getHostView()).toEqual(before);
  });

  it('replays only the repository-validated contiguous prefix and exposes the recovery issue only to the host', async () => {
    const { coordinator, selected, setResumable } = dependencies();
    const snapshot = createGame(selectionInput().config, selected, 42);
    const transition = applyGameCommand(snapshot, { type: 'SelectClue', clueId: selected.boards[0].categories[0].clues[0].id });
    setResumable({
      matchId: snapshot.id,
      snapshotSequence: 1,
      eventSequence: 0,
      state: snapshot,
      events: transition.events,
      replayIssue: { sequence: 2, reason: 'missing-sequence' },
    });

    const recovered = await coordinator.resume();

    expect(recovered?.state.phase).toBe('ordinary-clue');
    expect(recovered?.replayIssue).toEqual({ sequence: 2, reason: 'missing-sequence' });
    expect(JSON.stringify(coordinator.getPublicView())).not.toContain('replayIssue');
  });

  it('replays a persisted first Final reveal with its canonical response and judgment', async () => {
    const { coordinator, selected, setResumable } = dependencies();
    const base = createGame(selectionInput().config, selected, 42);
    const beforeReveal: GameState = {
      ...base,
      phase: 'final-clue',
      scores: { 'team-1': 100, 'team-2': 0 },
      finalEligibleTeamIds: ['team-1'],
      finalRevealOrder: ['team-1'],
      finalWagers: { 'team-1': 50 },
      activeClue: { clueId: selected.finalClue.id, lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
      timer: { durationMs: 30_000, remainingMs: 0, startedAt: null, status: 'expired' },
    };
    const reveal = applyGameCommand(beforeReveal, { type: 'RevealFinalTeam', teamId: 'team-1', correct: true });
    setResumable({
      matchId: beforeReveal.id, snapshotSequence: 1, eventSequence: 0,
      state: beforeReveal, events: reveal.events, replayIssue: null,
    });

    const recovered = await coordinator.resume();
    expect(recovered?.state.finalJudgments).toEqual({ 'team-1': true });
    expect(recovered?.state.activeClue?.responseRevealed).toBe(true);
    expect(recovered?.state).toEqual(reveal.state);
  });

  it('persists a newly selected canonical tiebreaker before a command can display it publicly', async () => {
    const { coordinator, repository, contentService, selected, setResumable } = dependencies();
    const base = createGame(selectionInput().config, selected, 42);
    const tiedFinal: GameState = {
      ...base,
      phase: 'final-clue',
      scores: { 'team-1': 100, 'team-2': 100 },
      finalEligibleTeamIds: ['team-1', 'team-2'],
      finalRevealOrder: ['team-1'],
      finalRevealedTeamIds: [],
      finalWagers: { 'team-1': 0 },
      timer: { durationMs: 30_000, remainingMs: 0, startedAt: null, status: 'expired' },
      tiebreakerClues: [],
    };
    setResumable({ matchId: base.id, snapshotSequence: 1, eventSequence: 0, state: tiedFinal, events: [], replayIssue: null });
    await coordinator.resume();
    vi.mocked(repository.persistTransition).mockClear();
    const publicStates: string[] = [];
    coordinator.subscribe('public', (view) => publicStates.push(JSON.stringify(view)));
    publicStates.length = 0;

    await coordinator.dispatch({ type: 'RevealFinalTeam', teamId: 'team-1', correct: true });

    expect(contentService.selectNextTiebreaker).toHaveBeenCalledOnce();
    expect(contentService.selectNextTiebreaker).toHaveBeenCalledWith(
      tiedFinal.config,
      tiedFinal.seed,
      expect.arrayContaining([tiedFinal.finalClue!.id]),
      0,
    );
    const calls = vi.mocked(repository.persistTransition).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[0][1]).toEqual([]);
    expect(calls[0][2].tiebreakerClues).toHaveLength(1);
    expect(calls[1][2].phase).toBe('tiebreaker');
    expect(publicStates.at(-1)).not.toContain('Final response final-2');
  });

  it('rejects malformed renderer commands before dispatching or persisting', async () => {
    const { coordinator, repository } = dependencies();
    await coordinator.startMatch(selectionInput().config);
    vi.mocked(repository.persistTransition).mockClear();

    await expect(coordinator.dispatch({ type: 'SelectClue', clueId: 'x', delta: 10 } as unknown as GameCommand)).rejects.toThrow();
    expect(repository.persistTransition).not.toHaveBeenCalled();
  });

  it('marks a terminal snapshot complete after persistence and before publishing', async () => {
    const { coordinator, persistenceOrder } = dependencies();
    await coordinator.startMatch(selectionInput().config);
    persistenceOrder.length = 0;
    coordinator.subscribe('host', () => persistenceOrder.push('publish'));
    persistenceOrder.length = 0;

    await coordinator.dispatch({ type: 'EndIncompleteMatch' });

    expect(persistenceOrder).toEqual(['persist', 'complete', 'publish']);
  });

  it('isolates a throwing listener after commit and continues publishing both projections', async () => {
    const { coordinator } = dependencies();
    await coordinator.startMatch(selectionInput().config);
    let shouldThrow = false;
    coordinator.subscribe('host', () => {
      if (shouldThrow) throw new Error('renderer listener failed');
    });
    const hostStates: number[] = [];
    const publicStates: string[] = [];
    coordinator.subscribe('host', (view) => hostStates.push(view.state.eventSequence));
    coordinator.subscribe('public', (view) => publicStates.push(view.phase));
    hostStates.length = 0;
    publicStates.length = 0;
    shouldThrow = true;

    const view = await coordinator.dispatch({
      type: 'SelectClue',
      clueId: coordinator.getHostView()!.state.boards[0].categories[0].clues[0].id,
    });

    expect(view.state.eventSequence).toBe(1);
    expect(hostStates).toEqual([1]);
    expect(publicStates).toEqual(['ordinary-clue']);
  });

  it('does not deliver an older publication after a listener dispatches a newer state', async () => {
    const { coordinator } = dependencies();
    await coordinator.startMatch(selectionInput().config);
    let reentrantDispatch: Promise<unknown> | undefined;
    coordinator.subscribe('host', (view) => {
      if (view.state.eventSequence === 1 && reentrantDispatch === undefined) {
        reentrantDispatch = coordinator.dispatch({ type: 'EndIncompleteMatch' });
      }
    });
    const hostStates: number[] = [];
    const publicStates: string[] = [];
    coordinator.subscribe('host', (view) => hostStates.push(view.state.eventSequence));
    coordinator.subscribe('public', (view) => publicStates.push(view.phase));
    hostStates.length = 0;
    publicStates.length = 0;

    await coordinator.dispatch({
      type: 'SelectClue',
      clueId: coordinator.getHostView()!.state.boards[0].categories[0].clues[0].id,
    });
    await reentrantDispatch;

    expect(hostStates).toEqual([2]);
    expect(publicStates).toEqual(['complete']);
  });

  it('keeps the last valid recovery state byte-equivalent when a replay event mutates then fails validation', async () => {
    const { coordinator, selected, setResumable } = dependencies();
    const initial = createGame(selectionInput().config, selected, 42);
    const selectedState = applyGameCommand(initial, {
      type: 'SelectClue',
      clueId: selected.boards[0].categories[0].clues[0].id,
    }).state;
    const before = structuredClone(selectedState);
    setResumable({
      matchId: selectedState.id,
      snapshotSequence: 1,
      eventSequence: 1,
      state: selectedState,
      events: [{
        id: 'semantic-mismatch',
        matchId: selectedState.id,
        at: 100,
        type: 'CommandApplied',
        command: { type: 'LockTeam', teamId: 'team-1', at: 100 },
      }],
      replayIssue: null,
    });

    const recovered = await coordinator.resume();

    expect(recovered?.state).toEqual({
      ...before,
      timer: { ...before.timer, startedAt: 42 },
    });
    expect(recovered?.replayIssue).toEqual({ sequence: 2, reason: 'invalid-event' });
  });
});

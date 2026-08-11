import { describe, expect, it, vi } from 'vitest';
import { selectMatchContent } from '../../../src/shared/game/boardSelector';
import { applyGameCommand, createGame } from '../../../src/shared/game/engine';
import type { GameCommand } from '../../../src/shared/game/commands';
import type { GameState } from '../../../src/shared/game/types';
import { GameCoordinator, type CoordinatorContentService, type CoordinatorMatchRepository } from '../../../src/main/coordinator/gameCoordinator';
import { toPublicGameView } from '../../../src/shared/game/views';
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
    recoverLatest: vi.fn(() => null),
    completeMatch: vi.fn(() => persistenceOrder.push('complete')),
  };
  const contentService: CoordinatorContentService = {
    selectForMatch: vi.fn(() => selected),
    selectNextTiebreaker: vi.fn(() => ({
      ...input.finalClues[1],
      round: 'tiebreaker' as const,
    })),
    reportClue: vi.fn((report) => ({ id: 1, ...report, resolvedAt: null })),
    runTransaction: (action) => action(),
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
  const callbacks = new Map<number, { callback: () => void; delayMs: number }>();
  const repository: CoordinatorMatchRepository = {
    persistTransition: vi.fn(),
    loadResumable: vi.fn(() => null),
    recoverLatest: vi.fn(() => null),
    completeMatch: vi.fn(),
  };
  const coordinator = new GameCoordinator({
    repository,
    contentService: {
      selectForMatch: () => selected,
      selectNextTiebreaker: () => ({ ...input.finalClues[1], round: 'tiebreaker' as const }),
      reportClue: (report) => ({ id: 1, ...report, resolvedAt: null }),
      runTransaction: (action) => action(),
    },
    now: () => now,
    createSeed: () => 'authoritative-seed',
    setTimeout: (callback, delayMs) => {
      const handle = nextHandle++;
      callbacks.set(handle, { callback, delayMs });
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
      const entry = callbacks.entries().next().value as [number, { callback: () => void; delayMs: number }] | undefined;
      if (entry === undefined) throw new Error('no scheduled timer');
      callbacks.delete(entry[0]);
      entry[1].callback();
      await Promise.resolve();
      await Promise.resolve();
    },
  };
}

describe('GameCoordinator', () => {
  it('projects structured custom board and Final sources as safe citations while preserving legacy text', async () => {
    const { coordinator, selected } = dependencies();
    const boardClue = selected.boards.flatMap((board) => board.categories.flatMap((category) => category.clues))
      .find((clue) => !selected.dailyDoubleClueIds.includes(clue.id))!;
    const legacyClue = selected.boards[0].categories[0].clues.find((clue) => clue.id !== boardClue.id)!;
    boardClue.source = JSON.stringify({ format: 'quiz-stage-csv-v1', title: 'Open board facts',
      url: 'https://example.com/board', license: 'CC0', retrievedAt: '2026-08-12', translationStatus: 'reviewed' });
    selected.finalClue.source = JSON.stringify({ format: 'quiz-stage-csv-v1', title: 'Open Final facts',
      url: 'https://example.com/final', license: 'CC BY 4.0', retrievedAt: '2026-08-12', translationStatus: 'reviewed' });
    legacyClue.source = '{malformed local source';

    const host = await coordinator.startMatch(selectionInput().config);
    const canonicalBoard = host.state.boards.flatMap((board) => board.categories.flatMap((category) => category.clues));
    expect(canonicalBoard.find((clue) => clue.id === boardClue.id)?.source).toBe('Open board facts');
    expect(canonicalBoard.find((clue) => clue.id === legacyClue.id)?.source).toBe('{malformed local source');
    expect(host.state.finalClue?.source).toBe('Open Final facts');
    expect(JSON.stringify(host)).not.toContain('quiz-stage-csv-v1');

    await coordinator.dispatch({ type: 'SelectClue', clueId: boardClue.id });
    await coordinator.dispatch({ type: 'RevealResponse' });
    expect(coordinator.getPublicView()?.activeClue).toMatchObject({ source: 'Open board facts' });

    const finalState = structuredClone(host.state);
    finalState.phase = 'final-reveal';
    finalState.finalEligibleTeamIds = ['team-1'];
    finalState.finalWagers = { 'team-1': 0 };
    finalState.finalRevealOrder = ['team-1'];
    finalState.finalRevealedTeamIds = ['team-1'];
    finalState.finalJudgments = { 'team-1': true };
    finalState.activeClue = { clueId: finalState.finalClue!.id, lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: true };
    expect(toPublicGameView(finalState).activeClue).toMatchObject({ source: 'Open Final facts' });
  });

  it('does not persist, publish, or adopt rejected clue reports', async () => {
    const { coordinator, repository } = dependencies();
    await coordinator.startMatch(selectionInput().config);
    const published: string[] = [];
    coordinator.subscribe('host', (view) => published.push(JSON.stringify(view)));
    const boardClues = coordinator.getHostView()!.state.boards[0].categories.flatMap((category) => category.clues);
    vi.mocked(repository.persistTransition).mockClear();
    published.length = 0;

    let before = JSON.stringify(coordinator.getHostView());
    await expect(coordinator.dispatch({
      type: 'ReportClue', clueId: boardClues[0].id, reason: 'No active clue',
    })).rejects.toThrowError(expect.objectContaining({ code: 'NO_ACTIVE_CLUE' }));
    expect(JSON.stringify(coordinator.getHostView())).toBe(before);
    expect(repository.persistTransition).not.toHaveBeenCalled();
    expect(published).toEqual([]);

    await coordinator.dispatch({ type: 'SelectClue', clueId: boardClues[0].id });
    vi.mocked(repository.persistTransition).mockClear();
    published.length = 0;
    before = JSON.stringify(coordinator.getHostView());
    await expect(coordinator.dispatch({
      type: 'ReportClue', clueId: boardClues[1].id, reason: 'Wrong active clue',
    })).rejects.toThrowError(expect.objectContaining({ code: 'INVALID_CLUE' }));
    expect(JSON.stringify(coordinator.getHostView())).toBe(before);
    expect(repository.persistTransition).not.toHaveBeenCalled();
    expect(published).toEqual([]);
  });

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
    const { coordinator, repository, callbacks, setNow, runNext } = timerDependencies();
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
    expect([...callbacks.values()]).toEqual([expect.objectContaining({ delayMs: 1_000 })]);
  });

  it('retries failed expiry persistence at a bounded delay until one durable adoption', async () => {
    const { coordinator, repository, callbacks, setNow, runNext } = timerDependencies();
    await coordinator.startMatch(selectionInput().config);
    const clueId = coordinator.getHostView()!.state.boards[0].categories[0].clues[0].id;
    await coordinator.dispatch({ type: 'SelectClue', clueId });
    const before = coordinator.getHostView();
    const published: unknown[] = [];
    coordinator.subscribe('public', (view) => published.push(view));
    published.length = 0;
    let failures = 2;
    let durableExpiries = 0;
    vi.mocked(repository.persistTransition).mockImplementation((_id, events) => {
      if (events[0]?.type !== 'TimerExpired') return;
      if (failures-- > 0) throw new Error('disk full');
      durableExpiries += 1;
    });

    setNow(16_000);
    await runNext();
    expect(coordinator.getHostView()).toEqual(before);
    expect(published).toEqual([]);
    expect([...callbacks.values()][0].delayMs).toBe(1_000);
    await runNext();
    expect(coordinator.getHostView()).toEqual(before);
    expect(published).toEqual([]);
    expect(callbacks).toHaveLength(1);
    await runNext();

    expect(durableExpiries).toBe(1);
    expect(coordinator.getHostView()!.state.timer.status).toBe('expired');
    expect(published).toHaveLength(1);
    expect(callbacks).toHaveLength(0);
  });

  it('cancels a failed-expiry retry when a host action or disposal changes its generation', async () => {
    const { coordinator, repository, callbacks, setNow, runNext } = timerDependencies();
    await coordinator.startMatch(selectionInput().config);
    const clueId = coordinator.getHostView()!.state.boards[0].categories[0].clues[0].id;
    await coordinator.dispatch({ type: 'SelectClue', clueId });
    vi.mocked(repository.persistTransition).mockImplementationOnce(() => { throw new Error('disk full'); });
    setNow(16_000);
    await runNext();
    expect(callbacks).toHaveLength(1);

    await coordinator.dispatch({ type: 'ResetTimer', at: 16_000 });
    expect(callbacks).toHaveLength(1);
    expect([...callbacks.values()][0].delayMs).toBe(15_000);
    coordinator.dispose();
    expect(callbacks).toHaveLength(0);
  });

  it('never lets a stale expiry retry cross into a newly started match', async () => {
    const { coordinator, repository, callbacks, setNow, runNext } = timerDependencies();
    await coordinator.startMatch(selectionInput().config);
    const oldMatchId = coordinator.getHostView()!.state.id;
    const clueId = coordinator.getHostView()!.state.boards[0].categories[0].clues[0].id;
    await coordinator.dispatch({ type: 'SelectClue', clueId });
    vi.mocked(repository.persistTransition).mockImplementationOnce(() => { throw new Error('disk full'); });
    setNow(16_000);
    await runNext();
    const staleRetry = [...callbacks.values()][0].callback;

    await coordinator.startMatch(selectionInput().config);
    const newMatch = coordinator.getHostView()!;
    expect(newMatch.state.id).not.toBe(oldMatchId);
    expect(callbacks).toHaveLength(0);
    staleRetry();
    await Promise.resolve();

    expect(coordinator.getHostView()).toEqual(newMatch);
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
      scores: { 'team-1': 100, 'team-2': 50 },
      finalEligibleTeamIds: ['team-1', 'team-2'],
      finalRevealOrder: ['team-1', 'team-2'],
      finalWagers: { 'team-1': 50, 'team-2': 25 },
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

  it('replays the authoritative clue reveal and board advance exactly', async () => {
    const { coordinator, selected, setResumable } = dependencies();
    const base = createGame(selectionInput().config, selected, 42);
    const clue = base.boards[0].categories.flatMap((category) => category.clues)
      .find((candidate) => !base.dailyDoubleClueIds.includes(candidate.id))!;
    const selectedClue = applyGameCommand(base, { type: 'SelectClue', clueId: clue.id }, 100);
    const revealed = applyGameCommand(selectedClue.state, { type: 'RevealResponse' }, 200);
    const advanced = applyGameCommand(revealed.state, { type: 'AdvanceAfterReveal' }, 300);
    setResumable({
      matchId: base.id,
      snapshotSequence: 1,
      eventSequence: 0,
      state: base,
      events: [...selectedClue.events, ...revealed.events, ...advanced.events],
      replayIssue: null,
    });

    const recovered = await coordinator.resume();

    expect(revealed.state).toMatchObject({ phase: 'clue-reveal', activeClue: { responseRevealed: true } });
    expect(recovered?.state).toEqual(advanced.state);
  });

  it('atomically persists a newly selected canonical tiebreaker with the command before public display', async () => {
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
    expect(calls).toHaveLength(1);
    expect(calls[0][1]).toMatchObject([{ type: 'CommandApplied' }]);
    expect(calls[0][2]).toMatchObject({ phase: 'tiebreaker', tiebreakerClues: [expect.any(Object)] });
    expect(publicStates.at(-1)).not.toContain('Final response final-2');
  });

  it('rejects malformed renderer commands before dispatching or persisting', async () => {
    const { coordinator, repository } = dependencies();
    await coordinator.startMatch(selectionInput().config);
    vi.mocked(repository.persistTransition).mockClear();

    await expect(coordinator.dispatch({ type: 'SelectClue', clueId: 'x', delta: 10 } as unknown as GameCommand)).rejects.toThrow();
    expect(repository.persistTransition).not.toHaveBeenCalled();
  });

  it('persists terminal state and completion metadata atomically before publishing', async () => {
    const { coordinator, repository, persistenceOrder } = dependencies();
    await coordinator.startMatch(selectionInput().config);
    persistenceOrder.length = 0;
    vi.mocked(repository.persistTransition).mockClear();
    vi.mocked(repository.completeMatch).mockClear();
    coordinator.subscribe('host', () => persistenceOrder.push('publish'));
    persistenceOrder.length = 0;

    const ended = await coordinator.dispatch({ type: 'EndIncompleteMatch' });

    expect(repository.persistTransition).toHaveBeenCalledWith(
      ended.state.id,
      expect.arrayContaining([expect.objectContaining({ type: 'MatchEnded', at: 42 })]),
      ended.state,
      42,
    );
    expect(repository.completeMatch).not.toHaveBeenCalled();
    expect(persistenceOrder).toEqual(['persist', 'publish']);
  });

  it('uses the same atomic persistence path when normal play resolves a winner', async () => {
    const { coordinator, repository, selected, setResumable } = dependencies();
    const base = createGame(selectionInput().config, selected, 42);
    const beforeWinner: GameState = {
      ...base,
      phase: 'final-clue',
      scores: { 'team-1': 100, 'team-2': 0 },
      finalEligibleTeamIds: ['team-1'],
      finalRevealOrder: ['team-1'],
      finalWagers: { 'team-1': 50 },
      activeClue: { clueId: selected.finalClue.id, lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
      timer: { durationMs: 30_000, remainingMs: 0, startedAt: null, status: 'expired' },
    };
    setResumable({
      matchId: base.id,
      snapshotSequence: 1,
      eventSequence: 0,
      state: beforeWinner,
      events: [],
      replayIssue: null,
    });
    await coordinator.resume();
    vi.mocked(repository.persistTransition).mockClear();
    vi.mocked(repository.completeMatch).mockClear();

    const winner = await coordinator.dispatch({ type: 'RevealFinalTeam', teamId: 'team-1', correct: true });

    expect(winner.state).toMatchObject({ phase: 'complete', winnerTeamId: 'team-1', endedIncomplete: false });
    expect(repository.persistTransition).toHaveBeenCalledWith(base.id, expect.any(Array), winner.state, 42);
    expect(repository.completeMatch).not.toHaveBeenCalled();
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

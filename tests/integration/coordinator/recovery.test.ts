import { describe, expect, it, vi } from 'vitest';
import { selectMatchContent } from '../../../src/shared/game/boardSelector';
import { applyGameCommand, createGame } from '../../../src/shared/game/engine';
import { GameCoordinator, type CoordinatorRecoveredMatch } from '../../../src/main/coordinator/gameCoordinator';
import { selectionInput } from '../../fixtures/contentFactory';

describe('GameCoordinator resumeLatest', () => {
  it('adopts only validated recovery state and exposes safe recovery metadata', async () => {
    const input = selectionInput();
    const selected = selectMatchContent(input);
    if (!selected.ok) throw new Error('fixture selection failed');
    const snapshot = createGame(input.config, selected, 100);
    const transition = applyGameCommand(snapshot, {
      type: 'SelectClue', clueId: snapshot.boards[0].categories[0].clues[0].id,
    }, 200);
    const repository = {
      persistTransition: vi.fn(),
      recoverLatest: vi.fn(() => ({
        matchId: snapshot.id,
        snapshotSequence: 1,
        recoveredFromSnapshotSequence: 1,
        skippedInvalidSnapshotSequence: 2,
        skippedInvalidSnapshotSequences: [2],
        eventSequence: 0,
        state: snapshot,
        events: transition.events,
        replayIssue: null,
      })),
      completeMatch: vi.fn(),
    };
    const coordinator = new GameCoordinator({
      repository: repository as never,
      contentService: {
        selectForMatch: () => selected,
        selectNextTiebreaker: () => ({ ...input.finalClues[1], round: 'tiebreaker' as const }),
        reportClue: (report) => ({ id: 1, ...report, resolvedAt: null }),
        runTransaction: (action) => action(),
      },
      now: () => 300,
    });

    const recovered = await coordinator.resumeLatest();

    expect(recovered?.state).toEqual(transition.state);
    expect(recovered?.recovery).toEqual({
      recoveredFromSnapshotSequence: 1,
      skippedInvalidSnapshotSequences: [2],
    });
    expect(repository.persistTransition).not.toHaveBeenCalled();
  });

  it('replays UndoLast with its persisted occurrence timestamp', async () => {
    const input = selectionInput();
    const selected = selectMatchContent(input);
    if (!selected.ok) throw new Error('fixture selection failed');
    const snapshot = createGame(input.config, selected, 100);
    const opened = applyGameCommand(snapshot, {
      type: 'SelectClue', clueId: snapshot.boards[0].categories[0].clues[0].id,
    }, 200);
    const undone = applyGameCommand(opened.state, { type: 'UndoLast' }, 345);
    const repository = {
      persistTransition: vi.fn(),
      recoverLatest: vi.fn(() => ({
        matchId: snapshot.id,
        snapshotSequence: opened.state.eventSequence,
        recoveredFromSnapshotSequence: opened.state.eventSequence,
        skippedInvalidSnapshotSequence: null,
        skippedInvalidSnapshotSequences: [],
        eventSequence: opened.state.eventSequence,
        state: opened.state,
        events: undone.events,
        replayIssue: null,
      })),
      completeMatch: vi.fn(),
    };
    const coordinator = new GameCoordinator({
      repository: repository as never,
      contentService: {
        selectForMatch: () => selected,
        selectNextTiebreaker: () => ({ ...input.finalClues[1], round: 'tiebreaker' as const }),
        reportClue: (report) => ({ id: 1, ...report, resolvedAt: null }),
        runTransaction: (action) => action(),
      },
      now: () => 999,
    });

    const recovered = await coordinator.resumeLatest();

    expect(recovered?.state).toEqual(undone.state);
    expect(recovered?.replayIssue).toBeNull();
    expect(undone.events).toMatchObject([{ type: 'ActionUndone', at: 345 }]);
  });

  it('replays MatchEnded with its persisted occurrence timestamp but never adopts terminal recovery', async () => {
    const input = selectionInput();
    const selected = selectMatchContent(input);
    if (!selected.ok) throw new Error('fixture selection failed');
    const snapshot = createGame(input.config, selected, 100);
    const ended = applyGameCommand(snapshot, { type: 'EndIncompleteMatch' }, 456);
    const candidate = {
      matchId: snapshot.id,
      snapshotSequence: snapshot.eventSequence,
      recoveredFromSnapshotSequence: snapshot.eventSequence,
      skippedInvalidSnapshotSequence: null,
      skippedInvalidSnapshotSequences: [],
      eventSequence: snapshot.eventSequence,
      state: snapshot,
      events: ended.events,
      replayIssue: null,
    };
    const repository = {
      persistTransition: vi.fn(),
      recoverLatest: vi.fn().mockReturnValueOnce(candidate).mockReturnValue(null),
      completeMatch: vi.fn(),
    };
    const coordinator = new GameCoordinator({
      repository: repository as never,
      contentService: {
        selectForMatch: () => selected,
        selectNextTiebreaker: () => ({ ...input.finalClues[1], round: 'tiebreaker' as const }),
        reportClue: (report) => ({ id: 1, ...report, resolvedAt: null }),
        runTransaction: (action) => action(),
      },
      now: () => 999,
    });

    const recovered = await coordinator.resumeLatest();

    expect(ended.events).toMatchObject([{ type: 'MatchEnded', at: 456 }]);
    expect(recovered).toBeNull();
    expect(coordinator.getHostStateUpdate()).toBeNull();
    expect(repository.completeMatch).toHaveBeenCalledWith(snapshot.id, 456, ended.state);
  });

  it('fails closed without duplicate reconciliation when a repository repeats the same terminal candidate', async () => {
    const input = selectionInput();
    const selected = selectMatchContent(input);
    if (!selected.ok) throw new Error('fixture selection failed');
    const snapshot = createGame(input.config, selected, 100);
    const ended = applyGameCommand(snapshot, { type: 'EndIncompleteMatch' }, 456);
    const candidate = {
      matchId: snapshot.id,
      snapshotSequence: snapshot.eventSequence,
      recoveredFromSnapshotSequence: snapshot.eventSequence,
      skippedInvalidSnapshotSequence: null,
      skippedInvalidSnapshotSequences: [],
      eventSequence: snapshot.eventSequence,
      state: snapshot,
      events: ended.events,
      replayIssue: null,
    };
    const repository = {
      persistTransition: vi.fn(),
      recoverLatest: vi.fn(() => candidate),
      completeMatch: vi.fn(),
    };
    const coordinator = new GameCoordinator({
      repository: repository as never,
      contentService: {
        selectForMatch: () => selected,
        selectNextTiebreaker: () => ({ ...input.finalClues[1], round: 'tiebreaker' as const }),
        reportClue: (report) => ({ id: 1, ...report, resolvedAt: null }),
        runTransaction: (action) => action(),
      },
      now: () => 999,
    });
    const published: unknown[] = [];
    coordinator.subscribe('host', (view) => published.push(view));
    coordinator.subscribe('public', (view) => published.push(view));

    await expect(coordinator.resumeLatest()).rejects.toThrow('RECOVERY_DID_NOT_PROGRESS');

    expect(repository.recoverLatest).toHaveBeenCalledTimes(2);
    expect(repository.completeMatch).toHaveBeenCalledTimes(1);
    expect(coordinator.getHostStateUpdate()).toBeNull();
    expect(published).toEqual([]);
  });

  it.each([
    'wrong match ID',
    'nonterminal state',
    'cursor mismatch',
    'invalid schema',
    'snapshot insertion failure',
    'completion update failure',
  ])('leaves state, revision, subscribers, and timers unchanged when reconciliation rejects %s', async (reason) => {
    const input = selectionInput();
    const selected = selectMatchContent(input);
    if (!selected.ok) throw new Error('fixture selection failed');
    let recovered: CoordinatorRecoveredMatch | null = null;
    let nextHandle = 1;
    const callbacks = new Map<number, { callback: () => void; delayMs: number }>();
    const repository = {
      persistTransition: vi.fn(),
      loadResumable: vi.fn(() => null),
      recoverLatest: vi.fn(() => recovered),
      completeMatch: vi.fn(),
    };
    const coordinator = new GameCoordinator({
      repository: repository as never,
      contentService: {
        selectForMatch: () => selected,
        selectNextTiebreaker: () => ({ ...input.finalClues[1], round: 'tiebreaker' as const }),
        reportClue: (report) => ({ id: 1, ...report, resolvedAt: null }),
        runTransaction: (action) => action(),
      },
      now: () => 600,
      setTimeout: (callback, delayMs) => {
        const handle = nextHandle++;
        callbacks.set(handle, { callback, delayMs });
        return handle;
      },
      clearTimeout: (handle) => typeof handle === 'number' && callbacks.delete(handle),
    });
    await coordinator.startMatch(input.config);
    const clue = coordinator.getHostView()!.state.boards[0].categories.flatMap((category) => category.clues)
      .find((candidate) => !coordinator.getHostView()!.state.dailyDoubleClueIds.includes(candidate.id))!;
    await coordinator.dispatch({ type: 'SelectClue', clueId: clue.id });
    const before = structuredClone(coordinator.getHostStateUpdate());
    const scheduledBefore = [...callbacks.entries()];
    const ended = applyGameCommand(before!.view.state, { type: 'EndIncompleteMatch' }, 600);
    recovered = {
      matchId: ended.state.id,
      snapshotSequence: ended.state.eventSequence,
      recoveredFromSnapshotSequence: ended.state.eventSequence,
      skippedInvalidSnapshotSequence: null,
      skippedInvalidSnapshotSequences: [],
      eventSequence: ended.state.eventSequence,
      state: ended.state,
      events: [],
      replayIssue: null,
    };
    const published: unknown[] = [];
    coordinator.subscribe('host', (view, revision) => published.push({ view, revision }));
    coordinator.subscribe('public', (view, revision) => published.push({ view, revision }));
    published.length = 0;
    repository.completeMatch.mockImplementationOnce(() => { throw new Error(reason); });

    await expect(coordinator.resumeLatest()).rejects.toThrow(reason);

    expect(repository.completeMatch).toHaveBeenCalledWith(ended.state.id, 600, ended.state);
    expect(coordinator.getHostStateUpdate()).toEqual(before);
    expect([...callbacks.entries()]).toEqual(scheduledBefore);
    expect(published).toEqual([]);
  });
});

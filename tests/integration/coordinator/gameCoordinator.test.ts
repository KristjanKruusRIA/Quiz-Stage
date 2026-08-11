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

describe('GameCoordinator', () => {
  it('validates setup, selects content, persists the initial snapshot, then publishes both projections', async () => {
    const { coordinator, contentService, persistenceOrder } = dependencies();
    const published: string[] = [];
    coordinator.subscribe('host', () => published.push('host'));
    coordinator.subscribe('public', () => published.push('public'));

    await coordinator.startMatch(selectionInput().config);

    expect(contentService.selectForMatch).toHaveBeenCalledWith(selectionInput().config, 'authoritative-seed');
    expect(persistenceOrder).toEqual(['persist']);
    expect(published).toEqual(['host', 'public']);
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
});

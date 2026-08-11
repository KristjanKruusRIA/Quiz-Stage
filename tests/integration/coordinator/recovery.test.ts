import { describe, expect, it, vi } from 'vitest';
import { selectMatchContent } from '../../../src/shared/game/boardSelector';
import { applyGameCommand, createGame } from '../../../src/shared/game/engine';
import { GameCoordinator } from '../../../src/main/coordinator/gameCoordinator';
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
});

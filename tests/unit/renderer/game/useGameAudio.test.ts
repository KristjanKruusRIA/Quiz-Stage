import { describe, expect, it, vi } from 'vitest';
import { audioActionsForTransition, AudioController } from '../../../../src/renderer/features/game/useGameAudio';
import { defaultAudioSettings } from '../../../../src/shared/media/contracts';
import { hostView } from './fixtures';

describe('game audio mapping', () => {
  it('baselines bootstrap/resume and maps forward phases and judgments exactly once', () => {
    const board = hostView({ eventSequence: 1, phase: 'round-one-board' });
    expect(audioActionsForTransition(null, board)).toEqual([]);
    expect(audioActionsForTransition(board, hostView({ eventSequence: 2, phase: 'daily-double-wager' }))).toEqual([{ type: 'play', key: 'daily-double' }]);
    expect(audioActionsForTransition(board, hostView({ eventSequence: 2, phase: 'round-two-board' }))).toEqual([{ type: 'play', key: 'round-transition' }]);
    expect(audioActionsForTransition(board, hostView({ eventSequence: 2, phase: 'final-clue' }))).toEqual([{ type: 'music', key: 'final-tension' }]);
    expect(audioActionsForTransition(hostView({ eventSequence: 1, phase: 'final-clue' }), hostView({ eventSequence: 2, phase: 'complete', winnerTeamId: 'team-1' }))).toEqual([{ type: 'stop-music' }, { type: 'play', key: 'winner' }]);
    expect(audioActionsForTransition(hostView({ eventSequence: 3 }), hostView({ eventSequence: 3, phase: 'round-two-board' }))).toEqual([]);
  });

  it('maps correct, incorrect, expiry and Final results without replaying undo or a different match', () => {
    const before = hostView({ eventSequence: 1, phase: 'ordinary-clue' });
    before.state.activeClue = { clueId: 'round-one-clue-1-1', lockedOutTeamIds: [], lockedTeamId: 'team-1', responseRevealed: false };
    const correct = structuredClone(before); correct.state.eventSequence = 2; correct.state.phase = 'clue-reveal'; correct.state.scores['team-1'] += 200;
    expect(audioActionsForTransition(before, correct)).toContainEqual({ type: 'play', key: 'correct-applause' });
    const incorrect = structuredClone(before); incorrect.state.eventSequence = 2; incorrect.state.scores['team-1'] -= 200;
    incorrect.state.activeClue!.lockedOutTeamIds = ['team-1']; incorrect.state.activeClue!.lockedTeamId = null;
    expect(audioActionsForTransition(before, incorrect)).toContainEqual({ type: 'play', key: 'incorrect-crowd' });
    const expired = structuredClone(before); expired.state.eventSequence = 2; expired.state.timer.status = 'expired';
    expect(audioActionsForTransition(before, expired)).toEqual([{ type: 'play', key: 'time-expired' }]);
    const final = structuredClone(before); final.state.eventSequence = 2; final.state.finalJudgments = { 'team-1': false };
    expect(audioActionsForTransition(before, final)).toContainEqual({ type: 'play', key: 'incorrect-crowd' });
    const undone = structuredClone(correct); undone.state.eventSequence = 3; undone.state.undoStack = [];
    before.state.undoStack = [{ eventId: 'event', state: structuredClone(before.state) }];
    expect(audioActionsForTransition(before, undone)).toEqual([]);
    const another = structuredClone(correct); another.state.id = 'another-match';
    expect(audioActionsForTransition(before, another)).toEqual([]);
    const correction = structuredClone(before); correction.state.eventSequence = 2; correction.state.scores['team-1'] += 50;
    expect(audioActionsForTransition(before, correction)).toEqual([]);
  });

  it('plays nonblocking, swallows rejected autoplay, applies gain, ducks music, and cleans up', async () => {
    const rejected = Promise.reject(new Error('autoplay blocked')); rejected.catch(() => undefined);
    const audios: Array<{
      play: ReturnType<typeof vi.fn>;
      pause: ReturnType<typeof vi.fn>;
      addEventListener: ReturnType<typeof vi.fn>;
      removeEventListener: ReturnType<typeof vi.fn>;
      volume: number;
      loop: boolean;
      currentTime: number;
    }> = [];
    const warning = vi.fn();
    const controller = new AudioController({
      createAudio: () => {
        const audio = {
          play: vi.fn(() => rejected),
          pause: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          volume: 1,
          loop: false,
          currentTime: 0,
        };
        audios.push(audio);
        return audio;
      },
      settings: { ...defaultAudioSettings, master: 0.5, effects: 0.4 },
      setTimeout: vi.fn(() => 1), clearTimeout: vi.fn(), onPlaybackWarning: warning,
    });
    controller.play('daily-double');
    expect(audios[0].volume).toBe(0.2);
    controller.startMusic('final-tension');
    controller.play('winner');
    controller.dispose();
    expect(audios.every((audio) => audio.pause.mock.calls.length === 1)).toBe(true);
    await Promise.resolve();
    expect(warning).toHaveBeenCalled();
    expect(audios.every((audio) => audio.removeEventListener.mock.calls.length === 1)).toBe(true);
  });
});

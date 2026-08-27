import { describe, expect, it, vi } from 'vitest';
import { audioActionsForTransition, AudioController } from '../../../../src/renderer/features/game/useGameAudio';
import { defaultAudioSettings } from '../../../../src/shared/media/contracts';
import { hostView } from './fixtures';

describe('game audio mapping', () => {
  it('baselines bootstrap/resume and maps forward phases and judgments exactly once', () => {
    const board = hostView({ eventSequence: 1, phase: 'round-one-board' });
    expect(audioActionsForTransition(null, board)).toEqual([{ type: 'music', key: 'opening' }]);
    expect(audioActionsForTransition(board, hostView({ eventSequence: 2, phase: 'daily-double-wager' }))).toEqual([
      { type: 'stop-music' },
      { type: 'play', key: 'daily-double' },
    ]);
    expect(audioActionsForTransition(board, hostView({ eventSequence: 2, phase: 'round-two-board' }))).toEqual([
      { type: 'play', key: 'round-transition' },
    ]);
    expect(audioActionsForTransition(
      hostView({ eventSequence: 1, phase: 'clue-reveal' }),
      hostView({ eventSequence: 2, phase: 'round-one-board' }),
    )).toContainEqual({ type: 'music', key: 'opening' });
    expect(audioActionsForTransition(board, hostView({ eventSequence: 2, phase: 'final-clue' }))).toEqual([
      { type: 'stop-music' },
      { type: 'music', key: 'final-tension' },
    ]);
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

  it('maps tiebreaker judgments from authoritative clue state without score deltas or duplicates', () => {
    const before = hostView({ eventSequence: 10, phase: 'tiebreaker', tiebreakerTeamIds: ['team-1', 'team-2'], suddenDeathClueNumber: 1 });
    before.state.activeClue = { clueId: 'tie-1', lockedOutTeamIds: [], lockedTeamId: 'team-1', responseRevealed: false };
    const incorrect = structuredClone(before);
    incorrect.state.eventSequence = 11;
    incorrect.state.activeClue = { ...incorrect.state.activeClue!, lockedTeamId: null, lockedOutTeamIds: ['team-1'] };
    expect(audioActionsForTransition(before, incorrect)).toEqual([{ type: 'play', key: 'incorrect-crowd' }]);

    const repeated = structuredClone(incorrect);
    repeated.state.activeClue = { ...repeated.state.activeClue!, lockedTeamId: 'team-2' };
    const nextClue = structuredClone(repeated);
    nextClue.state.eventSequence = 12;
    nextClue.state.suddenDeathClueNumber = 2;
    nextClue.state.activeClue = { clueId: 'tie-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false };
    expect(audioActionsForTransition(repeated, nextClue)).toEqual([{ type: 'play', key: 'incorrect-crowd' }]);

    const correct = structuredClone(before);
    correct.state.eventSequence = 11;
    correct.state.phase = 'complete';
    correct.state.winnerTeamId = 'team-1';
    correct.state.activeClue = { ...correct.state.activeClue!, lockedTeamId: null, responseRevealed: true };
    expect(audioActionsForTransition(before, correct)).toEqual([
      { type: 'play', key: 'correct-applause' },
      { type: 'play', key: 'winner' },
    ]);
    expect(audioActionsForTransition(correct, correct)).toEqual([]);
    expect(audioActionsForTransition(null, correct)).toEqual([]);
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

  it('recomputes every active channel immediately while preserving music ducking across mute and sliders', () => {
    const audios: Array<{ volume: number; loop: boolean; currentTime: number; play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> }> = [];
    let restoreMusic: (() => void) | undefined;
    const controller = new AudioController({
      createAudio: () => {
        const audio = { volume: 1, loop: false, currentTime: 0, play: vi.fn(async () => undefined), pause: vi.fn() };
        audios.push(audio);
        return audio;
      },
      settings: { ...defaultAudioSettings, master: 0.5, music: 0.8, effects: 0.6, crowd: 0.4 },
      setTimeout: (callback) => { restoreMusic = callback; return 1; },
      clearTimeout: vi.fn(),
    });
    controller.startMusic('final-tension');
    controller.play('daily-double');
    controller.play('correct-applause');
    expect(audios.map((audio) => audio.volume)).toEqual([0.1, 0.3, 0.2]);

    controller.setSettings({ ...defaultAudioSettings, muted: true });
    expect(audios.map((audio) => audio.volume)).toEqual([0, 0, 0]);
    controller.setSettings({ ...defaultAudioSettings, master: 1, music: 0.6, effects: 0.5, crowd: 0.25, muted: false });
    expect(audios.map((audio) => audio.volume)).toEqual([0.15, 0.5, 0.25]);
    restoreMusic?.();
    expect(audios[0].volume).toBe(0.6);
    controller.dispose();
  });

  it('does not start new audio while authoritative settings are muted', () => {
    const createAudio = vi.fn(() => ({ volume: 1, loop: false, currentTime: 0, play: vi.fn(async () => undefined), pause: vi.fn() }));
    const controller = new AudioController({ createAudio, settings: { ...defaultAudioSettings, muted: true } });
    controller.startMusic('opening');
    controller.play('daily-double');
    expect(createAudio).not.toHaveBeenCalled();
  });

  it('loops board music and ticks once per second only while a clue timer runs', () => {
    const intervals: Array<() => void> = [];
    const clearInterval = vi.fn();
    const audios: Array<{ url: string; loop: boolean; play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn>; volume: number; currentTime: number }> = [];
    const controller = new AudioController({
      createAudio: (url) => {
        const audio = { url, loop: false, play: vi.fn(async () => undefined), pause: vi.fn(), volume: 1, currentTime: 0 };
        audios.push(audio);
        return audio;
      },
      settings: defaultAudioSettings,
      setInterval: (callback) => { intervals.push(callback); return intervals.length; },
      clearInterval,
    });

    controller.startMusic('opening');
    expect(audios[0].loop).toBe(true);
    controller.stopMusic();
    controller.setCountdownRunning(true);
    intervals[0]!();
    intervals[0]!();
    expect(audios.filter((audio) => audio.url.includes('countdown-tick')).length).toBe(2);

    controller.setCountdownRunning(false);
    expect(clearInterval).toHaveBeenCalledWith(1);
    controller.dispose();
  });
});

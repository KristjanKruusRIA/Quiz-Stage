import { describe, expect, it, vi } from 'vitest';
import type { HostGameView } from '../../../../src/shared/game/types';
import {
  SpeechController,
  type SpeechSynthesisLike,
  type SpeechUtteranceLike,
} from '../../../../src/renderer/features/game/useGameSpeech';
import { gameState, hostView } from './fixtures';

type SpeechEnabledView = HostGameView & {
  state: HostGameView['state'] & {
    config: HostGameView['state']['config'] & { speechEnabled: boolean };
  };
};

function view(overrides: Partial<HostGameView['state']> = {}): SpeechEnabledView {
  let state = gameState({
    ...overrides,
    config: { ...gameState().config, speechEnabled: true },
  });
  if (state.activeClue !== null && state.timer.status === 'idle' && state.timer.narrationSequence === undefined) {
    state = { ...state, timer: { ...state.timer, narrationSequence: state.eventSequence } };
  }
  return { ...hostView(), state } as SpeechEnabledView;
}

function withConfig(current: SpeechEnabledView, speechEnabled: boolean, language: 'en' | 'et' = 'en'): SpeechEnabledView {
  return {
    ...current,
    state: { ...current.state, config: { ...current.state.config, language, speechEnabled } },
  };
}

function fakeSpeech() {
  const utterances: Array<SpeechUtteranceLike & { ended?: boolean }> = [];
  const voicesChanged = new Set<() => void>();
  const speech: SpeechSynthesisLike = {
    speak: vi.fn((utterance: SpeechUtteranceLike) => { utterances.push(utterance); }),
    cancel: vi.fn(),
    getVoices: vi.fn(() => [{ name: 'Local English', lang: 'en-US', localService: true }]),
    addEventListener: vi.fn((_type, listener) => { voicesChanged.add(listener); }),
    removeEventListener: vi.fn((_type, listener) => { voicesChanged.delete(listener); }),
  };
  return { speech, utterances, voicesChanged };
}

function controller(
  speech: SpeechSynthesisLike | null,
  dispatch = vi.fn(async () => undefined),
  options: { voiceWaitMs?: number; duckMusicFor?: (durationMs: number) => (() => void) | undefined } = {},
) {
  const created: SpeechUtteranceLike[] = [];
  const result = new SpeechController({
    speechSynthesis: speech,
    dispatch,
    createUtterance: (text) => {
      const utterance: SpeechUtteranceLike = { text, lang: '', voice: null };
      created.push(utterance);
      return utterance;
    },
    voiceWaitMs: options.voiceWaitMs,
    duckMusicFor: options.duckMusicFor,
  });
  return { result, dispatch, created };
}

describe('SpeechController', () => {
  it('speaks English board categories once for each fresh board', () => {
    const fake = fakeSpeech();
    const { result, created } = controller(fake.speech);
    const first = view({ phase: 'round-one-board' });

    result.update(first, { speechEnabled: true });
    result.update({ ...first, state: { ...first.state, eventSequence: 1 } }, { speechEnabled: true });
    result.update(view({ phase: 'round-two-board' }), { speechEnabled: true });

    expect(fake.speech.speak).toHaveBeenCalledTimes(2);
    expect(created.map((item) => item.text)).toEqual([
      'Category 1. Category 2. Category 3. Category 4. Category 5. Category 6.',
      'Category 1. Category 2. Category 3. Category 4. Category 5. Category 6.',
    ]);
  });

  it('speaks only the public-safe English prompt when the authoritative timer is idle', async () => {
    const fake = fakeSpeech();
    const { result, created, dispatch } = controller(fake.speech);
    const current = view({
      phase: 'ordinary-clue',
      activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
      timer: { durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle' },
    });

    result.update(current, { speechEnabled: true });

    expect(created[0]?.text).toBe('Prompt 1-2');
    expect(created[0]?.text).not.toContain('Response');
    expect(created[0]?.text).not.toContain('Explanation');
    created[0]!.onend?.();
    await Promise.resolve();
    expect(dispatch).toHaveBeenCalledWith({ type: 'StartNarratedClueTimer', clueId: 'round-one-clue-1-2', narrationSequence: 0 });
  });

  it.each([
    ['running', { startedAt: 1_000, status: 'running' as const }],
    ['paused', { startedAt: null, status: 'paused' as const }],
  ])('does not speak an %s timer until it becomes authoritative idle', (_label, timer) => {
    const fake = fakeSpeech();
    const { result } = controller(fake.speech);
    const current = view({
      phase: 'ordinary-clue',
      activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
      timer: { durationMs: 15_000, remainingMs: 15_000, ...timer },
    });

    result.update(current, { speechEnabled: true });
    expect(fake.speech.speak).not.toHaveBeenCalled();
    result.update({
      ...current,
      state: {
        ...current.state,
        eventSequence: 1,
        timer: { ...current.state.timer, startedAt: null, status: 'idle', narrationSequence: 1 },
      },
    }, { speechEnabled: true });
    expect(fake.speech.speak).toHaveBeenCalledTimes(1);
  });

  it('covers Daily Double, Final, and tiebreaker prompts without exposing responses', () => {
    for (const phase of ['daily-double-clue', 'final-clue', 'tiebreaker'] as const) {
      const fake = fakeSpeech();
      const { result, created } = controller(fake.speech);
      const current = view({
        phase,
        activeClue: { clueId: phase === 'tiebreaker' ? 'tie-1' : 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
        timer: { durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle' },
        ...(phase === 'tiebreaker' ? { tiebreakerClues: [{ ...gameState().boards[0]!.categories[0]!.clues[0]!, id: 'tie-1' }] } : {}),
      });
      result.update(current, { speechEnabled: true });
      expect(created[0]?.text).toMatch(/^Prompt|^Response/);
      expect(created[0]?.text).not.toContain('Response');
    }
  });

  it('speaks the Final category and never speaks Estonian or disabled matches', () => {
    const fake = fakeSpeech();
    const { result, created } = controller(fake.speech);
    const final = view({ phase: 'final-category', finalEligibleTeamIds: ['team-1'], timer: { durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle' } });
    result.update(final, { speechEnabled: true });
    result.update(withConfig(final, false), { speechEnabled: true });
    result.update(withConfig(final, true, 'et'), { speechEnabled: true });
    expect(created[0]?.text).toBe('World History');
    expect(fake.speech.speak).toHaveBeenCalledTimes(1);
  });

  it('waits for a local English voice, then fails open and starts the timer once when none appears', async () => {
    vi.useFakeTimers();
    try {
      const fake = fakeSpeech();
      let voices: Array<{ name: string; lang: string; localService: boolean }> = [];
      vi.mocked(fake.speech.getVoices).mockImplementation(() => voices);
      const { result, dispatch } = controller(fake.speech, undefined, { voiceWaitMs: 100 });
      const current = view({ phase: 'ordinary-clue', activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false }, timer: { durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle' } });

      result.update(current, { speechEnabled: true });
      expect(fake.speech.speak).not.toHaveBeenCalled();
      voices = [{ name: 'Local English', lang: 'en-GB', localService: true }];
      for (const listener of fake.voicesChanged) listener();
      expect(fake.speech.speak).toHaveBeenCalledTimes(1);
      result.update({ ...current, state: { ...current.state, eventSequence: 1 } }, { speechEnabled: true });
      fake.utterances[0]!.onerror?.(new Error('failed'));
      await Promise.resolve();
      expect(dispatch).toHaveBeenCalledTimes(1);

      const secondFake = fakeSpeech();
      vi.mocked(secondFake.speech.getVoices).mockReturnValue([]);
      const second = controller(secondFake.speech, undefined, { voiceWaitMs: 100 });
      second.result.update(current, { speechEnabled: true });
      vi.advanceTimersByTime(100);
      await Promise.resolve();
      expect(second.dispatch).toHaveBeenCalledWith({ type: 'StartNarratedClueTimer', clueId: 'round-one-clue-1-2', narrationSequence: 0 });
      expect(second.dispatch).toHaveBeenCalledTimes(1);

      const unavailable = controller(null);
      unavailable.result.update(current, { speechEnabled: true });
      await Promise.resolve();
      expect(unavailable.dispatch).toHaveBeenCalledWith({ type: 'StartNarratedClueTimer', clueId: 'round-one-clue-1-2', narrationSequence: 0 });
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancels the bounded voice wait when master mute is enabled', async () => {
    vi.useFakeTimers();
    try {
      const fake = fakeSpeech();
      vi.mocked(fake.speech.getVoices).mockReturnValue([]);
      const { result, dispatch } = controller(fake.speech, undefined, { voiceWaitMs: 100 });
      const current = view({ phase: 'ordinary-clue', activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false }, timer: { durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle' } });

      result.update(current, { speechEnabled: true });
      result.update(current, { speechEnabled: true, muted: true });
      vi.advanceTimersByTime(500);
      await Promise.resolve();

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: 'StartNarratedClueTimer', clueId: 'round-one-clue-1-2', narrationSequence: 0 });
      expect(fake.speech.speak).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses master volume for speech and fails open when the master volume is zero', async () => {
    const current = view({
      phase: 'ordinary-clue',
      activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
      timer: { durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle' },
    });
    const audible = fakeSpeech();
    const audibleController = controller(audible.speech);

    audibleController.result.update(current, { speechEnabled: true, master: 0.42 });
    expect(audibleController.created[0]?.volume).toBe(0.42);

    const silent = fakeSpeech();
    const silentController = controller(silent.speech);
    silentController.result.update(current, { speechEnabled: true, master: 0 });
    await Promise.resolve();

    expect(silent.speech.speak).not.toHaveBeenCalled();
    expect(silentController.dispatch).toHaveBeenCalledWith({
      type: 'StartNarratedClueTimer', clueId: 'round-one-clue-1-2', narrationSequence: 0,
    });
  });

  it('fails open an idle clue when speech is disabled before narration begins', async () => {
    const fake = fakeSpeech();
    const { result, dispatch } = controller(fake.speech);
    const current = view({ phase: 'ordinary-clue', activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false }, timer: { durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle' } });

    result.update(current, { speechEnabled: false });
    result.update(current, { speechEnabled: false, muted: true });
    await Promise.resolve();

    expect(fake.speech.speak).not.toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({ type: 'StartNarratedClueTimer', clueId: 'round-one-clue-1-2', narrationSequence: 0 });
  });

  it('does not dispatch a narration command for a match that was not configured for English speech', () => {
    const fake = fakeSpeech();
    const { result, dispatch } = controller(fake.speech);
    const current = view({
      phase: 'ordinary-clue',
      activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
      timer: { durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle' },
    });

    result.update(withConfig(current, false), { speechEnabled: false });
    result.update(withConfig(current, true, 'et'), { speechEnabled: true });

    expect(dispatch).not.toHaveBeenCalled();
    expect(fake.speech.speak).not.toHaveBeenCalled();
  });

  it('cancels and replaces speech, mutes on disable, and guards stale callbacks', async () => {
    const fake = fakeSpeech();
    const { result, created, dispatch } = controller(fake.speech);
    const first = view({ phase: 'ordinary-clue', activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false }, timer: { durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle' } });
    const second = view({ phase: 'ordinary-clue', activeClue: { clueId: 'round-one-clue-1-3', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false }, timer: { durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle' } });
    result.update(first, { speechEnabled: true });
    result.update(second, { speechEnabled: true });
    expect(fake.speech.cancel).toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
    created[0]!.onend?.();
    expect(dispatch).not.toHaveBeenCalled();
    result.update(second, { speechEnabled: false });
    created[1]!.onend?.();
    await Promise.resolve();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      type: 'StartNarratedClueTimer', clueId: 'round-one-clue-1-3', narrationSequence: 0,
    });
  });

  it('cancels an undone clue and safely narrates the same clue after reselection', () => {
    const fake = fakeSpeech();
    const { result, created, dispatch } = controller(fake.speech);
    const board = view({ phase: 'round-one-board' });
    const first = view({
      eventSequence: 1,
      phase: 'ordinary-clue',
      activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
      timer: {
        durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle', narrationSequence: 1,
      },
    });
    const second = view({
      eventSequence: 3,
      phase: 'ordinary-clue',
      activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
      timer: {
        durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle', narrationSequence: 3,
      },
    });

    result.update(board, { speechEnabled: true });
    created[0]?.onend?.();
    result.update(first, { speechEnabled: true });
    const cancelCount = vi.mocked(fake.speech.cancel).mock.calls.length;
    result.update(board, { speechEnabled: true });
    expect(fake.speech.cancel).toHaveBeenCalledTimes(cancelCount + 1);
    expect(dispatch).not.toHaveBeenCalled();

    result.update(second, { speechEnabled: true });
    expect(created).toHaveLength(3);
    created[1]?.onend?.();
    expect(dispatch).not.toHaveBeenCalled();
    created[2]?.onend?.();
    expect(dispatch).toHaveBeenCalledWith({
      type: 'StartNarratedClueTimer', clueId: 'round-one-clue-1-2', narrationSequence: 3,
    });
  });

  it('ducks music for the estimated utterance duration and cancels speech on dispose', () => {
    const fake = fakeSpeech();
    const releaseDuck = vi.fn();
    const duckMusicFor = vi.fn(() => releaseDuck);
    const { result, created } = controller(fake.speech, undefined, { duckMusicFor });
    const current = view({ phase: 'ordinary-clue', activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false }, timer: { durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle' } });
    result.update(current, { speechEnabled: true });
    expect(duckMusicFor).toHaveBeenCalledWith(expect.any(Number));
    created[0]?.onend?.();
    expect(releaseDuck).toHaveBeenCalledTimes(1);
    result.dispose();
    expect(fake.speech.cancel).toHaveBeenCalled();
    expect(created[0]?.onend).toBeTypeOf('function');
  });

  it('starts the clue timer when speech omits both completion callbacks', async () => {
    vi.useFakeTimers();
    try {
      const fake = fakeSpeech();
      const { result, dispatch } = controller(fake.speech);
      const current = view({ phase: 'ordinary-clue', activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false }, timer: { durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle' } });

      result.update(current, { speechEnabled: true });
      const cancelCountAfterSpeak = vi.mocked(fake.speech.cancel).mock.calls.length;
      vi.advanceTimersByTime(30_000);
      await Promise.resolve();

      expect(dispatch).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith({ type: 'StartNarratedClueTimer', clueId: 'round-one-clue-1-2', narrationSequence: 0 });
      expect(fake.speech.cancel).toHaveBeenCalledTimes(cancelCountAfterSpeak + 1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not cut off a long utterance at the old thirty-second watchdog limit', async () => {
    vi.useFakeTimers();
    try {
      const fake = fakeSpeech();
      const { result, created, dispatch } = controller(fake.speech);
      const current = view({
        phase: 'ordinary-clue',
        activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
        timer: { durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle' },
      });
      const clue = current.state.boards
        .flatMap((board) => board.categories)
        .flatMap((category) => category.clues)
        .find((candidate) => candidate.id === 'round-one-clue-1-2');
      if (clue === undefined) throw new Error('fixture clue missing');
      clue.prompt.en = 'Deliberately slow narration text. '.repeat(20);

      result.update(current, { speechEnabled: true });
      vi.advanceTimersByTime(30_000);
      await Promise.resolve();
      expect(dispatch).not.toHaveBeenCalled();
      expect(fake.speech.cancel).toHaveBeenCalledTimes(1);

      created[0]?.onend?.();
      await Promise.resolve();
      expect(dispatch).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('retries a transiently rejected timer-start dispatch while the same clue remains idle', async () => {
    vi.useFakeTimers();
    try {
      const fake = fakeSpeech();
      const dispatch = vi.fn()
        .mockRejectedValueOnce(new Error('temporary persistence failure'))
        .mockResolvedValueOnce(undefined);
      const { result, created } = controller(fake.speech, dispatch);
      const current = view({
        phase: 'ordinary-clue',
        activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
        timer: {
          durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle', narrationSequence: 0,
        },
      });

      result.update(current, { speechEnabled: true });
      created[0]?.onend?.();
      await Promise.resolve();
      await Promise.resolve();
      expect(dispatch).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(250);
      await Promise.resolve();
      expect(dispatch).toHaveBeenCalledTimes(2);
      expect(dispatch).toHaveBeenLastCalledWith({
        type: 'StartNarratedClueTimer', clueId: 'round-one-clue-1-2', narrationSequence: 0,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps retrying rejected timer starts with backoff while the same clue remains idle', async () => {
    vi.useFakeTimers();
    try {
      const fake = fakeSpeech();
      const dispatch = vi.fn()
        .mockRejectedValueOnce(new Error('first failure'))
        .mockRejectedValueOnce(new Error('second failure'))
        .mockRejectedValueOnce(new Error('third failure'))
        .mockResolvedValueOnce(undefined);
      const { result, created } = controller(fake.speech, dispatch);
      const current = view({
        phase: 'ordinary-clue',
        activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
        timer: {
          durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle', narrationSequence: 0,
        },
      });

      result.update(current, { speechEnabled: true });
      created[0]?.onend?.();
      await vi.advanceTimersByTimeAsync(250 + 500 + 1_000);

      expect(dispatch).toHaveBeenCalledTimes(4);
    } finally {
      vi.useRealTimers();
    }
  });

  it('retries a timer-start dispatch that never settles', async () => {
    vi.useFakeTimers();
    try {
      const fake = fakeSpeech();
      const dispatch = vi.fn()
        .mockImplementationOnce(() => new Promise(() => undefined))
        .mockResolvedValueOnce(undefined);
      const { result, created } = controller(fake.speech, dispatch);
      const current = view({
        phase: 'ordinary-clue',
        activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
        timer: {
          durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle', narrationSequence: 0,
        },
      });

      result.update(current, { speechEnabled: true });
      created[0]?.onend?.();
      await vi.advanceTimersByTimeAsync(2_000 + 250);

      expect(dispatch).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});

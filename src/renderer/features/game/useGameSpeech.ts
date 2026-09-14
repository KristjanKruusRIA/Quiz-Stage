import { useEffect, useRef } from 'react';
import type { TopicReveal } from '../../../shared/ipc/contracts';
import type { HostGameView } from '../../../shared/game/types';
import { toPublicGameView } from '../../../shared/game/views';

export type NarratedClueTimerCommand = {
  type: 'StartNarratedClueTimer';
  clueId: string;
  narrationSequence: number;
};
export type NarratedClueTimerDispatch = (command: NarratedClueTimerCommand) => Promise<unknown> | unknown;

export interface SpeechSettings {
  speechEnabled: boolean;
  /** Master audio mute also mutes narration. */
  muted?: boolean;
  /** Narration follows the existing master audio level. */
  master?: number;
}

export interface SpeechVoiceLike {
  name: string;
  lang: string;
  localService: boolean;
}

export interface SpeechUtteranceLike {
  text: string;
  lang: string;
  voice: SpeechVoiceLike | null;
  volume?: number;
  onend?: (() => void) | null;
  onerror?: ((error?: unknown) => void) | null;
}

export interface SpeechSynthesisLike {
  speak(utterance: SpeechUtteranceLike): void;
  cancel(): void;
  getVoices(): SpeechVoiceLike[];
  addEventListener?(type: 'voiceschanged', listener: () => void): void;
  removeEventListener?(type: 'voiceschanged', listener: () => void): void;
}

export type SpeechGameView = HostGameView;

interface SpeechControllerOptions {
  dispatch: NarratedClueTimerDispatch;
  onTopicReveal?: (reveal: TopicReveal) => void;
  speechSynthesis?: SpeechSynthesisLike | null;
  createUtterance?: (text: string) => SpeechUtteranceLike;
  setTimeout?: (callback: () => void, delay: number) => unknown;
  clearTimeout?: (handle: unknown) => void;
  voiceWaitMs?: number;
  duckMusicFor?: (durationMs: number) => (() => void) | undefined;
}

type Narration =
  | { kind: 'board' | 'final-category'; key: string; text: string }
  | { kind: 'clue'; key: string; clueId: string; narrationSequence: number; text: string };

interface PendingNarration {
  generation: number;
  narration: Narration;
  waitTimer: unknown;
  watchdogTimer: unknown;
  voiceListener: (() => void) | null;
  completed: boolean;
  releaseDuck: (() => void) | null;
}

const PROMPT_PHASES = new Set(['ordinary-clue', 'daily-double-clue', 'final-clue', 'tiebreaker']);
const BOARD_PHASES = new Set(['round-one-board', 'round-two-board']);
const DEFAULT_VOICE_WAIT_MS = 1_000;
const MAX_SPEECH_WATCHDOG_MS = 5 * 60_000;
const SPEECH_WATCHDOG_GRACE_MS = 10_000;
const TIMER_START_RETRY_MS = 250;
const MAX_TIMER_START_RETRY_MS = 5_000;
const TIMER_START_DISPATCH_TIMEOUT_MS = 2_000;

function browserSpeechSynthesis(): SpeechSynthesisLike | null {
  const browser = globalThis as typeof globalThis & { speechSynthesis?: SpeechSynthesisLike };
  return browser.speechSynthesis ?? null;
}

function defaultUtterance(text: string): SpeechUtteranceLike {
  const browser = globalThis as typeof globalThis & {
    SpeechSynthesisUtterance?: new (value: string) => SpeechUtteranceLike;
  };
  if (browser.SpeechSynthesisUtterance === undefined) {
    throw new Error('SPEECH_UTTERANCE_UNAVAILABLE');
  }
  return new browser.SpeechSynthesisUtterance(text) as unknown as SpeechUtteranceLike;
}

function isLocalEnglish(voice: SpeechVoiceLike): boolean {
  return voice.localService === true && /^en(?:[-_]|$)/i.test(voice.lang);
}

export function topicReadingMs(text: string): number {
  return Math.max(3_000, text.trim().split(/\s+/).length * 500 + 1_000);
}

function estimateDurationMs(text: string): number {
  return Math.max(1_000, Math.ceil(text.trim().length / 8 * 1_000));
}

function idleClueIdentifier(view: SpeechGameView): Extract<Narration, { kind: 'clue' }> | null {
  const { state } = view;
  if (
    PROMPT_PHASES.has(state.phase)
    && state.timer.status === 'idle'
    && state.timer.narrationSequence !== undefined
    && state.activeClue !== null
    && state.activeClue.responseRevealed === false
  ) {
    return {
      kind: 'clue',
      key: `${state.id}:${state.activeClue.clueId}:${state.timer.narrationSequence}`,
      clueId: state.activeClue.clueId,
      narrationSequence: state.timer.narrationSequence,
      text: '',
    };
  }
  return null;
}

function publicNarration(view: SpeechGameView): Narration | null {
  const state = view.state;
  const publicView = toPublicGameView(state);
  const matchKey = state.id;

  const finalCategory = publicView.final?.category;
  if (state.phase === 'final-category' && finalCategory !== undefined && finalCategory.trim() !== '') {
    return { kind: 'final-category', key: `${matchKey}:final-category`, text: finalCategory.trim() };
  }

  if (
    PROMPT_PHASES.has(state.phase)
    && state.timer.status === 'idle'
    && state.timer.narrationSequence !== undefined
    && state.activeClue !== null
    && publicView.activeClue !== null
    && publicView.activeClue.responseRevealed === false
  ) {
    return {
      kind: 'clue',
      key: `${matchKey}:${state.activeClue.clueId}:${state.timer.narrationSequence}`,
      clueId: state.activeClue.clueId,
      narrationSequence: state.timer.narrationSequence,
      text: publicView.activeClue.prompt,
    };
  }
  return null;
}

export class SpeechController {
  private readonly speech: SpeechSynthesisLike | null;
  private readonly createUtterance: (text: string) => SpeechUtteranceLike;
  private readonly schedule: (callback: () => void, delay: number) => unknown;
  private readonly clearSchedule: (handle: unknown) => void;
  private readonly voiceWaitMs: number;
  private readonly dispatch: NarratedClueTimerDispatch;
  private duckMusicFor?: (durationMs: number) => (() => void) | undefined;
  private pending: PendingNarration | null = null;
  private timerStartRetry: { key: string; handle: unknown } | null = null;
  private currentIdleClueKey: string | null = null;
  private volume = 1;
  private onTopicReveal?: (reveal: TopicReveal) => void;
  private boardSequence: { key: string; matchId: string; boardId: string; names: string[]; count: number; enabled: boolean; timer: unknown } | null = null;
  private generation = 0;
  private readonly announced = new Set<string>();

  constructor(options: SpeechControllerOptions) {
    this.speech = options.speechSynthesis === undefined ? browserSpeechSynthesis() : options.speechSynthesis;
    this.createUtterance = options.createUtterance ?? defaultUtterance;
    this.schedule = options.setTimeout ?? ((callback, delay) => globalThis.setTimeout(callback, delay));
    this.clearSchedule = options.clearTimeout ?? ((handle) => globalThis.clearTimeout(handle as number));
    this.voiceWaitMs = options.voiceWaitMs ?? DEFAULT_VOICE_WAIT_MS;
    this.dispatch = options.dispatch;
    this.duckMusicFor = options.duckMusicFor;
    this.onTopicReveal = options.onTopicReveal;
  }

  setDuckMusicFor(callback?: (durationMs: number) => (() => void) | undefined): void {
    this.duckMusicFor = callback;
  }

  setOnTopicReveal(callback?: (reveal: TopicReveal) => void): void {
    this.onTopicReveal = callback;
  }

  private updateBoard(view: SpeechGameView, enabled: boolean): boolean {
    const board = BOARD_PHASES.has(view.state.phase) ? toPublicGameView(view.state).board : null;
    const key = board === null ? null : `${view.state.id}:${board.id}`;
    if (this.boardSequence !== null && this.boardSequence.key !== key) {
      this.clearSchedule(this.boardSequence.timer);
      this.boardSequence.count = this.boardSequence.names.length;
      this.publishBoard();
      this.boardSequence = null;
      this.cancelActive(false);
    }
    if (board === null || !BOARD_PHASES.has(view.state.phase)) return false;
    if (this.boardSequence !== null) {
      const sequence = this.boardSequence;
      sequence.enabled = enabled;
      if (!enabled && this.pending?.narration.kind === 'board') {
        this.cancelActive(false);
        sequence.timer = this.schedule(() => this.advanceBoard(), topicReadingMs(sequence.names[sequence.count - 1]));
      }
      return true;
    }
    if (this.pending?.narration.kind !== 'board') this.cancelActive(false);
    if (this.announced.has(key!)) return true;
    this.announced.add(key!);
    if (view.recovery !== null || board.categories.some((category) => category.clues.some((clue) => clue.selected))) return true;
    this.cancelActive(false);
    this.boardSequence = { key: key!, matchId: view.state.id, boardId: board.id,
      names: board.categories.map((category) => category.name), count: 0, enabled, timer: null };
    this.publishBoard();
    this.boardSequence.timer = this.schedule(() => this.advanceBoard(), 6_000);
    return true;
  }

  private publishBoard(): void {
    const sequence = this.boardSequence;
    if (sequence !== null) this.onTopicReveal?.({ matchId: sequence.matchId, boardId: sequence.boardId, count: sequence.count });
  }

  private advanceBoard(): void {
    const sequence = this.boardSequence;
    if (sequence === null || sequence.count >= sequence.names.length) return;
    sequence.count += 1;
    this.publishBoard();
    const text = sequence.names[sequence.count - 1];
    if (sequence.enabled) this.begin({ kind: 'board', key: `${sequence.key}:${sequence.count}`, text });
    else sequence.timer = this.schedule(() => this.advanceBoard(), topicReadingMs(text));
  }

  update(view: SpeechGameView, settings: SpeechSettings): void {
    const configured = view.state.config.language === 'en' && view.state.config.speechEnabled === true;
    this.volume = Math.max(0, Math.min(1, settings.master ?? 1));
    const enabled = configured && !settings.muted && settings.speechEnabled && this.volume > 0;
    const idleClue = configured ? idleClueIdentifier(view) : null;
    this.currentIdleClueKey = idleClue?.key ?? null;
    if (this.timerStartRetry !== null && this.timerStartRetry.key !== this.currentIdleClueKey) {
      this.clearSchedule(this.timerStartRetry.handle);
      this.timerStartRetry = null;
    }
    if (this.updateBoard(view, enabled)) return;
    if (!enabled) {
      const cancellingCurrentClue = this.pending?.narration.kind === 'clue'
        && this.pending.narration.key === idleClue?.key;
      this.cancelActive(cancellingCurrentClue);
      if (idleClue !== null) this.failOpen(idleClue);
      return;
    }

    const narration = publicNarration(view);
    if (narration === null) {
      this.cancelActive(false);
      return;
    }
    if (this.pending?.narration.key === narration.key) return;
    if (this.pending !== null) this.cancelActive(false);
    if (this.announced.has(narration.key)) return;
    this.announced.add(narration.key);
    this.begin(narration);
  }

  dispose(): void {
    if (this.boardSequence !== null) this.clearSchedule(this.boardSequence.timer);
    this.boardSequence = null;
    this.generation += 1;
    this.currentIdleClueKey = null;
    if (this.timerStartRetry !== null) this.clearSchedule(this.timerStartRetry.handle);
    this.timerStartRetry = null;
    const pending = this.pending;
    this.pending = null;
    if (pending !== null) this.clearPending(pending);
    try { this.speech?.cancel(); } catch { /* speech teardown is best effort */ }
  }

  private begin(narration: Narration): void {
    const pending: PendingNarration = {
      generation: ++this.generation,
      narration,
      waitTimer: null,
      watchdogTimer: null,
      voiceListener: null,
      completed: false,
      releaseDuck: null,
    };
    this.pending = pending;
    if (this.speech === null) {
      this.finish(pending, narration.kind === 'clue');
      return;
    }
    this.trySpeak(pending);
  }

  private trySpeak(pending: PendingNarration): void {
    if (this.pending !== pending || pending.completed || pending.generation !== this.generation) return;
    const speech = this.speech;
    if (speech === null) {
      this.finish(pending, pending.narration.kind === 'clue');
      return;
    }
    let voice: SpeechVoiceLike | undefined;
    try { voice = speech.getVoices().find(isLocalEnglish); } catch { voice = undefined; }
    if (voice === undefined) {
      if (pending.waitTimer === null) {
        pending.voiceListener = () => this.trySpeak(pending);
        speech.addEventListener?.('voiceschanged', pending.voiceListener);
        pending.waitTimer = this.schedule(() => this.finish(pending, pending.narration.kind === 'clue'), this.voiceWaitMs);
      }
      return;
    }

    if (pending.waitTimer !== null) {
      this.clearSchedule(pending.waitTimer);
      pending.waitTimer = null;
    }
    if (pending.voiceListener !== null) {
      speech.removeEventListener?.('voiceschanged', pending.voiceListener);
      pending.voiceListener = null;
    }
    try {
      speech.cancel();
      const utterance = this.createUtterance(pending.narration.text);
      utterance.lang = voice.lang;
      utterance.voice = voice;
      utterance.volume = this.volume;
      utterance.onend = () => this.finish(pending, pending.narration.kind === 'clue', true);
      utterance.onerror = () => this.finish(pending, pending.narration.kind === 'clue');
      pending.releaseDuck = this.duckMusicFor?.(estimateDurationMs(pending.narration.text)) ?? null;
      speech.speak(utterance);
      if (!pending.completed) {
        pending.watchdogTimer = this.schedule(
          () => this.watchdog(pending),
          Math.min(
            MAX_SPEECH_WATCHDOG_MS,
            estimateDurationMs(pending.narration.text) + SPEECH_WATCHDOG_GRACE_MS,
          ),
        );
      }
    } catch {
      this.finish(pending, pending.narration.kind === 'clue');
    }
  }

  private finish(pending: PendingNarration, startTimer: boolean, spoken = false): void {
    if (this.pending !== pending || pending.completed || pending.generation !== this.generation) return;
    pending.completed = true;
    this.pending = null;
    this.clearPending(pending);
    if (pending.narration.kind === 'board' && this.boardSequence !== null) {
      if (spoken) this.advanceBoard();
      else this.boardSequence.timer = this.schedule(() => this.advanceBoard(), topicReadingMs(pending.narration.text));
    }
    if (startTimer && pending.narration.kind === 'clue') {
      this.startClueTimer(pending.narration);
    }
  }

  private watchdog(pending: PendingNarration): void {
    if (this.pending !== pending || pending.completed || pending.generation !== this.generation) return;
    try { this.speech?.cancel(); } catch { /* watchdog teardown is best effort */ }
    this.finish(pending, pending.narration.kind === 'clue');
  }

  private cancelActive(startTimer: boolean): void {
    const pending = this.pending;
    if (pending === null) return;
    this.generation += 1;
    this.pending = null;
    pending.completed = true;
    this.clearPending(pending);
    try { this.speech?.cancel(); } catch { /* cancellation is best effort */ }
    if (startTimer && pending.narration.kind === 'clue') this.startClueTimer(pending.narration);
  }

  private failOpen(narration: Narration): void {
    if (narration.kind !== 'clue' || this.announced.has(narration.key)) return;
    this.announced.add(narration.key);
    this.startClueTimer(narration);
  }

  private startClueTimer(narration: Extract<Narration, { kind: 'clue' }>, attempt = 1): void {
    let dispatched: Promise<unknown>;
    try {
      dispatched = Promise.resolve(this.dispatch({
        type: 'StartNarratedClueTimer',
        clueId: narration.clueId,
        narrationSequence: narration.narrationSequence,
      }));
    } catch {
      this.scheduleTimerStartRetry(narration, attempt);
      return;
    }
    let timeoutHandle: unknown = null;
    const timeout = new Promise<never>((_resolve, reject) => {
      timeoutHandle = this.schedule(
        () => reject(new Error('NARRATED_TIMER_START_TIMEOUT')),
        TIMER_START_DISPATCH_TIMEOUT_MS,
      );
    });
    void Promise.race([dispatched, timeout]).then(
      () => { if (timeoutHandle !== null) this.clearSchedule(timeoutHandle); },
      () => {
        if (timeoutHandle !== null) this.clearSchedule(timeoutHandle);
        this.scheduleTimerStartRetry(narration, attempt);
      },
    );
  }

  private scheduleTimerStartRetry(
    narration: Extract<Narration, { kind: 'clue' }>,
    attempt: number,
  ): void {
    if (this.currentIdleClueKey !== narration.key) return;
    if (this.timerStartRetry !== null) this.clearSchedule(this.timerStartRetry.handle);
    const handle = this.schedule(() => {
      this.timerStartRetry = null;
      if (this.currentIdleClueKey === narration.key) this.startClueTimer(narration, attempt + 1);
    }, Math.min(TIMER_START_RETRY_MS * 2 ** (attempt - 1), MAX_TIMER_START_RETRY_MS));
    this.timerStartRetry = { key: narration.key, handle };
  }

  private clearPending(pending: PendingNarration): void {
    if (pending.waitTimer !== null) this.clearSchedule(pending.waitTimer);
    if (pending.watchdogTimer !== null) this.clearSchedule(pending.watchdogTimer);
    if (pending.voiceListener !== null) this.speech?.removeEventListener?.('voiceschanged', pending.voiceListener);
    pending.releaseDuck?.();
    pending.waitTimer = null;
    pending.watchdogTimer = null;
    pending.voiceListener = null;
    pending.releaseDuck = null;
  }
}

export function useGameSpeech(
  view: SpeechGameView,
  settings: SpeechSettings,
  dispatch: NarratedClueTimerDispatch,
  duckMusicFor?: (durationMs: number) => (() => void) | undefined,
  onTopicReveal?: (reveal: TopicReveal) => void,
): void {
  const controller = useRef<SpeechController | null>(null);
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;
  controller.current ??= new SpeechController({ dispatch: (command) => dispatchRef.current(command), duckMusicFor });
  const instance = controller.current!;
  instance.setDuckMusicFor(duckMusicFor);
  instance.setOnTopicReveal(onTopicReveal);
  useEffect(() => {
    instance.update(view, settings);
  }, [settings, view]);
  useEffect(() => () => instance.dispose(), [instance]);
}

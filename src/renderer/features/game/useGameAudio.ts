import { useCallback, useEffect, useRef } from 'react';
import type { HostGameView } from '../../../shared/game/types';
import {
  audioChannelForAsset,
  effectiveAudioGain,
  mediaAssetUrl,
  type AudioAssetKey,
  type AudioSettings,
} from '../../../shared/media/contracts';

export type GameAudioAction =
  | { type: 'play'; key: AudioAssetKey }
  | { type: 'music'; key: Extract<AudioAssetKey, 'opening' | 'round-transition' | 'final-tension'> }
  | { type: 'stop-music' };

export function audioActionsForTransition(previous: HostGameView | null, current: HostGameView): GameAudioAction[] {
  const boardPhases = ['round-one-board', 'round-two-board'];
  if (previous === null) return boardPhases.includes(current.state.phase) ? [{ type: 'music', key: 'opening' }] : [];
  if (previous.state.id !== current.state.id || current.state.eventSequence <= previous.state.eventSequence) return [];
  const before = previous.state;
  const after = current.state;
  if (after.undoStack.length < before.undoStack.length) return [];
  const actions: GameAudioAction[] = [];
  const leftBoard = boardPhases.includes(before.phase) && !boardPhases.includes(after.phase);
  const enteredBoard = !boardPhases.includes(before.phase) && boardPhases.includes(after.phase);
  const tiebreakerTeam = before.phase === 'tiebreaker' ? before.activeClue?.lockedTeamId : null;
  if (tiebreakerTeam !== null && tiebreakerTeam !== undefined) {
    const correct = after.phase === 'complete'
      && after.winnerTeamId === tiebreakerTeam
      && after.activeClue?.responseRevealed === true;
    const sameClueLockout = after.phase === 'tiebreaker'
      && after.activeClue !== null
      && after.activeClue.clueId === before.activeClue?.clueId
      && after.activeClue.lockedTeamId === null
      && after.activeClue.lockedOutTeamIds.includes(tiebreakerTeam);
    const nextTiebreaker = after.phase === 'tiebreaker'
      && after.suddenDeathClueNumber > before.suddenDeathClueNumber
      && after.activeClue?.clueId !== before.activeClue?.clueId;
    if (correct) actions.push({ type: 'play', key: 'correct-applause' });
    else if (sameClueLockout || nextTiebreaker) actions.push({ type: 'play', key: 'incorrect-crowd' });
  }
  if (leftBoard || (before.phase === 'final-clue' && after.phase !== 'final-clue')) actions.push({ type: 'stop-music' });
  if (before.timer.status !== 'expired' && after.timer.status === 'expired') actions.push({ type: 'play', key: 'time-expired' });
  if (before.phase !== after.phase) {
    if (after.phase === 'daily-double-wager') actions.push({ type: 'play', key: 'daily-double' });
    else if (after.phase === 'round-two-board' || after.phase === 'final-category') actions.push({ type: 'play', key: 'round-transition' });
    else if (after.phase === 'final-clue') actions.push({ type: 'music', key: 'final-tension' });
    else if (after.phase === 'complete' && after.winnerTeamId !== null) actions.push({ type: 'play', key: 'winner' });
  }
  if (enteredBoard) actions.push({ type: 'music', key: 'opening' });
  const newJudgment = Object.keys(after.finalJudgments).find((teamId) => !(teamId in before.finalJudgments));
  if (newJudgment !== undefined) actions.push({ type: 'play', key: after.finalJudgments[newJudgment] ? 'correct-applause' : 'incorrect-crowd' });
  else if (before.activeClue?.clueId === after.activeClue?.clueId) {
    const scoreDelta = after.config.teams.reduce((sum, team) => sum + after.scores[team.id] - before.scores[team.id], 0);
    const revealedJudgment = before.phase !== 'clue-reveal' && after.phase === 'clue-reveal';
    const ordinaryLockout = after.activeClue !== null
      && after.activeClue.lockedOutTeamIds.length > (before.activeClue?.lockedOutTeamIds.length ?? 0);
    if (scoreDelta > 0 && revealedJudgment) actions.push({ type: 'play', key: 'correct-applause' });
    else if (scoreDelta < 0 && (revealedJudgment || ordinaryLockout)) actions.push({ type: 'play', key: 'incorrect-crowd' });
  }
  return actions;
}

interface AudioLike {
  volume: number;
  loop: boolean;
  currentTime: number;
  play(): Promise<unknown>;
  pause(): void;
  addEventListener?(type: 'ended', listener: () => void, options?: { once?: boolean }): void;
  removeEventListener?(type: 'ended', listener: () => void): void;
}

interface AudioControllerOptions {
  createAudio?: (url: string) => AudioLike;
  settings: AudioSettings;
  setTimeout?: (callback: () => void, delay: number) => unknown;
  clearTimeout?: (handle: unknown) => void;
  setInterval?: (callback: () => void, delay: number) => unknown;
  clearInterval?: (handle: unknown) => void;
  onPlaybackWarning?: (key: AudioAssetKey) => void;
}

export class AudioController {
  private settings: AudioSettings;
  private music: AudioLike | null = null;
  private active = new Map<AudioLike, { key: AudioAssetKey; channel: ReturnType<typeof audioChannelForAsset>; ducked: boolean }>();
  private endedListeners = new Map<AudioLike, () => void>();
  private duckLeaseSequence = 0;
  private duckLeases = new Map<number, unknown>();
  private countdownTimer: unknown = null;
  private readonly createAudio: (url: string) => AudioLike;
  private readonly schedule: (callback: () => void, delay: number) => unknown;
  private readonly cancel: (handle: unknown) => void;
  private readonly repeat: (callback: () => void, delay: number) => unknown;
  private readonly cancelRepeat: (handle: unknown) => void;

  constructor(private readonly options: AudioControllerOptions) {
    this.settings = options.settings;
    this.createAudio = options.createAudio ?? ((url) => new Audio(url) as AudioLike);
    this.schedule = options.setTimeout ?? ((callback, delay) => window.setTimeout(callback, delay));
    this.cancel = options.clearTimeout ?? ((handle) => window.clearTimeout(handle as number));
    this.repeat = options.setInterval ?? ((callback, delay) => window.setInterval(callback, delay));
    this.cancelRepeat = options.clearInterval ?? ((handle) => window.clearInterval(handle as number));
  }

  setSettings(settings: AudioSettings): void {
    this.settings = settings;
    for (const [audio, playback] of this.active) this.applyVolume(audio, playback);
  }

  play(key: AudioAssetKey): void {
    if (this.settings.muted) return;
    const audio = this.createAudio(mediaAssetUrl(key));
    this.track(audio, key);
    void audio.play().catch(() => { this.release(audio); this.options.onPlaybackWarning?.(key); });
    if (this.music !== null && key !== 'final-tension') this.duckMusicFor(1_200);
  }

  startMusic(key: Extract<AudioAssetKey, 'opening' | 'round-transition' | 'final-tension'>): void {
    this.stopMusic();
    if (this.settings.muted) return;
    const audio = this.createAudio(mediaAssetUrl(key));
    audio.loop = key === 'opening' || key === 'final-tension';
    this.music = audio;
    this.track(audio, key, () => { if (this.music === audio) this.music = null; });
    void audio.play().catch(() => {
      this.release(audio);
      if (this.music === audio) this.music = null;
      this.options.onPlaybackWarning?.(key);
    });
  }

  stopMusic(): void {
    if (this.music === null) return;
    this.music.pause();
    this.release(this.music);
    this.music = null;
  }

  duckMusicFor(durationMs: number): (() => void) | undefined {
    if (!Number.isFinite(durationMs) || durationMs < 0) return undefined;
    return this.duckMusic(durationMs);
  }

  apply(action: GameAudioAction): void {
    if (action.type === 'play') this.play(action.key);
    else if (action.type === 'music') this.startMusic(action.key);
    else this.stopMusic();
  }

  setCountdownRunning(running: boolean): void {
    if (running && this.countdownTimer === null) {
      this.countdownTimer = this.repeat(() => this.play('countdown-tick'), 1_000);
    } else if (!running && this.countdownTimer !== null) {
      this.cancelRepeat(this.countdownTimer);
      this.countdownTimer = null;
    }
  }

  dispose(): void {
    for (const handle of this.duckLeases.values()) this.cancel(handle);
    this.duckLeases.clear();
    this.setCountdownRunning(false);
    for (const audio of [...this.active.keys()]) { audio.pause(); this.release(audio); }
    this.music = null;
  }

  private track(audio: AudioLike, key: AudioAssetKey, onEnded?: () => void): void {
    const ended = () => { this.release(audio); onEnded?.(); };
    const playback = {
      key,
      channel: audioChannelForAsset(key),
      ducked: audio === this.music && this.duckLeases.size > 0,
    };
    this.active.set(audio, playback);
    this.applyVolume(audio, playback);
    this.endedListeners.set(audio, ended);
    audio.addEventListener?.('ended', ended, { once: true });
  }

  private release(audio: AudioLike): void {
    const ended = this.endedListeners.get(audio);
    if (ended !== undefined) audio.removeEventListener?.('ended', ended);
    this.endedListeners.delete(audio);
    this.active.delete(audio);
  }

  private duckMusic(durationMs: number): () => void {
    const lease = ++this.duckLeaseSequence;
    if (this.music !== null) {
      const playback = this.active.get(this.music);
      if (playback !== undefined) {
        playback.ducked = true;
        this.applyVolume(this.music, playback);
      }
    }
    const release = () => {
      if (!this.duckLeases.has(lease)) return;
      const handle = this.duckLeases.get(lease);
      this.cancel(handle);
      this.duckLeases.delete(lease);
      if (this.duckLeases.size > 0) return;
      if (this.music === null) return;
      const current = this.active.get(this.music);
      if (current === undefined) return;
      current.ducked = false;
      this.applyVolume(this.music, current);
    };
    this.duckLeases.set(lease, this.schedule(release, durationMs));
    return release;
  }

  private applyVolume(audio: AudioLike, playback: { channel: ReturnType<typeof audioChannelForAsset>; ducked: boolean }): void {
    audio.volume = effectiveAudioGain(this.settings, playback.channel) * (playback.ducked ? 0.25 : 1);
  }
}

export function useGameAudio(
  view: HostGameView,
  settings: AudioSettings,
  onPlaybackWarning?: (key: AudioAssetKey) => void,
): { duckMusicFor: (durationMs: number) => (() => void) | undefined } {
  const controller = useRef<AudioController | null>(null);
  const previous = useRef<HostGameView | null>(null);
  const playbackWarning = useRef(onPlaybackWarning);
  playbackWarning.current = onPlaybackWarning;
  controller.current ??= new AudioController({ settings, onPlaybackWarning: (key) => playbackWarning.current?.(key) });
  useEffect(() => controller.current?.setSettings(settings), [settings]);
  useEffect(() => {
    const audio = controller.current;
    if (audio === null) return;
    for (const action of audioActionsForTransition(previous.current, view)) audio.apply(action);
    audio.setCountdownRunning(view.state.timer.status === 'running');
    previous.current = view;
  }, [view]);
  useEffect(() => () => controller.current?.dispose(), []);
  const duckMusicFor = useCallback((durationMs: number) => controller.current?.duckMusicFor(durationMs), []);
  return { duckMusicFor };
}

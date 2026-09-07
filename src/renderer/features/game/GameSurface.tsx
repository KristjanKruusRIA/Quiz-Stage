import type { HostDesktopApi } from '../../api/desktopApi';
import type { HostGameView, PublicGameView } from '../../../shared/game/types';
import { toPublicGameView } from '../../../shared/game/views';
import { HostConsole } from './HostConsole';
import { PublicBoard } from './PublicBoard';
import { PublicClue } from './PublicClue';
import { PublicDailyDouble } from './PublicDailyDouble';
import { PublicFinal } from './PublicFinal';
import { PublicRoundIntro } from './PublicRoundIntro';
import { useEffect, useState } from 'react';
import { createTranslator, formatNumber } from '../../i18n';
import type { AudioAssetKey, AudioSettings } from '../../../shared/media/contracts';
import type { PublicPresentation } from '../../../shared/ipc/contracts';
import { useGameAudio } from './useGameAudio';
import { useGameSpeech } from './useGameSpeech';

type GameSurfaceProps =
  | { surface: 'public'; view: PublicGameView; now?: () => number; presentation?: PublicPresentation }
  | { surface: 'host'; view: HostGameView; api: HostDesktopApi; audioSettings?: AudioSettings; now?: () => number; onMute?: () => void; onAudioWarning?: (key: AudioAssetKey) => void; onHome?: () => void; onSaveAndQuit?: () => Promise<void> };

function presentation(
  view: PublicGameView,
  surface: GameSurfaceProps['surface'],
  now?: () => number,
  onSelect?: (tileId: string) => void,
  revealedCategoryCount?: number,
  publicPresentation: PublicPresentation = null,
) {
  if (view.phase === 'round-one-board' || view.phase === 'round-two-board') {
    return <PublicBoard view={view} onSelect={onSelect} revealedCategoryCount={revealedCategoryCount} />;
  }
  if (view.phase === 'daily-double-wager' && surface === 'public') return <PublicDailyDouble view={view} />;
  if (view.phase === 'ordinary-clue' || view.phase === 'daily-double-wager'
    || view.phase === 'daily-double-clue' || view.phase === 'clue-reveal') return <PublicClue view={view} now={now} />;
  return <PublicFinal view={view} now={now}
    showIntro={surface === 'public' && publicPresentation === 'final-intro'} />;
}

function scores(view: PublicGameView, surface: GameSurfaceProps['surface']) {
  const t = createTranslator(view.language);
  if (surface === 'public' && view.phase === 'daily-double-wager') return null;
  if (view.phase === 'final-wagers' && view.displayMode === 'single') return null;
  if (['final-category', 'final-wagers', 'complete'].includes(view.phase)) return null;
  return <ul className="scoreboard" aria-label={t('game.teamScores')}>{view.teams.map((team, index) => <li key={team.id}>
    {t('game.teamScore', { number: index + 1, name: team.name })} <strong>{formatNumber(view.language, team.score)}</strong>
  </li>)}</ul>;
}

export function GameSurface(props: GameSurfaceProps) {
  if (props.surface === 'public') return <PublicGameSurface key={props.view.board?.id ?? 'non-board'} {...props} />;
  return <HostGameSurface {...props} />;
}

const ROUND_INTRO_MS = 3_000;
const CATEGORY_REVEAL_MS = 350;

function PublicGameSurface(props: Extract<GameSurfaceProps, { surface: 'public' }>) {
  const categoryCount = props.view.board?.categories.length ?? 0;
  const [stageBoard] = useState(
    props.presentation === 'round-intro' && props.view.board !== null,
  );
  const [introPending, setIntroPending] = useState(stageBoard);
  const [revealedCategoryCount, setRevealedCategoryCount] = useState(stageBoard ? 0 : categoryCount);
  const showIntro = introPending;

  useEffect(() => {
    if (!showIntro) return;
    const timeout = window.setTimeout(() => {
      setIntroPending(false);
      setRevealedCategoryCount(Math.min(1, categoryCount));
    }, ROUND_INTRO_MS);
    return () => window.clearTimeout(timeout);
  }, [categoryCount, showIntro]);

  useEffect(() => {
    if (showIntro || revealedCategoryCount >= categoryCount) return;
    const timeout = window.setTimeout(() => {
      setRevealedCategoryCount((count) => Math.min(count + 1, categoryCount));
    }, CATEGORY_REVEAL_MS);
    return () => window.clearTimeout(timeout);
  }, [categoryCount, revealedCategoryCount, showIntro]);

  if (showIntro) return <main className="game-surface public-surface"><PublicRoundIntro view={props.view} /></main>;
  return <main className="game-surface public-surface">
    {scores(props.view, props.surface)}
    {presentation(props.view, props.surface, props.now, undefined,
      stageBoard ? revealedCategoryCount : undefined, props.presentation)}
  </main>;
}

function HostGameSurface(props: Extract<GameSurfaceProps, { surface: 'host' }>) {
  const viewKey = `${props.view.state.id}:${props.view.state.eventSequence}:${props.view.state.phase}`;
  const [selection, setSelection] = useState({ viewKey, request: 0, status: 'idle' as 'idle' | 'pending' | 'error' });
  if (selection.viewKey !== viewKey) {
    setSelection({ viewKey, request: selection.request + 1, status: 'idle' });
  }
  const selectionPending = selection.viewKey === viewKey && selection.status === 'pending';
  const selectionError = selection.viewKey === viewKey && selection.status === 'error';
  let selectingThisRender = selectionPending;

  const publicView = toPublicGameView(props.view.state);
  const tileMap = new Map<string, string>();
  const board = props.view.state.boards.find((candidate) => candidate.round === publicView.board?.round);
  if (publicView.board !== null && board !== undefined) publicView.board.categories.forEach((category, categoryIndex) => {
    category.clues.forEach((tile, clueIndex) => {
      const clue = board.categories[categoryIndex]?.clues[clueIndex];
      if (clue !== undefined) tileMap.set(tile.id, clue.id);
    });
  });
  const onSelect = (tileId: string) => {
    const clueId = tileMap.get(tileId);
    if (clueId === undefined || selectingThisRender) return;
    selectingThisRender = true;
    const request = selection.request + 1;
    const startingViewKey = viewKey;
    setSelection({ viewKey, request, status: 'pending' });
    void props.api.dispatch({ type: 'SelectClue', clueId }).then(() => {
      setSelection((current) => current.request === request && current.viewKey === startingViewKey
        ? { ...current, status: 'idle' }
        : current);
    }, () => {
      setSelection((current) => current.request === request && current.viewKey === startingViewKey
        ? { ...current, status: 'error' }
        : current);
    });
  };
  return <main className="game-surface host-surface">
    {props.audioSettings === undefined
      ? <GameSpeechLifecycle view={props.view} api={props.api} />
      : <GameMediaLifecycle view={props.view} api={props.api} settings={props.audioSettings}
        onWarning={props.onAudioWarning} />}
    <section className="public-presentation">
      {selectionError ? <p role="alert">{createTranslator(publicView.language)('game.selectionError')}</p> : null}
      {scores(publicView, props.surface)}{presentation(publicView, props.surface, props.now, selectionPending ? undefined : onSelect)}
    </section>
    <HostConsole view={props.view} api={props.api} now={props.now} onMute={props.onMute} onSaveAndQuit={props.onSaveAndQuit} />
    {props.onHome === undefined ? null : <button type="button" onClick={props.onHome}>{createTranslator(publicView.language)('common.backHome')}</button>}
  </main>;
}

function GameMediaLifecycle({ view, api, settings, onWarning }: {
  view: HostGameView;
  api: HostDesktopApi;
  settings: AudioSettings;
  onWarning?: (key: AudioAssetKey) => void;
}) {
  const { duckMusicFor } = useGameAudio(view, settings, onWarning);
  useGameSpeech(view, settings, api.dispatch, duckMusicFor);
  return null;
}

const unavailableSpeechSettings = { speechEnabled: false, muted: true } as const;

function GameSpeechLifecycle({ view, api }: { view: HostGameView; api: HostDesktopApi }) {
  useGameSpeech(view, unavailableSpeechSettings, api.dispatch);
  return null;
}

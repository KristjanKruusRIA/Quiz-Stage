import type { HostDesktopApi } from '../../api/desktopApi';
import type { HostGameView, PublicGameView } from '../../../shared/game/types';
import { toPublicGameView } from '../../../shared/game/views';
import { HostConsole } from './HostConsole';
import { PublicBoard } from './PublicBoard';
import { PublicClue } from './PublicClue';
import { PublicFinal } from './PublicFinal';
import { useState } from 'react';

type GameSurfaceProps =
  | { surface: 'public'; view: PublicGameView; now?: () => number }
  | { surface: 'host'; view: HostGameView; api: HostDesktopApi; now?: () => number; onMute?: () => void; onHome?: () => void };

function presentation(view: PublicGameView, now?: () => number, onSelect?: (tileId: string) => void) {
  if (view.phase === 'round-one-board' || view.phase === 'round-two-board') return <PublicBoard view={view} onSelect={onSelect} />;
  if (view.phase === 'ordinary-clue' || view.phase === 'clue-reveal') return <PublicClue view={view} now={now} />;
  return <PublicFinal view={view} now={now} />;
}

function scores(view: PublicGameView) {
  if (view.phase === 'final-wagers' && view.displayMode === 'single') return null;
  if (['final-category', 'final-wagers', 'complete'].includes(view.phase)) return null;
  return <ul className="scoreboard" aria-label="Team scores">{view.teams.map((team, index) => <li key={team.id}>
    Team {index + 1}: {team.name} <strong>{team.score}</strong>
  </li>)}</ul>;
}

export function GameSurface(props: GameSurfaceProps) {
  if (props.surface === 'public') return <main className="game-surface public-surface">{scores(props.view)}{presentation(props.view, props.now)}</main>;
  return <HostGameSurface {...props} />;
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
    <section className="public-presentation">
      {selectionError ? <p role="alert">The clue could not be selected. Try again.</p> : null}
      {scores(publicView)}{presentation(publicView, props.now, selectionPending ? undefined : onSelect)}
    </section>
    <HostConsole view={props.view} api={props.api} now={props.now} onMute={props.onMute} />
    {props.onHome === undefined ? null : <button type="button" onClick={props.onHome}>Back to Home</button>}
  </main>;
}

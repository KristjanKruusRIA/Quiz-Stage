import { useRef, useState } from 'react';
import type { HostDesktopApi } from '../../api/desktopApi';
import type { GameCommand } from '../../../shared/game/commands';
import type { Clue, HostGameView } from '../../../shared/game/types';
import { HostTeamControls } from './HostTeamControls';
import { useGameShortcuts } from './useGameShortcuts';

interface HostConsoleProps {
  view: HostGameView;
  api: HostDesktopApi;
  now?: () => number;
  onMute?: () => void;
}

const systemNow = () => Date.now();

function activeClue(view: HostGameView): Clue | null {
  const clueId = view.state.activeClue?.clueId;
  if (clueId === undefined) return null;
  for (const board of view.state.boards) for (const category of board.categories) {
    const clue = category.clues.find((candidate) => candidate.id === clueId);
    if (clue !== undefined) return clue;
  }
  if (view.state.finalClue?.id === clueId) return view.state.finalClue;
  return view.state.tiebreakerClues.find((clue) => clue.id === clueId) ?? null;
}

function text(clue: Clue, field: 'prompt' | 'response' | 'explanation', view: HostGameView): string {
  const language = view.state.config.language;
  return clue[field][language] ?? clue[field].en;
}

export function HostConsole({ view, api, now = systemNow, onMute }: HostConsoleProps) {
  const [dailyWager, setDailyWager] = useState('5');
  const [finalWagers, setFinalWagers] = useState<Record<string, string>>({});
  const [scoreReason, setScoreReason] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [confirmIncomplete, setConfirmIncomplete] = useState(false);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const clue = activeClue(view);
  const state = view.state;
  const dispatch = (command: GameCommand): boolean => {
    if (pendingRef.current) return false;
    pendingRef.current = true;
    setPending(true);
    void api.dispatch(command).then(
      () => setError(null),
      () => setError(state.config.language === 'et'
        ? 'Seda toimingut ei saanud praeguses mänguolukorras teha.'
        : 'That action could not be completed in the current game state.'),
    ).finally(() => {
      pendingRef.current = false;
      setPending(false);
    });
    return true;
  };
  const canJudge = state.activeClue?.lockedTeamId !== null && state.activeClue?.lockedTeamId !== undefined;
  const timed = ['ordinary-clue', 'daily-double-clue', 'final-clue', 'tiebreaker'].includes(state.phase);
  const revealable = state.activeClue !== null && state.activeClue.lockedTeamId === null
    && (state.phase === 'ordinary-clue' || state.phase === 'tiebreaker' || (state.phase === 'daily-double-clue' && state.timer.status === 'expired'));
  const clueRevealed = state.phase === 'clue-reveal' && state.activeClue?.responseRevealed === true;
  const reportable = clue !== null
    && ['ordinary-clue', 'daily-double-wager', 'daily-double-clue', 'clue-reveal', 'tiebreaker'].includes(state.phase);
  const lockTeam = (teamId: string) => dispatch({ type: 'LockTeam', teamId, at: now() });
  const teamAt = (index: number) => state.config.teams[index];

  useGameShortcuts({
    onTeam: (index) => {
      const team = teamAt(index);
      if (team === undefined || !timed || state.timer.status !== 'running' || state.activeClue?.lockedTeamId !== null) return false;
      if (state.activeClue?.lockedOutTeamIds.includes(team.id)) return false;
      if (state.phase === 'daily-double-clue' && team.id !== state.controllingTeamId) return false;
      if (state.phase === 'tiebreaker' && !state.tiebreakerTeamIds.includes(team.id)) return false;
      return dispatch({ type: 'LockTeam', teamId: team.id, at: now() });
    },
    onCorrect: () => canJudge && dispatch({ type: 'JudgeResponse', correct: true, at: now() }),
    onIncorrect: () => canJudge && dispatch({ type: 'JudgeResponse', correct: false, at: now() }),
    onToggleTimer: () => {
      if (!timed || !['running', 'paused'].includes(state.timer.status)) return false;
      return dispatch({ type: state.timer.status === 'running' ? 'PauseTimer' : 'ResumeTimer', at: now() });
    },
    onReveal: () => clueRevealed ? dispatch({ type: 'AdvanceAfterReveal' }) : revealable && dispatch({ type: 'RevealResponse' }),
    onUndo: () => state.undoStack.length > 0 && state.phase !== 'complete' && dispatch({ type: 'UndoLast' }),
    onMute: () => { if (onMute === undefined) return false; onMute(); return true; },
  });

  const controlling = state.config.teams.find((team) => team.id === state.controllingTeamId);
  const dailyMaximum = clue === null || controlling === undefined ? 0 : Math.max(
    state.scores[controlling.id], clue.round === 'round-two' ? 2000 : 1000,
  );
  const dailyValue = Number(dailyWager);
  const dailyValid = Number.isInteger(dailyValue) && dailyValue >= 5 && dailyValue <= dailyMaximum;
  const nextFinalTeamId = state.finalRevealOrder[state.finalRevealedTeamIds.length];
  const nextFinalTeam = state.config.teams.find((team) => team.id === nextFinalTeamId);

  return <aside className="host-console" aria-label="Host console">
    <header><h2>Host console</h2><p data-testid="controlling-team">In control: {controlling?.name ?? 'None'}</p></header>
    {view.replayIssue === null ? null : <p role="alert">Recovered through event {view.replayIssue.sequence}; later data could not be replayed.</p>}
    {error === null ? null : <p role="alert">{error}</p>}
    {clue === null ? null : <section aria-label="Private clue details">
      <p><strong>Response:</strong> {text(clue, 'response', view)}</p>
      <p><strong>Explanation:</strong> {text(clue, 'explanation', view)}</p>
      <p><strong>Source:</strong> {clue.source}</p>
    </section>}

    {state.phase === 'daily-double-wager' ? <form onSubmit={(event) => {
      event.preventDefault(); if (dailyValid) dispatch({ type: 'SubmitDailyDoubleWager', wager: dailyValue });
    }}>
      <label>Daily Double wager <input type="number" min={5} max={dailyMaximum} value={dailyWager} onChange={(event) => setDailyWager(event.target.value)} /></label>
      <button type="submit" disabled={!dailyValid || pending}>Commit wager</button>
    </form> : null}

    {state.phase === 'final-category' || state.phase === 'final-wagers' ? <section aria-label="Final wagers">
      {state.finalEligibleTeamIds.map((teamId) => {
        const team = state.config.teams.find((candidate) => candidate.id === teamId);
        const committed = teamId in state.finalWagers;
        const value = Number(finalWagers[teamId] ?? '0');
        const valid = Number.isInteger(value) && value >= 0 && value <= state.scores[teamId];
        return <form key={teamId} onSubmit={(event) => {
          event.preventDefault(); if (!committed && valid) dispatch({ type: 'SubmitFinalWager', teamId, wager: value });
        }}>
          <label>Final wager for {team?.name}<input type="number" min={0} max={state.scores[teamId]} disabled={committed}
            value={finalWagers[teamId] ?? '0'} onChange={(event) => setFinalWagers((values) => ({ ...values, [teamId]: event.target.value }))} /></label>
          <button type="submit" disabled={committed || !valid || pending}>Commit {team?.name} wager</button>
        </form>;
      })}
    </section> : null}

    {state.phase === 'complete' ? null : <>
    <HostTeamControls view={view} onLock={lockTeam} />
    <section className="judgment-controls" aria-label="Judgment controls">
      <button type="button" disabled={!canJudge || pending} onClick={() => dispatch({ type: 'JudgeResponse', correct: true, at: now() })}>Correct</button>
      <button type="button" disabled={!canJudge || pending} onClick={() => dispatch({ type: 'JudgeResponse', correct: false, at: now() })}>Incorrect</button>
      <button type="button" disabled={!revealable || pending} onClick={() => dispatch({ type: 'RevealResponse' })}>Reveal response</button>
      {clueRevealed ? <button type="button" disabled={pending} onClick={() => dispatch({ type: 'AdvanceAfterReveal' })}>Continue</button> : null}
    </section>
    <section className="timer-controls" aria-label="Timer controls">
      <button type="button" disabled={pending || !timed || !['running', 'paused'].includes(state.timer.status)} onClick={() => dispatch({
        type: state.timer.status === 'running' ? 'PauseTimer' : 'ResumeTimer', at: now(),
      })}>{state.timer.status === 'running' ? 'Pause timer' : 'Resume timer'}</button>
      <button type="button" disabled={pending || !timed} onClick={() => dispatch({ type: 'ResetTimer', at: now() })}>Reset timer</button>
    </section>
    {nextFinalTeam === undefined || !['final-clue', 'final-reveal'].includes(state.phase) ? null : <section aria-label="Final reveal">
      <p>Reveal {nextFinalTeam.name}</p>
      <button type="button" disabled={pending || (state.timer.status !== 'expired' && state.phase === 'final-clue')} onClick={() => dispatch({ type: 'RevealFinalTeam', teamId: nextFinalTeam.id, correct: true })}>Reveal {nextFinalTeam.name} correct</button>
      <button type="button" disabled={pending || (state.timer.status !== 'expired' && state.phase === 'final-clue')} onClick={() => dispatch({ type: 'RevealFinalTeam', teamId: nextFinalTeam.id, correct: false })}>Reveal {nextFinalTeam.name} incorrect</button>
    </section>}
    <section className="recovery-controls" aria-label="Recovery controls">
      <button type="button" disabled={pending || state.undoStack.length === 0} onClick={() => dispatch({ type: 'UndoLast' })}>Undo</button>
      <button type="button" disabled={pending || state.lastClosedClueId === null || !['round-one-board', 'round-two-board', 'final-category'].includes(state.phase)} onClick={() => dispatch({ type: 'ReopenClue' })}>Reopen clue</button>
    </section>
    <section aria-label="Current match corrections">
      <label>Score adjustment reason<input value={scoreReason} onChange={(event) => setScoreReason(event.target.value)} /></label>
      {state.config.teams.map((team) => {
        return <form key={team.id} onSubmit={(event) => {
          event.preventDefault();
          const score = Number(new FormData(event.currentTarget).get('score'));
          if (Number.isInteger(score) && scoreReason.trim() !== '') {
            dispatch({ type: 'AdjustScore', teamId: team.id, score, reason: scoreReason.trim() });
          }
        }}>
          <label>Score for {team.name}<input key={`${team.id}:${state.scores[team.id]}`} name="score" type="number" step="1" required defaultValue={state.scores[team.id]} /></label>
          <button type="submit" disabled={pending || scoreReason.trim() === ''}>Set {team.name} score</button>
        </form>;
      })}
      {reportable ? <form onSubmit={(event) => {
        event.preventDefault();
        if (clue !== null && reportReason.trim() !== '') dispatch({ type: 'ReportClue', clueId: clue.id, reason: reportReason.trim() });
      }}>
        <label>Clue report reason<input value={reportReason} onChange={(event) => setReportReason(event.target.value)} /></label>
        <button type="submit" disabled={pending || clue === null || reportReason.trim() === ''}>Report current clue</button>
      </form> : null}
      <label><input type="checkbox" checked={confirmIncomplete} onChange={(event) => setConfirmIncomplete(event.target.checked)} />I understand this ends the current match</label>
      <button type="button" disabled={pending || !confirmIncomplete}
        onClick={() => dispatch({ type: 'EndIncompleteMatch' })}>End match incomplete</button>
    </section>
    </>}
  </aside>;
}

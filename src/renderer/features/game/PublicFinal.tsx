import type { PublicGameView } from '../../../shared/game/types';
import { PublicClue } from './PublicClue';

interface PublicFinalProps { view: PublicGameView; now?: () => number }

export function PublicFinal({ view, now }: PublicFinalProps) {
  if (view.phase === 'complete') {
    const winner = view.teams.find((team) => team.id === view.winnerTeamId);
    return winner === undefined
      ? <section role="status"><h1>Match incomplete</h1></section>
      : <section className="winner-screen"><h1>{winner.name} wins</h1><Scores view={view} /></section>;
  }
  if (view.phase === 'tiebreaker') return <section><h1>Sudden death</h1><PublicClue view={view} now={now} /></section>;
  if (view.final === null) return <section role="status">Preparing Final</section>;
  if (view.phase === 'final-wagers' && view.displayMode === 'single') {
    return <section className="final-waiting" role="status">Waiting for Final wagers</section>;
  }
  if (view.phase === 'final-category' || view.phase === 'final-wagers') {
    return <section><h1>Final category</h1><p>{view.final.category}</p><Scores view={view} /></section>;
  }
  return <section className="public-final">
    <h1>Final</h1>
    <PublicClue view={view} now={now} />
    <ol>{view.final.revealed.map((result) => {
      const team = view.teams.find((candidate) => candidate.id === result.teamId);
      return <li key={result.teamId}>{team?.name} wagered {result.wager} — {result.correct ? 'Correct' : 'Incorrect'}</li>;
    })}</ol>
  </section>;
}

function Scores({ view }: { view: PublicGameView }) {
  return <ul className="scoreboard">{view.teams.map((team, index) => <li key={team.id}>
    <span>Team {index + 1}: {team.name}</span> <strong>{team.score}</strong>
  </li>)}</ul>;
}

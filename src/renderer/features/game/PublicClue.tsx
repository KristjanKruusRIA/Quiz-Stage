import type { PublicGameView } from '../../../shared/game/types';
import { useDisplayedTimer } from './useDisplayedTimer';

interface PublicClueProps { view: PublicGameView; now?: () => number }

export function PublicClue({ view, now }: PublicClueProps) {
  const remainingMs = useDisplayedTimer(view.timer, now);
  if (view.activeClue === null) return <section className="final-waiting" role="status">Waiting for wager</section>;
  return <section className="public-clue" aria-label="Active clue">
    <p className="clue-prompt">{view.activeClue.prompt}</p>
    <p role="timer" aria-label="Time remaining">{Math.ceil(remainingMs / 1000)}</p>
    {view.activeClue.responseRevealed ? <div className="public-response">
      <p>{view.activeClue.response}</p><p>{view.activeClue.explanation}</p><p>{view.activeClue.source}</p>
    </div> : null}
  </section>;
}

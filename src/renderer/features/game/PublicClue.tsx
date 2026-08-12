import type { PublicGameView } from '../../../shared/game/types';
import { useDisplayedTimer } from './useDisplayedTimer';
import { createTranslator, formatNumber } from '../../i18n';

interface PublicClueProps { view: PublicGameView; now?: () => number }

export function PublicClue({ view, now }: PublicClueProps) {
  const remainingMs = useDisplayedTimer(view.timer, now);
  const t = createTranslator(view.language);
  if (view.activeClue === null) return <section className="final-waiting" role="status">{t('game.waitingWager')}</section>;
  return <section className="public-clue" aria-label={t('game.activeClue')}>
    <p className="clue-prompt">{view.activeClue.prompt}</p>
    <p role="timer" aria-label={t('game.timeRemaining')}>{formatNumber(view.language, Math.ceil(remainingMs / 1000))}</p>
    {view.activeClue.responseRevealed ? <div className="public-response">
      <p>{view.activeClue.response}</p><p>{view.activeClue.explanation}</p><p>{view.activeClue.source}</p>
    </div> : null}
  </section>;
}

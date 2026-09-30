import { useEffect, useState } from 'react';
import type { PublicGameView } from '../../../shared/game/types';
import { PublicClue } from './PublicClue';
import { createTranslator, formatNumber } from '../../i18n';

interface PublicFinalProps {
  view: PublicGameView;
  now?: () => number;
  showIntro?: boolean;
}

const FINAL_INTRO_MS = 5_000;

function FinalCategory({ view, showIntro }: Required<Pick<PublicFinalProps, 'showIntro'>> & { view: PublicGameView }) {
  const t = createTranslator(view.language);
  const [introPending, setIntroPending] = useState(showIntro);
  useEffect(() => {
    if (!introPending) return;
    const timeout = window.setTimeout(() => setIntroPending(false), FINAL_INTRO_MS);
    return () => window.clearTimeout(timeout);
  }, [introPending]);
  if (introPending) return <section className="final-intro-screen" aria-labelledby="final-intro-title">
    <p className="special-round-brand">{t('common.productName')}</p>
    <h1 id="final-intro-title">{t('game.final')}</h1>
  </section>;
  return <section className="public-final final-category-screen">
    <h1>{t('game.finalCategory')}</h1><p>{view.final?.category}</p><Scores view={view} />
  </section>;
}

export function PublicFinal({ view, now, showIntro = false }: PublicFinalProps) {
  const t = createTranslator(view.language);
  if (view.phase === 'complete') {
    const winner = view.teams.find((team) => team.id === view.winnerTeamId);
    return winner === undefined
      ? <section role="status"><h1>{t('game.matchIncomplete')}</h1></section>
      : <section className="winner-screen"><h1>{t('game.wins', { team: winner.name })}</h1><Scores view={view} /></section>;
  }
  if (view.phase === 'tiebreaker') return <section><h1>{t('game.suddenDeath')}</h1><PublicClue view={view} now={now} /></section>;
  if (view.final === null) return <section role="status">{t('game.preparingFinal')}</section>;
  if (view.phase === 'final-wagers' && view.displayMode === 'single') {
    return <section className="final-waiting" role="status">{t('game.waitingFinalWagers')}</section>;
  }
  if (view.phase === 'final-category' || view.phase === 'final-wagers') {
    return <FinalCategory view={view} showIntro={showIntro} />;
  }
  return <section className="public-final">
    <h1>{t('game.final')}</h1>
    <PublicClue view={view} now={now} />
    <ol>{view.final.revealed.map((result) => {
      const team = view.teams.find((candidate) => candidate.id === result.teamId);
      return <li key={result.teamId}>{t('game.finalResult', { team: team?.name ?? '', wager: formatNumber(view.language, result.wager), result: t(result.correct ? 'game.correct' : 'game.incorrect') })}</li>;
    })}</ol>
  </section>;
}

function Scores({ view }: { view: PublicGameView }) {
  const t = createTranslator(view.language);
  return <ul className="scoreboard">{view.teams.map((team, index) => <li key={team.id}>
    <span>{t('game.teamScore', { number: index + 1, name: team.name })}</span> <strong>{formatNumber(view.language, team.score)}</strong>
  </li>)}</ul>;
}

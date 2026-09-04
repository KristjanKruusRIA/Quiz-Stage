import type { PublicGameView } from '../../../shared/game/types';
import { createTranslator } from '../../i18n';

interface PublicDailyDoubleProps { view: PublicGameView }

export function PublicDailyDouble({ view }: PublicDailyDoubleProps) {
  const t = createTranslator(view.language);
  return <section className="daily-double-screen" aria-labelledby="daily-double-title">
    <p className="special-round-brand">{t('common.productName')}</p>
    <h1 id="daily-double-title">{t('game.dailyDouble')}</h1>
  </section>;
}

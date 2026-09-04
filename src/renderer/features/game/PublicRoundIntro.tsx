import type { PublicGameView } from '../../../shared/game/types';
import { brandingAssetUrl } from '../../../shared/media/contracts';
import { createTranslator } from '../../i18n';

export function PublicRoundIntro({ view }: { view: PublicGameView }) {
  const t = createTranslator(view.language);
  if (view.board?.round === 'round-one') {
    return <section className="round-intro-screen opening-logo-screen">
      <img src={brandingAssetUrl('logo')} alt={t('common.productName')} />
    </section>;
  }
  return <section className="round-intro-screen round-two-intro-screen">
    <p className="special-round-brand">{t('common.productName')}</p>
    <h1>{t('common.doubleRound')}</h1>
  </section>;
}

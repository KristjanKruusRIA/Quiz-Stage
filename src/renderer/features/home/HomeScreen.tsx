interface HomeScreenProps {
  onNewMatch: () => void;
  onResume: () => void;
  onHistory: () => void;
  onContent?: () => void;
  onSettings?: () => void;
  hasResumableMatch: boolean;
  resumePending?: boolean;
  resumeError?: boolean;
}

export function HomeScreen({
  onNewMatch,
  onResume,
  onHistory,
  onContent,
  onSettings,
  hasResumableMatch,
  resumePending = false,
  resumeError = false,
}: HomeScreenProps) {
  const { t } = useI18n();
  return (
    <main className="page-shell home-screen">
      <header>
        <img className="brand-logo" src={brandingAssetUrl('logo')} alt="" aria-hidden="true" />
        <p className="eyebrow">{t('common.productName')}</p>
        <h1>{t('home.title')}</h1>
      </header>
      <nav className="home-actions" aria-label={t('home.menu')}>
        <button className="primary-action" type="button" onClick={onNewMatch}>{t('home.newMatch')}</button>
        <button type="button" disabled={!hasResumableMatch || resumePending} onClick={onResume}>{t('home.resumeMatch')}</button>
        <button type="button" disabled={onContent === undefined} onClick={onContent}>{t('home.contentLibrary')}</button>
        <button type="button" onClick={onHistory}>{t('home.matchHistory')}</button>
        <button type="button" disabled={onSettings === undefined} onClick={onSettings}>{t('home.settings')}</button>
      </nav>
      {resumeError ? <p role="alert">{t('home.resumeError')}</p> : null}
      <p className="muted">{t('home.later')}</p>
    </main>
  );
}
import { useI18n } from '../../i18n';
import { brandingAssetUrl } from '../../../shared/media/contracts';

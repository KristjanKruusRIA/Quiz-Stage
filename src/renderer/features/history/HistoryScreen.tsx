import type { MatchHistoryEntry } from '../../../shared/ipc/contracts';
import { formatDateTime, formatNumber, pluralKey, useI18n } from '../../i18n';

interface HistoryScreenProps {
  entries: MatchHistoryEntry[];
  onBack: () => void;
  loading?: boolean;
  error?: boolean;
}

export function HistoryScreen({ entries, onBack, loading = false, error = false }: HistoryScreenProps) {
  const { locale, t } = useI18n();
  return <main className="page-shell history-screen">
    <header className="setup-header">
      <button type="button" onClick={onBack}>{t('common.back')}</button>
      <h1>{t('history.title')}</h1>
    </header>
    {loading ? <p role="status">{t('history.loading')}</p> : null}
    {error ? <p role="alert">{t('history.error')}</p> : null}
    {!loading && !error && entries.length === 0 ? <p role="status">{t('history.empty')}</p> : null}
    {!loading && !error ? <ol className="history-list">
      {entries.map((entry) => <li key={entry.id}>
        <article aria-labelledby={`history-${entry.id}`}>
          <h2 id={`history-${entry.id}`}>
            <time dateTime={new Date(entry.completedAt).toISOString()}>
              {formatDateTime(locale, entry.completedAt)}
            </time>
          </h2>
          <dl>
            <div><dt>{t('history.status')}</dt><dd>{t(entry.completionState === 'complete' ? 'history.complete' : 'history.incomplete')}</dd></div>
            <div><dt>{t('history.language')}</dt><dd>{t(entry.language === 'en' ? 'common.english' : 'common.estonian')}</dd></div>
            <div><dt>{t('history.difficulty')}</dt><dd>{t(`common.${entry.difficulty}`)}</dd></div>
            <div><dt>{t('history.duration')}</dt><dd>{(() => { const count = Math.floor(entry.durationMs / 60_000); return t(pluralKey(count, { one: 'history.minute.one', other: 'history.minute.other' }), { count: formatNumber(locale, count) }); })()}</dd></div>
            <div><dt>{t('history.packs')}</dt><dd>{entry.packIds.join(', ')}</dd></div>
            <div><dt>{t('history.seed')}</dt><dd>{entry.seed}</dd></div>
          </dl>
          <h3>{t('history.standings')}</h3>
          <ol aria-label={t('history.standingsFor', { match: entry.id })}>
            {entry.standings.map((standing) => <li key={standing.teamId}>
              {formatNumber(locale, standing.rank)}. {standing.name} — {formatNumber(locale, standing.score)}
            </li>)}
          </ol>
        </article>
      </li>)}
    </ol> : null}
  </main>;
}

import { useRef, useState } from 'react';
import type { HostDesktopApi } from '../../api/desktopApi';
import type {
  MatchConfigurationPreview,
  MatchTopicTarget,
} from '../../../shared/ipc/contracts';
import { useI18n } from '../../i18n';

interface MatchConfigurationScreenProps {
  api: HostDesktopApi;
  initialPreview: MatchConfigurationPreview;
  onBack: () => void;
  onStarted?: () => void;
}

export function MatchConfigurationScreen({
  api,
  initialPreview,
  onBack,
  onStarted,
}: MatchConfigurationScreenProps) {
  const { t } = useI18n();
  const [preview, setPreview] = useState(initialPreview);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<'reroll' | 'start' | null>(null);
  const inFlight = useRef(false);

  const reroll = async (target: MatchTopicTarget) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      setPreview(await api.rerollConfiguredTopic({ draftId: preview.draftId, target }));
    } catch {
      setError('reroll');
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  const start = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError(null);
    try {
      await api.startConfiguredMatch(preview.draftId);
      onStarted?.();
    } catch {
      setError('start');
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  const topic = (
    value: MatchConfigurationPreview['roundOne'][number],
    target: MatchTopicTarget,
    round: string,
    index?: number,
  ) => (
    <li key={target.round === 'final' ? 'final' : `${target.round}-${target.index}`}>
      <span>{value.name}</span>
      <button
        type="button"
        disabled={pending || !value.canReroll}
        aria-label={target.round === 'final'
          ? t('configure.rerollFinalTopic', { name: value.name })
          : t('configure.rerollTopic', { round, index: index!, name: value.name })}
        onClick={() => void reroll(target)}
      >
        {t('configure.reroll')}
      </button>
    </li>
  );

  return (
    <main className="page-shell configure-match-screen">
      <header className="setup-header">
        <button type="button" disabled={pending} onClick={onBack}>{t('common.back')}</button>
        <h1>{t('configure.title')}</h1>
      </header>
      <p>{t('configure.instructions')}</p>
      <div className="match-topic-rounds">
        <section aria-labelledby="configure-round-one">
          <h2 id="configure-round-one">{t('common.roundOne')}</h2>
          <ol>{preview.roundOne.map((value, index) => topic(
            value,
            { round: 'round-one', index },
            t('common.roundOne'),
            index + 1,
          ))}</ol>
        </section>
        <section aria-labelledby="configure-round-two">
          <h2 id="configure-round-two">{t('common.doubleRound')}</h2>
          <ol>{preview.roundTwo.map((value, index) => topic(
            value,
            { round: 'round-two', index },
            t('common.doubleRound'),
            index + 1,
          ))}</ol>
        </section>
        <section aria-labelledby="configure-final">
          <h2 id="configure-final">{t('configure.final')}</h2>
          <ol>{topic(preview.final, { round: 'final' }, t('configure.final'))}</ol>
        </section>
      </div>
      {error === 'reroll' ? <p role="alert">{t('configure.rerollError')}</p> : null}
      {error === 'start' ? <p role="alert">{t('setup.startFailed')}</p> : null}
      <button className="primary-action" type="button" disabled={pending} onClick={() => void start()}>
        {t('setup.start')}
      </button>
    </main>
  );
}

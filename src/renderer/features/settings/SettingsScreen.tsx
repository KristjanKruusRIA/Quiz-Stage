import { useRef, useState } from 'react';
import type { AudioSettings } from '../../../shared/media/contracts';
import type { AppearanceSettings } from '../../../shared/settings/appearance';
import { useI18n } from '../../i18n';

interface SettingsScreenProps {
  settings: AudioSettings;
  appearance?: AppearanceSettings;
  settingsRevision?: number;
  onSave: (settings: AudioSettings) => Promise<void>;
  onSaveAppearance?: (settings: AppearanceSettings) => Promise<void>;
  onBack: () => void;
}

const volumeFields = [
  ['master', 'settings.master'],
  ['music', 'settings.music'],
  ['effects', 'settings.effects'],
  ['crowd', 'settings.crowd'],
] as const;

export function SettingsScreen({ settings, appearance = { reducedMotion: false }, settingsRevision = 0, onSave, onSaveAppearance, onBack }: SettingsScreenProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState({ current: settings, revision: settingsRevision, dirty: false, pending: null as AudioSettings | null });
  const [error, setError] = useState(false);
  const saveSequence = useRef(0);
  if (draft.revision !== settingsRevision) {
    setDraft(draft.dirty
      ? { ...draft, revision: settingsRevision, pending: settings }
      : { current: settings, revision: settingsRevision, dirty: false, pending: null });
  }
  const current = draft.current;
  const save = (next: AudioSettings) => {
    const sequence = ++saveSequence.current;
    setDraft((value) => ({ ...value, current: next, dirty: true, pending: null }));
    setError(false);
    void onSave(next).then(() => {
      if (sequence !== saveSequence.current) return;
      setDraft((value) => ({ ...value, current: value.pending ?? value.current, dirty: false, pending: null }));
    }, () => {
      if (sequence !== saveSequence.current) return;
      setDraft((value) => ({ ...value, current: value.pending ?? value.current, dirty: false, pending: null }));
      setError(true);
    });
  };
  return <main className="page-shell settings-screen">
    <header><p className="eyebrow">{t('common.productName')}</p><h1>{t('settings.title')}</h1></header>
    <section aria-label={t('settings.audio')}>
      <h2>{t('settings.audio')}</h2>
      {volumeFields.map(([field, label]) => <div key={field}>
        <label htmlFor={`audio-${field}`}>{t(label)}</label>
        <input id={`audio-${field}`} type="range" min="0" max="1" step="0.01" value={current[field]}
          onChange={(event) => save({ ...current, [field]: Number(event.target.value) })} />
        <output>{Math.round(current[field] * 100)}%</output>
      </div>)}
      <label><input type="checkbox" checked={current.muted}
        onChange={(event) => save({ ...current, muted: event.target.checked })} />{t('settings.mute')}</label>
    </section>
    <section aria-label={t('settings.appearance')}>
      <h2>{t('settings.appearance')}</h2>
      <label><input type="checkbox" checked={appearance.reducedMotion}
        onChange={(event) => { void onSaveAppearance?.({ reducedMotion: event.target.checked }); }} />{t('settings.reducedMotion')}</label>
    </section>
    {error ? <p role="alert">{t('settings.saveError')}</p> : null}
    <button type="button" onClick={onBack}>{t('common.back')}</button>
  </main>;
}

export function SettingsStatusScreen({ status, onRetry, onBack }: {
  status: 'loading' | 'error';
  onRetry: () => void;
  onBack: () => void;
}) {
  const { t } = useI18n();
  return <main className="page-shell settings-screen">
    <header><p className="eyebrow">{t('common.productName')}</p><h1>{t('settings.title')}</h1></header>
    {status === 'loading'
      ? <p role="status">{t('settings.loading')}</p>
      : <><p role="alert">{t('settings.loadError')}</p><button type="button" onClick={onRetry}>{t('common.retry')}</button></>}
    <button type="button" onClick={onBack}>{t('common.back')}</button>
  </main>;
}

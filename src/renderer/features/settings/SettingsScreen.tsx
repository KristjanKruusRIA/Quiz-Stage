import { useState } from 'react';
import type { AudioSettings } from '../../../shared/media/contracts';
import { useI18n } from '../../i18n';

interface SettingsScreenProps {
  settings: AudioSettings;
  onSave: (settings: AudioSettings) => Promise<void>;
  onBack: () => void;
}

const volumeFields = [
  ['master', 'settings.master'],
  ['music', 'settings.music'],
  ['effects', 'settings.effects'],
  ['crowd', 'settings.crowd'],
] as const;

export function SettingsScreen({ settings, onSave, onBack }: SettingsScreenProps) {
  const { t } = useI18n();
  const [current, setCurrent] = useState(settings);
  const [error, setError] = useState(false);
  const save = (next: AudioSettings) => {
    setCurrent(next);
    setError(false);
    void onSave(next).catch(() => setError(true));
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
    {error ? <p role="alert">{t('settings.saveError')}</p> : null}
    <button type="button" onClick={onBack}>{t('common.back')}</button>
  </main>;
}

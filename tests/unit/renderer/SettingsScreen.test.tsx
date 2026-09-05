import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../../src/renderer/i18n';
import { SettingsScreen } from '../../../src/renderer/features/settings/SettingsScreen';
import { defaultAudioSettings } from '../../../src/shared/media/contracts';

describe('SettingsScreen', () => {
  it.each([
    ['en' as const, ['Settings', 'Master volume', 'Music volume', 'Effects volume', 'Crowd volume', 'Mute all audio', 'Read English topics and clues aloud']],
    ['et' as const, ['Seaded', 'Põhihelitugevus', 'Muusika helitugevus', 'Efektide helitugevus', 'Publiku helitugevus', 'Vaigista kõik helid', 'Loe ingliskeelsed teemad ja vihjed ette']],
  ])('renders accessible %s labels and saves a changed volume', async (locale, labels) => {
    const save = vi.fn(async () => undefined);
    const saveAppearance = vi.fn(async () => undefined);
    render(<I18nProvider locale={locale}><SettingsScreen settings={defaultAudioSettings} appearance={{ version: 1, reducedMotion: false, revision: 0 }} onSave={save} onSaveAppearance={saveAppearance} onBack={vi.fn()} /></I18nProvider>);
    expect(screen.getByRole('heading', { name: labels[0] })).toBeInTheDocument();
    for (const label of labels.slice(1, 5)) expect(screen.getByRole('slider', { name: label })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: labels[5] })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: labels[6] })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: locale === 'en' ? 'Reduce motion' : 'Vähenda liikumist' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: labels[5] }));
    expect(save).toHaveBeenCalledWith({ ...defaultAudioSettings, muted: true });
    await userEvent.click(screen.getByRole('checkbox', { name: labels[6] }));
    expect(save).toHaveBeenCalledWith({ ...defaultAudioSettings, muted: true, speechEnabled: true });
  });

  it('shows a localized error when appearance settings cannot be saved', async () => {
    render(<I18nProvider locale="en"><SettingsScreen
      settings={defaultAudioSettings}
      appearance={{ version: 1, reducedMotion: false, revision: 0 }}
      onSave={vi.fn(async () => undefined)}
      onSaveAppearance={vi.fn(async () => { throw new Error('write failed'); })}
      onBack={vi.fn()}
    /></I18nProvider>);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Reduce motion' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Settings could not be saved');
  });

  it('refreshes an untouched draft for a newer authoritative revision but preserves an in-progress edit', async () => {
    let finishSave!: () => void;
    const save = vi.fn(() => new Promise<void>((resolve) => { finishSave = resolve; }));
    const { rerender } = render(<I18nProvider locale="en"><SettingsScreen
      settings={defaultAudioSettings} settingsRevision={1} onSave={save} onBack={vi.fn()}
      appearance={{ version: 1, reducedMotion: false, revision: 0 }} onSaveAppearance={vi.fn(async () => undefined)}
    /></I18nProvider>);
    rerender(<I18nProvider locale="en"><SettingsScreen
      settings={{ ...defaultAudioSettings, master: 0.6 }} settingsRevision={2} onSave={save} onBack={vi.fn()}
      appearance={{ version: 1, reducedMotion: false, revision: 0 }} onSaveAppearance={vi.fn(async () => undefined)}
    /></I18nProvider>);
    expect(screen.getByRole('slider', { name: 'Master volume' })).toHaveValue('0.6');

    await userEvent.click(screen.getByRole('checkbox', { name: 'Mute all audio' }));
    rerender(<I18nProvider locale="en"><SettingsScreen
      settings={{ ...defaultAudioSettings, master: 0.3 }} settingsRevision={3} onSave={save} onBack={vi.fn()}
      appearance={{ version: 1, reducedMotion: false, revision: 0 }} onSaveAppearance={vi.fn(async () => undefined)}
    /></I18nProvider>);
    expect(screen.getByRole('slider', { name: 'Master volume' })).toHaveValue('0.6');
    expect(screen.getByRole('checkbox', { name: 'Mute all audio' })).toBeChecked();
    finishSave();
  });
});

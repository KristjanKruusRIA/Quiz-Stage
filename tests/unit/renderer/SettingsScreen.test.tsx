import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '../../../src/renderer/i18n';
import { SettingsScreen } from '../../../src/renderer/features/settings/SettingsScreen';
import { defaultAudioSettings } from '../../../src/shared/media/contracts';

describe('SettingsScreen', () => {
  it.each([
    ['en' as const, ['Settings', 'Master volume', 'Music volume', 'Effects volume', 'Crowd volume', 'Mute all audio']],
    ['et' as const, ['Seaded', 'Põhihelitugevus', 'Muusika helitugevus', 'Efektide helitugevus', 'Publiku helitugevus', 'Vaigista kõik helid']],
  ])('renders accessible %s labels and saves a changed volume', async (locale, labels) => {
    const save = vi.fn(async () => undefined);
    const saveAppearance = vi.fn(async () => undefined);
    render(<I18nProvider locale={locale}><SettingsScreen settings={defaultAudioSettings} appearance={{ reducedMotion: false }} onSave={save} onSaveAppearance={saveAppearance} onBack={vi.fn()} /></I18nProvider>);
    expect(screen.getByRole('heading', { name: labels[0] })).toBeInTheDocument();
    for (const label of labels.slice(1, 5)) expect(screen.getByRole('slider', { name: label })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: labels[5] })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: locale === 'en' ? 'Reduce motion' : 'Vähenda liikumist' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: labels[5] }));
    expect(save).toHaveBeenCalledWith({ ...defaultAudioSettings, muted: true });
  });

  it('refreshes an untouched draft for a newer authoritative revision but preserves an in-progress edit', async () => {
    let finishSave!: () => void;
    const save = vi.fn(() => new Promise<void>((resolve) => { finishSave = resolve; }));
    const { rerender } = render(<I18nProvider locale="en"><SettingsScreen
      settings={defaultAudioSettings} settingsRevision={1} onSave={save} onBack={vi.fn()}
      appearance={{ reducedMotion: false }} onSaveAppearance={vi.fn(async () => undefined)}
    /></I18nProvider>);
    rerender(<I18nProvider locale="en"><SettingsScreen
      settings={{ ...defaultAudioSettings, master: 0.6 }} settingsRevision={2} onSave={save} onBack={vi.fn()}
      appearance={{ reducedMotion: false }} onSaveAppearance={vi.fn(async () => undefined)}
    /></I18nProvider>);
    expect(screen.getByRole('slider', { name: 'Master volume' })).toHaveValue('0.6');

    await userEvent.click(screen.getByRole('checkbox', { name: 'Mute all audio' }));
    rerender(<I18nProvider locale="en"><SettingsScreen
      settings={{ ...defaultAudioSettings, master: 0.3 }} settingsRevision={3} onSave={save} onBack={vi.fn()}
      appearance={{ reducedMotion: false }} onSaveAppearance={vi.fn(async () => undefined)}
    /></I18nProvider>);
    expect(screen.getByRole('slider', { name: 'Master volume' })).toHaveValue('0.6');
    expect(screen.getByRole('checkbox', { name: 'Mute all audio' })).toBeChecked();
    finishSave();
  });
});

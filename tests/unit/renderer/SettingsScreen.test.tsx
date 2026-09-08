import { act, render, screen, waitFor } from '@testing-library/react';
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
    let rejectSave!: (error: Error) => void;
    render(<I18nProvider locale="en"><SettingsScreen
      settings={defaultAudioSettings}
      appearance={{ version: 1, reducedMotion: false, revision: 0 }}
      onSave={vi.fn(async () => undefined)}
      onSaveAppearance={vi.fn(() => new Promise<void>((_resolve, reject) => { rejectSave = reject; }))}
      onBack={vi.fn()}
    /></I18nProvider>);

    const reducedMotion = screen.getByRole('checkbox', { name: 'Reduce motion' });
    await userEvent.click(reducedMotion);
    expect(reducedMotion).toBeChecked();
    expect(reducedMotion).toBeDisabled();
    await act(async () => rejectSave(new Error('write failed')));
    expect(await screen.findByRole('alert')).toHaveTextContent('Settings could not be saved');
    expect(reducedMotion).not.toBeChecked();
    expect(reducedMotion).toBeEnabled();
  });

  it.each(['save-first', 'revision-first'] as const)('updates reduced motion immediately and serializes a %s acknowledgement', async (order) => {
    let finishFirstSave!: () => void;
    const saveAppearance = vi.fn()
      .mockImplementationOnce(() => new Promise<void>((resolve) => { finishFirstSave = resolve; }))
      .mockResolvedValue(undefined);
    const renderScreen = (appearance: { version: 1; reducedMotion: boolean; revision: number }) =>
      <I18nProvider locale="en"><SettingsScreen
        settings={defaultAudioSettings}
        appearance={appearance}
        onSave={vi.fn(async () => undefined)}
        onSaveAppearance={saveAppearance}
        onBack={vi.fn()}
      /></I18nProvider>;
    const { rerender } = render(renderScreen({ version: 1, reducedMotion: false, revision: 0 }));
    const reducedMotion = screen.getByRole('checkbox', { name: 'Reduce motion' });

    await userEvent.click(reducedMotion);
    expect(reducedMotion).toBeChecked();
    expect(reducedMotion).toBeDisabled();
    expect(saveAppearance).toHaveBeenLastCalledWith({ version: 1, reducedMotion: true, revision: 0 });

    if (order === 'save-first') {
      await act(async () => finishFirstSave());
      expect(reducedMotion).toBeDisabled();
      rerender(renderScreen({ version: 1, reducedMotion: true, revision: 1 }));
    } else {
      rerender(renderScreen({ version: 1, reducedMotion: true, revision: 1 }));
      expect(reducedMotion).toBeDisabled();
      await act(async () => finishFirstSave());
    }
    await waitFor(() => expect(reducedMotion).toBeEnabled());
    await userEvent.click(reducedMotion);

    expect(reducedMotion).not.toBeChecked();
    expect(saveAppearance).toHaveBeenLastCalledWith({ version: 1, reducedMotion: false, revision: 1 });
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

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
    render(<I18nProvider locale={locale}><SettingsScreen settings={defaultAudioSettings} onSave={save} onBack={vi.fn()} /></I18nProvider>);
    expect(screen.getByRole('heading', { name: labels[0] })).toBeInTheDocument();
    for (const label of labels.slice(1, 5)) expect(screen.getByRole('slider', { name: label })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: labels[5] })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: labels[5] }));
    expect(save).toHaveBeenCalledWith({ ...defaultAudioSettings, muted: true });
  });
});

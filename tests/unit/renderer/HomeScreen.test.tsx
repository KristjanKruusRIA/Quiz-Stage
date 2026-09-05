import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from '../../../src/renderer/App';
import type { HostDesktopApi } from '../../../src/renderer/api/desktopApi';
import { HomeScreen } from '../../../src/renderer/features/home/HomeScreen';
import { hostView } from './game/fixtures';
import { defaultAudioSettings } from '../../../src/shared/media/contracts';
import { defaultAppearanceSettings } from '../../../src/shared/settings/appearance';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => { resolve = onResolve; reject = onReject; });
  return { promise, resolve, reject };
}

function hostApi(): HostDesktopApi {
  return {
    surface: 'host',
    getSetupOptions: vi.fn(async () => ({
      packs: [{ id: 'pack-one', name: 'Pack One', enabled: true, selectedByDefault: true }],
      automaticDisplayMode: 'single' as const,
    })),
    checkContentAvailability: vi.fn(async () => ({ ok: true as const })),
    startMatch: vi.fn(async () => undefined),
    configureMatch: vi.fn(),
    rerollConfiguredTopic: vi.fn(),
    startConfiguredMatch: vi.fn(),
    dispatch: vi.fn(async () => hostView()),
    hasResumableMatch: vi.fn(async () => false),
    resumeMatch: vi.fn(async () => null),
    listHistory: vi.fn(async () => []),
    getAppearanceSettings: vi.fn(async () => defaultAppearanceSettings),
    updateAppearanceSettings: vi.fn(async (settings) => ({ ...settings, revision: settings.revision + 1 })),
    subscribeToAppearance: vi.fn((listener) => {
      listener(defaultAppearanceSettings);
      return vi.fn();
    }),
  };
}

describe('HomeScreen', () => {
  it('carries the saved speech opt-in from App into a new English match', async () => {
    const api = hostApi();
    api.getAudioSettings = vi.fn(async () => ({ ...defaultAudioSettings, speechEnabled: true }));
    api.updateAudioSettings = vi.fn(async (settings) => settings);
    render(<App api={api} />);

    await userEvent.click(screen.getByRole('button', { name: 'New Match' }));
    const start = await screen.findByRole('button', { name: 'Start match' });
    await userEvent.click(start);

    expect(api.startMatch).toHaveBeenCalledWith(expect.objectContaining({
      language: 'en',
      speechEnabled: true,
    }));
  });

  it('waits for the saved speech preference before offering match setup', async () => {
    const pending = deferred<typeof defaultAudioSettings>();
    const api = hostApi();
    api.getAudioSettings = vi.fn(() => pending.promise);
    render(<App api={api} />);

    await userEvent.click(screen.getByRole('button', { name: 'New Match' }));
    expect(screen.getByRole('status')).toHaveTextContent('Loading audio settings');
    expect(screen.queryByRole('button', { name: 'Start match' })).not.toBeInTheDocument();

    await act(async () => pending.resolve({ ...defaultAudioSettings, speechEnabled: true }));
    await userEvent.click(await screen.findByRole('button', { name: 'Start match' }));
    expect(api.startMatch).toHaveBeenCalledWith(expect.objectContaining({ speechEnabled: true }));
  });

  it('fails open a recovered narrated clue when audio settings cannot be loaded', async () => {
    const api = hostApi();
    api.getAudioSettings = vi.fn(async () => { throw new Error('database unavailable'); });
    api.subscribeToState = vi.fn((listener) => {
      listener(hostView({
        config: { ...hostView().state.config, speechEnabled: true },
        phase: 'ordinary-clue',
        activeClue: {
          clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false,
        },
        timer: {
          durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle', narrationSequence: 7,
        },
      }));
      return vi.fn();
    });

    render(<App api={api} />);

    await waitFor(() => expect(api.dispatch).toHaveBeenCalledWith({
      type: 'StartNarratedClueTimer', clueId: 'round-one-clue-1-2', narrationSequence: 7,
    }));
  });

  it('fails open a recovered narrated clue when audio settings never settle', async () => {
    vi.useFakeTimers();
    try {
      const api = hostApi();
      api.getAudioSettings = vi.fn(() => new Promise<typeof defaultAudioSettings>(() => undefined));
      api.subscribeToState = vi.fn((listener) => {
        listener(hostView({
          config: { ...hostView().state.config, speechEnabled: true },
          phase: 'ordinary-clue',
          activeClue: {
            clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false,
          },
          timer: {
            durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle', narrationSequence: 7,
          },
        }));
        return vi.fn();
      });

      render(<App api={api} />);
      expect(screen.getByRole('status')).toHaveTextContent('Starting match');
      await act(async () => vi.advanceTimersByTime(3_000));
      await act(async () => Promise.resolve());

      expect(api.dispatch).toHaveBeenCalledWith({
        type: 'StartNarratedClueTimer', clueId: 'round-one-clue-1-2', narrationSequence: 7,
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('offers current Home actions including Settings', async () => {
    const onNewMatch = vi.fn();
    const onHistory = vi.fn();
    const onContent = vi.fn();
    const onSettings = vi.fn();
    render(<HomeScreen
      onNewMatch={onNewMatch}
      onResume={vi.fn()}
      onHistory={onHistory}
      onContent={onContent}
      onSettings={onSettings}
      hasResumableMatch={false}
    />);

    await userEvent.click(screen.getByRole('button', { name: 'New Match' }));

    expect(onNewMatch).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'Match History' }));
    expect(onHistory).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'Content Library' }));
    expect(onContent).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Resume Match' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(onSettings).toHaveBeenCalledOnce();
  });

  it('routes the host from Home to Setup and keeps the public surface neutral', async () => {
    const api = hostApi();
    const { rerender } = render(<App api={api} />);
    await userEvent.click(screen.getByRole('button', { name: 'New Match' }));
    expect(await screen.findByRole('heading', { name: 'New Match' })).toBeInTheDocument();

    rerender(<App api={{ surface: 'public', subscribeToState: vi.fn(() => vi.fn()), subscribeToAppearance: vi.fn(() => vi.fn()) }} />);
    expect(screen.getByRole('status')).toHaveTextContent('Waiting for the host');
    expect(screen.queryByRole('button', { name: 'New Match' })).not.toBeInTheDocument();
  });

  it('routes Home to live Settings when the host bridge owns audio settings', async () => {
    const api = hostApi();
    api.getAudioSettings = vi.fn(async () => defaultAudioSettings);
    api.updateAudioSettings = vi.fn(async (settings) => settings);
    render(<App api={api} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Master volume' })).toHaveValue('0.8');
  });

  it('shows localized loading before settings resolve and exposes no editable defaults', async () => {
    const pending = deferred<typeof defaultAudioSettings>();
    const api = hostApi();
    api.getAudioSettings = vi.fn(() => pending.promise);
    api.updateAudioSettings = vi.fn(async (settings) => settings);
    render(<App api={api} />);
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByRole('status')).toHaveTextContent('Loading audio settings');
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    await act(async () => pending.resolve({ ...defaultAudioSettings, muted: true }));
    expect(await screen.findByRole('checkbox', { name: 'Mute all audio' })).toBeChecked();
  });

  it('fails closed on settings load and retries without enabling a default draft', async () => {
    const api = hostApi();
    api.getAudioSettings = vi.fn()
      .mockRejectedValueOnce(new Error('database unavailable'))
      .mockResolvedValueOnce(defaultAudioSettings);
    api.updateAudioSettings = vi.fn(async (settings) => settings);
    render(<App api={api} />);
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Settings could not be loaded');
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('slider', { name: 'Master volume' })).toHaveValue('0.8');
  });

  it('keeps the newest concurrent save authoritative when older responses arrive later', async () => {
    const saves: Array<{ settings: typeof defaultAudioSettings; resolve: (value: typeof defaultAudioSettings) => void }> = [];
    const api = hostApi();
    api.getAudioSettings = vi.fn(async () => defaultAudioSettings);
    api.updateAudioSettings = vi.fn((settings) => new Promise<typeof defaultAudioSettings>((resolve) => saves.push({ settings, resolve })));
    render(<App api={api} />);
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    const mute = await screen.findByRole('checkbox', { name: 'Mute all audio' });
    await userEvent.click(mute);
    await userEvent.click(mute);
    expect(saves).toHaveLength(2);
    await act(async () => saves[1].resolve(saves[1].settings));
    await act(async () => saves[0].resolve(saves[0].settings));
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(await screen.findByRole('checkbox', { name: 'Mute all audio' })).not.toBeChecked();
  });

  it('does not let a delayed appearance retry replace a newer live revision', async () => {
    const pending = deferred<Awaited<ReturnType<NonNullable<HostDesktopApi['getAppearanceSettings']>>>>();
    let appearanceListener: ((settings: typeof defaultAppearanceSettings) => void) | undefined;
    let appearanceError: (() => void) | undefined;
    const api = hostApi();
    api.getAudioSettings = vi.fn(async () => defaultAudioSettings);
    api.updateAudioSettings = vi.fn(async (settings) => settings);
    api.getAppearanceSettings = vi.fn(() => pending.promise);
    api.subscribeToAppearance = vi.fn((listener, onError) => {
      appearanceListener = listener;
      appearanceError = onError;
      return vi.fn();
    });
    render(<App api={api} />);
    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    act(() => appearanceError?.());
    await userEvent.click(await screen.findByRole('button', { name: 'Retry' }));
    act(() => appearanceListener?.({ version: 1, reducedMotion: true, revision: 2 }));
    await act(async () => pending.resolve({ version: 1, reducedMotion: false, revision: 1 }));

    expect(document.documentElement).toHaveAttribute('data-reduced-motion', 'true');
    expect(await screen.findByRole('checkbox', { name: 'Reduce motion' })).toBeChecked();
  });

  it('tracks warning and recovery by sanitized asset key without clearing another warning', async () => {
    let mediaListener: ((event: never) => void) | undefined;
    const api = hostApi();
    api.getAudioSettings = vi.fn(async () => defaultAudioSettings);
    api.updateAudioSettings = vi.fn(async (settings) => settings);
    api.subscribeToMediaWarnings = vi.fn((listener) => { mediaListener = listener as (event: never) => void; return vi.fn(); });
    render(<App api={api} />);
    act(() => {
      mediaListener?.({ status: 'warning', assetKey: 'opening', reason: 'malformed-wav' } as never);
      mediaListener?.({ status: 'warning', assetKey: 'winner', reason: 'unsafe-file' } as never);
    });
    expect(screen.getByRole('alert', { name: /Opening/ })).toBeInTheDocument();
    expect(screen.getByRole('alert', { name: /Winner/ })).toBeInTheDocument();
    act(() => mediaListener?.({ status: 'recovered', assetKey: 'opening' } as never));
    expect(screen.queryByRole('alert', { name: /Opening/ })).not.toBeInTheDocument();
    expect(screen.getByRole('alert', { name: /Winner/ })).toBeInTheDocument();
  });

  it('preserves Estonian setup and generated names after Back and reopen', async () => {
    render(<App api={hostApi()} />);
    await userEvent.click(screen.getByRole('button', { name: 'New Match' }));
    await userEvent.click(await screen.findByRole('radio', { name: 'Estonian' }));
    await userEvent.click(screen.getByRole('button', { name: 'Tagasi' }));
    expect(screen.getByRole('heading', { name: 'Avaleht' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Uus mäng' }));
    expect(await screen.findByRole('textbox', { name: 'Võistkonna 1 nimi' })).toHaveValue('Võistkond 1');
    expect(document.documentElement.lang).toBe('et');
  });

  it('does not show Home when the authoritative host subscription has an active match', async () => {
    const api = hostApi();
    const unsubscribe = vi.fn();
    api.subscribeToState = vi.fn((listener) => {
      listener(hostView());
      return unsubscribe;
    });
    const { unmount } = render(<App api={api} />);

    expect(await screen.findByRole('grid', { name: 'Round One board' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New Match' })).not.toBeInTheDocument();
    unmount();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});

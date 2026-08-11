import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from '../../../src/renderer/App';
import type { HostDesktopApi } from '../../../src/renderer/api/desktopApi';
import { HomeScreen } from '../../../src/renderer/features/home/HomeScreen';
import { hostView } from './game/fixtures';

function hostApi(): HostDesktopApi {
  return {
    surface: 'host',
    getSetupOptions: vi.fn(async () => ({
      packs: [{ id: 'pack-one', name: 'Pack One', enabled: true }],
      automaticDisplayMode: 'single' as const,
    })),
    checkContentAvailability: vi.fn(async () => ({ ok: true as const })),
    startMatch: vi.fn(async () => undefined),
    dispatch: vi.fn(async () => hostView()),
  };
}

describe('HomeScreen', () => {
  it('offers New Match while clearly disabling features owned by later tasks', async () => {
    const onNewMatch = vi.fn();
    render(<HomeScreen onNewMatch={onNewMatch} />);

    await userEvent.click(screen.getByRole('button', { name: 'New Match' }));

    expect(onNewMatch).toHaveBeenCalledOnce();
    for (const name of ['Resume Match', 'Content Library', 'Match History', 'Settings']) {
      expect(screen.getByRole('button', { name })).toBeDisabled();
    }
  });

  it('routes the host from Home to Setup and keeps the public surface neutral', async () => {
    const api = hostApi();
    const { rerender } = render(<App api={api} />);
    await userEvent.click(screen.getByRole('button', { name: 'New Match' }));
    expect(await screen.findByRole('heading', { name: 'New Match' })).toBeInTheDocument();

    rerender(<App api={{ surface: 'public', subscribeToState: vi.fn(() => vi.fn()) }} />);
    expect(screen.getByRole('status')).toHaveTextContent('Waiting for the host');
    expect(screen.queryByRole('button', { name: 'New Match' })).not.toBeInTheDocument();
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

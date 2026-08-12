import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { HostDesktopApi } from '../../../../src/renderer/api/desktopApi';
import { GameSurface } from '../../../../src/renderer/features/game/GameSurface';
import { hostView, publicView } from './fixtures';

function deferred<T>() {
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((_resolve, rejectPromise) => { reject = rejectPromise; });
  return { promise, reject };
}

function api(dispatch: HostDesktopApi['dispatch']): HostDesktopApi {
  return {
    surface: 'host', dispatch,
    getSetupOptions: vi.fn(), checkContentAvailability: vi.fn(), startMatch: vi.fn(),
    hasResumableMatch: vi.fn(), resumeMatch: vi.fn(), listHistory: vi.fn(),
  };
}

describe('GameSurface board selection', () => {
  it('renders a legacy long Unicode team name exactly on host and public scoreboards', () => {
    const legacyName = 'Pärandvõistkond 🧠 — väga pikk nimi 1234567890';
    const view = hostView();
    view.state.config.teams[0].name = legacyName;
    const { rerender } = render(<GameSurface surface="host" view={view} api={api(vi.fn())} />);
    expect(screen.getByText(new RegExp(legacyName), { selector: '.scoreboard li' })).toBeInTheDocument();

    rerender(<GameSurface surface="public" view={publicView({ config: view.state.config })} />);
    expect(screen.getByText(new RegExp(legacyName), { selector: '.scoreboard li' })).toBeInTheDocument();
  });

  it('synchronously prevents duplicate selection while the authoritative dispatch is pending', () => {
    const pending = deferred<Awaited<ReturnType<HostDesktopApi['dispatch']>>>();
    const dispatch = vi.fn(() => pending.promise);
    render(<GameSurface surface="host" view={hostView()} api={api(dispatch)} />);
    const tile = screen.getByRole('button', { name: 'Category 1 for 200' });

    fireEvent.click(tile);
    fireEvent.click(tile);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(tile).toBeDisabled();
  });

  it('handles a rejected selection, reports it accessibly, and re-enables the board', async () => {
    const pending = deferred<Awaited<ReturnType<HostDesktopApi['dispatch']>>>();
    const dispatch = vi.fn(() => pending.promise);
    render(<GameSurface surface="host" view={hostView()} api={api(dispatch)} />);
    const tile = screen.getByRole('button', { name: 'Category 1 for 200' });
    fireEvent.click(tile);

    await act(async () => { pending.reject(new Error('stale renderer state')); });

    expect(screen.getByRole('alert')).toHaveTextContent('The clue could not be selected.');
    expect(tile).toBeEnabled();
  });

  it('ignores a stale rejection after a newer authoritative view arrives', async () => {
    const pending = deferred<Awaited<ReturnType<HostDesktopApi['dispatch']>>>();
    const dispatch = vi.fn(() => pending.promise);
    const { rerender } = render(<GameSurface surface="host" view={hostView()} api={api(dispatch)} />);
    fireEvent.click(screen.getByRole('button', { name: 'Category 1 for 200' }));

    rerender(<GameSurface surface="host" view={hostView({ eventSequence: 1 })} api={api(dispatch)} />);
    await act(async () => { pending.reject(new Error('old request rejected')); });

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Category 1 for 200' })).toBeEnabled();
  });
});

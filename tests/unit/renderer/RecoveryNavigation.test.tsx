import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import App from '../../../src/renderer/App';
import type { HostDesktopApi } from '../../../src/renderer/api/desktopApi';
import { hostView } from './game/fixtures';

function recoveryApi(hasResumableMatch = true) {
  return {
    surface: 'host' as const,
    getSetupOptions: vi.fn(),
    checkContentAvailability: vi.fn(),
    startMatch: vi.fn(),
    dispatch: vi.fn(),
    hasResumableMatch: vi.fn(async () => hasResumableMatch),
    resumeMatch: vi.fn(async () => hostView()),
    listHistory: vi.fn(async () => []),
    subscribeToState: vi.fn(() => vi.fn()),
  } as unknown as HostDesktopApi;
}

describe('Task 11 host navigation', () => {
  it('enables Resume only after a current resumable summary and routes the returned view into the game', async () => {
    const api = recoveryApi();
    render(<App api={api} />);

    const resume = screen.getByRole('button', { name: 'Resume Match' });
    expect(resume).toBeDisabled();
    await vi.waitFor(() => expect(resume).toBeEnabled());
    await userEvent.click(resume);

    expect(await screen.findByRole('grid', { name: 'Round One board' })).toBeInTheDocument();
    expect((api as never as { resumeMatch: ReturnType<typeof vi.fn> }).resumeMatch).toHaveBeenCalledOnce();
  });

  it('does not let a stale Resume result replace newer host navigation', async () => {
    let resolveResume!: (view: ReturnType<typeof hostView>) => void;
    const api = recoveryApi();
    (api as never as { resumeMatch: ReturnType<typeof vi.fn> }).resumeMatch = vi.fn(() => new Promise((resolve) => {
      resolveResume = resolve;
    }));
    render(<App api={api} />);
    const resume = screen.getByRole('button', { name: 'Resume Match' });
    await vi.waitFor(() => expect(resume).toBeEnabled());

    await userEvent.click(resume);
    await userEvent.click(screen.getByRole('button', { name: 'Match History' }));
    resolveResume(hostView());

    expect(await screen.findByRole('heading', { name: 'Match History' })).toBeInTheDocument();
    expect(screen.queryByRole('grid', { name: 'Round One board' })).not.toBeInTheDocument();
  });

  it('keeps Resume disabled when no incomplete autosave exists and opens an empty History screen', async () => {
    const api = recoveryApi(false);
    render(<App api={api} />);

    await vi.waitFor(() => expect(
      (api as never as { hasResumableMatch: ReturnType<typeof vi.fn> }).hasResumableMatch,
    ).toHaveBeenCalledOnce());
    expect(screen.getByRole('button', { name: 'Resume Match' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Match History' }));

    expect(await screen.findByRole('heading', { name: 'Match History' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No matches have been saved yet.');
  });
});

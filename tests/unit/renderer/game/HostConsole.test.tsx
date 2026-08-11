import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { HostDesktopApi } from '../../../../src/renderer/api/desktopApi';
import { HostConsole } from '../../../../src/renderer/features/game/HostConsole';
import { hostView } from './fixtures';

function api(): HostDesktopApi {
  return {
    surface: 'host', dispatch: vi.fn(async () => hostView()),
    getSetupOptions: vi.fn(), checkContentAvailability: vi.fn(), startMatch: vi.fn(),
  };
}

describe('HostConsole', () => {
  it('shows private answer context and dispatches a valid incorrect judgment intent', async () => {
    const desktopApi = api();
    const view = hostView({
      phase: 'ordinary-clue',
      activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: 'team-1', responseRevealed: false },
      timer: { durationMs: 15_000, remainingMs: 9_000, startedAt: null, status: 'paused' },
    });
    render(<HostConsole view={view} api={desktopApi} now={() => 4_000} />);
    expect(screen.getByText('Response 1-2')).toBeInTheDocument();
    expect(screen.getByText('Source 1-2')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Incorrect' }));
    expect(desktopApi.dispatch).toHaveBeenCalledWith({ type: 'JudgeResponse', correct: false, at: 4_000 });
  });

  it('keeps eligible nonlocked teams available after an incorrect response', () => {
    render(<HostConsole view={hostView({
      phase: 'ordinary-clue',
      activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: ['team-1'], lockedTeamId: null, responseRevealed: false },
      timer: { durationMs: 15_000, remainingMs: 9_000, startedAt: 4_000, status: 'running' },
    })} api={api()} />);
    expect(screen.getByRole('button', { name: 'Lock Alpha' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Lock Beta' })).toBeEnabled();
  });

  it('prevalidates the authoritative Daily Double wager range', async () => {
    const desktopApi = api();
    const user = userEvent.setup();
    render(<HostConsole view={hostView({
      phase: 'daily-double-wager', controllingTeamId: 'team-1', scores: { 'team-1': 1200, 'team-2': 800 },
      activeClue: { clueId: 'round-one-clue-1-1', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
    })} api={desktopApi} />);
    const wager = screen.getByRole('spinbutton', { name: 'Daily Double wager' });
    expect(wager).toHaveAttribute('min', '5');
    expect(wager).toHaveAttribute('max', '1200');
    await user.clear(wager); await user.type(wager, '1201');
    expect(screen.getByRole('button', { name: 'Commit wager' })).toBeDisabled();
    await user.clear(wager); await user.type(wager, '1200');
    await user.click(screen.getByRole('button', { name: 'Commit wager' }));
    expect(desktopApi.dispatch).toHaveBeenCalledWith({ type: 'SubmitDailyDoubleWager', wager: 1200 });
  });
});

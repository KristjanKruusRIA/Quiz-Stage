import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { HostDesktopApi } from '../../../../src/renderer/api/desktopApi';
import { HostConsole } from '../../../../src/renderer/features/game/HostConsole';
import { hostView } from './fixtures';

function api(): HostDesktopApi {
  return {
    surface: 'host', dispatch: vi.fn(async () => hostView()),
    getSetupOptions: vi.fn(), checkContentAvailability: vi.fn(), startMatch: vi.fn(),
    hasResumableMatch: vi.fn(), resumeMatch: vi.fn(), listHistory: vi.fn(),
  };
}

function deferred<T>() {
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((_resolve, rejectPromise) => { reject = rejectPromise; });
  return { promise, reject };
}

describe('HostConsole', () => {
  it('offers an explicit save-and-quit action for an incomplete match', async () => {
    const onSaveAndQuit = vi.fn(async () => undefined);
    render(<HostConsole view={hostView()} api={api()} onSaveAndQuit={onSaveAndQuit} />);

    await userEvent.click(screen.getByRole('button', { name: 'Save match and quit' }));

    expect(onSaveAndQuit).toHaveBeenCalledOnce();
  });

  it('dispatches validated current-match score, report, and confirmed incomplete-match intents', async () => {
    const desktopApi = api();
    const user = userEvent.setup();
    render(<HostConsole view={hostView({
      phase: 'ordinary-clue',
      activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
    })} api={desktopApi} />);

    await user.clear(screen.getByRole('spinbutton', { name: 'Score for Alpha' }));
    await user.type(screen.getByRole('spinbutton', { name: 'Score for Alpha' }), '1400');
    await user.type(screen.getByRole('textbox', { name: 'Score adjustment reason' }), 'Host correction');
    await user.click(screen.getByRole('button', { name: 'Set Alpha score' }));
    expect(desktopApi.dispatch).toHaveBeenCalledWith({ type: 'AdjustScore', teamId: 'team-1', score: 1400, reason: 'Host correction' });

    await user.type(screen.getByRole('textbox', { name: 'Clue report reason' }), 'Ambiguous wording');
    await user.click(screen.getByRole('button', { name: 'Report current clue' }));
    expect(desktopApi.dispatch).toHaveBeenCalledWith({ type: 'ReportClue', clueId: 'round-one-clue-1-2', reason: 'Ambiguous wording' });

    expect(screen.getByRole('button', { name: 'End match incomplete' })).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: 'I understand this ends the current match' }));
    await user.click(screen.getByRole('button', { name: 'End match incomplete' }));
    expect(desktopApi.dispatch).toHaveBeenCalledWith({ type: 'EndIncompleteMatch' });
  });

  it('permits only one in-flight host intent and shows a safe localized rejection', async () => {
    const pending = deferred<Awaited<ReturnType<HostDesktopApi['dispatch']>>>();
    const desktopApi = api();
    desktopApi.dispatch = vi.fn(() => pending.promise);
    const user = userEvent.setup();
    render(<HostConsole view={hostView({ config: { ...hostView().state.config, language: 'et' } })} api={desktopApi} />);
    await user.type(screen.getByRole('textbox', { name: 'Punktiparanduse põhjus' }), 'Parandus');
    await user.click(screen.getByRole('button', { name: 'Määra võistkonna Alpha punktid' }));

    expect(screen.getByRole('button', { name: 'Määra võistkonna Beta punktid' })).toBeDisabled();
    expect(desktopApi.dispatch).toHaveBeenCalledTimes(1);
    await act(async () => { pending.reject(new Error('SECRET_DISK_DETAIL')); });
    expect(screen.getByRole('alert')).toHaveTextContent('Seda toimingut ei saanud');
    expect(screen.getByRole('alert')).not.toHaveTextContent('SECRET_DISK_DETAIL');
  });

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

  it('continues an authoritative clue reveal from the button and R shortcut', async () => {
    const desktopApi = api();
    render(<HostConsole view={hostView({
      phase: 'clue-reveal',
      activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: true },
    })} api={desktopApi} />);
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(desktopApi.dispatch).toHaveBeenLastCalledWith({ type: 'AdvanceAfterReveal' });
    vi.mocked(desktopApi.dispatch).mockClear();
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    await vi.waitFor(() => expect(desktopApi.dispatch).toHaveBeenCalledWith({ type: 'AdvanceAfterReveal' }));
  });

  it('uses R to reveal a hidden ordinary response before Continue is legal', async () => {
    const desktopApi = api();
    render(<HostConsole view={hostView({
      phase: 'ordinary-clue',
      activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
    })} api={desktopApi} />);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    await vi.waitFor(() => expect(desktopApi.dispatch).toHaveBeenCalledWith({ type: 'RevealResponse' }));
    expect(desktopApi.dispatch).not.toHaveBeenCalledWith({ type: 'AdvanceAfterReveal' });
  });

  it('refreshes score correction defaults from authoritative rerenders and hides recovery controls when complete', async () => {
    const desktopApi = api();
    const user = userEvent.setup();
    const { rerender } = render(<HostConsole view={hostView()} api={desktopApi} />);
    await user.type(screen.getByRole('textbox', { name: 'Score adjustment reason' }), 'Current correction');
    await user.clear(screen.getByRole('spinbutton', { name: 'Score for Beta' }));
    await user.type(screen.getByRole('spinbutton', { name: 'Score for Beta' }), '900');
    rerender(<HostConsole view={hostView({ scores: { 'team-1': 1800, 'team-2': 800 } })} api={desktopApi} />);
    expect(screen.getByRole('spinbutton', { name: 'Score for Alpha' })).toHaveValue(1800);
    expect(screen.getByRole('spinbutton', { name: 'Score for Beta' })).toHaveValue(900);
    expect(screen.getByRole('textbox', { name: 'Score adjustment reason' })).toHaveValue('Current correction');
    await user.click(screen.getByRole('button', { name: 'Set Alpha score' }));
    expect(desktopApi.dispatch).toHaveBeenCalledWith({
      type: 'AdjustScore', teamId: 'team-1', score: 1800, reason: 'Current correction',
    });

    rerender(<HostConsole view={hostView({ phase: 'complete', endedIncomplete: true })} api={desktopApi} />);
    expect(screen.queryByRole('region', { name: 'Current match corrections' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reopen clue' })).not.toBeInTheDocument();
  });

  it.each(['final-category', 'final-wagers', 'final-clue', 'final-reveal', 'complete'] as const)(
    'does not offer clue reporting during %s',
    (phase) => {
      const finalActive = phase === 'final-clue' || phase === 'final-reveal'
        ? { clueId: 'final-clue', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: phase === 'final-reveal' }
        : null;
      render(<HostConsole view={hostView({ phase, activeClue: finalActive })} api={api()} />);
      expect(screen.queryByRole('textbox', { name: 'Clue report reason' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Report current clue' })).not.toBeInTheDocument();
    },
  );
});

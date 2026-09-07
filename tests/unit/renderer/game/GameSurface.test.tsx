import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { HostDesktopApi } from '../../../../src/renderer/api/desktopApi';
import { GameSurface } from '../../../../src/renderer/features/game/GameSurface';
import { gameState, hostView, publicView } from './fixtures';

afterEach(() => vi.unstubAllGlobals());

function deferred<T>() {
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((_resolve, rejectPromise) => { reject = rejectPromise; });
  return { promise, reject };
}

function api(dispatch: HostDesktopApi['dispatch']): HostDesktopApi {
  return {
    surface: 'host', dispatch,
    getSetupOptions: vi.fn(), checkContentAvailability: vi.fn(), startMatch: vi.fn(),
    configureMatch: vi.fn(), rerollConfiguredTopic: vi.fn(), startConfiguredMatch: vi.fn(),
    hasResumableMatch: vi.fn(), resumeMatch: vi.fn(), listHistory: vi.fn(),
  };
}

describe('GameSurface board selection', () => {
  it('owns English clue narration on the host and starts the fair timer when speech ends', async () => {
    const utterances: Array<{ text: string; lang: string; voice: unknown; onend?: () => void }> = [];
    vi.stubGlobal('speechSynthesis', {
      speak: vi.fn((utterance) => utterances.push(utterance)),
      cancel: vi.fn(),
      getVoices: vi.fn(() => [{ name: 'Local English', lang: 'en-US', localService: true }]),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      lang = '';
      voice = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(readonly text: string) {}
    });
    const dispatch = vi.fn(async () => hostView());
    const state = {
      config: { ...gameState().config, speechEnabled: true },
      phase: 'ordinary-clue' as const,
      activeClue: {
        clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false,
      },
      timer: {
        durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle' as const, narrationSequence: 7,
      },
    };

    render(<GameSurface surface="host" view={hostView(state)} api={api(dispatch)} audioSettings={{
      master: 1, music: 1, effects: 1, crowd: 1, muted: false, speechEnabled: true,
    }} />);

    await waitFor(() => expect(utterances).toHaveLength(1));
    expect(utterances[0]?.text).toBe('Prompt 1-2');
    expect(utterances[0]?.text).not.toContain('Response 1-2');
    expect(dispatch).not.toHaveBeenCalled();
    utterances[0]?.onend?.();
    await waitFor(() => expect(dispatch).toHaveBeenCalledWith({
      type: 'StartNarratedClueTimer', clueId: 'round-one-clue-1-2', narrationSequence: 7,
    }));
  });

  it('shows the player opening logo for three seconds, then reveals categories one at a time', () => {
    vi.useFakeTimers();
    try {
      render(<GameSurface surface="public" view={publicView()} reducedMotion={false} presentation="round-intro" />);

      expect(screen.getByRole('img', { name: 'Quiz Stage' })).toBeInTheDocument();
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();

      act(() => { vi.advanceTimersByTime(2_999); });
      expect(screen.getByRole('img', { name: 'Quiz Stage' })).toBeInTheDocument();

      act(() => { vi.advanceTimersByTime(1); });
      expect(screen.getByRole('grid', { name: 'Round One board' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Category 1' })).toBeInTheDocument();
      expect(screen.queryByRole('columnheader', { name: 'Category 2' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Category 2 for 200' })).not.toBeInTheDocument();

      act(() => { vi.advanceTimersByTime(349); });
      expect(screen.queryByRole('columnheader', { name: 'Category 2' })).not.toBeInTheDocument();

      act(() => { vi.advanceTimersByTime(1); });
      expect(screen.getByRole('columnheader', { name: 'Category 2' })).toBeInTheDocument();

      for (let index = 0; index < 4; index += 1) {
        act(() => { vi.advanceTimersByTime(350); });
      }
      expect(screen.getByRole('columnheader', { name: 'Category 6' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows a three-second Double Round title before revealing its categories', () => {
    vi.useFakeTimers();
    try {
      const roundOneClues = gameState().boards[0].categories.flatMap((category) => category.clues.map((clue) => clue.id));
      const { rerender } = render(<GameSurface surface="public" view={publicView({
        usedClueIds: ['round-one-clue-1-1'],
      })} reducedMotion={false} />);

      rerender(<GameSurface surface="public" view={publicView({
        phase: 'round-two-board', usedClueIds: roundOneClues,
      })} reducedMotion={false} presentation="round-intro" />);

      expect(screen.getByRole('heading', { level: 1, name: 'Double Round' })).toBeInTheDocument();
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();

      act(() => { vi.advanceTimersByTime(2_999); });
      expect(screen.getByRole('heading', { level: 1, name: 'Double Round' })).toBeInTheDocument();

      act(() => { vi.advanceTimersByTime(1); });
      expect(screen.getByRole('grid', { name: 'Double Round board' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Category 1' })).toBeInTheDocument();
      expect(screen.queryByRole('columnheader', { name: 'Category 2' })).not.toBeInTheDocument();

      for (let index = 0; index < 5; index += 1) {
        act(() => { vi.advanceTimersByTime(350); });
      }
      expect(screen.getByRole('columnheader', { name: 'Category 6' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows every category immediately for the host and recovery', () => {
    const host = render(<GameSurface surface="host" view={hostView()} api={api(vi.fn())} />);
    expect(screen.getByRole('columnheader', { name: 'Category 6' })).toBeInTheDocument();
    host.rerender(<GameSurface surface="host" view={hostView({ phase: 'round-two-board' })} api={api(vi.fn())} />);
    expect(screen.getByRole('grid', { name: 'Double Round board' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Category 6' })).toBeInTheDocument();
    host.unmount();

    const recovery = render(<GameSurface surface="public" view={publicView({
      usedClueIds: ['round-one-clue-1-1'],
    })} reducedMotion={false} />);
    expect(screen.getByRole('grid', { name: 'Round One board' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Category 6' })).toBeInTheDocument();
    recovery.unmount();
  });

  it('preserves the player intro and staggered topics with reduced motion', () => {
    vi.useFakeTimers();
    try {
      render(<GameSurface surface="public" view={publicView()} reducedMotion presentation="round-intro" />);

      expect(screen.getByRole('img', { name: 'Quiz Stage' })).toBeInTheDocument();
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();

      act(() => { vi.advanceTimersByTime(3_000); });
      expect(screen.getByRole('columnheader', { name: 'Category 1' })).toBeInTheDocument();
      expect(screen.queryByRole('columnheader', { name: 'Category 2' })).not.toBeInTheDocument();

      act(() => { vi.advanceTimersByTime(350); });
      expect(screen.getByRole('columnheader', { name: 'Category 2' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('abandons an unfinished board presentation for a clue and does not replay it after undo', () => {
    vi.useFakeTimers();
    try {
      const activeClue = {
        clueId: 'round-one-clue-1-1', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false,
      };
      const { rerender } = render(<GameSurface surface="public" view={publicView()} reducedMotion={false} presentation="round-intro" />);
      act(() => { vi.advanceTimersByTime(1_000); });

      rerender(<GameSurface surface="public" view={publicView({
        phase: 'ordinary-clue', activeClue,
      })} reducedMotion={false} />);
      expect(screen.getByText('Prompt 1-1')).toBeInTheDocument();

      rerender(<GameSurface surface="public" view={publicView({
        activeClue: null,
      })} reducedMotion={false} />);
      expect(screen.queryByRole('img', { name: 'Quiz Stage' })).not.toBeInTheDocument();
      expect(screen.getByRole('grid', { name: 'Round One board' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Category 6' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not replay the Double Round presentation after undoing its first clue', () => {
    vi.useFakeTimers();
    try {
      const roundOneClues = gameState().boards[0].categories.flatMap((category) => category.clues.map((clue) => clue.id));
      const roundTwoBoard = publicView({ phase: 'round-two-board', usedClueIds: roundOneClues });
      const { rerender } = render(<GameSurface surface="public" view={roundTwoBoard}
        reducedMotion={false} presentation="round-intro" />);
      act(() => { vi.advanceTimersByTime(1_000); });

      rerender(<GameSurface surface="public" view={publicView({
        phase: 'ordinary-clue', usedClueIds: roundOneClues,
        activeClue: {
          clueId: 'round-two-clue-1-1', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false,
        },
      })} reducedMotion={false} presentation={null} />);

      rerender(<GameSurface surface="public" view={roundTwoBoard} reducedMotion={false} presentation={null} />);
      expect(screen.queryByRole('heading', { level: 1, name: 'Double Round' })).not.toBeInTheDocument();
      expect(screen.getByRole('grid', { name: 'Double Round board' })).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: 'Category 6' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows a Daily Double title only on the public surface while the host enters the wager', () => {
    const state = {
      phase: 'daily-double-wager' as const,
      activeClue: {
        clueId: 'round-one-clue-1-1', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false,
      },
    };
    const { rerender } = render(<GameSurface surface="public" view={publicView(state)} />);

    expect(screen.getByRole('heading', { name: 'Daily Double' })).toBeInTheDocument();
    expect(screen.queryByText('Waiting for wager')).not.toBeInTheDocument();

    rerender(<GameSurface surface="host" view={hostView(state)} api={api(vi.fn())} />);

    expect(screen.queryByRole('heading', { name: 'Daily Double' })).not.toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Daily Double wager' })).toBeInTheDocument();
  });

  it('automatically advances the public Final title to its category without delaying the host', () => {
    vi.useFakeTimers();
    try {
      const state = { phase: 'final-category' as const, finalEligibleTeamIds: ['team-1', 'team-2'] };
      const { rerender } = render(<GameSurface surface="public" view={publicView(state)}
        reducedMotion={false} presentation="final-intro" />);

      expect(screen.getByRole('heading', { level: 1, name: 'Final' })).toBeInTheDocument();
      expect(screen.queryByText('World History')).not.toBeInTheDocument();

      act(() => { vi.advanceTimersByTime(2_499); });
      expect(screen.getByRole('heading', { level: 1, name: 'Final' })).toBeInTheDocument();
      expect(screen.queryByText('World History')).not.toBeInTheDocument();

      act(() => { vi.advanceTimersByTime(1); });
      expect(screen.getByRole('heading', { name: 'Final category' })).toBeInTheDocument();
      expect(screen.getByText('World History')).toBeInTheDocument();

      rerender(<GameSurface surface="host" view={hostView(state)} api={api(vi.fn())} />);
      expect(screen.queryByRole('heading', { level: 1, name: 'Final' })).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Final category' })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('preserves the timed Final title when the player display uses reduced motion', () => {
    vi.useFakeTimers();
    try {
      render(<GameSurface surface="public" view={publicView({
        phase: 'final-category', finalEligibleTeamIds: ['team-1', 'team-2'],
      })} reducedMotion presentation="final-intro" />);

      expect(screen.getByRole('heading', { level: 1, name: 'Final' })).toBeInTheDocument();
      expect(screen.queryByText('World History')).not.toBeInTheDocument();

      act(() => { vi.advanceTimersByTime(2_500); });
      expect(screen.getByRole('heading', { name: 'Final category' })).toBeInTheDocument();
      expect(screen.getByText('World History')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not replay the Final title when a player display recovers during wagers', () => {
    render(<GameSurface surface="public" view={publicView({
      phase: 'final-wagers', finalEligibleTeamIds: ['team-1', 'team-2'],
      config: { ...gameState().config, displayMode: 'dual' },
    })} reducedMotion={false} presentation={null} />);

    expect(screen.queryByRole('heading', { level: 1, name: 'Final' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Final category' })).toBeInTheDocument();
    expect(screen.getByText('World History')).toBeInTheDocument();
  });

  it('renders a legacy long Unicode team name exactly on host and public scoreboards', () => {
    const legacyName = 'Pärandvõistkond 🧠 — väga pikk nimi 1234567890';
    const view = hostView();
    view.state.config.teams[0].name = legacyName;
    const { rerender } = render(<GameSurface surface="host" view={view} api={api(vi.fn())} />);
    expect(screen.getByText(new RegExp(legacyName), { selector: '.scoreboard li' })).toBeInTheDocument();

    rerender(<GameSurface surface="public" view={publicView({ config: view.state.config })} reducedMotion />);
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

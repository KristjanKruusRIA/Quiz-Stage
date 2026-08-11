import { act, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PublicClue } from '../../../../src/renderer/features/game/PublicClue';
import { publicView } from './fixtures';

describe('PublicClue', () => {
  it('derives a nonnegative display from authoritative running timestamps without mutating them', () => {
    vi.useFakeTimers();
    let now = 4_000;
    const view = publicView({
      phase: 'ordinary-clue',
      activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
      timer: { durationMs: 15_000, remainingMs: 12_000, startedAt: 1_000, status: 'running' },
    });
    render(<PublicClue view={view} now={() => now} />);
    expect(screen.getByRole('timer')).toHaveTextContent('9');
    now = 30_000;
    act(() => vi.advanceTimersByTime(250));
    expect(screen.getByRole('timer')).toHaveTextContent('0');
    expect(view.timer).toEqual({ durationMs: 15_000, remainingMs: 12_000, startedAt: 1_000, status: 'running' });
    vi.useRealTimers();
  });

  it('reflects pause and reset projections exactly', () => {
    const paused = publicView({
      phase: 'ordinary-clue',
      activeClue: { clueId: 'round-one-clue-1-2', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
      timer: { durationMs: 15_000, remainingMs: 7_000, startedAt: null, status: 'paused' },
    });
    const { rerender } = render(<PublicClue view={paused} />);
    expect(screen.getByRole('timer')).toHaveTextContent('7');
    rerender(<PublicClue view={{ ...paused, timer: { durationMs: 15_000, remainingMs: 15_000, startedAt: 5_000, status: 'running' } }} now={() => 5_000} />);
    expect(screen.getByRole('timer')).toHaveTextContent('15');
  });
});

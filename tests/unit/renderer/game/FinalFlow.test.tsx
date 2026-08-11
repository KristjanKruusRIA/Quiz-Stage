import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PublicFinal } from '../../../../src/renderer/features/game/PublicFinal';
import { publicView } from './fixtures';

describe('Public Final flow', () => {
  it('shows category, neutral single-screen wager waiting, and the fixed clue timer', () => {
    const category = publicView({ phase: 'final-category', finalEligibleTeamIds: ['team-1', 'team-2'] });
    const { rerender } = render(<PublicFinal view={category} />);
    expect(screen.getByRole('heading', { name: 'Final category' })).toBeInTheDocument();
    expect(screen.getByText('World History')).toBeInTheDocument();

    rerender(<PublicFinal view={publicView({ phase: 'final-wagers', finalEligibleTeamIds: ['team-1', 'team-2'] })} />);
    expect(screen.getByRole('status')).toHaveTextContent('Waiting for Final wagers');
    expect(screen.queryByText('1200')).not.toBeInTheDocument();

    rerender(<PublicFinal view={publicView({
      phase: 'final-clue', finalEligibleTeamIds: ['team-1', 'team-2'], finalWagers: { 'team-1': 400, 'team-2': 200 },
      activeClue: { clueId: 'final-clue', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: false },
      timer: { durationMs: 30_000, remainingMs: 30_000, startedAt: 2_000, status: 'running' },
    })} now={() => 2_000} />);
    expect(screen.getByText('Final prompt')).toBeInTheDocument();
    expect(screen.getByRole('timer')).toHaveTextContent('30');
  });

  it('renders only authoritative reveals in their public order and then the winner', () => {
    const revealed = publicView({
      phase: 'final-reveal', finalEligibleTeamIds: ['team-1', 'team-2'],
      finalWagers: { 'team-1': 400, 'team-2': 200 }, finalRevealOrder: ['team-2', 'team-1'],
      finalRevealedTeamIds: ['team-2'], finalJudgments: { 'team-2': false },
      activeClue: { clueId: 'final-clue', lockedOutTeamIds: [], lockedTeamId: null, responseRevealed: true },
    });
    const { rerender } = render(<PublicFinal view={revealed} />);
    expect(screen.getByText('Beta wagered 200 — Incorrect')).toBeInTheDocument();
    expect(screen.getByText('Final response')).toBeInTheDocument();
    expect(screen.queryByText(/Alpha wagered/)).not.toBeInTheDocument();
    rerender(<PublicFinal view={publicView({ phase: 'complete', winnerTeamId: 'team-1' })} />);
    expect(screen.getByRole('heading', { name: 'Alpha wins' })).toBeInTheDocument();
  });
});

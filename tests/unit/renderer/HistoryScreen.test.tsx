import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { HistoryScreen } from '../../../src/renderer/features/history/HistoryScreen';
import { RecoveryNotice } from '../../../src/renderer/features/history/RecoveryNotice';

const history = [{
  id: 'match-1',
  startedAt: Date.UTC(2026, 7, 11, 18, 0),
  completedAt: Date.UTC(2026, 7, 11, 18, 42),
  durationMs: 42 * 60 * 1000,
  completionState: 'incomplete' as const,
  language: 'et' as const,
  difficulty: 'hard' as const,
  packIds: ['history-pack', 'science-pack'],
  seed: 'durable-seed-42',
  teams: [
    { id: 'team-1', name: 'Alpha', color: '#E3B341' },
    { id: 'team-2', name: 'Beta', color: '#50A7F5' },
  ],
  standings: [
    { teamId: 'team-2', name: 'Beta', color: '#50A7F5', score: 2_400, rank: 1 },
    { teamId: 'team-1', name: 'Alpha', color: '#E3B341', score: 1_200, rank: 2 },
  ],
  winnerTeamId: null,
}];

describe('HistoryScreen', () => {
  it('renders read-only match facts and standings without clue or private answer fields', async () => {
    const onBack = vi.fn();
    render(<HistoryScreen entries={history} onBack={onBack} />);

    expect(screen.getByRole('heading', { name: 'Match History' })).toBeInTheDocument();
    expect(screen.getByText('Incomplete')).toBeInTheDocument();
    expect(screen.getByText(/Estonian/i)).toBeInTheDocument();
    expect(screen.getByText(/Hard/i)).toBeInTheDocument();
    expect(screen.getByText(/42 minutes/i)).toBeInTheDocument();
    expect(screen.getByText(/history-pack, science-pack/i)).toBeInTheDocument();
    expect(screen.getByText(/durable-seed-42/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. Beta — 2,400/)).toBeInTheDocument();
    expect(screen.getByText(/2\. Alpha — 1,200/)).toBeInTheDocument();
    expect(screen.queryByText(/prompt|response|answer/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('renders accessible empty and error states', () => {
    const { rerender } = render(<HistoryScreen entries={[]} onBack={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('No matches have been saved yet.');

    rerender(<HistoryScreen entries={[]} onBack={vi.fn()} error />);
    expect(screen.getByRole('alert')).toHaveTextContent('Match history could not be loaded.');
  });
});

describe('RecoveryNotice', () => {
  it('reports only safe recovery sequence metadata', () => {
    render(<RecoveryNotice recoveredFromSnapshotSequence={4} skippedInvalidSnapshotSequences={[6, 5]} replayIssue={{ sequence: 9, reason: 'invalid-event' }} />);

    const notice = screen.getByRole('status');
    expect(notice).toHaveTextContent('snapshot 4');
    expect(notice).toHaveTextContent('snapshots 6, 5');
    expect(notice).toHaveTextContent('event 9');
    expect(notice.textContent).not.toMatch(/clue|prompt|response|source|answer/i);
  });
});

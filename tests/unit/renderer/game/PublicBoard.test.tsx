import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PublicBoard } from '../../../../src/renderer/features/game/PublicBoard';
import { publicView } from './fixtures';

describe('PublicBoard', () => {
  it('renders an accessible six-column, five-row board without answers', () => {
    render(<PublicBoard view={publicView()} />);
    const board = screen.getByRole('grid', { name: 'Round One board' });
    expect(within(board).getAllByRole('columnheader')).toHaveLength(6);
    expect(within(board).getAllByRole('gridcell')).toHaveLength(30);
    expect(screen.getByText('Category 1')).toBeInTheDocument();
    expect(screen.getAllByText('200')).toHaveLength(6);
    expect(screen.queryByText('Response 1-1')).not.toBeInTheDocument();
  });

  it('disables used tiles and sends only a selectable tile id', async () => {
    const onSelect = vi.fn();
    const view = publicView({ usedClueIds: ['round-one-clue-1-1'] });
    render(<PublicBoard view={view} onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: 'Category 1 for 200' })).toBeDisabled();
    screen.getByRole('button', { name: 'Category 1 for 400' }).click();
    expect(onSelect).toHaveBeenCalledWith('round-one-board:tile:0:1');
  });
});

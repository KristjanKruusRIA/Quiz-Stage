import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ImportPreview } from '../../../../src/renderer/features/content/ImportPreview';

describe('ImportPreview', () => {
  it('renders every row issue and blocks commit until validation succeeds', async () => {
    const commit = vi.fn();
    render(<ImportPreview preview={{
      cancelled: false, previewId: 'token-1', packId: 'pack', packName: 'Pack', rowCount: 5, conflict: false,
      issues: [
        { code: 'missing', message: 'clue is required', row: 2, column: 'clue_en' },
        { code: 'url', message: 'source URL is invalid', row: 4, column: 'source_url' },
      ],
    }} onCommit={commit} onCancel={vi.fn()} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText(/Row 2.*clue is required/)).toBeInTheDocument();
    expect(screen.getByText(/Row 4.*source URL is invalid/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Import pack' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel import' }));
    expect(commit).not.toHaveBeenCalled();
  });
});

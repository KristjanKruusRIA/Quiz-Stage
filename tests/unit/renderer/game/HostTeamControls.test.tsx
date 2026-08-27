import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HostTeamControls } from '../../../../src/renderer/features/game/HostTeamControls';
import { hostView } from './fixtures';

describe('HostTeamControls', () => {
  it('shows the team lock label without a numeric suffix', () => {
    render(<HostTeamControls view={hostView()} onLock={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Lock Alpha' })).toHaveTextContent(/^Lock Alpha$/);
  });
});

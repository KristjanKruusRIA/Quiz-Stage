import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CategorySetEditor } from '../../../../src/renderer/features/content/CategorySetEditor';
import type { EditorCategorySet } from '../../../../src/shared/content/editor';

function categorySet(): EditorCategorySet {
  return {
    id: 'set-1', packId: 'pack-1', revision: 'rev-1', ownership: 'custom', round: 'round-one',
    difficulty: 'easy', macroTopic: 'science', name: { en: 'Space', et: 'Kosmos' }, enabled: true,
    eligibility: { en: true, et: true },
    clues: [1, 2, 3, 4, 5].map((tier) => ({
      id: `clue-${tier}`, tier, value: tier * 200, prompt: { en: `Prompt ${tier}`, et: `Küsimus ${tier}` },
      response: { en: `Response ${tier}`, et: `Vastus ${tier}` },
      explanation: { en: `Explanation ${tier}`, et: `Selgitus ${tier}` }, acceptedResponses: undefined,
      source: { title: 'Facts', url: `https://example.com/${tier}`, license: 'CC0', retrievedAt: '2026-08-12', translationStatus: 'reviewed' },
      enabled: true, reported: false,
    })),
  };
}

describe('CategorySetEditor', () => {
  it('shows all five tiers together with side-by-side labels and source metadata', () => {
    render(<CategorySetEditor value={categorySet()} onSave={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getAllByRole('group', { name: /Tier [1-5]/ })).toHaveLength(5);
    expect(screen.getByLabelText('Tier 1 clue — English')).toHaveValue('Prompt 1');
    expect(screen.getByLabelText('Tier 1 clue — Estonian')).toHaveValue('Küsimus 1');
    expect(screen.getByText('https://example.com/1')).toBeInTheDocument();
    expect(screen.getAllByText('CC0').length).toBeGreaterThan(0);
    expect(screen.getAllByText('reviewed').length).toBeGreaterThan(0);
  });

  it('exposes category and per-tier enabled controls and preserves disabled saves', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn(async () => undefined);
    render(<CategorySetEditor value={categorySet()} onSave={onSave} onCancel={vi.fn()} />);
    await user.click(screen.getByLabelText('Category enabled'));
    await user.click(screen.getByLabelText('Tier 3 enabled'));
    await user.click(screen.getByRole('button', { name: 'Save category set' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      enabled: false,
      clues: expect.arrayContaining([expect.objectContaining({ tier: 3, enabled: false })]),
    }));
  });

  it('keeps drafts local, labels validation errors, and latches a single submit', async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => { release = resolve; });
    const onSave = vi.fn(() => pending);
    const user = userEvent.setup();
    render(<CategorySetEditor value={categorySet()} onSave={onSave} onCancel={vi.fn()} />);
    const prompt = screen.getByLabelText('Tier 1 clue — English');
    await user.clear(prompt);
    await user.click(screen.getByRole('button', { name: 'Save category set' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Tier 1 English clue is required');
    await user.type(prompt, 'Updated prompt');
    const form = screen.getByRole('button', { name: 'Save category set' }).closest('form')!;
    form.requestSubmit();
    form.requestSubmit();
    expect(onSave).toHaveBeenCalledOnce();
    release();
  });
});

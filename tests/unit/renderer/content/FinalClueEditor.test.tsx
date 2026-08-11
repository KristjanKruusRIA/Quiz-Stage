import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FinalClueEditor } from '../../../../src/renderer/features/content/FinalClueEditor';

function finalDraft() {
  return {
    id: null as null, packId: 'pack', categoryId: null as null, difficulty: 'easy' as const,
    categoryName: { en: 'Final', et: 'Finaal' }, macroTopic: 'history', enabled: true,
    clue: { id: null as null, tier: 0, value: 0, prompt: { en: 'Prompt', et: 'Küsimus' },
      response: { en: 'Response', et: 'Vastus' }, explanation: { en: 'Explanation', et: 'Selgitus' },
      acceptedResponses: { en: 'Alias', et: 'Variant' }, source: { title: 'Source', url: 'https://example.com/final',
        license: 'CC0', retrievedAt: '2026-08-12', translationStatus: 'reviewed' as const }, enabled: true, reported: false },
  };
}

describe('FinalClueEditor', () => {
  it('renders every bilingual answer, provenance, classification, and status field', () => {
    render(<FinalClueEditor value={{
      id: null, packId: 'pack', categoryId: null, difficulty: 'easy', categoryName: { en: '' },
      macroTopic: '', enabled: true, clue: { id: null, tier: 0, value: 0, prompt: { en: '' },
        response: { en: '' }, explanation: { en: '' }, source: { title: '', url: null, license: null, retrievedAt: null, translationStatus: null }, enabled: true, reported: false },
    }} onSave={vi.fn()} onCancel={vi.fn()} onReport={vi.fn()} />);
    for (const label of ['Final accepted responses — English', 'Final accepted responses — Estonian',
      'Final source title', 'Final source URL', 'Final source license', 'Final retrieval date',
      'Final translation status', 'Difficulty', 'Macro-topic', 'Final enabled']) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
  });

  it.each([
    ['Final category — English', 'English Final category is required'],
    ['Final clue — English', 'English Final clue is required'],
    ['Final response — English', 'English Final response is required'],
    ['Final explanation — English', 'English Final explanation is required'],
    ['Macro-topic', 'Macro-topic is required'],
    ['Final source title', 'Source title is required'],
    ['Final source URL', 'HTTP(S) source URL is required'],
    ['Final source license', 'Source license is required'],
    ['Final retrieval date', 'Retrieval date is required'],
  ])('continuously blocks an invalid %s before calling the bridge', async (label, message) => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<FinalClueEditor value={finalDraft()} onSave={onSave} onCancel={vi.fn()} />);
    await user.clear(screen.getByLabelText(label));
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Final clue' })).toBeDisabled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('validates accepted variants and translation status continuously', async () => {
    const user = userEvent.setup();
    render(<FinalClueEditor value={finalDraft()} onSave={vi.fn()} onCancel={vi.fn()} />);
    const variants = screen.getByLabelText('Final accepted responses — English');
    await user.clear(variants); await user.type(variants, String.raw`alias\q`);
    expect(screen.getByText('English accepted responses contain an invalid escape')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Final translation status'), '');
    expect(screen.getByText('Translation status is required')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save Final clue' })).toBeDisabled();
  });

  it('rejects non-HTTP source URLs and saves a complete Final once', async () => {
    const user = userEvent.setup(); const onSave = vi.fn(async () => undefined);
    render(<FinalClueEditor value={finalDraft()} onSave={onSave} onCancel={vi.fn()} />);
    const url = screen.getByLabelText('Final source URL');
    await user.clear(url); await user.type(url, 'javascript:alert(1)');
    expect(screen.getByRole('button', { name: 'Save Final clue' })).toBeDisabled();
    await user.clear(url); await user.type(url, 'https://example.com/final');
    await user.click(screen.getByRole('button', { name: 'Save Final clue' }));
    expect(onSave).toHaveBeenCalledOnce();
  });
});

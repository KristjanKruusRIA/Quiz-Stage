import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FinalClueEditor } from '../../../../src/renderer/features/content/FinalClueEditor';

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
});

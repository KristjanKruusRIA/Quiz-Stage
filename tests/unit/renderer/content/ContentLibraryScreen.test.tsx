import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ContentLibraryScreen } from '../../../../src/renderer/features/content/ContentLibraryScreen';
import type { HostDesktopApi } from '../../../../src/renderer/api/desktopApi';
import type { EditorLibrary } from '../../../../src/shared/content/editor';

function library(): EditorLibrary {
  return {
    reports: [{ id: 1, clueId: 'reported', matchId: null, note: 'Wrong fact', createdAt: 1, resolvedAt: null }],
    packs: [{
      id: 'pack-1', name: 'Pack One', ownership: 'bundled', enabled: true, revision: 'pack-rev',
      categorySets: [{
        id: 'set-1', packId: 'pack-1', revision: 'set-rev', ownership: 'bundled', round: 'round-one',
        difficulty: 'easy', macroTopic: 'science', name: { en: 'Space', et: 'Kosmos' }, enabled: true,
        eligibility: { en: true, et: true }, clues: [1, 2, 3, 4, 5].map((tier) => ({
          id: tier === 3 ? 'reported' : `clue-${tier}`, tier, value: tier * 200,
          prompt: { en: `Prompt ${tier}`, et: `Küsimus ${tier}` }, response: { en: `Response ${tier}`, et: `Vastus ${tier}` },
          explanation: { en: `Explanation ${tier}`, et: `Selgitus ${tier}` }, acceptedResponses: undefined,
          source: { title: 'Facts', url: null, license: null, retrievedAt: null, translationStatus: null },
          enabled: tier !== 3, reported: tier === 3,
        })),
      }], finalClues: [],
    }],
  };
}

function api(load = vi.fn(async () => library())): HostDesktopApi {
  return {
    surface: 'host', getSetupOptions: vi.fn(), checkContentAvailability: vi.fn(), startMatch: vi.fn(),
    hasResumableMatch: vi.fn(), resumeMatch: vi.fn(), listHistory: vi.fn(), dispatch: vi.fn(),
    listContent: load, saveCategorySet: vi.fn(), saveFinalClue: vi.fn(), createContentPack: vi.fn(),
    deleteContentPack: vi.fn(), reportContentClue: vi.fn(), resolveContentReport: vi.fn(),
    previewContentImport: vi.fn(), commitContentImport: vi.fn(), exportContentPack: vi.fn(),
  } as HostDesktopApi;
}

describe('ContentLibraryScreen', () => {
  it('loads reported clues first and gives keyboard-accessible Home navigation', async () => {
    const onBack = vi.fn();
    render(<ContentLibraryScreen api={api()} onBack={onBack} />);
    expect(await screen.findByRole('heading', { name: 'Reported clues' })).toBeInTheDocument();
    const entries = screen.getAllByRole('button', { name: /Edit/ });
    expect(entries[0]).toHaveAccessibleName(/Edit reported clue/);
    const home = screen.getByRole('button', { name: 'Back to Home' });
    home.focus();
    await userEvent.keyboard('{Enter}');
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('suppresses a stale load response after a newer refresh and recovers from failures', async () => {
    let resolveOld!: (value: EditorLibrary) => void;
    const old = new Promise<EditorLibrary>((resolve) => { resolveOld = resolve; });
    const newer = structuredClone(library());
    newer.packs[0].name = 'Newer Pack';
    const load = vi.fn().mockImplementationOnce(() => old).mockResolvedValueOnce(newer);
    render(<ContentLibraryScreen api={api(load)} onBack={vi.fn()} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Refresh content' }));
    expect(await screen.findByText('Newer Pack')).toBeInTheDocument();
    resolveOld(library());
    await Promise.resolve();
    expect(screen.queryByText('Pack One')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh content' })).toBeEnabled());
  });
});

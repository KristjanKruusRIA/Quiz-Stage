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
    configureMatch: vi.fn(), rerollConfiguredTopic: vi.fn(), startConfiguredMatch: vi.fn(),
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

  it('latches create/import actions synchronously and offers a reachable custom Final workflow', async () => {
    const custom = structuredClone(library());
    custom.packs[0].ownership = 'custom';
    const create = vi.fn(() => new Promise<never>(() => {}));
    const preview = vi.fn(() => new Promise<never>(() => {}));
    const bridge = api(vi.fn(async () => custom));
    bridge.createContentPack = create as never;
    bridge.previewContentImport = preview as never;
    render(<ContentLibraryScreen api={bridge} onBack={vi.fn()} />);
    await screen.findByText('Pack One');
    await userEvent.type(screen.getByLabelText('Custom pack name'), 'New');
    const createButton = screen.getByRole('button', { name: 'Create custom pack' });
    await Promise.all([userEvent.click(createButton), userEvent.click(createButton)]);
    expect(create).toHaveBeenCalledOnce();
    expect(createButton).toBeDisabled();
    const importButton = screen.getByRole('button', { name: 'Import CSV' });
    await Promise.all([userEvent.click(importButton), userEvent.click(importButton)]);
    expect(preview).toHaveBeenCalledOnce();
    expect(importButton).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add Final clue' })).toBeEnabled();
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

  it('clears a consumed failed import preview and requires choosing the file again', async () => {
    const bridge = api();
    bridge.previewContentImport = vi.fn(async () => ({ cancelled: false as const, valid: true as const, previewId: 'token-1',
      packId: 'new-pack', packName: 'New Pack', rowCount: 5, conflict: false, issues: [] }));
    bridge.commitContentImport = vi.fn(async () => { throw new Error('commit race'); });
    render(<ContentLibraryScreen api={bridge} onBack={vi.fn()} />);
    await screen.findByText('Pack One');
    await userEvent.click(screen.getByRole('button', { name: 'Import CSV' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Import pack' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/choose.*file.*again/i);
    expect(screen.queryByRole('button', { name: 'Import pack' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Import CSV' }));
    expect(bridge.previewContentImport).toHaveBeenCalledTimes(2);
  });

  it('owns report failures, retains the draft note, releases the latch, and renders a safe alert', async () => {
    const bridge = api();
    let rejectReport!: (reason: Error) => void;
    const pending = new Promise<never>((_resolve, reject) => { rejectReport = reject; });
    bridge.reportContentClue = vi.fn(() => pending);
    render(<ContentLibraryScreen api={bridge} onBack={vi.fn()} />);
    await userEvent.click(await screen.findByRole('button', { name: /Edit reported clue/ }));
    const note = screen.getByLabelText('Report note for tier 1');
    await userEvent.type(note, 'Check source');
    const report = screen.getByRole('button', { name: 'Report tier 1' });
    await Promise.all([userEvent.click(report), userEvent.click(report)]);
    expect(bridge.reportContentClue).toHaveBeenCalledOnce();
    expect(report).toBeDisabled();
    rejectReport(new Error('STALE_CONTENT_REVISION private'));
    expect(await screen.findByRole('alert')).toHaveTextContent('The report could not be saved');
    expect(note).toHaveValue('Check source');
    expect(report).toBeEnabled();
    expect(screen.queryByText(/STALE_CONTENT_REVISION|private/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('The report could not be saved. Refresh content and try again.')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Edit reported clue/ }));
    expect(screen.queryByText('The report could not be saved. Refresh content and try again.')).not.toBeInTheDocument();
  });
});

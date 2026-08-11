import { useCallback, useEffect, useRef, useState } from 'react';
import type { HostDesktopApi } from '../../api/desktopApi';
import type { EditorCategorySet, EditorFinalClue, EditorLibrary, EditorPack } from '../../../shared/content/editor';
import { CategorySetEditor, type CategorySetDraft } from './CategorySetEditor';
import { FinalClueEditor } from './FinalClueEditor';
import { ImportPreview } from './ImportPreview';
import { PackList } from './PackList';

interface ContentLibraryScreenProps { api: HostDesktopApi; onBack: () => void }

function blankCategory(pack: EditorPack): CategorySetDraft {
  return {
    id: null, packId: pack.id, round: 'round-one', difficulty: 'easy', macroTopic: '', name: { en: '' }, enabled: true,
    clues: [1, 2, 3, 4, 5].map((tier) => ({
      id: null, tier, value: tier * 200, prompt: { en: '' }, response: { en: '' }, explanation: { en: '' },
      source: { title: '', url: null, license: null, retrievedAt: null, translationStatus: null },
      enabled: true, reported: false,
    })),
  };
}

export function ContentLibraryScreen({ api, onBack }: ContentLibraryScreenProps) {
  const [library, setLibrary] = useState<EditorLibrary | null>(null);
  const [selected, setSelected] = useState<EditorCategorySet | CategorySetDraft | EditorFinalClue | null>(null);
  const [preview, setPreview] = useState<Awaited<ReturnType<NonNullable<HostDesktopApi['previewContentImport']>>> | null>(null);
  const [error, setError] = useState(false);
  const [newPackName, setNewPackName] = useState('');
  const generation = useRef(0);
  const load = useCallback(async () => {
    if (api.listContent === undefined) return;
    const request = ++generation.current;
    try {
      const result = await api.listContent();
      if (request === generation.current) {
        setLibrary(result);
        setError(false);
      }
    } catch {
      if (request === generation.current) setError(true);
    }
  }, [api]);
  useEffect(() => {
    if (api.listContent === undefined) return;
    const request = ++generation.current;
    void api.listContent().then((result) => {
      if (request === generation.current) {
        setLibrary(result);
        setError(false);
      }
    }, () => {
      if (request === generation.current) setError(true);
    });
    return () => { generation.current += 1; };
  }, [api]);

  const saveCategory = async (category: EditorCategorySet | CategorySetDraft) => {
    if (api.saveCategorySet === undefined) throw new Error('Content editing is unavailable');
    const expectedRevision = category.id === null
      ? library!.packs.find((pack) => pack.id === category.packId)!.revision
      : category.revision!;
    await api.saveCategorySet({ expectedRevision, categorySet: category });
    setSelected(null);
    await load();
  };
  const saveFinal = async (final: EditorFinalClue) => {
    if (api.saveFinalClue === undefined) throw new Error('Content editing is unavailable');
    await api.saveFinalClue({ expectedRevision: final.revision, finalClue: final });
    setSelected(null);
    await load();
  };
  const createPack = async () => {
    const name = newPackName.trim();
    if (!name || api.createContentPack === undefined) return;
    try {
      await api.createContentPack({ name });
      setNewPackName('');
      await load();
    } catch {
      setError(true);
    }
  };
  const deletePack = async (pack: EditorPack) => {
    if (api.deleteContentPack === undefined || !window.confirm(`Delete ${pack.name}?`)) return;
    try { await api.deleteContentPack({ packId: pack.id, expectedRevision: pack.revision }); await load(); }
    catch { setError(true); }
  };
  const startImport = async () => {
    if (api.previewContentImport === undefined) return;
    try {
      const result = await api.previewContentImport();
      if (!result.cancelled) setPreview(result);
    } catch { setError(true); }
  };
  const commitImport = async (conflict?: 'replace-existing' | 'keep-both') => {
    if (preview === null || preview.cancelled || api.commitContentImport === undefined) return;
    await api.commitContentImport({ previewId: preview.previewId, ...(conflict === undefined ? {} : { conflict }) });
    setPreview(null);
    await load();
  };

  if (selected !== null) {
    if ('clues' in selected) return <main className="page-shell"><CategorySetEditor value={selected} onSave={saveCategory} onCancel={() => setSelected(null)} onReport={async (clueId, note) => {
      if (api.reportContentClue === undefined) throw new Error('Reporting is unavailable');
      await api.reportContentClue({ clueId, note });
      setSelected(null);
      await load();
    }} /></main>;
    return <main className="page-shell"><FinalClueEditor value={selected} onSave={saveFinal} onCancel={() => setSelected(null)} /></main>;
  }
  return (
    <main className="page-shell content-library-screen">
      <header className="setup-header"><div><p className="eyebrow">Quiz Stage</p><h1>Content Library</h1></div><button type="button" onClick={onBack}>Back to Home</button></header>
      <div className="editor-actions">
        <button type="button" onClick={() => void load()}>Refresh content</button>
        <label>Custom pack name<input value={newPackName} onChange={(event) => setNewPackName(event.target.value)} /></label>
        <button type="button" disabled={!newPackName.trim()} onClick={() => void createPack()}>Create custom pack</button>
        <button type="button" onClick={() => void startImport()}>Import CSV</button>
      </div>
      {error ? <p role="alert">The content library action failed. No unconfirmed changes were applied.</p> : null}
      {preview !== null && !preview.cancelled ? <ImportPreview preview={preview} onCommit={commitImport} onCancel={() => setPreview(null)} /> : null}
      {library === null && !error ? <p role="status">Loading content library</p> : null}
      {library !== null ? (
        <>
          <section aria-labelledby="reported-clues-title"><h2 id="reported-clues-title">Reported clues</h2>
            {library.reports.length === 0 ? <p>No unresolved reports.</p> : <ul>{library.reports.map((report) => <li key={report.id}>{report.note} <span className="muted">{report.clueId}</span> <button type="button" onClick={() => void api.resolveContentReport?.({ clueId: report.clueId }).then(load).catch(() => setError(true))}>Resolve without change</button></li>)}</ul>}
          </section>
          <PackList packs={library.packs}
            onEditCategory={(pack, id) => setSelected(pack.categorySets.find((set) => set.id === id)!)}
            onEditFinal={(pack, id) => setSelected(pack.finalClues.find((final) => final.id === id)!)}
            onAddCategory={(pack) => setSelected(blankCategory(pack))}
            onDeletePack={(pack) => void deletePack(pack)}
            onExport={(pack) => void api.exportContentPack?.({ packId: pack.id }).catch(() => setError(true))}
          />
        </>
      ) : null}
    </main>
  );
}

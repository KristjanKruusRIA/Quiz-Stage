import { useCallback, useEffect, useRef, useState } from 'react';
import type { HostDesktopApi } from '../../api/desktopApi';
import {
  toWritableCategorySet, toWritableFinalClue,
  type EditorCategorySet, type EditorFinalClue, type EditorLibrary, type EditorPack,
} from '../../../shared/content/editor';
import { CategorySetEditor, type CategorySetDraft } from './CategorySetEditor';
import { FinalClueEditor, type FinalClueDraft } from './FinalClueEditor';
import { ImportPreview } from './ImportPreview';
import { PackList } from './PackList';
import { useI18n } from '../../i18n';

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

function blankFinal(pack: EditorPack): FinalClueDraft {
  return { id: null, packId: pack.id, categoryId: null, difficulty: 'easy', categoryName: { en: '' },
    macroTopic: '', enabled: true, clue: { id: null, tier: 0, value: 0, prompt: { en: '' }, response: { en: '' },
      explanation: { en: '' }, source: { title: '', url: null, license: null, retrievedAt: null, translationStatus: null },
      enabled: true, reported: false } };
}

export function ContentLibraryScreen({ api, onBack }: ContentLibraryScreenProps) {
  const { t } = useI18n();
  const [library, setLibrary] = useState<EditorLibrary | null>(null);
  const [selected, setSelected] = useState<EditorCategorySet | CategorySetDraft | EditorFinalClue | FinalClueDraft | null>(null);
  const [preview, setPreview] = useState<Awaited<ReturnType<NonNullable<HostDesktopApi['previewContentImport']>>> | null>(null);
  const [error, setError] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [importFailure, setImportFailure] = useState(false);
  const [newPackName, setNewPackName] = useState('');
  const generation = useRef(0);
  const previewRef = useRef(preview);
  const actions = useRef(new Set<string>());
  const [pendingActions, setPendingActions] = useState<ReadonlySet<string>>(new Set());
  const closeEditor = () => { setSelected(null); setActionError(null); };
  const openEditor = (editor: NonNullable<typeof selected>) => { setActionError(null); setSelected(editor); };
  useEffect(() => { previewRef.current = preview; }, [preview]);
  const runAction = async <T,>(key: string, action: () => Promise<T>): Promise<{ ran: true; value: T } | { ran: false }> => {
    if (actions.current.has(key)) return { ran: false };
    actions.current.add(key); setPendingActions(new Set(actions.current));
    try { return { ran: true, value: await action() }; }
    finally { actions.current.delete(key); setPendingActions(new Set(actions.current)); }
  };
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
    return () => {
      generation.current += 1;
      const currentPreview = previewRef.current;
      if (currentPreview !== null && !currentPreview.cancelled && currentPreview.valid) {
        void api.discardContentImport?.({ previewId: currentPreview.previewId });
      }
    };
  }, [api]);

  const saveCategory = async (category: EditorCategorySet | CategorySetDraft) => {
    if (api.saveCategorySet === undefined) throw new Error('Content editing is unavailable');
    const expectedRevision = category.id === null
      ? library!.packs.find((pack) => pack.id === category.packId)!.revision
      : category.revision!;
    await api.saveCategorySet({ expectedRevision, categorySet: toWritableCategorySet(category) });
    closeEditor();
    await load();
  };
  const saveFinal = async (final: EditorFinalClue | FinalClueDraft) => {
    if (api.saveFinalClue === undefined) throw new Error('Content editing is unavailable');
    const expectedRevision = final.id === null ? library!.packs.find((pack) => pack.id === final.packId)!.revision : final.revision;
    await api.saveFinalClue({ expectedRevision, finalClue: toWritableFinalClue(final) });
    closeEditor();
    await load();
  };
  const createPack = async () => {
    const name = newPackName.trim();
    if (!name || api.createContentPack === undefined) return;
    const create = api.createContentPack;
    await runAction('create', async () => { try {
      await create({ name });
      setNewPackName('');
      await load();
    } catch {
      setError(true);
    } });
  };
  const deletePack = async (pack: EditorPack) => {
    if (api.deleteContentPack === undefined || !window.confirm(t('content.deleteConfirm', { pack: pack.name }))) return;
    try { await runAction(`delete:${pack.id}`, async () => { await api.deleteContentPack!({ packId: pack.id, expectedRevision: pack.revision }); await load(); }); }
    catch { setError(true); }
  };
  const startImport = async () => {
    if (api.previewContentImport === undefined) return;
    const openPreview = api.previewContentImport;
    await runAction('preview', async () => { try {
      const result = await openPreview();
      if (!result.cancelled) {
        if (preview !== null && !preview.cancelled && preview.valid) void api.discardContentImport?.({ previewId: preview.previewId });
        setPreview(result);
        setImportFailure(false);
      }
    } catch { setError(true); }
    });
  };
  const commitImport = async (conflict?: 'replace-existing' | 'keep-both') => {
    if (preview === null || preview.cancelled || !preview.valid || api.commitContentImport === undefined) return;
    try {
      await api.commitContentImport({ previewId: preview.previewId, ...(conflict === undefined ? {} : { conflict }) });
      setPreview(null); setImportFailure(false); await load();
    } catch {
      setPreview(null); setImportFailure(true);
    }
  };

  if (selected !== null) {
    if ('clues' in selected) return <main className="page-shell">{actionError ? <p role="alert">{actionError}</p> : null}<CategorySetEditor value={selected} onSave={saveCategory} reportPending={selected.clues.some((clue) => pendingActions.has(`report:${clue.id}`))} onReport={async (clueId, note) => {
      setActionError(null);
      try {
        if (api.reportContentClue === undefined) throw new Error('Reporting is unavailable');
        const result = await runAction(`report:${clueId}`, () => api.reportContentClue!({ clueId, note, expectedRevision: selected.revision }));
        if (!result.ran) return;
        closeEditor(); await load();
      } catch { setActionError(t('content.reportError')); }
    }} onCancel={closeEditor} /></main>;
    return <main className="page-shell">{actionError ? <p role="alert">{actionError}</p> : null}<FinalClueEditor value={selected} onSave={saveFinal} reportPending={selected.clue.id !== null && pendingActions.has(`report:${selected.clue.id}`)} onReport={selected.id === null ? undefined : async (clueId, note) => {
      setActionError(null);
      try {
        if (api.reportContentClue === undefined) throw new Error('Reporting is unavailable');
        const result = await runAction(`report:${clueId}`, () => api.reportContentClue!({ clueId, note, expectedRevision: selected.revision }));
        if (!result.ran) return;
        closeEditor(); await load();
      } catch { setActionError(t('content.reportError')); }
    }} onCancel={closeEditor} /></main>;
  }
  return (
    <main className="page-shell content-library-screen">
      <header className="setup-header"><div><p className="eyebrow">{t('common.productName')}</p><h1>{t('content.title')}</h1></div><button type="button" onClick={() => { setActionError(null); onBack(); }}>{t('common.backHome')}</button></header>
      <div className="editor-actions">
        <button type="button" onClick={() => void load()}>{t('content.refresh')}</button>
        <label>{t('content.customPackName')}<input value={newPackName} onChange={(event) => setNewPackName(event.target.value)} /></label>
        <button type="button" disabled={!newPackName.trim() || pendingActions.has('create')} onClick={() => void createPack()}>{t('content.createPack')}</button>
        <button type="button" disabled={pendingActions.has('preview')} onClick={() => void startImport()}>{t('content.importCsv')}</button>
      </div>
      {error ? <p role="alert">{t('content.actionError')}</p> : null}
      {importFailure ? <p role="alert">{t('content.importConsumed')}</p> : null}
      {preview !== null && !preview.cancelled ? <ImportPreview preview={preview} onCommit={commitImport} onCancel={() => { if (preview.valid) void api.discardContentImport?.({ previewId: preview.previewId }); setPreview(null); }} /> : null}
      {library === null && !error ? <p role="status">{t('content.loading')}</p> : null}
      {library !== null ? (
        <>
          <section aria-labelledby="reported-clues-title"><h2 id="reported-clues-title">{t('content.reportedClues')}</h2>
            {library.reports.length === 0 ? <p>{t('content.noReports')}</p> : <ul>{library.reports.map((report) => {
              const editor = library.packs.flatMap((pack) => [...pack.categorySets, ...pack.finalClues]).find((item) => 'clues' in item ? item.clues.some((clue) => clue.id === report.clueId) : item.clue.id === report.clueId);
              return <li key={report.id}>{report.note} <span className="muted">{report.clueId}</span> <button type="button" disabled={pendingActions.has(`resolve:${report.id}`)} onClick={() => void runAction(`resolve:${report.id}`, async () => { await api.resolveContentReport?.({ clueId: report.clueId, reportId: report.id, expectedRevision: editor!.revision }); await load(); }).catch(() => setError(true))}>{t('content.resolveWithoutChange')}</button></li>;
            })}</ul>}
          </section>
          <PackList packs={library.packs}
            pendingActions={pendingActions}
            onEditCategory={(pack, id) => openEditor(pack.categorySets.find((set) => set.id === id)!)}
            onEditFinal={(pack, id) => openEditor(pack.finalClues.find((final) => final.id === id)!)}
            onAddCategory={(pack) => openEditor(blankCategory(pack))}
            onAddFinal={(pack) => openEditor(blankFinal(pack))}
            onDeletePack={(pack) => void deletePack(pack)}
            onExport={(pack) => void runAction(`export:${pack.id}`, async () => { await api.exportContentPack?.({ packId: pack.id }); }).catch(() => setError(true))}
          />
        </>
      ) : null}
    </main>
  );
}

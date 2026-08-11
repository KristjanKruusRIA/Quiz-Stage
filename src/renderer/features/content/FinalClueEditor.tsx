import { useEffect, useRef, useState } from 'react';
import type { EditorFinalClue } from '../../../shared/content/editor';

export type FinalClueDraft = Omit<EditorFinalClue, 'id' | 'categoryId' | 'revision' | 'ownership' | 'eligibility' | 'clue'> & {
  id: null; categoryId: null; clue: Omit<EditorFinalClue['clue'], 'id'> & { id: null };
};

interface FinalClueEditorProps {
  value: EditorFinalClue | FinalClueDraft;
  onSave: (value: EditorFinalClue | FinalClueDraft) => Promise<unknown>;
  onCancel: () => void;
  onReport?: (clueId: string, note: string) => Promise<unknown>;
  reportPending?: boolean;
}

export function FinalClueEditor({ value, onSave, onCancel, onReport, reportPending = false }: FinalClueEditorProps) {
  const [draft, setDraft] = useState(() => structuredClone(value));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [reportNote, setReportNote] = useState('');
  const inFlight = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const cancel = () => {
    if (JSON.stringify(draft) !== JSON.stringify(value) && !window.confirm('Discard unsaved Final changes?')) return;
    onCancel();
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inFlight.current) return;
    if (!draft.categoryName.en.trim() || !draft.clue.prompt.en.trim()
      || !draft.clue.response.en.trim() || !draft.clue.explanation.en.trim()) {
      setError('English category, clue, response, and explanation are required.'); return;
    }
    inFlight.current = true; setPending(true); setError(null);
    try { await onSave(draft); } catch { setError('The Final clue could not be saved. Refresh and try again.'); }
    finally { inFlight.current = false; setPending(false); }
  };
  const updateClue = (change: (clue: typeof draft.clue) => void) => setDraft((current) => {
    const next = structuredClone(current); change(next.clue); return next;
  });
  const localized = (field: 'prompt' | 'response' | 'explanation' | 'acceptedResponses', language: 'en' | 'et', text: string) =>
    updateClue((clue) => {
      if (field === 'acceptedResponses' && clue.acceptedResponses === undefined) clue.acceptedResponses = { en: '' };
      const target = clue[field]!;
      if (language === 'en') target.en = text;
      else target.et = text || undefined;
      if (field === 'acceptedResponses' && !target.en && target.et === undefined) clue.acceptedResponses = undefined;
    });
  return <form className="content-editor" onSubmit={(event) => void submit(event)}>
    <h1 ref={heading} tabIndex={-1}>{draft.id === null ? 'Add Final clue' : 'Edit Final clue'}</h1>
    <div className="bilingual-grid">
      {(['en', 'et'] as const).map((language) => <label key={`category-${language}`}>Final category — {language === 'en' ? 'English' : 'Estonian'}<input value={draft.categoryName[language] ?? ''} onChange={(event) => setDraft({ ...draft, categoryName: { ...draft.categoryName, [language]: event.target.value || (language === 'et' ? undefined : '') } })} /></label>)}
      {(['prompt', 'response', 'explanation', 'acceptedResponses'] as const).flatMap((field) => (['en', 'et'] as const).map((language) => <label key={`${field}-${language}`}>Final {field === 'prompt' ? 'clue' : field === 'acceptedResponses' ? 'accepted responses' : field} — {language === 'en' ? 'English' : 'Estonian'}{field === 'prompt' || field === 'explanation' ? <textarea value={draft.clue[field][language] ?? ''} onChange={(event) => localized(field, language, event.target.value)} /> : <input value={draft.clue[field]?.[language] ?? ''} onChange={(event) => localized(field, language, event.target.value)} />}</label>))}
    </div>
    <div className="content-metadata-grid">
      <label>Difficulty<select value={draft.difficulty} onChange={(event) => setDraft({ ...draft, difficulty: event.target.value as typeof draft.difficulty })}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
      <label>Macro-topic<input value={draft.macroTopic} onChange={(event) => setDraft({ ...draft, macroTopic: event.target.value })} /></label>
      <label>Final source title<input value={draft.clue.source.title} onChange={(event) => updateClue((clue) => { clue.source.title = event.target.value; })} /></label>
      <label>Final source URL<input value={draft.clue.source.url ?? ''} disabled={value.id !== null && 'ownership' in value && value.ownership === 'bundled'} onChange={(event) => updateClue((clue) => { clue.source.url = event.target.value || null; })} /></label>
      <label>Final source license<input value={draft.clue.source.license ?? ''} disabled={value.id !== null && 'ownership' in value && value.ownership === 'bundled'} onChange={(event) => updateClue((clue) => { clue.source.license = event.target.value || null; })} /></label>
      <label>Final retrieval date<input type="date" value={draft.clue.source.retrievedAt ?? ''} disabled={value.id !== null && 'ownership' in value && value.ownership === 'bundled'} onChange={(event) => updateClue((clue) => { clue.source.retrievedAt = event.target.value || null; })} /></label>
      <label>Final translation status<select value={draft.clue.source.translationStatus ?? ''} disabled={value.id !== null && 'ownership' in value && value.ownership === 'bundled'} onChange={(event) => updateClue((clue) => { clue.source.translationStatus = (event.target.value || null) as typeof clue.source.translationStatus; })}><option value="">Not recorded</option><option value="untranslated">untranslated</option><option value="machine">machine</option><option value="reviewed">reviewed</option></select></label>
      <label>Final enabled<input type="checkbox" checked={draft.enabled && draft.clue.enabled} onChange={(event) => { const enabled = event.target.checked; setDraft((current) => { const next = structuredClone(current); next.enabled = enabled; next.clue.enabled = enabled; return next; }); }} /></label>
    </div>
    {draft.clue.id !== null && onReport !== undefined ? <div className="editor-actions"><label>Report note for Final<input value={reportNote} onChange={(event) => setReportNote(event.target.value)} /></label><button type="button" disabled={reportPending || draft.clue.reported || !reportNote.trim()} onClick={() => void onReport(draft.clue.id!, reportNote.trim())}>{draft.clue.reported ? 'Final is reported' : 'Report Final clue'}</button></div> : null}
    {error ? <p role="alert">{error}</p> : null}
    <div className="editor-actions"><button className="primary-action" type="submit" disabled={pending}>Save Final clue</button><button type="button" disabled={pending} onClick={cancel}>Cancel</button></div>
  </form>;
}

import { useRef, useState } from 'react';
import type { EditorFinalClue } from '../../../shared/content/editor';

interface FinalClueEditorProps {
  value: EditorFinalClue;
  onSave: (value: EditorFinalClue) => Promise<unknown>;
  onCancel: () => void;
}

export function FinalClueEditor({ value, onSave, onCancel }: FinalClueEditorProps) {
  const [draft, setDraft] = useState(() => structuredClone(value));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inFlight = useRef(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inFlight.current) return;
    if (!draft.categoryName.en.trim() || !draft.clue.prompt.en.trim()
      || !draft.clue.response.en.trim() || !draft.clue.explanation.en.trim()) {
      setError('English category, clue, response, and explanation are required.');
      return;
    }
    inFlight.current = true;
    setPending(true);
    setError(null);
    try { await onSave(draft); } catch { setError('The Final clue could not be saved. Refresh and try again.'); }
    finally { inFlight.current = false; setPending(false); }
  };
  const updateClue = (field: 'prompt' | 'response' | 'explanation', language: 'en' | 'et', text: string) => {
    setDraft((current) => ({
      ...current,
      clue: { ...current.clue, [field]: { ...current.clue[field], [language]: text || (language === 'et' ? undefined : '') } },
    }));
  };
  return (
    <form className="content-editor" onSubmit={(event) => void submit(event)}>
      <h2>Final clue</h2>
      <div className="bilingual-grid">
        <label>Final category — English<input value={draft.categoryName.en} onChange={(event) => setDraft({ ...draft, categoryName: { ...draft.categoryName, en: event.target.value } })} /></label>
        <label>Final category — Estonian<input value={draft.categoryName.et ?? ''} onChange={(event) => setDraft({ ...draft, categoryName: { ...draft.categoryName, et: event.target.value || undefined } })} /></label>
        <label>Final clue — English<textarea value={draft.clue.prompt.en} onChange={(event) => updateClue('prompt', 'en', event.target.value)} /></label>
        <label>Final clue — Estonian<textarea value={draft.clue.prompt.et ?? ''} onChange={(event) => updateClue('prompt', 'et', event.target.value)} /></label>
        <label>Final response — English<input value={draft.clue.response.en} onChange={(event) => updateClue('response', 'en', event.target.value)} /></label>
        <label>Final response — Estonian<input value={draft.clue.response.et ?? ''} onChange={(event) => updateClue('response', 'et', event.target.value)} /></label>
        <label>Final explanation — English<textarea value={draft.clue.explanation.en} onChange={(event) => updateClue('explanation', 'en', event.target.value)} /></label>
        <label>Final explanation — Estonian<textarea value={draft.clue.explanation.et ?? ''} onChange={(event) => updateClue('explanation', 'et', event.target.value)} /></label>
      </div>
      <div className="source-summary"><strong>{draft.clue.source.title}</strong><span>{draft.clue.source.url ?? 'Source URL unavailable'}</span><span>{draft.clue.source.license ?? 'License unavailable'}</span><span>{draft.clue.source.retrievedAt ?? 'Retrieval date unavailable'}</span><span>{draft.clue.source.translationStatus ?? 'Translation status unavailable'}</span></div>
      {error ? <p role="alert">{error}</p> : null}
      <div className="editor-actions"><button className="primary-action" type="submit" disabled={pending}>Save Final clue</button><button type="button" disabled={pending} onClick={onCancel}>Cancel</button></div>
    </form>
  );
}

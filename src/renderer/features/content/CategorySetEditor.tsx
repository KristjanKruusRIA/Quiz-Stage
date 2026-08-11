import { useRef, useState } from 'react';
import type { EditorCategorySet, EditorClue } from '../../../shared/content/editor';
import { ValidationPanel } from './ValidationPanel';

export type CategorySetDraft = Omit<EditorCategorySet, 'id' | 'revision' | 'ownership' | 'eligibility' | 'clues'> & {
  id: string | null;
  revision?: string;
  ownership?: 'bundled' | 'custom';
  eligibility?: { en: boolean; et: boolean };
  clues: Array<Omit<EditorClue, 'id'> & { id: string | null }>;
};

interface CategorySetEditorProps {
  value: EditorCategorySet | CategorySetDraft;
  onSave: (value: EditorCategorySet | CategorySetDraft) => Promise<unknown>;
  onCancel: () => void;
  onReport?: (clueId: string, note: string) => Promise<unknown>;
}

function validate(value: EditorCategorySet | CategorySetDraft): string[] {
  const issues: string[] = [];
  if (!value.name.en.trim()) issues.push('English category name is required');
  if (!value.macroTopic.trim()) issues.push('Macro-topic is required');
  for (const clue of value.clues) {
    if (!clue.prompt.en.trim()) issues.push(`Tier ${clue.tier} English clue is required`);
    if (!clue.response.en.trim()) issues.push(`Tier ${clue.tier} English response is required`);
    if (!clue.explanation.en.trim()) issues.push(`Tier ${clue.tier} English explanation is required`);
    if (!clue.source.title.trim()) issues.push(`Tier ${clue.tier} source title is required`);
    if (value.ownership !== 'bundled') {
      if (clue.source.url === null || !/^https?:\/\//.test(clue.source.url)) issues.push(`Tier ${clue.tier} source URL is required`);
      if (clue.source.license === null || !clue.source.license.trim()) issues.push(`Tier ${clue.tier} source license is required`);
      if (clue.source.retrievedAt === null) issues.push(`Tier ${clue.tier} retrieval date is required`);
      if (clue.source.translationStatus === null) issues.push(`Tier ${clue.tier} translation status is required`);
    }
  }
  return issues;
}

export function CategorySetEditor({ value, onSave, onCancel, onReport }: CategorySetEditorProps) {
  const [draft, setDraft] = useState(() => structuredClone(value));
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [pending, setPending] = useState(false);
  const [reportNotes, setReportNotes] = useState<Record<number, string>>({});
  const inFlight = useRef(false);
  const updateClue = (index: number, update: (clue: CategorySetDraft['clues'][number]) => void) => {
    setDraft((current) => {
      const next = structuredClone(current) as CategorySetDraft;
      update(next.clues[index]);
      return next;
    });
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inFlight.current) return;
    const nextIssues = validate(draft);
    setValidationAttempted(true);
    if (nextIssues.length > 0) return;
    inFlight.current = true;
    setPending(true);
    setSaveError(false);
    try {
      await onSave(draft);
    } catch {
      setSaveError(true);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  };

  return (
    <form className="content-editor" onSubmit={(event) => void submit(event)}>
      <div className="bilingual-grid">
        <label>Category name — English
          <input value={draft.name.en} onChange={(event) => setDraft({ ...draft, name: { ...draft.name, en: event.target.value } })} />
        </label>
        <label>Category name — Estonian
          <input value={draft.name.et ?? ''} onChange={(event) => setDraft({ ...draft, name: { ...draft.name, et: event.target.value || undefined } })} />
        </label>
      </div>
      <div className="content-metadata-grid">
        <label>Round
          <select value={draft.round} disabled={draft.id !== null} onChange={(event) => {
            const round = event.target.value as CategorySetDraft['round'];
            setDraft({ ...draft, round, clues: draft.clues.map((clue) => ({ ...clue, value: clue.tier * (round === 'round-one' ? 200 : 400) })) });
          }}><option value="round-one">Round One</option><option value="round-two">Double Round</option></select>
        </label>
        <label>Difficulty
          <select value={draft.difficulty} onChange={(event) => setDraft({ ...draft, difficulty: event.target.value as CategorySetDraft['difficulty'] })}>
            <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
          </select>
        </label>
        <label>Macro-topic
          <input value={draft.macroTopic} onChange={(event) => setDraft({ ...draft, macroTopic: event.target.value })} />
        </label>
      </div>
      {draft.clues.map((clue, index) => (
        <fieldset className="tier-editor" key={clue.id ?? clue.tier} aria-label={`Tier ${clue.tier}`}>
          <legend>Tier {clue.tier} · {clue.value} points</legend>
          <div className="bilingual-grid">
            <label>Tier {clue.tier} clue — English
              <textarea value={clue.prompt.en} onChange={(event) => updateClue(index, (next) => { next.prompt.en = event.target.value; })} />
            </label>
            <label>Tier {clue.tier} clue — Estonian
              <textarea value={clue.prompt.et ?? ''} onChange={(event) => updateClue(index, (next) => { next.prompt.et = event.target.value || undefined; })} />
            </label>
            <label>Tier {clue.tier} response — English
              <input value={clue.response.en} onChange={(event) => updateClue(index, (next) => { next.response.en = event.target.value; })} />
            </label>
            <label>Tier {clue.tier} response — Estonian
              <input value={clue.response.et ?? ''} onChange={(event) => updateClue(index, (next) => { next.response.et = event.target.value || undefined; })} />
            </label>
            <label>Tier {clue.tier} explanation — English
              <textarea value={clue.explanation.en} onChange={(event) => updateClue(index, (next) => { next.explanation.en = event.target.value; })} />
            </label>
            <label>Tier {clue.tier} explanation — Estonian
              <textarea value={clue.explanation.et ?? ''} onChange={(event) => updateClue(index, (next) => { next.explanation.et = event.target.value || undefined; })} />
            </label>
          </div>
          <div className="source-summary">
            <strong>{clue.source.title}</strong>
            <span>{clue.source.url ?? 'Source URL unavailable'}</span>
            <span>{clue.source.license ?? 'License unavailable'}</span>
            <span>{clue.source.retrievedAt ?? 'Retrieval date unavailable'}</span>
            <span>{clue.source.translationStatus ?? 'Translation status unavailable'}</span>
          </div>
          <div className="content-metadata-grid">
            <label>Tier {clue.tier} source title
              <input value={clue.source.title} onChange={(event) => updateClue(index, (next) => { next.source.title = event.target.value; })} />
            </label>
            <label>Tier {clue.tier} source URL
              <input value={clue.source.url ?? ''} disabled={draft.ownership === 'bundled'} onChange={(event) => updateClue(index, (next) => { next.source.url = event.target.value || null; })} />
            </label>
            <label>Tier {clue.tier} source license
              <input value={clue.source.license ?? ''} disabled={draft.ownership === 'bundled'} onChange={(event) => updateClue(index, (next) => { next.source.license = event.target.value || null; })} />
            </label>
            <label>Tier {clue.tier} retrieval date
              <input type="date" value={clue.source.retrievedAt ?? ''} disabled={draft.ownership === 'bundled'} onChange={(event) => updateClue(index, (next) => { next.source.retrievedAt = event.target.value || null; })} />
            </label>
            <label>Tier {clue.tier} translation status
              <select value={clue.source.translationStatus ?? ''} disabled={draft.ownership === 'bundled'} onChange={(event) => updateClue(index, (next) => { next.source.translationStatus = (event.target.value || null) as typeof next.source.translationStatus; })}>
                <option value="">Not recorded</option><option value="untranslated">untranslated</option><option value="machine">machine</option><option value="reviewed">reviewed</option>
              </select>
            </label>
          </div>
          {clue.id !== null && onReport !== undefined ? (
            <div className="editor-actions">
              <label>Report note for tier {clue.tier}<input value={reportNotes[clue.tier] ?? ''} onChange={(event) => setReportNotes((current) => ({ ...current, [clue.tier]: event.target.value }))} /></label>
              <button type="button" disabled={clue.reported || !(reportNotes[clue.tier] ?? '').trim()} onClick={() => void onReport(clue.id!, reportNotes[clue.tier]!.trim())}>{clue.reported ? `Tier ${clue.tier} is reported` : `Report tier ${clue.tier}`}</button>
            </div>
          ) : null}
        </fieldset>
      ))}
      <ValidationPanel issues={validationAttempted ? validate(draft) : []} />
      {saveError ? <p role="alert">The category set could not be saved. Refresh and try again.</p> : null}
      <div className="editor-actions">
        <button className="primary-action" type="submit" disabled={pending}>Save category set</button>
        <button type="button" onClick={onCancel} disabled={pending}>Cancel</button>
      </div>
    </form>
  );
}

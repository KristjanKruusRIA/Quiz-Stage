import { useEffect, useRef, useState } from 'react';
import type { EditorFinalClue } from '../../../shared/content/editor';
import { ValidationPanel } from './ValidationPanel';
import { isHttpSourceUrl } from '../../../shared/content/sourceUrl';
import { hasValidAcceptedResponseEscapes } from '../../../shared/content/acceptedResponses';
import { useI18n, type Translate } from '../../i18n';

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

const FINAL_FIELD_KEYS = {
  prompt: ['editor.finalClueEnglish', 'editor.finalClueEstonian'],
  response: ['editor.finalResponseEnglish', 'editor.finalResponseEstonian'],
  explanation: ['editor.finalExplanationEnglish', 'editor.finalExplanationEstonian'],
  acceptedResponses: ['editor.finalAcceptedEnglish', 'editor.finalAcceptedEstonian'],
} as const;

function validate(value: EditorFinalClue | FinalClueDraft, t: Translate): string[] {
  const issues: string[] = [];
  if (!value.categoryName.en.trim()) issues.push(t('validation.finalCategoryEnglish'));
  if (!value.clue.prompt.en.trim()) issues.push(t('validation.finalClueEnglish'));
  if (!value.clue.response.en.trim()) issues.push(t('validation.finalResponseEnglish'));
  if (!value.clue.explanation.en.trim()) issues.push(t('validation.finalExplanationEnglish'));
  if (!value.macroTopic.trim()) issues.push(t('validation.categoryMacroTopic'));
  if (!value.clue.source.title.trim()) issues.push(t('validation.sourceTitle'));
  for (const [language, accepted] of [['English', value.clue.acceptedResponses?.en], ['Estonian', value.clue.acceptedResponses?.et]] as const) {
    if (accepted !== undefined && !hasValidAcceptedResponseEscapes(accepted)) issues.push(t('validation.acceptedEscape', { language: t(language === 'English' ? 'common.english' : 'common.estonian') }));
  }
  if (!('ownership' in value) || value.ownership !== 'bundled') {
    if (value.clue.source.url === null || !isHttpSourceUrl(value.clue.source.url)) issues.push(t('validation.sourceUrl'));
    if (value.clue.source.license === null || !value.clue.source.license.trim()) issues.push(t('validation.sourceLicense'));
    if (value.clue.source.retrievedAt === null) issues.push(t('validation.retrievalDate'));
    if (value.clue.source.translationStatus === null) issues.push(t('validation.translationStatus'));
  }
  return issues;
}

export function FinalClueEditor({ value, onSave, onCancel, onReport, reportPending = false }: FinalClueEditorProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(() => structuredClone(value));
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [reportNote, setReportNote] = useState('');
  const inFlight = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const cancel = () => {
    if (JSON.stringify(draft) !== JSON.stringify(value) && !window.confirm(t('editor.discardFinal'))) return;
    onCancel();
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inFlight.current) return;
    if (validate(draft, t).length > 0) return;
    inFlight.current = true; setPending(true); setError(null);
    try { await onSave(draft); } catch { setError(t('editor.finalSaveError')); }
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
  const issues = validate(draft, t);
  return <form className="content-editor" onSubmit={(event) => void submit(event)}>
    <h1 ref={heading} tabIndex={-1}>{t(draft.id === null ? 'editor.addFinal' : 'editor.editFinal')}</h1>
    <div className="bilingual-grid">
      {(['en', 'et'] as const).map((language) => <label key={`category-${language}`}>{t(language === 'en' ? 'editor.finalCategoryEnglish' : 'editor.finalCategoryEstonian')}<input value={draft.categoryName[language] ?? ''} onChange={(event) => setDraft({ ...draft, categoryName: { ...draft.categoryName, [language]: event.target.value || (language === 'et' ? undefined : '') } })} /></label>)}
      {(['prompt', 'response', 'explanation', 'acceptedResponses'] as const).flatMap((field) => (['en', 'et'] as const).map((language) => {
        return <label key={`${field}-${language}`}>{t(FINAL_FIELD_KEYS[field][language === 'en' ? 0 : 1])}{field === 'prompt' || field === 'explanation' ? <textarea value={draft.clue[field][language] ?? ''} onChange={(event) => localized(field, language, event.target.value)} /> : <input value={draft.clue[field]?.[language] ?? ''} onChange={(event) => localized(field, language, event.target.value)} />}</label>;
      }))}
    </div>
    <div className="content-metadata-grid">
      <label>{t('editor.difficulty')}<select value={draft.difficulty} onChange={(event) => setDraft({ ...draft, difficulty: event.target.value as typeof draft.difficulty })}><option value="easy">{t('common.easy')}</option><option value="medium">{t('common.medium')}</option><option value="hard">{t('common.hard')}</option></select></label>
      <label>{t('editor.macroTopic')}<input value={draft.macroTopic} onChange={(event) => setDraft({ ...draft, macroTopic: event.target.value })} /></label>
      <label>{t('editor.finalSourceTitle')}<input value={draft.clue.source.title} onChange={(event) => updateClue((clue) => { clue.source.title = event.target.value; })} /></label>
      <label>{t('editor.finalSourceUrl')}<input value={draft.clue.source.url ?? ''} disabled={value.id !== null && 'ownership' in value && value.ownership === 'bundled'} onChange={(event) => updateClue((clue) => { clue.source.url = event.target.value || null; })} /></label>
      <label>{t('editor.finalSourceLicense')}<input value={draft.clue.source.license ?? ''} disabled={value.id !== null && 'ownership' in value && value.ownership === 'bundled'} onChange={(event) => updateClue((clue) => { clue.source.license = event.target.value || null; })} /></label>
      <label>{t('editor.finalRetrieval')}<input type="date" value={draft.clue.source.retrievedAt ?? ''} disabled={value.id !== null && 'ownership' in value && value.ownership === 'bundled'} onChange={(event) => updateClue((clue) => { clue.source.retrievedAt = event.target.value || null; })} /></label>
      <label>{t('editor.finalTranslation')}<select value={draft.clue.source.translationStatus ?? ''} disabled={value.id !== null && 'ownership' in value && value.ownership === 'bundled'} onChange={(event) => updateClue((clue) => { clue.source.translationStatus = (event.target.value || null) as typeof clue.source.translationStatus; })}><option value="">{t('common.notRecorded')}</option><option value="untranslated">{t('common.untranslated')}</option><option value="machine">{t('common.machine')}</option><option value="reviewed">{t('common.reviewed')}</option></select></label>
      <label>{t('editor.finalEnabled')}<input type="checkbox" checked={draft.enabled && draft.clue.enabled} onChange={(event) => { const enabled = event.target.checked; setDraft((current) => { const next = structuredClone(current); next.enabled = enabled; next.clue.enabled = enabled; return next; }); }} /></label>
    </div>
    {draft.clue.id !== null && onReport !== undefined ? <div className="editor-actions"><label>{t('editor.reportFinalNote')}<input value={reportNote} onChange={(event) => setReportNote(event.target.value)} /></label><button type="button" disabled={reportPending || draft.clue.reported || !reportNote.trim()} onClick={() => void onReport(draft.clue.id!, reportNote.trim())}>{t(draft.clue.reported ? 'editor.finalReported' : 'editor.reportFinal')}</button></div> : null}
    <ValidationPanel issues={issues} />
    {error ? <p role="alert">{error}</p> : null}
    <div className="editor-actions"><button className="primary-action" type="submit" disabled={pending || issues.length > 0}>{t('editor.saveFinal')}</button><button type="button" disabled={pending} onClick={cancel}>{t('common.cancel')}</button></div>
  </form>;
}

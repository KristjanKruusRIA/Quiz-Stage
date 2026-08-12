import { useEffect, useRef, useState } from 'react';
import type { EditorCategorySet, EditorClue } from '../../../shared/content/editor';
import { ValidationPanel } from './ValidationPanel';
import { isHttpSourceUrl } from '../../../shared/content/sourceUrl';
import { hasValidAcceptedResponseEscapes } from '../../../shared/content/acceptedResponses';
import { formatNumber, useI18n, type Translate } from '../../i18n';

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
  reportPending?: boolean;
}

function validate(value: EditorCategorySet | CategorySetDraft, t: Translate): string[] {
  const issues: string[] = [];
  if (!value.name.en.trim()) issues.push(t('validation.categoryNameEnglish'));
  if (!value.macroTopic.trim()) issues.push(t('validation.categoryMacroTopic'));
  for (const clue of value.clues) {
    if (!clue.prompt.en.trim()) issues.push(t('validation.tierPrompt', { tier: clue.tier }));
    if (!clue.response.en.trim()) issues.push(t('validation.tierResponse', { tier: clue.tier }));
    if (!clue.explanation.en.trim()) issues.push(t('validation.tierExplanation', { tier: clue.tier }));
    if (!clue.source.title.trim()) issues.push(t('validation.tierSource', { tier: clue.tier }));
    for (const [language, accepted] of [['English', clue.acceptedResponses?.en], ['Estonian', clue.acceptedResponses?.et]] as const) {
      if (accepted !== undefined && !hasValidAcceptedResponseEscapes(accepted)) issues.push(t('validation.tierAcceptedEscape', { tier: clue.tier, language: t(language === 'English' ? 'common.english' : 'common.estonian') }));
    }
    if (value.ownership !== 'bundled') {
      if (clue.source.url === null || !isHttpSourceUrl(clue.source.url)) issues.push(t('validation.tierSourceUrl', { tier: clue.tier }));
      if (clue.source.license === null || !clue.source.license.trim()) issues.push(t('validation.tierSourceLicense', { tier: clue.tier }));
      if (clue.source.retrievedAt === null) issues.push(t('validation.tierRetrieval', { tier: clue.tier }));
      if (clue.source.translationStatus === null) issues.push(t('validation.tierTranslation', { tier: clue.tier }));
    }
  }
  return issues;
}

export function CategorySetEditor({ value, onSave, onCancel, onReport, reportPending = false }: CategorySetEditorProps) {
  const { locale, t } = useI18n();
  const [draft, setDraft] = useState(() => structuredClone(value));
  const [validationAttempted, setValidationAttempted] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [pending, setPending] = useState(false);
  const [reportNotes, setReportNotes] = useState<Record<number, string>>({});
  const inFlight = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  const cancel = () => {
    if (JSON.stringify(draft) !== JSON.stringify(value) && !window.confirm(t('editor.discardCategory'))) return;
    onCancel();
  };
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
    const nextIssues = validate(draft, t);
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
      <h1 ref={heading} tabIndex={-1}>{draft.id === null ? t('editor.addCategory') : t('editor.editCategory', { category: draft.name.en })}</h1>
      <div className="bilingual-grid">
        <label>{t('editor.categoryNameEnglish')}
          <input value={draft.name.en} onChange={(event) => setDraft({ ...draft, name: { ...draft.name, en: event.target.value } })} />
        </label>
        <label>{t('editor.categoryNameEstonian')}
          <input value={draft.name.et ?? ''} onChange={(event) => setDraft({ ...draft, name: { ...draft.name, et: event.target.value || undefined } })} />
        </label>
      </div>
      <div className="content-metadata-grid">
        <label>{t('editor.round')}
          <select value={draft.round} disabled={draft.id !== null} onChange={(event) => {
            const round = event.target.value as CategorySetDraft['round'];
            setDraft({ ...draft, round, clues: draft.clues.map((clue) => ({ ...clue, value: clue.tier * (round === 'round-one' ? 200 : 400) })) });
          }}><option value="round-one">{t('common.roundOne')}</option><option value="round-two">{t('common.doubleRound')}</option></select>
        </label>
        <label>{t('editor.difficulty')}
          <select value={draft.difficulty} onChange={(event) => setDraft({ ...draft, difficulty: event.target.value as CategorySetDraft['difficulty'] })}>
            <option value="easy">{t('common.easy')}</option><option value="medium">{t('common.medium')}</option><option value="hard">{t('common.hard')}</option>
          </select>
        </label>
        <label>{t('editor.macroTopic')}
          <input value={draft.macroTopic} onChange={(event) => setDraft({ ...draft, macroTopic: event.target.value })} />
        </label>
        <label>{t('editor.categoryEnabled')}
          <input type="checkbox" checked={draft.enabled} onChange={(event) => setDraft({ ...draft, enabled: event.target.checked })} />
        </label>
      </div>
      {draft.clues.map((clue, index) => (
        <fieldset className="tier-editor" key={clue.id ?? clue.tier} aria-label={t('editor.tier', { tier: clue.tier })}>
          <legend>{t('editor.tierLegend', { tier: clue.tier, value: formatNumber(locale, clue.value) })}</legend>
          <div className="bilingual-grid">
            <label>{t('editor.tierClueEnglish', { tier: clue.tier })}
              <textarea value={clue.prompt.en} onChange={(event) => updateClue(index, (next) => { next.prompt.en = event.target.value; })} />
            </label>
            <label>{t('editor.tierClueEstonian', { tier: clue.tier })}
              <textarea value={clue.prompt.et ?? ''} onChange={(event) => updateClue(index, (next) => { next.prompt.et = event.target.value || undefined; })} />
            </label>
            <label>{t('editor.tierResponseEnglish', { tier: clue.tier })}
              <input value={clue.response.en} onChange={(event) => updateClue(index, (next) => { next.response.en = event.target.value; })} />
            </label>
            <label>{t('editor.tierResponseEstonian', { tier: clue.tier })}
              <input value={clue.response.et ?? ''} onChange={(event) => updateClue(index, (next) => { next.response.et = event.target.value || undefined; })} />
            </label>
            <label>{t('editor.tierExplanationEnglish', { tier: clue.tier })}
              <textarea value={clue.explanation.en} onChange={(event) => updateClue(index, (next) => { next.explanation.en = event.target.value; })} />
            </label>
            <label>{t('editor.tierExplanationEstonian', { tier: clue.tier })}
              <textarea value={clue.explanation.et ?? ''} onChange={(event) => updateClue(index, (next) => { next.explanation.et = event.target.value || undefined; })} />
            </label>
            <label>{t('editor.tierAcceptedEnglish', { tier: clue.tier })}
              <input value={clue.acceptedResponses?.en ?? ''} onChange={(event) => updateClue(index, (next) => {
                const en = event.target.value; const et = next.acceptedResponses?.et;
                next.acceptedResponses = !en && et === undefined ? undefined : { en, ...(et === undefined ? {} : { et }) };
              })} />
            </label>
            <label>{t('editor.tierAcceptedEstonian', { tier: clue.tier })}
              <input value={clue.acceptedResponses?.et ?? ''} onChange={(event) => updateClue(index, (next) => {
                const en = next.acceptedResponses?.en ?? ''; const et = event.target.value || undefined;
                next.acceptedResponses = !en && et === undefined ? undefined : { en, ...(et === undefined ? {} : { et }) };
              })} />
            </label>
          </div>
          <div className="source-summary">
            <strong>{clue.source.title}</strong>
            <span>{clue.source.url ?? t('editor.sourceUrlUnavailable')}</span>
            <span>{clue.source.license ?? t('editor.licenseUnavailable')}</span>
            <span>{clue.source.retrievedAt ?? t('editor.retrievalUnavailable')}</span>
            <span>{clue.source.translationStatus === null ? t('editor.translationUnavailable') : t(`common.${clue.source.translationStatus}`)}</span>
          </div>
          <div className="content-metadata-grid">
            <label>{t('editor.tierEnabled', { tier: clue.tier })}
              <input type="checkbox" checked={clue.enabled} onChange={(event) => updateClue(index, (next) => { next.enabled = event.target.checked; })} />
            </label>
            <label>{t('editor.sourceTitle', { tier: clue.tier })}
              <input value={clue.source.title} onChange={(event) => updateClue(index, (next) => { next.source.title = event.target.value; })} />
            </label>
            <label>{t('editor.sourceUrl', { tier: clue.tier })}
              <input value={clue.source.url ?? ''} disabled={draft.ownership === 'bundled'} onChange={(event) => updateClue(index, (next) => { next.source.url = event.target.value || null; })} />
            </label>
            <label>{t('editor.sourceLicense', { tier: clue.tier })}
              <input value={clue.source.license ?? ''} disabled={draft.ownership === 'bundled'} onChange={(event) => updateClue(index, (next) => { next.source.license = event.target.value || null; })} />
            </label>
            <label>{t('editor.retrievalDate', { tier: clue.tier })}
              <input type="date" value={clue.source.retrievedAt ?? ''} disabled={draft.ownership === 'bundled'} onChange={(event) => updateClue(index, (next) => { next.source.retrievedAt = event.target.value || null; })} />
            </label>
            <label>{t('editor.translationStatus', { tier: clue.tier })}
              <select value={clue.source.translationStatus ?? ''} disabled={draft.ownership === 'bundled'} onChange={(event) => updateClue(index, (next) => { next.source.translationStatus = (event.target.value || null) as typeof next.source.translationStatus; })}>
                <option value="">{t('common.notRecorded')}</option><option value="untranslated">{t('common.untranslated')}</option><option value="machine">{t('common.machine')}</option><option value="reviewed">{t('common.reviewed')}</option>
              </select>
            </label>
          </div>
          {clue.id !== null && onReport !== undefined ? (
            <div className="editor-actions">
              <label>{t('editor.reportTierNote', { tier: clue.tier })}<input value={reportNotes[clue.tier] ?? ''} onChange={(event) => setReportNotes((current) => ({ ...current, [clue.tier]: event.target.value }))} /></label>
              <button type="button" disabled={reportPending || clue.reported || !(reportNotes[clue.tier] ?? '').trim()} onClick={() => void onReport(clue.id!, reportNotes[clue.tier]!.trim())}>{t(clue.reported ? 'editor.tierReported' : 'editor.reportTier', { tier: clue.tier })}</button>
            </div>
          ) : null}
        </fieldset>
      ))}
      <ValidationPanel issues={validationAttempted ? validate(draft, t) : []} />
      {saveError ? <p role="alert">{t('editor.categorySaveError')}</p> : null}
      <div className="editor-actions">
        <button className="primary-action" type="submit" disabled={pending}>{t('editor.saveCategory')}</button>
        <button type="button" onClick={cancel} disabled={pending}>{t('common.cancel')}</button>
      </div>
    </form>
  );
}

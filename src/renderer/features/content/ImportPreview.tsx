import { useRef, useState } from 'react';
import type { ContentImportPreview } from '../../../shared/content/editor';
import { useI18n } from '../../i18n';
import { formatImportIssue } from './importDiagnostics';

interface ImportPreviewProps {
  preview: Exclude<ContentImportPreview, { cancelled: true }>;
  onCommit: (conflict?: 'replace-existing' | 'keep-both') => Promise<unknown> | unknown;
  onCancel: () => void;
}

export function ImportPreview({ preview, onCommit, onCancel }: ImportPreviewProps) {
  const { locale, t } = useI18n();
  const [strategy, setStrategy] = useState<'replace-existing' | 'keep-both'>('keep-both');
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);
  const commit = async () => {
    if (inFlight.current || preview.issues.length > 0) return;
    inFlight.current = true;
    setPending(true);
    setFailed(false);
    try { await onCommit(preview.conflict ? strategy : undefined); } catch { setFailed(true); }
    finally { inFlight.current = false; setPending(false); }
  };
  return (
    <section className="import-preview" aria-labelledby="import-preview-title">
      <h2 id="import-preview-title">{t('import.preview', { pack: preview.packName ?? t('import.invalidPack') })}</h2>
      <p>{t('import.rows', { count: preview.rowCount })}</p>
      {preview.issues.length > 0 ? (
        <ul aria-label={t('import.issues')}>
          {preview.issues.map((issue, index) => (
            <li key={`${issue.row ?? 0}-${issue.column ?? ''}-${issue.code}-${index}`}>
              {formatImportIssue(locale, issue)}
            </li>
          ))}
        </ul>
      ) : <p role="status">{t('import.allValid')}</p>}
      {preview.conflict ? (
        <fieldset><legend>{t('import.conflict')}</legend>
          <label><input type="radio" name="import-conflict" checked={strategy === 'keep-both'} onChange={() => setStrategy('keep-both')} />{t('import.keepBoth')}</label>
          <label><input type="radio" name="import-conflict" checked={strategy === 'replace-existing'} onChange={() => setStrategy('replace-existing')} />{t('import.replace')}</label>
        </fieldset>
      ) : null}
      {failed ? <p role="alert">{t('import.failed')}</p> : null}
      <div className="editor-actions">
        <button className="primary-action" type="button" disabled={pending || !preview.valid || preview.issues.length > 0} onClick={() => void commit()}>{t('import.commit')}</button>
        <button type="button" disabled={pending} onClick={onCancel}>{t('import.cancel')}</button>
      </div>
    </section>
  );
}

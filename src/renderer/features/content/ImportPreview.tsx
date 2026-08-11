import { useRef, useState } from 'react';
import type { ContentImportPreview } from '../../../shared/content/editor';

interface ImportPreviewProps {
  preview: Exclude<ContentImportPreview, { cancelled: true }>;
  onCommit: (conflict?: 'replace-existing' | 'keep-both') => Promise<unknown> | unknown;
  onCancel: () => void;
}

export function ImportPreview({ preview, onCommit, onCancel }: ImportPreviewProps) {
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
      <h2 id="import-preview-title">Import preview: {preview.packName}</h2>
      <p>{preview.rowCount} rows · no changes have been written.</p>
      {preview.issues.length > 0 ? (
        <ul aria-label="Import validation issues">
          {preview.issues.map((issue, index) => (
            <li key={`${issue.row ?? 0}-${issue.column ?? ''}-${issue.code}-${index}`}>
              {issue.row === undefined ? '' : `Row ${issue.row}${issue.column === undefined ? '' : `, ${issue.column}`}: `}{issue.message}
            </li>
          ))}
        </ul>
      ) : <p role="status">All rows are valid.</p>}
      {preview.conflict ? (
        <fieldset><legend>Pack ID conflict</legend>
          <label><input type="radio" checked={strategy === 'keep-both'} onChange={() => setStrategy('keep-both')} />Keep both</label>
          <label><input type="radio" checked={strategy === 'replace-existing'} onChange={() => setStrategy('replace-existing')} />Replace existing</label>
        </fieldset>
      ) : null}
      {failed ? <p role="alert">Import failed. The library was not changed.</p> : null}
      <div className="editor-actions">
        <button className="primary-action" type="button" disabled={pending || preview.issues.length > 0} onClick={() => void commit()}>Import pack</button>
        <button type="button" disabled={pending} onClick={onCancel}>Cancel import</button>
      </div>
    </section>
  );
}

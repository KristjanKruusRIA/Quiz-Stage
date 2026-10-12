import { useRef, useState } from 'react';
import type { EditorLibrary } from '../../../shared/content/editor';
import { useI18n } from '../../i18n';

export function ContentCredits({ loadContent }: { loadContent?: () => Promise<EditorLibrary> }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [library, setLibrary] = useState<EditorLibrary | null>(null);
  const [packId, setPackId] = useState('');
  const [error, setError] = useState(false);
  const loading = useRef(false);
  const load = () => {
    if (loadContent === undefined || loading.current || library !== null) return;
    loading.current = true;
    setError(false);
    void loadContent().then((value) => {
      setLibrary(value);
      setPackId(value.packs[0]?.id ?? '');
    }, () => setError(true)).finally(() => { loading.current = false; });
  };
  const pack = library?.packs.find((value) => value.id === packId);
  const clues = pack === undefined ? [] : [
    ...pack.categorySets.flatMap((set) => set.clues), ...pack.finalClues.map((final) => final.clue),
  ];
  return <section className="content-credits" aria-label={t('settings.contentCredits')}>
    <button type="button" aria-expanded={open} aria-controls="content-credits" onClick={() => {
      setOpen(!open);
      if (!open) load();
    }}>{t('settings.contentCredits')}</button>
    {open ? <article id="content-credits">
      <p>{t('settings.contentChanges')}</p>
      <p>{t('settings.contentLicense')}</p>
      <p>https://creativecommons.org/licenses/by-sa/4.0/</p>
      <p>{t('settings.wikipediaCredit')} https://www.wikipedia.org/</p>
      <p>Open Trivia Database (OpenTDB): https://opentdb.com/ — CC-BY-SA-4.0</p>
      {error ? <><p role="alert">{t('settings.creditsLoadError')}</p>
        <button type="button" onClick={load}>{t('common.retry')}</button></>
        : library === null && loadContent !== undefined ? <p role="status">{t('settings.creditsLoading')}</p> : null}
      {library !== null ? <>
        <label htmlFor="credits-pack">{t('settings.creditsPack')}</label>
        <select id="credits-pack" value={packId} onChange={(event) => setPackId(event.target.value)}>
          {library.packs.map((value) => <option key={value.id} value={value.id}>{value.name}</option>)}
        </select>
        <ul tabIndex={0} aria-label={t('settings.contentCredits')}>{clues.map((clue) => <li key={clue.id}>
          <p><strong>{clue.source.title}</strong> — {clue.id}</p>
          {clue.source.url === null ? null : <p>{clue.source.url}</p>}
          <p>{clue.source.license ?? t('common.notRecorded')}</p>
          {clue.source.inspiration === undefined ? null : <p>
            {t('settings.creditsInspiration')}: {clue.source.inspiration.system} — {clue.source.inspiration.candidateId}
            {' — '}{clue.source.inspiration.license}
          </p>}
        </li>)}</ul>
      </> : null}
    </article> : null}
  </section>;
}

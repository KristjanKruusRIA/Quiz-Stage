import type { EditorPack } from '../../../shared/content/editor';
import { useI18n } from '../../i18n';

interface PackListProps {
  packs: readonly EditorPack[];
  onEditCategory: (pack: EditorPack, categoryId: string) => void;
  onEditFinal: (pack: EditorPack, clueId: string) => void;
  onAddCategory: (pack: EditorPack) => void;
  onAddFinal: (pack: EditorPack) => void;
  onDeletePack: (pack: EditorPack) => void;
  onExport: (pack: EditorPack) => void;
  pendingActions?: ReadonlySet<string>;
}
const NO_PENDING_ACTIONS: ReadonlySet<string> = new Set();

export function PackList({ packs, onEditCategory, onEditFinal, onAddCategory, onAddFinal, onDeletePack, onExport, pendingActions = NO_PENDING_ACTIONS }: PackListProps) {
  const { t } = useI18n();
  return (
    <div className="pack-list">
      {packs.map((pack) => (
        <section className="pack-card" key={pack.id} aria-labelledby={`pack-${pack.id}`}>
          <div className="section-heading">
            <div><h2 id={`pack-${pack.id}`}>{pack.name}</h2><p className="muted">{t(pack.ownership === 'custom' ? 'content.custom' : 'content.bundled')}</p></div>
            <div className="editor-actions">
              <button type="button" disabled={pendingActions.has(`export:${pack.id}`)} onClick={() => onExport(pack)}>{t('content.exportCsv')}</button>
              {pack.ownership === 'custom' ? <button type="button" onClick={() => onAddCategory(pack)}>{t('content.addCategory')}</button> : null}
              {pack.ownership === 'custom' ? <button type="button" onClick={() => onAddFinal(pack)}>{t('content.addFinal')}</button> : null}
              {pack.ownership === 'custom' ? <button type="button" disabled={pendingActions.has(`delete:${pack.id}`)} onClick={() => onDeletePack(pack)}>{t('content.deletePack')}</button> : null}
            </div>
          </div>
          <ul className="content-record-list">
            {pack.categorySets.map((set) => (
              <li key={set.id} className={set.clues.some((clue) => clue.reported) ? 'reported-record' : ''}>
                <span>{t('common.english')}: {set.name.en} / {t('common.estonian')}: {set.name.et ?? t('content.missing')} · {t('content.roundDifficulty', { round: t(set.round === 'round-one' ? 'common.roundOne' : 'common.doubleRound'), difficulty: t(`common.${set.difficulty}`) })}</span>
                <span>{t('content.languageEligibility', { english: t(set.eligibility.en ? 'content.eligible' : 'content.blocked'), estonian: t(set.eligibility.et ? 'content.eligible' : 'content.blocked') })}</span>
                <button type="button" onClick={() => onEditCategory(pack, set.id)}>
                  {t(set.clues.some((clue) => clue.reported) ? 'content.editReportedCategory' : 'content.editCategory', { category: set.name.en })}
                </button>
              </li>
            ))}
            {pack.finalClues.map((final) => (
              <li key={final.id} className={final.clue.reported ? 'reported-record' : ''}>
                <span>{t('content.finalRecord', { english: final.categoryName.en, estonian: final.categoryName.et ?? t('content.missing') })}</span>
                <button type="button" onClick={() => onEditFinal(pack, final.id)}>{t(final.clue.reported ? 'content.editReportedFinal' : 'content.editFinal', { category: final.categoryName.en })}</button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

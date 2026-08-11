import type { EditorPack } from '../../../shared/content/editor';

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
  return (
    <div className="pack-list">
      {packs.map((pack) => (
        <section className="pack-card" key={pack.id} aria-labelledby={`pack-${pack.id}`}>
          <div className="section-heading">
            <div><h2 id={`pack-${pack.id}`}>{pack.name}</h2><p className="muted">{pack.ownership}</p></div>
            <div className="editor-actions">
              <button type="button" disabled={pendingActions.has(`export:${pack.id}`)} onClick={() => onExport(pack)}>Export CSV</button>
              {pack.ownership === 'custom' ? <button type="button" onClick={() => onAddCategory(pack)}>Add category set</button> : null}
              {pack.ownership === 'custom' ? <button type="button" onClick={() => onAddFinal(pack)}>Add Final clue</button> : null}
              {pack.ownership === 'custom' ? <button type="button" disabled={pendingActions.has(`delete:${pack.id}`)} onClick={() => onDeletePack(pack)}>Delete pack</button> : null}
            </div>
          </div>
          <ul className="content-record-list">
            {pack.categorySets.map((set) => (
              <li key={set.id} className={set.clues.some((clue) => clue.reported) ? 'reported-record' : ''}>
                <span>{set.name.en} / {set.name.et ?? 'ET missing'} · {set.round} · {set.difficulty}</span>
                <span>EN {set.eligibility.en ? 'eligible' : 'blocked'} · ET {set.eligibility.et ? 'eligible' : 'blocked'}</span>
                <button type="button" onClick={() => onEditCategory(pack, set.id)}>
                  Edit {set.clues.some((clue) => clue.reported) ? 'reported clue' : 'category set'} {set.name.en}
                </button>
              </li>
            ))}
            {pack.finalClues.map((final) => (
              <li key={final.id} className={final.clue.reported ? 'reported-record' : ''}>
                <span>Final: {final.categoryName.en} / {final.categoryName.et ?? 'ET missing'}</span>
                <button type="button" onClick={() => onEditFinal(pack, final.id)}>Edit {final.clue.reported ? 'reported clue' : 'Final'} {final.categoryName.en}</button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

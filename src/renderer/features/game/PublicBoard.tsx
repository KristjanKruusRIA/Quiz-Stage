import type { PublicGameView } from '../../../shared/game/types';
import { createTranslator, formatNumber } from '../../i18n';

interface PublicBoardProps {
  view: PublicGameView;
  onSelect?: (tileId: string) => void;
}

export function PublicBoard({ view, onSelect }: PublicBoardProps) {
  const board = view.board;
  if (board === null) return null;
  const t = createTranslator(view.language);
  const label = t(board.round === 'round-one' ? 'game.roundOneBoard' : 'game.doubleRoundBoard');
  return <section className="public-board" role="grid" aria-label={label}>
    <div role="rowgroup" className="board-rowgroup">
      <div role="row" className="board-row board-header-row">
        {board.categories.map((category) => <h2 role="columnheader" key={category.id}>{category.name}</h2>)}
      </div>
    </div>
    <div role="rowgroup" className="board-rowgroup">
      {Array.from({ length: 5 }, (_, clueIndex) => <div role="row" className="board-row" key={clueIndex}>
        {board.categories.map((category) => {
          const clue = category.clues[clueIndex];
          return <div role="gridcell" key={clue.id}>
            <button
              type="button"
              disabled={clue.selected || onSelect === undefined}
              aria-label={t('game.tileLabel', { category: category.name, value: formatNumber(view.language, clue.value) })}
              onClick={() => onSelect?.(clue.id)}
            >{clue.selected ? '—' : formatNumber(view.language, clue.value)}</button>
          </div>;
        })}
      </div>)}
    </div>
  </section>;
}

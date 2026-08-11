import type { PublicGameView } from '../../../shared/game/types';

interface PublicBoardProps {
  view: PublicGameView;
  onSelect?: (tileId: string) => void;
}

export function PublicBoard({ view, onSelect }: PublicBoardProps) {
  const board = view.board;
  if (board === null) return null;
  const label = board.round === 'round-one' ? 'Round One board' : 'Double Round board';
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
              aria-label={`${category.name} for ${clue.value}`}
              onClick={() => onSelect?.(clue.id)}
            >{clue.selected ? '—' : clue.value}</button>
          </div>;
        })}
      </div>)}
    </div>
  </section>;
}

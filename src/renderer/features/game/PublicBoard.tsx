import type { PublicGameView } from '../../../shared/game/types';

interface PublicBoardProps {
  view: PublicGameView;
  onSelect?: (tileId: string) => void;
}

export function PublicBoard({ view, onSelect }: PublicBoardProps) {
  if (view.board === null) return null;
  const label = view.board.round === 'round-one' ? 'Round One board' : 'Double Round board';
  return <section className="public-board" role="grid" aria-label={label}>
    {view.board.categories.map((category) => <div className="board-column" role="rowgroup" key={category.id}>
      <h2 role="columnheader">{category.name}</h2>
      {category.clues.map((clue) => <div role="gridcell" key={clue.id}>
        <button
          type="button"
          disabled={clue.selected || onSelect === undefined}
          aria-label={`${category.name} for ${clue.value}`}
          onClick={() => onSelect?.(clue.id)}
        >{clue.selected ? '—' : clue.value}</button>
      </div>)}
    </div>)}
  </section>;
}

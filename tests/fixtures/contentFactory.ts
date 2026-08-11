import type { Difficulty, GameConfig, Round } from '../../src/shared/game/types';
import type {
  FinalClue,
  SelectableCategorySet,
  SelectableClue,
  SelectionInput,
} from '../../src/shared/game/boardSelector';

const teams = [
  { id: 'team-1', name: 'Alpha', color: '#E3B341' },
  { id: 'team-2', name: 'Beta', color: '#50A7F5' },
];

export function gameConfig(overrides: Partial<GameConfig> = {}): GameConfig {
  return {
    language: 'en',
    difficulty: 'medium',
    clueSeconds: 15,
    teams,
    packIds: ['enabled-pack'],
    displayMode: 'single',
    ...overrides,
  };
}

export function selectableClue(
  categoryId: string,
  round: Extract<Round, 'round-one' | 'round-two'>,
  tier: number,
  overrides: Partial<SelectableClue> = {},
): SelectableClue {
  return {
    id: `${categoryId}-clue-${tier}`,
    categoryId,
    round,
    tier,
    value: tier * (round === 'round-one' ? 200 : 400),
    prompt: { en: `Prompt ${categoryId} ${tier}`, et: `Kusimus ${categoryId} ${tier}` },
    response: { en: `Response ${categoryId} ${tier}`, et: `Vastus ${categoryId} ${tier}` },
    explanation: { en: `Explanation ${categoryId} ${tier}`, et: `Selgitus ${categoryId} ${tier}` },
    source: `Source ${categoryId} ${tier}`,
    enabled: true,
    ...overrides,
  };
}

export function categorySet(
  id: string,
  round: Extract<Round, 'round-one' | 'round-two'>,
  overrides: Partial<SelectableCategorySet> = {},
): SelectableCategorySet {
  return {
    id,
    packId: 'enabled-pack',
    enabled: true,
    difficulty: 'medium',
    round,
    name: { en: `Category ${id}`, et: `Kategooria ${id}` },
    macroTopic: `topic-${Number(id.match(/\d+$/)?.[0] ?? 0) % 3}`,
    clues: [1, 2, 3, 4, 5].map((tier) => selectableClue(id, round, tier)),
    lastSeenAt: null,
    ...overrides,
  };
}

export function finalClue(
  id: string,
  difficulty: Difficulty = 'medium',
  overrides: Partial<FinalClue> = {},
): FinalClue {
  return {
    id,
    packId: 'enabled-pack',
    enabled: true,
    difficulty,
    categoryId: `final-category-${id}`,
    categoryName: { en: `Final category ${id}`, et: `Finaalkategooria ${id}` },
    round: 'final',
    tier: 0,
    value: 0,
    prompt: { en: `Final prompt ${id}`, et: `Finaalkusimus ${id}` },
    response: { en: `Final response ${id}`, et: `Finaalvastus ${id}` },
    explanation: { en: `Final explanation ${id}`, et: `Finaalselgitus ${id}` },
    source: `Final source ${id}`,
    lastSeenAt: null,
    ...overrides,
  };
}

export function selectionInput(overrides: Partial<SelectionInput> = {}): SelectionInput {
  return {
    config: gameConfig(),
    seed: 'fixed-seed',
    categorySets: [
      ...Array.from({ length: 8 }, (_, index) => categorySet(`r1-${index + 1}`, 'round-one')),
      ...Array.from({ length: 8 }, (_, index) => categorySet(`r2-${index + 1}`, 'round-two')),
    ],
    finalClues: [finalClue('final-1'), finalClue('final-2'), finalClue('final-3')],
    ...overrides,
  };
}

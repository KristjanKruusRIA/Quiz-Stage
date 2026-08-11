import type { Board, Category, Clue, Difficulty, GameConfig, Language } from './types';

const CATEGORIES_PER_BOARD = 6;
const MAX_MACRO_TOPIC_PER_BOARD = 2;
const REQUIRED_TIERS = [1, 2, 3, 4, 5];

export interface SelectableClue extends Clue {
  enabled: boolean;
}

export interface SelectableCategorySet extends Omit<Category, 'clues'> {
  packId: string;
  enabled: boolean;
  difficulty: Difficulty;
  round: Board['round'];
  clues: SelectableClue[];
  lastSeenAt?: number | string | null;
}

export interface FinalClue extends Clue {
  packId: string;
  enabled: boolean;
  difficulty: Difficulty;
  categoryName: Category['name'];
  round: Extract<Clue['round'], 'final' | 'tiebreaker'>;
  lastSeenAt?: number | string | null;
}

export interface SelectionInput {
  config: GameConfig;
  seed: string;
  categorySets: readonly SelectableCategorySet[];
  finalClues: readonly FinalClue[];
}

export interface SelectedMatch {
  ok: true;
  seed: string;
  boards: [Board, Board];
  roundOne: Board;
  roundTwo: Board;
  categorySets: SelectableCategorySet[];
  dailyDoubleClueIds: string[];
  final: FinalClue;
  finalClue: FinalClue;
  tiebreakerClues: FinalClue[];
}

export interface SelectionShortage {
  ok: false;
  roundOneMissing: number;
  roundTwoMissing: number;
  finalMissing: 0 | 1;
}

export type SelectedMatchContent = SelectedMatch | SelectionShortage;

export function createSeededRandom(seed: string): () => number {
  let state = 0x811c9dc5;
  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 0x01000193);
  }

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function selectMatchContent(input: SelectionInput): SelectedMatchContent {
  const roundOneCandidates = eligibleCategorySets(input, 'round-one');
  const roundTwoCandidates = eligibleCategorySets(input, 'round-two');
  const finals = eligibleFinalClues(input);
  const boards = findCompleteBoards(roundOneCandidates, roundTwoCandidates, input.config.language);

  if (boards === null || finals.length === 0) {
    const roundOneAvailable = maximumBoardSize(roundOneCandidates, input.config.language);
    const roundTwoAvailable = maximumBoardSize(roundTwoCandidates, input.config.language);
    let roundTwoMissing = CATEGORIES_PER_BOARD - roundTwoAvailable;

    if (roundOneAvailable === CATEGORIES_PER_BOARD && roundTwoAvailable === CATEGORIES_PER_BOARD && boards === null) {
      roundTwoMissing = crossRoundMissing(roundOneCandidates, roundTwoCandidates, input.config.language);
    }

    return {
      ok: false,
      roundOneMissing: CATEGORIES_PER_BOARD - roundOneAvailable,
      roundTwoMissing,
      finalMissing: finals.length === 0 ? 1 : 0,
    };
  }

  const [roundOneSets, roundTwoSets] = boards;
  const roundOne = createBoard('round-one', input.seed, roundOneSets);
  const roundTwo = createBoard('round-two', input.seed, roundTwoSets);
  const final = finals[0];
  const dailyDoubleClueIds = selectDailyDoubles(roundOne, roundTwo, input.seed);

  return {
    ok: true,
    seed: input.seed,
    boards: [roundOne, roundTwo],
    roundOne,
    roundTwo,
    categorySets: [...roundOneSets, ...roundTwoSets],
    dailyDoubleClueIds,
    final,
    finalClue: final,
    tiebreakerClues: [],
  };
}

export function selectNextTiebreakerClue(
  input: SelectionInput,
  excludedIds: readonly string[],
  tieIndex: number,
): FinalClue {
  const excluded = new Set(excludedIds);
  const candidates = eligibleFinalClues(input, excluded, `tiebreaker:${tieIndex}`);
  const selected = candidates[0];
  if (selected === undefined) {
    throw new Error('No unused Final-eligible clue is available for the tiebreaker');
  }

  return { ...selected, round: 'tiebreaker' };
}

function eligibleCategorySets(input: SelectionInput, round: Board['round']): SelectableCategorySet[] {
  const enabledPacks = new Set(input.config.packIds);
  const eligible = input.categorySets.flatMap((categorySet) => {
    if (
      !categorySet.enabled
      || !enabledPacks.has(categorySet.packId)
      || categorySet.difficulty !== input.config.difficulty
      || categorySet.round !== round
      || !hasLocalizedText(categorySet.name, input.config.language)
    ) {
      return [];
    }

    const clues = categorySet.clues
      .filter((clue) => clue.enabled)
      .sort((left, right) => left.tier - right.tier);
    if (
      clues.length !== REQUIRED_TIERS.length
      || clues.some((clue, index) =>
        clue.tier !== REQUIRED_TIERS[index]
        || clue.round !== round
        || clue.categoryId !== categorySet.id
        || !isLocalizedClueComplete(clue, input.config.language))
    ) {
      return [];
    }

    return [{ ...categorySet, clues }];
  });

  return rankWithSeed(eligible, input.seed, round);
}

function eligibleFinalClues(
  input: SelectionInput,
  excludedIds: ReadonlySet<string> = new Set(),
  seedScope = 'final',
): FinalClue[] {
  const enabledPacks = new Set(input.config.packIds);
  const eligible = input.finalClues.filter((clue) =>
    clue.enabled
    && enabledPacks.has(clue.packId)
    && clue.difficulty === input.config.difficulty
    && clue.round === 'final'
    && !excludedIds.has(clue.id)
    && hasLocalizedText(clue.categoryName, input.config.language)
    && isLocalizedClueComplete(clue, input.config.language),
  );

  return rankWithSeed(eligible, input.seed, seedScope);
}

function hasLocalizedText(text: Category['name'], language: Language): boolean {
  return typeof text[language] === 'string' && text[language]!.trim().length > 0;
}

function isLocalizedClueComplete(clue: Clue, language: Language): boolean {
  return hasLocalizedText(clue.prompt, language)
    && hasLocalizedText(clue.response, language)
    && hasLocalizedText(clue.explanation, language)
    && (clue.acceptedResponses === undefined || hasLocalizedText(clue.acceptedResponses, language));
}

function rankWithSeed<T extends { id: string; lastSeenAt?: number | string | null }>(
  candidates: readonly T[],
  seed: string,
  scope: string,
): T[] {
  const groups = new Map<number, T[]>();
  for (const candidate of candidates) {
    const rank = usageRank(candidate.lastSeenAt);
    const group = groups.get(rank) ?? [];
    group.push(candidate);
    groups.set(rank, group);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left - right)
    .flatMap(([rank, group]) => seededShuffle(
      [...group].sort((left, right) => left.id.localeCompare(right.id)),
      `${seed}:${scope}:${rank}`,
    ));
}

function usageRank(lastSeenAt: number | string | null | undefined): number {
  if (lastSeenAt === null || lastSeenAt === undefined) return Number.NEGATIVE_INFINITY;
  if (typeof lastSeenAt === 'number') return lastSeenAt;
  const parsed = Date.parse(lastSeenAt);
  return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
}

function seededShuffle<T>(values: readonly T[], seed: string): T[] {
  const result = [...values];
  const random = createSeededRandom(seed);
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function findCompleteBoards(
  roundOne: readonly SelectableCategorySet[],
  roundTwo: readonly SelectableCategorySet[],
  language: Language,
): [SelectableCategorySet[], SelectableCategorySet[]] | null {
  let result: [SelectableCategorySet[], SelectableCategorySet[]] | null = null;
  visitBoardSelections(roundOne, CATEGORIES_PER_BOARD, language, new Set(), (selectedRoundOne) => {
    const usedNames = new Set(selectedRoundOne.map((category) => normalizedName(category, language)));
    const selectedRoundTwo = firstBoardSelection(roundTwo, CATEGORIES_PER_BOARD, language, usedNames);
    if (selectedRoundTwo === null) return false;
    result = [selectedRoundOne, selectedRoundTwo];
    return true;
  });
  return result;
}

function firstBoardSelection(
  candidates: readonly SelectableCategorySet[],
  size: number,
  language: Language,
  excludedNames: ReadonlySet<string>,
): SelectableCategorySet[] | null {
  let result: SelectableCategorySet[] | null = null;
  visitBoardSelections(candidates, size, language, excludedNames, (selection) => {
    result = selection;
    return true;
  });
  return result;
}

function visitBoardSelections(
  candidates: readonly SelectableCategorySet[],
  size: number,
  language: Language,
  excludedNames: ReadonlySet<string>,
  visitor: (selection: SelectableCategorySet[]) => boolean,
): boolean {
  const selected: SelectableCategorySet[] = [];
  const selectedNames = new Set(excludedNames);
  const macroCounts = new Map<string, number>();

  function visit(startIndex: number): boolean {
    if (selected.length === size) return visitor([...selected]);
    if (candidates.length - startIndex < size - selected.length) return false;

    for (let index = startIndex; index < candidates.length; index += 1) {
      if (candidates.length - index < size - selected.length) return false;
      const candidate = candidates[index];
      const name = normalizedName(candidate, language);
      const macroCount = macroCounts.get(candidate.macroTopic) ?? 0;
      if (selectedNames.has(name) || macroCount >= MAX_MACRO_TOPIC_PER_BOARD) continue;

      selected.push(candidate);
      selectedNames.add(name);
      macroCounts.set(candidate.macroTopic, macroCount + 1);
      if (visit(index + 1)) return true;
      selected.pop();
      selectedNames.delete(name);
      if (macroCount === 0) macroCounts.delete(candidate.macroTopic);
      else macroCounts.set(candidate.macroTopic, macroCount);
    }
    return false;
  }

  return visit(0);
}

function maximumBoardSize(candidates: readonly SelectableCategorySet[], language: Language): number {
  for (let size = CATEGORIES_PER_BOARD; size > 0; size -= 1) {
    if (firstBoardSelection(candidates, size, language, new Set()) !== null) return size;
  }
  return 0;
}

function crossRoundMissing(
  roundOne: readonly SelectableCategorySet[],
  roundTwo: readonly SelectableCategorySet[],
  language: Language,
): number {
  for (let roundTwoSize = CATEGORIES_PER_BOARD - 1; roundTwoSize > 0; roundTwoSize -= 1) {
    let found = false;
    visitBoardSelections(roundOne, CATEGORIES_PER_BOARD, language, new Set(), (selectedRoundOne) => {
      const usedNames = new Set(selectedRoundOne.map((category) => normalizedName(category, language)));
      found = firstBoardSelection(roundTwo, roundTwoSize, language, usedNames) !== null;
      return found;
    });
    if (found) return CATEGORIES_PER_BOARD - roundTwoSize;
  }
  return CATEGORIES_PER_BOARD;
}

function normalizedName(category: SelectableCategorySet, language: Language): string {
  return category.name[language]!.trim().toLocaleLowerCase(language === 'et' ? 'et' : 'en');
}

function createBoard(
  round: Board['round'],
  seed: string,
  categories: readonly SelectableCategorySet[],
): Board {
  return {
    id: `${round}-${seed}`,
    round,
    categories: [...categories],
  };
}

function selectDailyDoubles(roundOne: Board, roundTwo: Board, seed: string): string[] {
  const roundOneIds = roundOne.categories.flatMap((category) => category.clues.map((clue) => clue.id));
  const roundTwoIds = roundTwo.categories.flatMap((category) => category.clues.map((clue) => clue.id));
  const roundOneRandom = createSeededRandom(`${seed}:daily-double:round-one`);
  const shuffledRoundTwo = seededShuffle(roundTwoIds, `${seed}:daily-double:round-two`);

  return [
    roundOneIds[Math.floor(roundOneRandom() * roundOneIds.length)],
    shuffledRoundTwo[0],
    shuffledRoundTwo[1],
  ];
}

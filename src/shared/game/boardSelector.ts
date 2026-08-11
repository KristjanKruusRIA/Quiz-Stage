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
  const allocation = findBestJointAllocation(roundOneCandidates, roundTwoCandidates, input.config.language);
  const hasCompleteBoards = allocation.roundOne.length === CATEGORIES_PER_BOARD
    && allocation.roundTwo.length === CATEGORIES_PER_BOARD;

  if (!hasCompleteBoards || finals.length === 0) {
    return {
      ok: false,
      roundOneMissing: CATEGORIES_PER_BOARD - allocation.roundOne.length,
      roundTwoMissing: CATEGORIES_PER_BOARD - allocation.roundTwo.length,
      finalMissing: finals.length === 0 ? 1 : 0,
    };
  }

  const { roundOne: roundOneSets, roundTwo: roundTwoSets } = allocation;
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

interface CategoryOption {
  category: SelectableCategorySet;
  rank: number;
  round: Board['round'];
}

interface NameGroup {
  options: CategoryOption[];
}

interface JointAllocation {
  roundOne: SelectableCategorySet[];
  roundTwo: SelectableCategorySet[];
}

interface JointSearchIndex {
  groups: NameGroup[];
  roundOneSuffixCounts: number[];
  roundTwoSuffixCounts: number[];
  roundOneTopicPositions: Map<string, number[]>;
  roundTwoTopicPositions: Map<string, number[]>;
}

function findBestJointAllocation(
  roundOne: readonly SelectableCategorySet[],
  roundTwo: readonly SelectableCategorySet[],
  language: Language,
): JointAllocation {
  const searchIndex = buildJointSearchIndex(roundOne, roundTwo, language);

  // Shortages maximize total fill, then prefer filling Round One before Round Two.
  for (let total = CATEGORIES_PER_BOARD * 2; total >= 0; total -= 1) {
    const maximumRoundOne = Math.min(CATEGORIES_PER_BOARD, total);
    const minimumRoundOne = Math.max(0, total - CATEGORIES_PER_BOARD);
    for (let roundOneSize = maximumRoundOne; roundOneSize >= minimumRoundOne; roundOneSize -= 1) {
      const allocation = findJointAllocation(searchIndex, roundOneSize, total - roundOneSize);
      if (allocation !== null) return allocation;
    }
  }

  return { roundOne: [], roundTwo: [] };
}

function buildJointSearchIndex(
  roundOne: readonly SelectableCategorySet[],
  roundTwo: readonly SelectableCategorySet[],
  language: Language,
): JointSearchIndex {
  const groupsByName = new Map<string, Map<string, CategoryOption>>();

  function addCandidates(candidates: readonly SelectableCategorySet[], round: Board['round']): void {
    candidates.forEach((category, rank) => {
      const name = normalizedName(category, language);
      const options = groupsByName.get(name) ?? new Map<string, CategoryOption>();
      const dominanceKey = `${round}\u0000${category.macroTopic}`;
      if (!options.has(dominanceKey)) options.set(dominanceKey, { category, rank, round });
      groupsByName.set(name, options);
    });
  }

  addCandidates(roundOne, 'round-one');
  addCandidates(roundTwo, 'round-two');

  const groups = [...groupsByName.values()].map((options) => ({
    options: [...options.values()].sort(compareOptions),
  }));
  const roundOneSuffixCounts = buildSuffixCounts(groups, 'round-one');
  const roundTwoSuffixCounts = buildSuffixCounts(groups, 'round-two');

  return {
    groups,
    roundOneSuffixCounts,
    roundTwoSuffixCounts,
    roundOneTopicPositions: buildTopicPositions(groups, 'round-one'),
    roundTwoTopicPositions: buildTopicPositions(groups, 'round-two'),
  };
}

function compareOptions(left: CategoryOption, right: CategoryOption): number {
  if (left.round !== right.round) return left.round === 'round-one' ? -1 : 1;
  return left.rank - right.rank || left.category.id.localeCompare(right.category.id);
}

function buildSuffixCounts(groups: readonly NameGroup[], round: Board['round']): number[] {
  const result = Array.from({ length: groups.length + 1 }, () => 0);
  for (let index = groups.length - 1; index >= 0; index -= 1) {
    result[index] = result[index + 1] + (groups[index].options.some((option) => option.round === round) ? 1 : 0);
  }
  return result;
}

function buildTopicPositions(groups: readonly NameGroup[], round: Board['round']): Map<string, number[]> {
  const result = new Map<string, number[]>();
  groups.forEach((group, groupIndex) => {
    const topics = new Set(group.options
      .filter((option) => option.round === round)
      .map((option) => option.category.macroTopic));
    for (const topic of topics) {
      const positions = result.get(topic) ?? [];
      positions.push(groupIndex);
      result.set(topic, positions);
    }
  });
  return result;
}

function findJointAllocation(
  searchIndex: JointSearchIndex,
  targetRoundOne: number,
  targetRoundTwo: number,
): JointAllocation | null {
  const selectedRoundOne: CategoryOption[] = [];
  const selectedRoundTwo: CategoryOption[] = [];
  const roundOneMacroCounts = new Map<string, number>();
  const roundTwoMacroCounts = new Map<string, number>();
  const failedStates = new Set<string>();

  function visit(groupIndex: number, roundOneRemaining: number, roundTwoRemaining: number): boolean {
    if (roundOneRemaining === 0 && roundTwoRemaining === 0) return true;
    if (!canStillFill(
      searchIndex,
      groupIndex,
      roundOneRemaining,
      roundTwoRemaining,
      roundOneMacroCounts,
      roundTwoMacroCounts,
    )) return false;

    const stateKey = selectionStateKey(
      groupIndex,
      roundOneRemaining,
      roundTwoRemaining,
      roundOneMacroCounts,
      roundTwoMacroCounts,
    );
    if (failedStates.has(stateKey)) return false;

    const group = searchIndex.groups[groupIndex];
    for (const option of group.options) {
      const remaining = option.round === 'round-one' ? roundOneRemaining : roundTwoRemaining;
      const macroCounts = option.round === 'round-one' ? roundOneMacroCounts : roundTwoMacroCounts;
      const selected = option.round === 'round-one' ? selectedRoundOne : selectedRoundTwo;
      const macroCount = macroCounts.get(option.category.macroTopic) ?? 0;
      if (remaining === 0 || macroCount >= MAX_MACRO_TOPIC_PER_BOARD) continue;

      selected.push(option);
      macroCounts.set(option.category.macroTopic, macroCount + 1);
      const found = visit(
        groupIndex + 1,
        roundOneRemaining - (option.round === 'round-one' ? 1 : 0),
        roundTwoRemaining - (option.round === 'round-two' ? 1 : 0),
      );
      if (found) return true;
      selected.pop();
      restoreMacroCount(macroCounts, option.category.macroTopic, macroCount);
    }

    if (visit(groupIndex + 1, roundOneRemaining, roundTwoRemaining)) return true;
    failedStates.add(stateKey);
    return false;
  }

  if (!visit(0, targetRoundOne, targetRoundTwo)) return null;
  return {
    roundOne: selectedRoundOne.sort((left, right) => left.rank - right.rank).map((option) => option.category),
    roundTwo: selectedRoundTwo.sort((left, right) => left.rank - right.rank).map((option) => option.category),
  };
}

function canStillFill(
  searchIndex: JointSearchIndex,
  groupIndex: number,
  roundOneRemaining: number,
  roundTwoRemaining: number,
  roundOneMacroCounts: ReadonlyMap<string, number>,
  roundTwoMacroCounts: ReadonlyMap<string, number>,
): boolean {
  if (searchIndex.groups.length - groupIndex < roundOneRemaining + roundTwoRemaining) return false;
  if (searchIndex.roundOneSuffixCounts[groupIndex] < roundOneRemaining) return false;
  if (searchIndex.roundTwoSuffixCounts[groupIndex] < roundTwoRemaining) return false;
  return macroCapacity(searchIndex.roundOneTopicPositions, groupIndex, roundOneMacroCounts) >= roundOneRemaining
    && macroCapacity(searchIndex.roundTwoTopicPositions, groupIndex, roundTwoMacroCounts) >= roundTwoRemaining;
}

function macroCapacity(
  topicPositions: ReadonlyMap<string, number[]>,
  groupIndex: number,
  macroCounts: ReadonlyMap<string, number>,
): number {
  let capacity = 0;
  for (const [topic, positions] of topicPositions) {
    const available = positions.length - lowerBound(positions, groupIndex);
    capacity += Math.min(
      available,
      Math.max(0, MAX_MACRO_TOPIC_PER_BOARD - (macroCounts.get(topic) ?? 0)),
    );
  }
  return capacity;
}

function lowerBound(values: readonly number[], target: number): number {
  let low = 0;
  let high = values.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (values[middle] < target) low = middle + 1;
    else high = middle;
  }
  return low;
}

function selectionStateKey(
  groupIndex: number,
  roundOneRemaining: number,
  roundTwoRemaining: number,
  roundOneMacroCounts: ReadonlyMap<string, number>,
  roundTwoMacroCounts: ReadonlyMap<string, number>,
): string {
  return JSON.stringify([
    groupIndex,
    roundOneRemaining,
    roundTwoRemaining,
    [...roundOneMacroCounts].sort(([left], [right]) => left.localeCompare(right)),
    [...roundTwoMacroCounts].sort(([left], [right]) => left.localeCompare(right)),
  ]);
}

function restoreMacroCount(macroCounts: Map<string, number>, topic: string, previousCount: number): void {
  if (previousCount === 0) macroCounts.delete(topic);
  else macroCounts.set(topic, previousCount);
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

import type { Board, Category, Clue, Difficulty, GameConfig, Language } from './types';
import { hasLocalizedText, isLocalizedClueComplete } from '../content/localizedCompleteness';

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

export interface SelectionFlowDiagnostics {
  targetChecks: number;
  maxAugmentationsPerCheck: number;
  maxEdgeScansPerCheck: number;
  nodeCount: number;
  directedEdgeCount: number;
}

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

export function selectMatchContent(
  input: SelectionInput,
  diagnostics?: SelectionFlowDiagnostics,
): SelectedMatchContent {
  const roundOneCandidates = eligibleCategorySets(input, 'round-one');
  const roundTwoCandidates = eligibleCategorySets(input, 'round-two');
  const finals = eligibleFinalClues(input);
  const allocation = findBestJointAllocation(
    roundOneCandidates,
    roundTwoCandidates,
    input.config.language,
    diagnostics,
  );
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
  name: string;
  options: CategoryOption[];
}

interface JointAllocation {
  roundOne: SelectableCategorySet[];
  roundTwo: SelectableCategorySet[];
}

interface FlowEdge {
  to: number;
  reverseIndex: number;
  capacity: number;
  cost: number;
}

interface FlowRun {
  allocation: JointAllocation;
  flow: number;
  augmentations: number;
  edgeScans: number;
  nodeCount: number;
  directedEdgeCount: number;
}

function findBestJointAllocation(
  roundOne: readonly SelectableCategorySet[],
  roundTwo: readonly SelectableCategorySet[],
  language: Language,
  diagnostics?: SelectionFlowDiagnostics,
): JointAllocation {
  const groups = buildNameGroups(roundOne, roundTwo, language);
  if (diagnostics !== undefined) {
    diagnostics.targetChecks = 0;
    diagnostics.maxAugmentationsPerCheck = 0;
    diagnostics.maxEdgeScansPerCheck = 0;
    diagnostics.nodeCount = 0;
    diagnostics.directedEdgeCount = 0;
  }

  const maximum = runFlow(groups, CATEGORIES_PER_BOARD, CATEGORIES_PER_BOARD);
  recordFlowDiagnostics(diagnostics, maximum);
  if (maximum.flow === CATEGORIES_PER_BOARD * 2) return maximum.allocation;

  // Shortages maximize total fill, then prefer filling Round One before Round Two.
  const maximumRoundOne = Math.min(CATEGORIES_PER_BOARD, maximum.flow);
  const minimumRoundOne = Math.max(0, maximum.flow - CATEGORIES_PER_BOARD);
  for (let roundOneSize = maximumRoundOne; roundOneSize >= minimumRoundOne; roundOneSize -= 1) {
    const run = runFlow(groups, roundOneSize, maximum.flow - roundOneSize);
    recordFlowDiagnostics(diagnostics, run);
    if (run.flow === maximum.flow) return run.allocation;
  }

  throw new Error('Maximum joint board flow could not be reproduced by an exact round allocation');
}

function buildNameGroups(
  roundOne: readonly SelectableCategorySet[],
  roundTwo: readonly SelectableCategorySet[],
  language: Language,
): NameGroup[] {
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

  return [...groupsByName.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, options]) => ({ name, options: [...options.values()].sort(compareOptions) }));
}

function compareOptions(left: CategoryOption, right: CategoryOption): number {
  if (left.round !== right.round) return left.round === 'round-one' ? -1 : 1;
  return left.rank - right.rank || left.category.id.localeCompare(right.category.id);
}

function runFlow(
  groups: readonly NameGroup[],
  targetRoundOne: number,
  targetRoundTwo: number,
): FlowRun {
  const source = 0;
  const nameNodes = new Map(groups.map((group, index) => [group.name, index + 1]));
  const roundOneTopics = uniqueSortedTopics(groups, 'round-one');
  const roundTwoTopics = uniqueSortedTopics(groups, 'round-two');
  let nextNode = groups.length + 1;
  const roundOneTopicNodes = new Map(roundOneTopics.map((topic) => [topic, nextNode++]));
  const roundTwoTopicNodes = new Map(roundTwoTopics.map((topic) => [topic, nextNode++]));
  const roundOneNode = nextNode++;
  const roundTwoNode = nextNode++;
  const sink = nextNode++;
  const graph: FlowEdge[][] = Array.from({ length: nextNode }, () => []);
  const optionEdges: Array<{ option: CategoryOption; edge: FlowEdge }> = [];

  for (const group of groups) {
    const nameNode = nameNodes.get(group.name)!;
    addFlowEdge(graph, source, nameNode, 1, 0);
    for (const option of group.options) {
      const topicNodes = option.round === 'round-one' ? roundOneTopicNodes : roundTwoTopicNodes;
      const edge = addFlowEdge(graph, nameNode, topicNodes.get(option.category.macroTopic)!, 1, option.rank);
      optionEdges.push({ option, edge });
    }
  }
  for (const topicNode of roundOneTopicNodes.values()) {
    addFlowEdge(graph, topicNode, roundOneNode, MAX_MACRO_TOPIC_PER_BOARD, 0);
  }
  for (const topicNode of roundTwoTopicNodes.values()) {
    addFlowEdge(graph, topicNode, roundTwoNode, MAX_MACRO_TOPIC_PER_BOARD, 0);
  }
  addFlowEdge(graph, roundOneNode, sink, targetRoundOne, 0);
  addFlowEdge(graph, roundTwoNode, sink, targetRoundTwo, 0);

  const directedEdgeCount = graph.reduce((total, edges) => total + edges.length, 0);
  const result = minCostMaximumFlow(graph, source, sink, targetRoundOne + targetRoundTwo);
  const selected = optionEdges.filter(({ edge }) => edge.capacity === 0).map(({ option }) => option);

  return {
    allocation: {
      roundOne: selected
        .filter((option) => option.round === 'round-one')
        .sort(compareOptions)
        .map((option) => option.category),
      roundTwo: selected
        .filter((option) => option.round === 'round-two')
        .sort(compareOptions)
        .map((option) => option.category),
    },
    flow: result.flow,
    augmentations: result.augmentations,
    edgeScans: result.edgeScans,
    nodeCount: graph.length,
    directedEdgeCount,
  };
}

function uniqueSortedTopics(groups: readonly NameGroup[], round: Board['round']): string[] {
  return [...new Set(groups.flatMap((group) => group.options
    .filter((option) => option.round === round)
    .map((option) => option.category.macroTopic)))]
    .sort((left, right) => left.localeCompare(right));
}

function addFlowEdge(
  graph: FlowEdge[][],
  from: number,
  to: number,
  capacity: number,
  cost: number,
): FlowEdge {
  const forward: FlowEdge = { to, reverseIndex: graph[to].length, capacity, cost };
  const reverse: FlowEdge = { to: from, reverseIndex: graph[from].length, capacity: 0, cost: -cost };
  graph[from].push(forward);
  graph[to].push(reverse);
  return forward;
}

function minCostMaximumFlow(
  graph: FlowEdge[][],
  source: number,
  sink: number,
  maximumFlow: number,
): { flow: number; augmentations: number; edgeScans: number } {
  let flow = 0;
  let augmentations = 0;
  let edgeScans = 0;

  while (flow < maximumFlow) {
    const distances = Array.from({ length: graph.length }, () => Number.POSITIVE_INFINITY);
    const previousNodes = Array.from({ length: graph.length }, () => -1);
    const previousEdges = Array.from({ length: graph.length }, () => -1);
    distances[source] = 0;

    for (let iteration = 0; iteration < graph.length - 1; iteration += 1) {
      let changed = false;
      for (let from = 0; from < graph.length; from += 1) {
        if (!Number.isFinite(distances[from])) continue;
        for (let edgeIndex = 0; edgeIndex < graph[from].length; edgeIndex += 1) {
          edgeScans += 1;
          const edge = graph[from][edgeIndex];
          const distance = distances[from] + edge.cost;
          if (edge.capacity === 0 || distance >= distances[edge.to]) continue;
          distances[edge.to] = distance;
          previousNodes[edge.to] = from;
          previousEdges[edge.to] = edgeIndex;
          changed = true;
        }
      }
      if (!changed) break;
    }

    if (previousNodes[sink] === -1) break;
    let amount = maximumFlow - flow;
    for (let node = sink; node !== source; node = previousNodes[node]) {
      amount = Math.min(amount, graph[previousNodes[node]][previousEdges[node]].capacity);
    }
    for (let node = sink; node !== source; node = previousNodes[node]) {
      const edge = graph[previousNodes[node]][previousEdges[node]];
      edge.capacity -= amount;
      graph[node][edge.reverseIndex].capacity += amount;
    }
    flow += amount;
    augmentations += 1;
  }

  return { flow, augmentations, edgeScans };
}

function recordFlowDiagnostics(diagnostics: SelectionFlowDiagnostics | undefined, run: FlowRun): void {
  if (diagnostics === undefined) return;
  diagnostics.targetChecks += 1;
  diagnostics.maxAugmentationsPerCheck = Math.max(diagnostics.maxAugmentationsPerCheck, run.augmentations);
  diagnostics.maxEdgeScansPerCheck = Math.max(diagnostics.maxEdgeScansPerCheck, run.edgeScans);
  diagnostics.nodeCount = Math.max(diagnostics.nodeCount, run.nodeCount);
  diagnostics.directedEdgeCount = Math.max(diagnostics.directedEdgeCount, run.directedEdgeCount);
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

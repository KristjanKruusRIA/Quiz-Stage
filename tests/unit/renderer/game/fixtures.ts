import { APP_VERSION } from '../../../../src/shared/appMeta';
import type { GameState, HostGameView, PublicGameView } from '../../../../src/shared/game/types';
import { toPublicGameView } from '../../../../src/shared/game/views';

export function gameState(overrides: Partial<GameState> = {}): GameState {
  const teams = [
    { id: 'team-1', name: 'Alpha', color: '#E3B341' },
    { id: 'team-2', name: 'Beta', color: '#50A7F5' },
  ];
  const boards = (['round-one', 'round-two'] as const).map((round) => ({
    id: `${round}-board`,
    round,
    categories: Array.from({ length: 6 }, (_, categoryIndex) => ({
      id: `${round}-category-${categoryIndex + 1}`,
      name: { en: `Category ${categoryIndex + 1}` },
      macroTopic: `topic-${categoryIndex + 1}`,
      clues: Array.from({ length: 5 }, (_, clueIndex) => ({
        id: `${round}-clue-${categoryIndex + 1}-${clueIndex + 1}`,
        categoryId: `${round}-category-${categoryIndex + 1}`,
        round,
        tier: clueIndex + 1,
        value: (clueIndex + 1) * (round === 'round-one' ? 200 : 400),
        prompt: { en: `Prompt ${categoryIndex + 1}-${clueIndex + 1}` },
        response: { en: `Response ${categoryIndex + 1}-${clueIndex + 1}` },
        explanation: { en: `Explanation ${categoryIndex + 1}-${clueIndex + 1}` },
        source: `Source ${categoryIndex + 1}-${clueIndex + 1}`,
      })),
    })),
  }));
  const base: GameState = {
    appVersion: APP_VERSION,
    id: 'match-1',
    config: { language: 'en', difficulty: 'medium', clueSeconds: 15, teams, packIds: ['pack'], displayMode: 'single' },
    seed: 'private-seed',
    phase: 'round-one-board',
    boards,
    finalClue: {
      id: 'final-clue', categoryId: 'final-category', round: 'final', tier: 0, value: 0,
      prompt: { en: 'Final prompt' }, response: { en: 'Final response' },
      explanation: { en: 'Final explanation' }, source: 'Final source',
      categoryName: { en: 'World History' },
    },
    scores: { 'team-1': 1200, 'team-2': 800 },
    controllingTeamId: 'team-1',
    activeClue: null,
    timer: { durationMs: 15_000, remainingMs: 15_000, startedAt: null, status: 'idle' },
    usedClueIds: [], dailyDoubleClueIds: ['round-one-clue-1-1'], dailyDoubleWager: null,
    finalWagers: {}, finalEligibleTeamIds: [], finalRevealOrder: [], finalRevealedTeamIds: [], finalJudgments: {},
    tiebreakerClues: [], tiebreakerTeamIds: [], usedTiebreakerClueIds: [], suddenDeathClueNumber: 0,
    winnerTeamId: null, endedIncomplete: false, lastClosedClueId: null, lastClosedPhase: null,
    lastClosedControllingTeamId: null, disabledClueIds: [], eventSequence: 0, undoStack: [],
  };
  return { ...base, ...overrides };
}

export function hostView(overrides: Partial<GameState> = {}): HostGameView {
  return { appVersion: APP_VERSION, state: gameState(overrides), replayIssue: null, recovery: null };
}

export function publicView(overrides: Partial<GameState> = {}): PublicGameView {
  return toPublicGameView(gameState(overrides));
}

import { expect, test } from '@playwright/test';
import {
  closeFastMatch,
  completeFastMatch,
  launchFastMatch,
  type FastMatchOptions,
} from './helpers/fastMatch';
import { prepareE2eApplication } from './productHarness';

test.beforeAll(prepareE2eApplication);

const configurations: FastMatchOptions[] = ([2, 8] as const).flatMap((teams) =>
  (['easy', 'medium', 'hard'] as const).flatMap((difficulty) =>
    (['en', 'et'] as const).flatMap((language) =>
      (['single', 'dual'] as const).map((displayMode) => ({ teams, difficulty, language, displayMode })),
    ),
  ),
);

for (const configuration of configurations) {
  test(`completes ${configuration.teams}-team ${configuration.difficulty} ${configuration.language} ${configuration.displayMode}`, async () => {
    const match = await launchFastMatch(configuration);
    try {
      await expect(match.host.getByRole('grid')).toBeVisible();
      await expect.poll(() => match.application.windows().length).toBe(configuration.displayMode === 'dual' ? 2 : 1);
      const result = await completeFastMatch(match);
      expect(result).toMatchObject({
        phase: 'complete',
        usedClues: 60,
        dailyDoubles: 3,
        completionState: 'complete',
      });
      expect(result.winnerTeamId).not.toBeNull();
      expect(await match.application.evaluate(() =>
        (globalThis as typeof globalThis & { __quizStageExternalRequests?: string[] }).__quizStageExternalRequests,
      )).toEqual([]);
    } finally {
      await closeFastMatch(match);
    }
  });
}

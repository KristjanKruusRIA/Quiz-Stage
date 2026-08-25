import { expect, test } from '@playwright/test';
import { closeFastMatch, launchFastMatch } from './helpers/fastMatch';
import { prepareE2eApplication } from './productHarness';

test.beforeAll(prepareE2eApplication);

test('keeps host-only response details out of the public view', async () => {
  const match = await launchFastMatch({ teams: 8, difficulty: 'hard', language: 'et', displayMode: 'dual' });
  try {
    await expect.poll(() => match.application.windows().length).toBe(2);
    const publicWindow = match.application.windows().find((window) => window !== match.host);
    expect(publicWindow).toBeDefined();
    await match.host.locator('.public-board button:not([disabled])').first().click();
    const wager = match.host.getByRole('spinbutton', { name: 'Duubli panus' });
    if (await wager.isVisible()) {
      await wager.fill('5');
      await match.host.getByRole('button', { name: 'Kinnita panus' }).click();
    }
    await expect(match.host.getByRole('region', { name: 'Privaatsed vihjeandmed' })).toBeVisible();
    await expect(publicWindow!.getByRole('region', { name: 'Privaatsed vihjeandmed' })).toHaveCount(0);
    await expect(publicWindow!.locator('.public-response')).toHaveCount(0);
  } finally {
    await closeFastMatch(match);
  }
});

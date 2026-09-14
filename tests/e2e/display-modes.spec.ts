import { expect, test } from '@playwright/test';
import { closeFastMatch, launchFastMatch } from './helpers/fastMatch';
import { prepareE2eApplication } from './productHarness';

test.beforeAll(prepareE2eApplication);

test('creates only the host window in single-screen mode and a public window in dual-screen mode', async () => {
  const single = await launchFastMatch({ teams: 2, difficulty: 'medium', language: 'en', displayMode: 'single' });
  try {
    await expect.poll(() => single.application.windows().length).toBe(1);
  } finally {
    await closeFastMatch(single);
  }

  const dual = await launchFastMatch({ teams: 2, difficulty: 'medium', language: 'en', displayMode: 'dual' });
  try {
    await expect.poll(() => dual.application.windows().length).toBe(2);
    const publicWindow = dual.application.windows().find((window) => window !== dual.host);
    expect(publicWindow).toBeDefined();
    await publicWindow!.close();
    await expect.poll(() => dual.application.windows().length).toBe(2);
    const recoveredPublicWindow = dual.application.windows().find((window) => window !== dual.host);
    expect(recoveredPublicWindow).toBeDefined();
    expect(recoveredPublicWindow).not.toBe(publicWindow);
    await expect(recoveredPublicWindow!.getByRole('grid')).toBeVisible({ timeout: 10_000 });
  } finally {
    await closeFastMatch(dual);
  }
});

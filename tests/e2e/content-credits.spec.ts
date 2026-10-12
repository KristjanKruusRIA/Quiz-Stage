import { chromium, expect, test, type Browser } from '@playwright/test';
import type { ChildProcess } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { createServer, type AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { spawnPackagedProcess, stopPackagedProcess, waitForPackagedConnection } from '../../scripts/release/packagedProcess';
import { packagedExecutablePath, prepareE2eApplication } from './productHarness';

test.beforeAll(prepareE2eApplication);

test('shows factual citations, OpenTDB provenance and licence notices in the packaged app', async ({}, testInfo) => {
  const executable = packagedExecutablePath();
  const resources = path.join(path.dirname(executable), 'resources');
  for (const file of ['THIRD_PARTY_NOTICES.md', 'LICENSE-CC-BY-SA-4.0.txt']) {
    expect(readFileSync(path.join(resources, file))).toEqual(readFileSync(path.join('content', file)));
  }
  const database = new DatabaseSync(path.join(resources, 'seed.sqlite'), { readOnly: true });
  const expected = database.prepare("SELECT id, source FROM clues WHERE id LIKE 'built-in-history-%' AND json_extract(source, '$.inspiration.system') = 'OpenTDB' ORDER BY id LIMIT 1").get() as { id: string; source: string };
  expect(database.prepare('SELECT COUNT(*) AS count FROM clues').get()?.count).toBe(11_374);
  expect(database.prepare("SELECT COUNT(*) AS count FROM clues WHERE json_extract(source, '$.inspiration.system') = 'OpenTDB'").get()?.count).toBe(1_200);
  database.close();
  const source = JSON.parse(expected.source) as { title: string; url: string; inspiration: { candidateId: string } };
  const server = createServer();
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  const userData = mkdtempSync(path.join(tmpdir(), 'quiz-stage-credits-e2e-'));
  let application: ChildProcess | undefined;
  let browser: Browser | undefined;
  try {
    application = spawnPackagedProcess(executable, [`--remote-debugging-port=${port}`, `--user-data-dir=${userData}`, '--quiz-stage-e2e-network-guard'], {
      cwd: path.dirname(executable), windowsHide: true, env: { ...process.env },
    });
    browser = await waitForPackagedConnection(application, () => chromium.connectOverCDP(`http://127.0.0.1:${port}`), { attempts: 300 });
    const page = browser.contexts()[0].pages()[0];
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByRole('button', { name: 'Content credits', exact: true }).click();
    const credits = page.getByRole('region', { name: 'Content credits', exact: true });
    await credits.getByLabel('Content pack').selectOption('built-in-history');
    const clue = credits.locator('li').filter({ hasText: expected.id });
    await expect(clue).toContainText(source.title);
    await expect(clue).toContainText(source.url);
    await expect(clue).toContainText(source.inspiration.candidateId);
    await expect(credits).toContainText('Wikipedia contributors');
    await expect(credits).toContainText('https://creativecommons.org/licenses/by-sa/4.0/');
    await clue.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('content-credits.png') });
  } finally {
    if (application !== undefined) await stopPackagedProcess(application);
    await browser?.close().catch(() => undefined);
    await rm(userData, { recursive: true, force: true, maxRetries: 20, retryDelay: 250 });
  }
});

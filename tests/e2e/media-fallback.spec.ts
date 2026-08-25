import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { closeFastMatch, launchFastMatch } from './helpers/fastMatch';
import { prepareE2eApplication } from './productHarness';

test.beforeAll(prepareE2eApplication);

test('serves bundled audio when a personal replacement is malformed', async () => {
  const match = await launchFastMatch({ teams: 2, difficulty: 'easy', language: 'en', displayMode: 'single' });
  try {
    const mediaDirectory = path.join(match.userData, 'media');
    mkdirSync(mediaDirectory, { recursive: true });
    writeFileSync(path.join(mediaDirectory, 'opening.wav'), 'not a wave file');
    const result = await match.host.evaluate(async () => {
      const response = await fetch('quiz-stage-media://asset/opening');
      return { status: response.status, type: response.headers.get('content-type') };
    });
    expect(result).toEqual({ status: 200, type: 'audio/wav' });
  } finally {
    await closeFastMatch(match);
  }
});

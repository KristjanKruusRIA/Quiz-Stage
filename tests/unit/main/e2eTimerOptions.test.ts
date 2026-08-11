import { describe, expect, it } from 'vitest';
import { acceleratedE2eTimerOptions } from '../../../src/main/e2eTimerOptions';

describe('accelerated E2E timer composition', () => {
  it('cannot be enabled in a packaged application', () => {
    expect(acceleratedE2eTimerOptions(true, true)).toEqual({});
  });

  it('is absent unless explicitly enabled in an unpackaged test process', () => {
    expect(acceleratedE2eTimerOptions(false, false)).toEqual({});
    expect(acceleratedE2eTimerOptions(true, false)).toMatchObject({
      now: expect.any(Function),
      setTimeout: expect.any(Function),
      clearTimeout: expect.any(Function),
    });
  });
});

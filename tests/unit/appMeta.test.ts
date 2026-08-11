import { describe, expect, it } from 'vitest';
import { APP_NAME, APP_VERSION } from '../../src/shared/appMeta';

describe('app metadata', () => {
  it('uses the approved working title and semantic version', () => {
    expect(APP_NAME).toBe('Quiz Stage');
    expect(APP_VERSION).toMatch(/^0\.1\.0$/);
  });
});

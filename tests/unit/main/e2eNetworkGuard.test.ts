import { describe, expect, it } from 'vitest';
import { shouldInstallE2eNetworkGuard } from '../../../src/main/e2eNetworkGuard';

describe('E2E network guard activation', () => {
  it('requires an explicit opt-in in an unpackaged runtime', () => {
    expect(shouldInstallE2eNetworkGuard({ requested: false, isPackaged: false })).toBe(false);
    expect(shouldInstallE2eNetworkGuard({ requested: true, isPackaged: false })).toBe(true);
  });

  it('cannot activate in a packaged runtime even with the test argv flag', () => {
    expect(shouldInstallE2eNetworkGuard({ requested: true, isPackaged: true })).toBe(false);
  });
});

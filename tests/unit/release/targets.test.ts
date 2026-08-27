import { describe, expect, it } from 'vitest';
import { makerNamesFor, releaseTargetFor, releaseTargetForId } from '../../../scripts/release/targets';

describe('release targets', () => {
  it.each([
    ['win32', 'x64', 'windows-x64'],
    ['darwin', 'arm64', 'macos-arm64'],
    ['darwin', 'x64', 'macos-x64'],
    ['linux', 'x64', 'ubuntu-x64'],
  ] as const)('maps %s/%s to %s', (platform, arch, id) => {
    expect(releaseTargetFor(platform, arch).id).toBe(id);
    expect(releaseTargetForId(id).id).toBe(id);
  });

  it('rejects unsupported architectures', () => {
    expect(() => releaseTargetFor('linux', 'arm64')).toThrow('UNSUPPORTED_RELEASE_TARGET:linux:arm64');
  });

  it('selects only supported makers', () => {
    expect(makerNamesFor(releaseTargetForId('windows-x64'), 'all')).toEqual(['squirrel', 'zip']);
    expect(makerNamesFor(releaseTargetForId('macos-arm64'), 'all')).toEqual(['zip']);
    expect(makerNamesFor(releaseTargetForId('ubuntu-x64'), 'all')).toEqual(['deb', 'zip']);
  });
});

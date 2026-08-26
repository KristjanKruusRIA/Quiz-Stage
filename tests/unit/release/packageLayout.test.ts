import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  expectedNativeModuleSuffix,
  packagedResourcesDirectory,
  resolvePackagedApplicationBinary,
  resolvePackagedExecutable,
} from '../../../scripts/release/packageLayout';
import { releaseTargetForId } from '../../../scripts/release/targets';

describe('package layouts', () => {
  it.each([
    ['windows-x64', 'C:/release/Quiz Stage-win32-x64', 'C:/release/Quiz Stage-win32-x64/Quiz Stage.exe', 'C:/release/Quiz Stage-win32-x64/resources', 'prebuilds/win32-x64.node'],
    ['macos-arm64', '/tmp/Quiz Stage.app', '/tmp/Quiz Stage.app/Contents/MacOS/Quiz Stage', '/tmp/Quiz Stage.app/Contents/Resources', 'prebuilds/darwin-arm64.node'],
    ['macos-x64', '/tmp/Quiz Stage.app', '/tmp/Quiz Stage.app/Contents/MacOS/Quiz Stage', '/tmp/Quiz Stage.app/Contents/Resources', 'prebuilds/darwin-x64.node'],
    ['ubuntu-x64', '/tmp/Quiz Stage-linux-x64', '/tmp/Quiz Stage-linux-x64/quiz-stage', '/tmp/Quiz Stage-linux-x64/resources', 'prebuilds/linux-x64.node'],
  ] as const)('resolves the %s application directory', (targetId, applicationPath, executablePath, resourcesPath, nativeSuffix) => {
    const target = releaseTargetForId(targetId);

    expect(resolvePackagedExecutable(applicationPath, target)).toBe(path.normalize(executablePath));
    expect(packagedResourcesDirectory(executablePath, target)).toBe(path.normalize(resourcesPath));
    expect(expectedNativeModuleSuffix(target)).toBe(nativeSuffix);
  });

  it('keeps an exact Windows executable path', () => {
    const target = releaseTargetForId('windows-x64');
    const executablePath = 'C:/release/Quiz Stage-win32-x64/Quiz Stage.exe';

    expect(resolvePackagedExecutable(executablePath, target)).toBe(path.normalize(executablePath));
  });

  it('resolves the public Linux launcher separately from the Electron application binary', () => {
    const target = releaseTargetForId('ubuntu-x64');
    const applicationPath = '/tmp/Quiz Stage-linux-x64';

    expect(resolvePackagedExecutable(applicationPath, target)).toBe(
      path.normalize('/tmp/Quiz Stage-linux-x64/quiz-stage'),
    );
    expect(resolvePackagedApplicationBinary(applicationPath, target)).toBe(
      path.normalize('/tmp/Quiz Stage-linux-x64/quiz-stage-bin'),
    );
  });
});

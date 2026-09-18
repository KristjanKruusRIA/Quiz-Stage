import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { resignMacosApplication } from '../../../scripts/release/macosSignature';
import { releaseTargetForId } from '../../../scripts/release/targets';

const temporaryRoots: string[] = [];

function temporaryRoot(): string {
  const root = mkdtempSync(path.join(tmpdir(), 'quiz-stage-macos-signature-'));
  temporaryRoots.push(root);
  return root;
}

function recordingRunner(): { calls: [string, string[]][]; run: (command: string, args: string[]) => void } {
  const calls: [string, string[]][] = [];
  return { calls, run: (command, args) => { calls.push([command, args]); } };
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('resignMacosApplication', () => {
  it('re-signs and verifies each packaged macOS bundle', () => {
    const outputPath = temporaryRoot();
    mkdirSync(path.join(outputPath, 'Quiz Stage.app'));
    const runner = recordingRunner();

    resignMacosApplication({ platform: 'darwin', outputPaths: [outputPath] }, releaseTargetForId('macos-arm64'), runner.run);

    const bundle = path.join(outputPath, 'Quiz Stage.app');
    expect(runner.calls).toEqual([
      ['codesign', ['--sign', '-', '--force', '--deep', bundle]],
      ['codesign', ['--verify', '--deep', '--strict', bundle]],
    ]);
  });

  it('does nothing for other platforms', () => {
    const runner = recordingRunner();

    resignMacosApplication({ platform: 'linux', outputPaths: ['/unused'] }, releaseTargetForId('ubuntu-x64'), runner.run);
    resignMacosApplication({ platform: 'win32', outputPaths: ['/unused'] }, releaseTargetForId('windows-x64'), runner.run);

    expect(runner.calls).toEqual([]);
  });

  it('fails when the package output has no application bundle', () => {
    const outputPath = temporaryRoot();

    expect(() => resignMacosApplication(
      { platform: 'darwin', outputPaths: [outputPath] },
      releaseTargetForId('macos-x64'),
      recordingRunner().run,
    )).toThrow(`MACOS_APPLICATION_BUNDLE_MISSING:${outputPath}`);
  });
});

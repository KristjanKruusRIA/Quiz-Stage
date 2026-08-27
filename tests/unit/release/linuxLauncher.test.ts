import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  installLinuxLauncher,
  linuxLauncherScript,
  type LinuxUserNamespacePaths,
} from '../../../scripts/release/linuxLauncher';
import { releaseTargetForId } from '../../../scripts/release/targets';

const temporaryRoots: string[] = [];

function temporaryRoot(): string {
  const root = mkdtempSync(path.join(tmpdir(), 'quiz-stage-linux-launcher-'));
  temporaryRoots.push(root);
  return root;
}

function namespacePaths(root: string): LinuxUserNamespacePaths {
  return {
    appArmorRestriction: path.join(root, 'apparmor_restrict_unprivileged_userns'),
    unprivilegedClone: path.join(root, 'unprivileged_userns_clone'),
    maxNamespaces: path.join(root, 'max_user_namespaces'),
  };
}

function writeNamespaceSettings(paths: LinuxUserNamespacePaths, values: [string, string, string]): void {
  writeFileSync(paths.appArmorRestriction, values[0]);
  writeFileSync(paths.unprivilegedClone, values[1]);
  writeFileSync(paths.maxNamespaces, values[2]);
}

function writeFakeApplication(applicationDirectory: string): string {
  const binary = path.join(applicationDirectory, 'quiz-stage-bin');
  writeFileSync(binary, '#!/bin/sh\nprintf \'%s\\n\' "$@"\n');
  chmodSync(binary, 0o755);
  return binary;
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe('Linux package launcher', () => {
  it('installs the public launcher beside the packaged application binary', () => {
    const root = temporaryRoot();
    const target = releaseTargetForId('ubuntu-x64');
    const applicationDirectory = path.join(root, 'Quiz Stage-linux-x64');
    mkdirSync(applicationDirectory);
    writeFileSync(path.join(applicationDirectory, target.applicationExecutableName), 'electron binary');

    installLinuxLauncher({ platform: 'linux', outputPaths: [applicationDirectory] }, target);

    const launcher = path.join(applicationDirectory, target.executableName);
    expect(readFileSync(launcher, 'utf8')).toContain(
      'exec "$app_dir/quiz-stage-bin" --no-sandbox "$@"',
    );
    expect(existsSync(path.join(applicationDirectory, target.applicationExecutableName))).toBe(true);
  });

  it('does not alter non-Linux package output', () => {
    const root = temporaryRoot();
    const target = releaseTargetForId('windows-x64');
    writeFileSync(path.join(root, '.keep'), 'untouched');

    installLinuxLauncher({ platform: 'win32', outputPaths: [root] }, target);

    expect(readFileSync(path.join(root, '.keep'), 'utf8')).toBe('untouched');
  });

  it.skipIf(process.platform !== 'linux')(
    'adds no-sandbox before launch only when user namespaces are restricted and no helper is usable',
    () => {
      const root = temporaryRoot();
      const applicationDirectory = path.join(root, 'Quiz Stage-linux-x64');
      mkdirSync(applicationDirectory);
      writeFakeApplication(applicationDirectory);
      const paths = namespacePaths(root);
      writeNamespaceSettings(paths, ['1\n', '1\n', '61920\n']);
      const launcher = path.join(applicationDirectory, 'quiz-stage');
      writeFileSync(launcher, linuxLauncherScript('quiz-stage-bin', paths));
      chmodSync(launcher, 0o755);

      const output = execFileSync(launcher, ['value with spaces'], { encoding: 'utf8' });

      expect(output.split('\n').filter(Boolean)).toEqual(['--no-sandbox', 'value with spaces']);
    },
  );

  it.skipIf(process.platform !== 'linux')(
    'keeps the user-namespace sandbox when it is available',
    () => {
      const root = temporaryRoot();
      const applicationDirectory = path.join(root, 'Quiz Stage-linux-x64');
      mkdirSync(applicationDirectory);
      writeFakeApplication(applicationDirectory);
      const paths = namespacePaths(root);
      writeNamespaceSettings(paths, ['0\n', '1\n', '61920\n']);
      const launcher = path.join(applicationDirectory, 'quiz-stage');
      writeFileSync(launcher, linuxLauncherScript('quiz-stage-bin', paths));
      chmodSync(launcher, 0o755);

      const output = execFileSync(launcher, ['sandboxed'], { encoding: 'utf8' });

      expect(output.split('\n').filter(Boolean)).toEqual(['sandboxed']);
    },
  );

  it.skipIf(process.platform !== 'linux')(
    'resolves the Debian symlink and keeps the setuid helper sandbox under restricted namespaces',
    () => {
      const root = temporaryRoot();
      const applicationDirectory = path.join(root, 'usr', 'lib', 'quiz-stage');
      const binaryDirectory = path.join(root, 'usr', 'bin');
      const commandDirectory = path.join(root, 'commands');
      mkdirSync(applicationDirectory, { recursive: true });
      mkdirSync(binaryDirectory, { recursive: true });
      mkdirSync(commandDirectory);
      writeFakeApplication(applicationDirectory);
      writeFileSync(path.join(applicationDirectory, 'chrome-sandbox'), 'helper');
      const paths = namespacePaths(root);
      writeNamespaceSettings(paths, ['1\n', '0\n', '0\n']);
      const launcher = path.join(applicationDirectory, 'quiz-stage');
      writeFileSync(launcher, linuxLauncherScript('quiz-stage-bin', paths));
      chmodSync(launcher, 0o755);
      const statCommand = path.join(commandDirectory, 'stat');
      writeFileSync(statCommand, '#!/bin/sh\nprintf \'0:4755\\n\'\n');
      chmodSync(statCommand, 0o755);
      const debianLauncher = path.join(binaryDirectory, 'quiz-stage');
      symlinkSync('../lib/quiz-stage/quiz-stage', debianLauncher);

      const output = execFileSync(debianLauncher, ['sandboxed'], {
        encoding: 'utf8',
        env: { ...process.env, PATH: `${commandDirectory}:${process.env.PATH ?? ''}` },
      });

      expect(output.split('\n').filter(Boolean)).toEqual(['sandboxed']);
    },
  );
});

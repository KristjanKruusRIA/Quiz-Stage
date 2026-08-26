import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readme = readFileSync('README.md', 'utf8');
const limitations = readFileSync('docs/known-limitations.md', 'utf8');
const upgrades = readFileSync('docs/portable-upgrades.md', 'utf8');

describe('release documentation', () => {
  it('documents every native download and installation flow', () => {
    for (const artifact of [
      'QuizStageSetup.exe',
      'QuizStage-win32-x64.zip',
      'QuizStage-darwin-arm64.zip',
      'QuizStage-darwin-x64.zip',
      'quiz-stage_0.1.0_amd64.deb',
      'QuizStage-linux-x64.zip',
    ]) {
      expect(readme).toContain(artifact);
    }

    expect(readme).toContain('Apple Silicon');
    expect(readme).toContain('Intel');
    expect(readme).toContain('arm64');
    expect(readme).toContain('x64');
    expect(readme).toContain('unsigned and unnotarized');
    expect(readme).toContain('Open Anyway');
    expect(readme).toContain('https://support.apple.com/guide/mac-help/open-a-mac-app-from-an-unidentified-developer-mh40616/mac');
    expect(readme).toContain('apt install');
    expect(readme).toContain('apt remove');
    expect(readme).toContain('unzip');
    expect(readme).toContain('~/Library/Application Support');
    expect(readme).toContain('~/.config');
    expect(readme).toContain('Windows portable upgrades require copying previous `UserData`');
    expect(readme).not.toContain('- Portable upgrades require copying previous `UserData`');
  });

  it('states unsupported architectures and package formats precisely', () => {
    expect(limitations).toContain('unsigned and unnotarized');
    expect(limitations).toContain('Ubuntu ARM64');

    for (const format of ['DMG', 'AppImage', 'RPM', 'Flatpak']) {
      expect(limitations).toContain(format);
    }

    expect(limitations).not.toContain('- macOS and Linux support.');
  });

  it('limits adjacent UserData migration to the Windows portable package', () => {
    expect(upgrades).toContain('QuizStage-win32-x64.zip');
    expect(upgrades).toContain('UserData');
    expect(upgrades).toContain('macOS and Linux ZIPs');
    expect(upgrades).toContain('outside the extracted application');
    expect(upgrades).toContain('do not use an adjacent `UserData` directory');
    expect(upgrades.split('## macOS and Linux ZIP upgrades')[1]).not.toMatch(/copy/i);
  });
});

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

    expect(readme).toContain('Apple Silicon Macs use the arm64 `QuizStage-darwin-arm64.zip` download.');
    expect(readme).toContain('Intel Macs use the x64 `QuizStage-darwin-x64.zip` download.');
    expect(readme).toContain('These macOS ZIPs are unsigned and unnotarized.');
    expect(readme).toContain(
      'For the one-time first launch, try to open the app, then open **System Settings** > **Privacy & Security**, click **Open Anyway**, authenticate, and confirm the launch.',
    );
    expect(readme).toContain('https://support.apple.com/guide/mac-help/open-a-mac-app-from-an-unidentified-developer-mh40616/mac');
    expect(readme).toContain('`~/Library/Application Support/Quiz Stage`');
    expect(readme).toContain('sudo apt install ./quiz-stage_0.1.0_amd64.deb');
    expect(readme).toContain('Prefer the Ubuntu DEB for full Chromium sandboxing.');
    expect(readme).toContain('automatically falls back to `no-sandbox` only when neither user namespaces nor a usable setuid sandbox helper is available');
    expect(readme).toContain('sudo apt remove quiz-stage');
    expect(readme).toContain('unzip QuizStage-linux-x64.zip');
    expect(readme).toContain('cd Quiz\\ Stage-linux-x64');
    expect(readme).toContain('./quiz-stage');
    expect(readme).toMatch(/\$XDG_CONFIG_HOME\/Quiz Stage.*~\/\.config\/Quiz Stage/s);
    expect(readme).toMatch(/\$XDG_CONFIG_HOME.*when.*set.*otherwise.*default.*~\/\.config\/Quiz Stage/s);
    expect(readme).toContain('Windows portable upgrades require copying previous `UserData`');
    expect(readme).not.toContain('- Portable upgrades require copying previous `UserData`');
  });

  it('states unsupported architectures and package formats precisely', () => {
    expect(limitations).toContain('unsigned and unnotarized');
    expect(limitations).toContain('Ubuntu ARM64');

    for (const format of ['DMG', 'AppImage', 'RPM', 'Snap', 'Flatpak']) {
      expect(limitations).toContain(format);
    }

    expect(limitations).not.toContain('- macOS and Linux support.');
  });

  it('limits adjacent UserData migration to the Windows portable package', () => {
    const [windows, macosAndLinux] = upgrades.split('## macOS and Linux ZIP upgrades');

    expect(windows).toContain('QuizStage-win32-x64.zip');
    expect(windows).toContain('Copy the previous `UserData` directory');
    expect(macosAndLinux).toContain('outside the extracted application');
    expect(macosAndLinux).toContain('do not use an adjacent `UserData` directory or `portable.flag` marker');
    expect(macosAndLinux).not.toMatch(/copy/i);
  });
});

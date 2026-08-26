import { describe, expect, it } from 'vitest';
import { requiredLinuxSandboxSwitch, type LinuxSandboxProbe } from '../../../src/main/security/linuxSandbox';

const executablePath = '/opt/Quiz Stage/quiz-stage';
const helperPath = '/opt/Quiz Stage/chrome-sandbox';

function probe(options: {
  helper?: { uid: number; mode: number };
  settings?: Record<string, string>;
}): LinuxSandboxProbe {
  return {
    stat: (filePath) => filePath === helperPath ? options.helper : undefined,
    read: (filePath) => options.settings?.[filePath],
  };
}

describe('packaged Linux sandbox selection', () => {
  it('preserves Chromium sandboxing for a portable package when user namespaces are available', () => {
    expect(requiredLinuxSandboxSwitch({
      platform: 'linux',
      isPackaged: true,
      executablePath,
    }, probe({
      helper: { uid: 1000, mode: 0o100755 },
      settings: {
        '/proc/sys/kernel/apparmor_restrict_unprivileged_userns': '0\n',
        '/proc/sys/kernel/unprivileged_userns_clone': '1\n',
        '/proc/sys/user/max_user_namespaces': '61920\n',
      },
    }))).toBeNull();
  });

  it.each([
    ['/proc/sys/kernel/apparmor_restrict_unprivileged_userns', '1\n'],
    ['/proc/sys/kernel/unprivileged_userns_clone', '0\n'],
    ['/proc/sys/user/max_user_namespaces', '0\n'],
  ])('uses the no-sandbox fallback when %s blocks user namespaces and the helper is not setuid', (setting, value) => {
    expect(requiredLinuxSandboxSwitch({
      platform: 'linux',
      isPackaged: true,
      executablePath,
    }, probe({
      helper: { uid: 1000, mode: 0o100755 },
      settings: { [setting]: value },
    }))).toBe('no-sandbox');
  });

  it('preserves Chromium sandboxing for the DEB root-owned setuid helper under restricted user namespaces', () => {
    expect(requiredLinuxSandboxSwitch({
      platform: 'linux',
      isPackaged: true,
      executablePath,
    }, probe({
      helper: { uid: 0, mode: 0o104755 },
      settings: {
        '/proc/sys/kernel/apparmor_restrict_unprivileged_userns': '1\n',
        '/proc/sys/kernel/unprivileged_userns_clone': '0\n',
        '/proc/sys/user/max_user_namespaces': '0\n',
      },
    }))).toBeNull();
  });

  it.each([
    ['win32', true],
    ['darwin', true],
    ['linux', false],
  ])('does not change sandboxing on %s when isPackaged is %s', (platform, isPackaged) => {
    const unreachableProbe: LinuxSandboxProbe = {
      stat: () => { throw new Error('unexpected stat'); },
      read: () => { throw new Error('unexpected read'); },
    };

    expect(requiredLinuxSandboxSwitch({ platform, isPackaged, executablePath }, unreachableProbe)).toBeNull();
  });
});

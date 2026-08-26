import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';

export interface LinuxSandboxProbe {
  stat: (filePath: string) => { uid: number; mode: number } | undefined;
  read: (filePath: string) => string | undefined;
}

interface LinuxSandboxEnvironment {
  platform: string;
  isPackaged: boolean;
  executablePath: string;
}

const APPARMOR_USER_NAMESPACE_RESTRICTION = '/proc/sys/kernel/apparmor_restrict_unprivileged_userns';
const UNPRIVILEGED_USER_NAMESPACE_CLONE = '/proc/sys/kernel/unprivileged_userns_clone';
const MAX_USER_NAMESPACES = '/proc/sys/user/max_user_namespaces';

const systemProbe: LinuxSandboxProbe = {
  stat: (filePath) => {
    try {
      const entry = statSync(filePath);
      return { uid: entry.uid, mode: entry.mode };
    } catch {
      return undefined;
    }
  },
  read: (filePath) => {
    try {
      return readFileSync(filePath, 'utf8');
    } catch {
      return undefined;
    }
  },
};

function hasUsableSetuidHelper(executablePath: string, probe: LinuxSandboxProbe): boolean {
  const helper = probe.stat(path.posix.join(path.posix.dirname(executablePath), 'chrome-sandbox'));
  return helper?.uid === 0 && (helper.mode & 0o4777) === 0o4755;
}

function userNamespacesAreRestricted(probe: LinuxSandboxProbe): boolean {
  return probe.read(APPARMOR_USER_NAMESPACE_RESTRICTION)?.trim() === '1'
    || probe.read(UNPRIVILEGED_USER_NAMESPACE_CLONE)?.trim() === '0'
    || probe.read(MAX_USER_NAMESPACES)?.trim() === '0';
}

export function requiredLinuxSandboxSwitch(
  environment: LinuxSandboxEnvironment,
  probe: LinuxSandboxProbe = systemProbe,
): 'no-sandbox' | null {
  if (environment.platform !== 'linux' || !environment.isPackaged) return null;
  if (hasUsableSetuidHelper(environment.executablePath, probe)) return null;
  return userNamespacesAreRestricted(probe) ? 'no-sandbox' : null;
}

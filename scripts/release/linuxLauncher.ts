import { chmodSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { ReleaseTarget } from './targets';

export interface LinuxUserNamespacePaths {
  appArmorRestriction: string;
  unprivilegedClone: string;
  maxNamespaces: string;
}

interface PackageResult {
  platform: string;
  outputPaths: string[];
}

const systemNamespacePaths: LinuxUserNamespacePaths = {
  appArmorRestriction: '/proc/sys/kernel/apparmor_restrict_unprivileged_userns',
  unprivilegedClone: '/proc/sys/kernel/unprivileged_userns_clone',
  maxNamespaces: '/proc/sys/user/max_user_namespaces',
};

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'"'"'`)}'`;
}

export function linuxLauncherScript(
  applicationExecutableName: string,
  namespacePaths: LinuxUserNamespacePaths = systemNamespacePaths,
): string {
  return `#!/bin/sh
set -eu

launcher_path=$0
while [ -L "$launcher_path" ]; do
  launcher_dir=$(CDPATH= cd -- "$(dirname -- "$launcher_path")" && pwd -P)
  link_target=$(readlink -- "$launcher_path")
  case "$link_target" in
    /*) launcher_path=$link_target ;;
    *) launcher_path=$launcher_dir/$link_target ;;
  esac
done
app_dir=$(CDPATH= cd -- "$(dirname -- "$launcher_path")" && pwd -P)
sandbox_path=$app_dir/chrome-sandbox
apparmor_path=${shellQuote(namespacePaths.appArmorRestriction)}
unprivileged_clone_path=${shellQuote(namespacePaths.unprivilegedClone)}
max_namespaces_path=${shellQuote(namespacePaths.maxNamespaces)}

read_setting() {
  if [ -r "$1" ]; then
    cat -- "$1"
  fi
}

sandbox_usable=0
if [ -f "$sandbox_path" ]; then
  sandbox_status=$(stat -c '%u:%a' -- "$sandbox_path" 2>/dev/null || true)
  if [ "$sandbox_status" = '0:4755' ]; then
    sandbox_usable=1
  fi
fi

userns_restricted=0
if [ "$(read_setting "$apparmor_path")" = '1' ]; then
  userns_restricted=1
fi
if [ "$(read_setting "$unprivileged_clone_path")" = '0' ]; then
  userns_restricted=1
fi
if [ "$(read_setting "$max_namespaces_path")" = '0' ]; then
  userns_restricted=1
fi

if [ "$sandbox_usable" -eq 0 ] && [ "$userns_restricted" -eq 1 ]; then
  exec "$app_dir/${applicationExecutableName}" --no-sandbox "$@"
fi
exec "$app_dir/${applicationExecutableName}" "$@"
`;
}

export function installLinuxLauncher(packageResult: PackageResult, target: ReleaseTarget): void {
  if (packageResult.platform !== 'linux' || target.forgePlatform !== 'linux') return;

  for (const outputPath of packageResult.outputPaths) {
    const applicationBinary = path.join(outputPath, target.applicationExecutableName);
    if (!statSync(applicationBinary).isFile()) {
      throw new Error(`LINUX_APPLICATION_BINARY_MISSING:${applicationBinary}`);
    }
    const launcher = path.join(outputPath, target.executableName);
    writeFileSync(launcher, linuxLauncherScript(target.applicationExecutableName), { mode: 0o755 });
    chmodSync(launcher, 0o755);
  }
}

import { mkdirSync, rmSync, writeFileSync, lstatSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const PORTABLE_DATA_NOT_WRITABLE = 'PORTABLE_DATA_NOT_WRITABLE';

export interface UserDataModeOptions {
  isPackaged: boolean;
  resourcesPath: string;
  appUserDataDirectory: string;
  executablePath: string;
}

export interface PortableUserDataOptions {
  resourcesPath: string;
}

export interface UserDataPathResult {
  portable: boolean;
  userDataDirectory: string;
}

export interface UserDataWritableCheckOptions {
  userDataDirectory: string;
}

export function isPortableMode(options: PortableUserDataOptions): boolean {
  const markerPath = join(options.resourcesPath, 'portable.flag');
  try {
    return lstatSync(markerPath).isFile();
  } catch {
    return false;
  }
}

export function portableUserDataDirectory(executablePath: string): string {
  return join(dirname(executablePath), 'UserData');
}

export function userDataDirectoryForMode(options: UserDataModeOptions): UserDataPathResult {
  const portable = options.isPackaged && isPortableMode({ resourcesPath: options.resourcesPath });
  return {
    portable,
    userDataDirectory: portable
      ? portableUserDataDirectory(options.executablePath)
      : options.appUserDataDirectory,
  };
}

export function ensurePortableDataWritable(options: UserDataWritableCheckOptions): void {
  try {
    mkdirSync(options.userDataDirectory, { recursive: true });
  } catch {
    throw new Error(PORTABLE_DATA_NOT_WRITABLE);
  }
  const writableProbe = join(options.userDataDirectory, '.quiz-stage-write-check');
  try {
    writeFileSync(writableProbe, '', { flag: 'wx' });
    rmSync(writableProbe, { force: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') return;
    throw new Error(PORTABLE_DATA_NOT_WRITABLE);
  }
}

export function portableDirectoryPermissionError(): Error {
  return new Error(PORTABLE_DATA_NOT_WRITABLE);
}

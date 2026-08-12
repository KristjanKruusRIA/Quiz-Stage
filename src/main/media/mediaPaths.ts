import { dirname, join } from 'node:path';

interface MediaPathOptions {
  userDataDirectory: string;
  executablePath: string;
  portable: boolean;
}

export function mediaOverrideDirectory(options: MediaPathOptions): string {
  return options.portable
    ? join(dirname(options.executablePath), 'UserData', 'media')
    : join(options.userDataDirectory, 'media');
}

export function bundledMediaDirectory(options: {
  isPackaged: boolean;
  resourcesPath: string;
  workingDirectory: string;
}): string {
  return options.isPackaged
    ? join(options.resourcesPath, 'media')
    : join(options.workingDirectory, 'resources', 'media');
}

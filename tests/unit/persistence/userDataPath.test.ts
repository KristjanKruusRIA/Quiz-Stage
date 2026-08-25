import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  PORTABLE_DATA_NOT_WRITABLE,
  ensurePortableDataWritable,
  isPortableMode,
  portableUserDataDirectory,
  userDataDirectoryForMode,
} from '../../../src/main/persistence/userDataPath';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

beforeEach(() => {
  const temporaryDirectory = mkdtempSync(join(process.cwd(), 'quiz-stage-user-data-'));
  temporaryDirectories.push(temporaryDirectory);
});

describe('user-data mode resolution', () => {
  it('uses writable per-user data in non-portable mode and portable directory beside executable when marked', () => {
    const portableMark = mkdtempSync(join(process.cwd(), 'quiz-stage-portable-'));
    temporaryDirectories.push(portableMark);
    writeFileSync(join(portableMark, 'portable.flag'), '1', { encoding: 'utf8' });
    const installedPath = userDataDirectoryForMode({
      isPackaged: true,
      resourcesPath: portableMark,
      appUserDataDirectory: 'C:\\Users\\me\\AppData\\quiz-stage-desktop-game',
      executablePath: 'C:\\Quiz\\QuizStage.exe',
    });
    expect(installedPath).toMatchObject({
      portable: true,
      userDataDirectory: 'C:\\Quiz\\UserData',
    });

    const portablePath = userDataDirectoryForMode({
      isPackaged: false,
      resourcesPath: temporaryDirectories[0],
      appUserDataDirectory: 'C:\\Users\\me\\AppData\\quiz-stage-desktop-game',
      executablePath: 'C:\\Quiz\\QuizStage.exe',
    });
    expect(portablePath).toMatchObject({
      portable: false,
      userDataDirectory: 'C:\\Users\\me\\AppData\\quiz-stage-desktop-game',
    });
  });

  it('resolves portable UserData beside executable', () => {
    const userDataDirectory = portableUserDataDirectory('D:\\Games\\QuizStage\\QuizStage.exe');
    expect(userDataDirectory).toBe('D:\\Games\\QuizStage\\UserData');
  });

  it('returns the writable-error code before DB bootstrapping in portable mode when directory is read-only', () => {
    const userDataRoot = mkdtempSync(join(process.cwd(), 'quiz-stage-user-data-readonly-'));
    temporaryDirectories.push(userDataRoot);
    const userDataDirectory = join(userDataRoot, 'UserData');
    writeFileSync(userDataDirectory, 'blocked', { encoding: 'utf8' });
    expect(() => ensurePortableDataWritable({ userDataDirectory })).toThrow(
      PORTABLE_DATA_NOT_WRITABLE,
    );
  });

  it('treats marker files as portable mode', () => {
    const resources = mkdtempSync(join(process.cwd(), 'quiz-stage-portable-mark-'));
    temporaryDirectories.push(resources);
    const marker = join(resources, 'portable.flag');
    writeFileSync(marker, '1', { encoding: 'utf8' });
    expect(isPortableMode({ resourcesPath: resources })).toBe(true);
  });
});

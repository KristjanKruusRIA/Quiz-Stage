import { describe, expect, it } from 'vitest';
import { bundledMediaDirectory, mediaOverrideDirectory } from '../../../src/main/media/mediaPaths';

describe('media override data paths', () => {
  it('uses per-user data for installer/dev and adjacent UserData for a marked portable package', () => {
    expect(mediaOverrideDirectory({ userDataDirectory: 'C:\\Users\\me\\AppData\\Quiz', executablePath: 'D:\\Quiz\\Quiz.exe', portable: false }))
      .toBe('C:\\Users\\me\\AppData\\Quiz\\media');
    expect(mediaOverrideDirectory({ userDataDirectory: 'ignored', executablePath: 'D:\\Quiz\\Quiz.exe', portable: true }))
      .toBe('D:\\Quiz\\UserData\\media');
  });

  it('resolves packaged media from resources and development media from the project root', () => {
    expect(bundledMediaDirectory({ isPackaged: true, resourcesPath: 'D:\\Quiz\\resources', workingDirectory: 'ignored' }))
      .toBe('D:\\Quiz\\resources\\media');
    expect(bundledMediaDirectory({ isPackaged: false, resourcesPath: 'ignored', workingDirectory: 'C:\\repo' }))
      .toBe('C:\\repo\\resources\\media');
  });
});

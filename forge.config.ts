import { join } from 'node:path';
import { FuseVersion, FuseV1Options } from '@electron/fuses';
import type { ForgeConfig } from '@electron-forge/shared-types';
import { installLinuxLauncher } from './scripts/release/linuxLauncher';
import { makerNamesFor, releaseTargetFor, type MakerName, type PackageProfile } from './scripts/release/targets';

process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING = 'true';
const packageProfile: PackageProfile = process.env.QUIZ_STAGE_PACKAGE_PROFILE === 'installer'
  ? 'installer'
  : process.env.QUIZ_STAGE_PACKAGE_PROFILE === 'portable'
    ? 'portable'
    : 'all';
const windowsIconPath = join(process.cwd(), 'resources', 'media', 'icon.ico');
const packagerIconPath = process.platform === 'win32'
  ? windowsIconPath
  : process.platform === 'darwin'
    ? join(process.cwd(), '.cache', 'icons', 'QuizStage.icns')
    : undefined;

const fuseConfig = {
  version: FuseVersion.V1,
  [FuseV1Options.RunAsNode]: false,
  [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
  [FuseV1Options.EnableNodeCliInspectArguments]: false,
  [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
  [FuseV1Options.OnlyLoadAppFromAsar]: true,
};

const squirrelMaker = {
  name: '@electron-forge/maker-squirrel',
  config: {
    name: 'QuizStage',
    title: 'Quiz Stage',
    exe: 'Quiz Stage.exe',
    setupExe: 'QuizStageSetup.exe',
    setupIcon: windowsIconPath,
  },
  platforms: ['win32'],
};

const zipMaker = {
  name: '@electron-forge/maker-zip',
  config: {},
  platforms: ['win32', 'darwin', 'linux'],
};

const debMaker = {
  name: '@electron-forge/maker-deb',
  config: {
    options: {
      name: 'quiz-stage',
      bin: 'quiz-stage',
      productName: 'Quiz Stage',
      genericName: 'Quiz game',
      categories: ['Game'],
      maintainer: 'Quiz Stage',
      icon: join(process.cwd(), 'resources', 'media', 'icon-source.png'),
    },
  },
  platforms: ['linux'],
};

const makersByName: Record<MakerName, typeof squirrelMaker | typeof zipMaker | typeof debMaker> = {
  squirrel: squirrelMaker,
  zip: zipMaker,
  deb: debMaker,
};
const releaseTarget = releaseTargetFor(process.platform, process.arch);
const makers = makerNamesFor(releaseTarget, packageProfile)
  .map((makerName) => makersByName[makerName]);

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    executableName: releaseTarget.applicationExecutableName,
    electronZipDir: join(process.cwd(), '.cache', 'electron-zips'),
    ...(packagerIconPath === undefined ? {} : { icon: packagerIconPath }),
    extraResource: ['resources/content/seed.sqlite', 'resources/content/dev-seed.sqlite', 'resources/media'],
    ignore: (file) => {
      if (!file) return false;
      return !(
        file.startsWith('/.vite')
        || file === '/node_modules'
        || file.startsWith('/node_modules/better-sqlite3')
      );
    },
  },
  hooks: {
    postPackage: async (_forgeConfig, packageResult) => {
      installLinuxLauncher(packageResult, releaseTarget);
    },
  },
  makers,
  plugins: [
    {
      name: '@electron-forge/plugin-fuses',
      config: fuseConfig,
    },
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          {
            entry: 'src/main/main.ts',
            config: 'vite.main.config.ts',
          },
          {
            entry: 'src/preload/preload.ts',
            config: 'vite.preload.config.ts',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.ts',
          },
        ],
      },
    },
  ],
};

export default config;

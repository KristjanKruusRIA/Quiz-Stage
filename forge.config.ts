import type { ForgeConfig } from '@electron-forge/shared-types';

process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING = 'true';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
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
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      config: {},
      platforms: ['win32'],
    },
  ],
  plugins: [
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

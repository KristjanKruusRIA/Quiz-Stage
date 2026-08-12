import { execFileSync } from 'node:child_process';
import { copyFileSync, cpSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export const PRODUCT_BUILD_READY = 'QUIZ_STAGE_PRODUCT_BUILD_READY';

export function prepareE2eApplication(): void {
  if (process.env[PRODUCT_BUILD_READY] !== '1') {
    execFileSync(process.execPath, [
      'node_modules/@electron-forge/cli/dist/electron-forge.js',
      'package',
      '--platform=win32',
      '--arch=x64',
    ], { cwd: process.cwd(), stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } });
  }
  const buildResources = path.join(process.cwd(), '.vite', 'build', 'resources');
  const content = path.join(buildResources, 'content');
  mkdirSync(content, { recursive: true });
  copyFileSync(path.join(process.cwd(), 'resources', 'content', 'dev-seed.sqlite'), path.join(content, 'dev-seed.sqlite'));
  cpSync(path.join(process.cwd(), 'resources', 'media'), path.join(buildResources, 'media'), { recursive: true });
}

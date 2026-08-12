import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

type ProductPlatform = 'win32' | 'linux' | 'darwin';

export const PRODUCT_BUILD_STAMP_PATH = 'QUIZ_STAGE_INTERNAL_BUILD_STAMP_PATH';
export const PRODUCT_BUILD_STAMP_TOKEN = 'QUIZ_STAGE_INTERNAL_BUILD_STAMP_TOKEN';

interface ProductBuildStampOptions {
  stampPath: string;
  token: string;
  sourcePaths: string[];
  outputPaths: string[];
  executablePath: string;
}

interface ProductBuildStamp {
  version: 1;
  tokenHash: string;
  sourceHash: string;
  outputHash: string;
  executableHash: string;
}

function hash(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function filesWithin(candidate: string): string[] {
  const stats = statSync(candidate);
  if (stats.isFile()) return [candidate];
  if (!stats.isDirectory()) throw new Error(`INVALID_PRODUCT_BUILD_INPUT:${candidate}`);
  return readdirSync(candidate, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => filesWithin(path.join(candidate, entry.name)));
}

function fingerprint(candidates: string[]): string {
  const digest = createHash('sha256');
  for (const candidate of candidates.map((item) => path.resolve(item)).sort()) {
    for (const file of filesWithin(candidate)) {
      digest.update(path.relative(process.cwd(), file).replaceAll(path.sep, '/'));
      digest.update('\0');
      digest.update(readFileSync(file));
      digest.update('\0');
    }
  }
  return digest.digest('hex');
}

export function forgePackageArguments(
  platform: ProductPlatform = process.platform as ProductPlatform,
  arch = process.arch,
): string[] {
  return ['package', `--platform=${platform}`, `--arch=${arch}`];
}

export function electronExecutablePath(
  cwd = process.cwd(),
  platform: ProductPlatform = process.platform as ProductPlatform,
): string {
  if (platform === 'win32') return path.win32.join(cwd, 'node_modules', 'electron', 'dist', 'electron.exe');
  if (platform === 'darwin') return path.posix.join(cwd, 'node_modules', 'electron', 'dist', 'Electron.app', 'Contents', 'MacOS', 'Electron');
  return path.posix.join(cwd, 'node_modules', 'electron', 'dist', 'electron');
}

export function packagedExecutablePath(
  cwd = process.cwd(),
  platform: ProductPlatform = process.platform as ProductPlatform,
  arch = process.arch,
): string {
  if (platform === 'win32') return path.win32.join(cwd, 'out', `quiz-stage-desktop-game-${platform}-${arch}`, 'quiz-stage-desktop-game.exe');
  const root = path.posix.join(cwd, 'out', `quiz-stage-desktop-game-${platform}-${arch}`);
  if (platform === 'darwin') return path.posix.join(root, 'quiz-stage-desktop-game.app', 'Contents', 'MacOS', 'quiz-stage-desktop-game');
  return path.posix.join(root, 'quiz-stage-desktop-game');
}

export function packagedResourcesPath(
  cwd = process.cwd(),
  platform: ProductPlatform = process.platform as ProductPlatform,
  arch = process.arch,
): string {
  if (platform === 'win32') return path.win32.join(cwd, 'out', `quiz-stage-desktop-game-${platform}-${arch}`, 'resources', 'app.asar');
  const root = path.posix.join(cwd, 'out', `quiz-stage-desktop-game-${platform}-${arch}`);
  if (platform === 'darwin') return path.posix.join(root, 'quiz-stage-desktop-game.app', 'Contents', 'Resources', 'app.asar');
  return path.posix.join(root, 'resources', 'app.asar');
}

export function terminateExactProcessTree(
  pid: number,
  platform: ProductPlatform = process.platform as ProductPlatform,
  ports: {
    execFileSync?: typeof execFileSync;
    kill?: typeof process.kill;
  } = {},
): void {
  if (!Number.isSafeInteger(pid) || pid < 1) throw new Error('INVALID_PROCESS_ID');
  if (platform === 'win32') {
    (ports.execFileSync ?? execFileSync)('taskkill.exe', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
    return;
  }
  (ports.kill ?? process.kill)(-pid, 'SIGKILL');
}

export function createProductBuildStamp(options: ProductBuildStampOptions): void {
  const value: ProductBuildStamp = {
    version: 1,
    tokenHash: hash(options.token),
    sourceHash: fingerprint(options.sourcePaths),
    outputHash: fingerprint(options.outputPaths),
    executableHash: fingerprint([options.executablePath]),
  };
  writeFileSync(options.stampPath, JSON.stringify(value), { encoding: 'utf8', flag: 'wx' });
}

export function validateProductBuildStamp(options: ProductBuildStampOptions): boolean {
  try {
    const value = JSON.parse(readFileSync(options.stampPath, 'utf8')) as ProductBuildStamp;
    return value.version === 1
      && value.tokenHash === hash(options.token)
      && value.sourceHash === fingerprint(options.sourcePaths)
      && value.outputHash === fingerprint(options.outputPaths)
      && value.executableHash === fingerprint([options.executablePath]);
  } catch {
    return false;
  }
}

export function productBuildInputs(
  cwd = process.cwd(),
  platform: ProductPlatform = process.platform as ProductPlatform,
  arch = process.arch,
): Pick<ProductBuildStampOptions, 'sourcePaths' | 'outputPaths' | 'executablePath'> {
  return {
    sourcePaths: [
      'package.json',
      'package-lock.json',
      'forge.config.ts',
      'tsconfig.json',
      'vite.main.config.ts',
      'vite.preload.config.ts',
      'vite.renderer.config.ts',
      'src',
      'resources',
      'scripts',
      'tests',
    ].map((candidate) => path.join(cwd, candidate)),
    outputPaths: [
      path.join(cwd, '.vite', 'build', 'main.js'),
      path.join(cwd, '.vite', 'build', 'preload.js'),
      path.join(cwd, '.vite', 'renderer', 'main_window'),
      packagedResourcesPath(cwd, platform, arch),
    ],
    executablePath: packagedExecutablePath(cwd, platform, arch),
  };
}

export function prepareE2eApplication(): void {
  const stampPath = process.env[PRODUCT_BUILD_STAMP_PATH];
  const token = process.env[PRODUCT_BUILD_STAMP_TOKEN];
  if (stampPath === undefined && token === undefined) {
    execFileSync(process.execPath, [
      'node_modules/@electron-forge/cli/dist/electron-forge.js',
      ...forgePackageArguments(),
    ], { cwd: process.cwd(), stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } });
  } else if (
    stampPath === undefined
    || token === undefined
    || !validateProductBuildStamp({ stampPath, token, ...productBuildInputs() })
  ) {
    throw new Error('INVALID_PRODUCT_BUILD_STAMP');
  }

  const buildResources = path.join(process.cwd(), '.vite', 'build', 'resources');
  const content = path.join(buildResources, 'content');
  mkdirSync(content, { recursive: true });
  copyFileSync(path.join(process.cwd(), 'resources', 'content', 'dev-seed.sqlite'), path.join(content, 'dev-seed.sqlite'));
  rmSync(path.join(buildResources, 'media'), { recursive: true, force: true });
  cpSync(path.join(process.cwd(), 'resources', 'media'), path.join(buildResources, 'media'), { recursive: true });
}

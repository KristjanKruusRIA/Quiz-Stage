import { lstatSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

const CANDIDATE_ROOT = resolve('content/imports');
const WORK_ROOT = resolve('content/work');

function assertSafeDescendant(path: string, root: string): string {
  const destination = resolve(path);
  const relativePath = relative(root, destination);
  if (relativePath === '' || isAbsolute(relativePath) || relativePath === '..' || relativePath.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`)) {
    throw new Error(`Destination must be under ${root}: ${destination}`);
  }

  let current = destination;
  while (true) {
    const metadata = lstatSync(current, { throwIfNoEntry: false });
    if (metadata?.isSymbolicLink()) {
      throw new Error(`Destination must not use a symbolic link: ${current}`);
    }
    const parent = resolve(current, '..');
    if (parent === current) break;
    current = parent;
  }
  return destination;
}

export function assertCandidateOutputPath(path: string): string {
  return assertSafeDescendant(path, CANDIDATE_ROOT);
}

export function assertWorkOutputPath(path: string): string {
  return assertSafeDescendant(path, WORK_ROOT);
}

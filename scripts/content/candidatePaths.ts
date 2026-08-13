import { lstatSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const CANDIDATE_ROOT = resolve(REPOSITORY_ROOT, 'content/imports');
export const WORK_ROOT = resolve(REPOSITORY_ROOT, 'content/work');

function assertSafeDescendant(path: string, root: string): string {
  const destination = resolve(path);
  const relativePath = relative(root, destination);
  if (relativePath === '' || isAbsolute(relativePath) || relativePath === '..' || relativePath.startsWith(`..${sep}`)) {
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

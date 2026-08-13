import { lstatSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
export const CANDIDATE_ROOT = resolve(REPOSITORY_ROOT, 'content/imports');
export const WORK_ROOT = resolve(REPOSITORY_ROOT, 'content/work');
export const THIRD_PARTY_NOTICE_PATH = resolve(REPOSITORY_ROOT, 'content/THIRD_PARTY_NOTICES.md');

function assertNoSymlinks(destination: string): void {
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
}

function assertSafeDescendant(path: string, root: string): string {
  const destination = resolve(path);
  const relativePath = relative(root, destination);
  if (relativePath === '' || isAbsolute(relativePath) || relativePath === '..' || relativePath.startsWith(`..${sep}`)) {
    throw new Error(`Destination must be under ${root}: ${destination}`);
  }

  assertNoSymlinks(destination);
  return destination;
}

export function assertCandidateOutputPath(path: string): string {
  return assertSafeDescendant(path, CANDIDATE_ROOT);
}

export function assertWorkOutputPath(path: string): string {
  return assertSafeDescendant(path, WORK_ROOT);
}

export function assertThirdPartyNoticeOutputPath(path: string): string {
  const destination = resolve(path);
  if (relative(THIRD_PARTY_NOTICE_PATH, destination) !== '') {
    throw new Error(`Legal notice destination must be ${THIRD_PARTY_NOTICE_PATH}: ${destination}`);
  }
  assertNoSymlinks(destination);
  return destination;
}

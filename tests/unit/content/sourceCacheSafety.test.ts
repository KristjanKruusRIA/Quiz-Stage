import {
  mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, symlinkSync, writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { openFileSourceCache, type SourceCache } from '../../../scripts/content/sourceCheck';

interface CachePublicationDependencies {
  beforeRename?(): void;
  createTemporaryId?(): string;
}

function openWithDependencies(path: string, dependencies: CachePublicationDependencies): SourceCache & { publish(): void } {
  return (openFileSourceCache as unknown as (
    cachePath: string,
    publicationDependencies: CachePublicationDependencies,
  ) => SourceCache & { publish(): void })(path, dependencies);
}

describe('file source cache boundary', () => {
  test('rejects an existing junction ancestor without reading or writing outside it', () => {
    const root = mkdtempSync(join(tmpdir(), 'quiz-stage-cache-junction-'));
    const outside = join(root, 'outside');
    const linked = join(root, 'linked');
    const outsideCache = join(outside, 'source-cache.json');
    mkdirSync(outside);
    writeFileSync(outsideCache, '{not-cache-json}\n');
    symlinkSync(outside, linked, 'junction');

    expect(() => openFileSourceCache(join(linked, 'source-cache.json'))).toThrow(/symlink|junction/i);
    expect(readFileSync(outsideCache, 'utf8')).toBe('{not-cache-json}\n');
    expect(readdirSync(outside)).toEqual(['source-cache.json']);
  });

  test('rejects an ancestor swapped to a junction after open and before publish', () => {
    const root = mkdtempSync(join(tmpdir(), 'quiz-stage-cache-swap-'));
    const ancestor = join(root, 'cache-root');
    const parent = join(ancestor, 'nested');
    const displaced = join(root, 'displaced');
    const outside = join(root, 'outside');
    const outsideNested = join(outside, 'nested');
    const cachePath = join(parent, 'source-cache.json');
    mkdirSync(parent, { recursive: true });
    mkdirSync(outsideNested, { recursive: true });
    writeFileSync(join(outsideNested, 'sentinel.txt'), 'outside sentinel');
    const cache = openFileSourceCache(cachePath);
    renameSync(ancestor, displaced);
    symlinkSync(outside, ancestor, 'junction');

    expect(() => cache.publish()).toThrow(/symlink|junction/i);
    expect(readFileSync(join(outsideNested, 'sentinel.txt'), 'utf8')).toBe('outside sentinel');
    expect(readdirSync(outsideNested)).toEqual(['sentinel.txt']);
  });

  test('revalidates after staging and never cleans through a swapped ancestor', () => {
    const root = mkdtempSync(join(tmpdir(), 'quiz-stage-cache-rename-swap-'));
    const ancestor = join(root, 'cache-root');
    const parent = join(ancestor, 'nested');
    const displaced = join(root, 'displaced');
    const outside = join(root, 'outside');
    const outsideNested = join(outside, 'nested');
    const cachePath = join(parent, 'source-cache.json');
    mkdirSync(parent, { recursive: true });
    mkdirSync(outsideNested, { recursive: true });
    writeFileSync(cachePath, '{"version":1,"entries":{}}\n');
    writeFileSync(join(outsideNested, 'sentinel.txt'), 'outside sentinel');
    const cache = openWithDependencies(cachePath, {
      createTemporaryId: () => 'owned',
      beforeRename: () => {
        renameSync(ancestor, displaced);
        symlinkSync(outside, ancestor, 'junction');
      },
    });

    expect(() => cache.publish()).toThrow(/symlink|junction/i);
    expect(readFileSync(join(outsideNested, 'sentinel.txt'), 'utf8')).toBe('outside sentinel');
    expect(readdirSync(outsideNested)).toEqual(['sentinel.txt']);
    expect(readFileSync(join(displaced, 'nested/source-cache.json'), 'utf8')).toBe('{"version":1,"entries":{}}\n');
    expect(readdirSync(join(displaced, 'nested'))).toEqual(expect.arrayContaining([
      'source-cache.json', 'source-cache.json.owned.tmp',
    ]));
  });

  test('continues to reject a cache directory', () => {
    const root = mkdtempSync(join(tmpdir(), 'quiz-stage-cache-directory-'));
    const cachePath = join(root, 'source-cache.json');
    mkdirSync(cachePath);
    expect(() => openFileSourceCache(cachePath)).toThrow(/regular file/i);
  });
});

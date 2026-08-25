import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, parse, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';
import { buildDevelopmentSeed } from '../../../scripts/content/build-dev-seed';

const fixturePath = resolve('tests/fixtures/dev-content.json');
const builderPath = resolve('scripts/content/build-dev-seed.ts');
const tsxCliPath = resolve('node_modules/tsx/dist/cli.mjs');

describe('development seed builder', () => {
  const temporaryDirectories: string[] = [];

  afterEach(() => {
    for (const directory of temporaryDirectories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  function temporaryDirectory(): string {
    const directory = mkdtempSync(join(tmpdir(), 'quiz-stage-seed-builder-'));
    temporaryDirectories.push(directory);
    return directory;
  }

  function invalidForeignKeyFixture(directory: string): string {
    const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
    fixture.categorySets.at(-1).packId = 'missing-pack';
    const path = join(directory, 'invalid-fixture.json');
    writeFileSync(path, JSON.stringify(fixture));
    return path;
  }

  function sha256(path: string): string {
    return createHash('sha256').update(readFileSync(path)).digest('hex');
  }

  it('preserves the previous seed and cleans temporary files when a replacement build fails', () => {
    const directory = temporaryDirectory();
    const outputPath = join(directory, 'dev-seed.sqlite');
    buildDevelopmentSeed(fixturePath, outputPath);
    const previousSeedHash = sha256(outputPath);

    expect(() => buildDevelopmentSeed(invalidForeignKeyFixture(directory), outputPath))
      .toThrow(/foreign key/i);

    expect(sha256(outputPath)).toBe(previousSeedHash);
    expect(readdirSync(directory).filter((name) => name.includes('.tmp'))).toEqual([]);
  });

  it('rolls back a failed transactional import without publishing a partial database', () => {
    const directory = temporaryDirectory();
    const outputPath = join(directory, 'dev-seed.sqlite');

    expect(() => buildDevelopmentSeed(invalidForeignKeyFixture(directory), outputPath))
      .toThrow(/foreign key/i);

    expect(existsSync(outputPath)).toBe(false);
    expect(readdirSync(directory).filter((name) => name.includes('.tmp'))).toEqual([]);
  });

  it('rejects unsafe output targets before modifying them', () => {
    const directory = temporaryDirectory();
    const directoryTarget = join(directory, 'directory.sqlite');
    mkdirSync(directoryTarget);
    const nonSqliteTarget = join(directory, 'seed.json');
    const invalidSqliteTarget = join(directory, 'not-a-database.sqlite');
    writeFileSync(invalidSqliteTarget, 'not sqlite');
    const fixtureAlias = join(directory, 'fixture.sqlite');
    copyFileSync(fixturePath, fixtureAlias);

    const unsafeTargets = [
      { fixture: fixturePath, output: parse(directory).root },
      { fixture: fixturePath, output: directoryTarget },
      { fixture: fixturePath, output: nonSqliteTarget },
      { fixture: fixturePath, output: invalidSqliteTarget },
      { fixture: fixtureAlias, output: fixtureAlias },
    ];
    for (const target of unsafeTargets) {
      expect(() => buildDevelopmentSeed(target.fixture, target.output)).toThrow(/unsafe seed output/i);
    }

    expect(readFileSync(invalidSqliteTarget, 'utf8')).toBe('not sqlite');
    expect(sha256(fixtureAlias)).toBe(sha256(fixturePath));
  });

  it('rejects a dangling destination symlink without following or replacing it', () => {
    const directory = temporaryDirectory();
    const outputPath = join(directory, 'dangling.sqlite');
    symlinkSync(join(directory, 'missing-target.sqlite'), outputPath, 'file');

    expect(() => buildDevelopmentSeed(fixturePath, outputPath)).toThrow(/unsafe seed output/i);

    expect(lstatSync(outputPath).isSymbolicLink()).toBe(true);
    expect(existsSync(join(directory, 'missing-target.sqlite'))).toBe(false);
  });

  it('uses repository-anchored defaults when launched from another working directory', () => {
    const directory = temporaryDirectory();
    const outputPath = join(directory, 'foreign-cwd-seed.sqlite');
    const result = spawnSync(process.execPath, [tsxCliPath, builderPath, outputPath], {
      cwd: directory,
      encoding: 'utf8',
    });

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain('183 clues, 36 category sets, 3 Finals');
    expect(existsSync(outputPath)).toBe(true);
  }, 30_000);

  it('produces byte-equivalent SQLite output on consecutive rebuilds', () => {
    const directory = temporaryDirectory();
    const outputPath = join(directory, 'deterministic.sqlite');

    expect(buildDevelopmentSeed(fixturePath, outputPath)).toEqual({
      clues: 183,
      categorySets: 36,
      finals: 3,
    });
    const firstHash = sha256(outputPath);
    buildDevelopmentSeed(fixturePath, outputPath);

    expect(sha256(outputPath)).toBe(firstHash);
  });
});

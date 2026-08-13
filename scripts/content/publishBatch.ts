import { randomUUID, createHash } from 'node:crypto';
import {
  existsSync, lstatSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { acceptedBatchPaths, getProductionBatch } from './productionBatches';
import { parseBatchVerificationReport } from './verifyBatch';
import type { BatchVerificationReport } from './verifyBatch';

export interface PublishBatchDependencies {
  rename(source: string, destination: string): void;
}

export interface PublishBatchOptions {
  batchId: string;
  workRoot: string;
  acceptedRoot: string;
  dependencies?: PublishBatchDependencies;
}

function within(root: string, path: string): boolean {
  const child = relative(root, path);
  return child !== '' && !isAbsolute(child) && child !== '..' && !child.startsWith(`..${sep}`);
}

function assertNoSymlinkAncestors(path: string): void {
  let current = resolve(path);
  while (true) {
    const stat = lstatSync(current, { throwIfNoEntry: false });
    if (stat?.isSymbolicLink()) throw new Error(`Batch path must not contain symlinks: ${path}`);
    const parent = dirname(current);
    if (parent === current) return;
    current = parent;
  }
}

function assertSafePath(root: string, path: string, destination: boolean): void {
  if (!within(root, path)) throw new Error(`Batch path escapes or prefix-collides with its root: ${path}`);
  assertNoSymlinkAncestors(root);
  let current = destination ? dirname(path) : path;
  while (within(root, current) || current === root) {
    const stat = lstatSync(current, { throwIfNoEntry: false });
    if (stat?.isSymbolicLink()) throw new Error(`Batch path must not contain symlinks: ${path}`);
    if (current === root) break;
    current = dirname(current);
  }
  const stat = lstatSync(path, { throwIfNoEntry: false });
  if (stat?.isSymbolicLink() || (stat !== undefined && !stat.isFile())) throw new Error(`Batch destination is not a safe regular file: ${path}`);
}

function safeRead(path: string): Buffer {
  const before = lstatSync(path);
  if (!before.isFile() || before.isSymbolicLink()) throw new Error(`Batch artifact is not a safe regular file: ${path}`);
  const bytes = readFileSync(path);
  const after = lstatSync(path);
  if (!after.isFile() || after.isSymbolicLink() || before.dev !== after.dev || before.ino !== after.ino
    || before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs) {
    throw new Error(`Batch artifact changed while reading: ${path}`);
  }
  return bytes;
}

function digest(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function removeOwned(path: string): void {
  try { unlinkSync(path); } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

function isPassingReport(report: BatchVerificationReport): boolean {
  return !report.blocking
    && !report.validations.authored.blocking
    && !report.validations.generated.blocking
    && !report.translationDiagnostics.blocking
    && report.validations.authored.issues.every((issue) => issue.severity !== 'error')
    && report.validations.generated.issues.every((issue) => issue.severity !== 'error')
    && report.translationDiagnostics.issues.every((issue) => issue.severity !== 'error')
    && report.sources.every((source) => source.ok)
    && report.unresolvedIssues.every((issue) => !['evidence', 'samples', 'source'].includes(issue.scope));
}

export async function publishBatch(options: PublishBatchOptions): Promise<void> {
  const batch = getProductionBatch(options.batchId);
  const workRoot = resolve(options.workRoot);
  const acceptedRoot = resolve(options.acceptedRoot);
  const workDirectory = resolve(workRoot, batch.id);
  const accepted = acceptedBatchPaths(batch.id);
  const sources = {
    authored: resolve(workDirectory, 'authored.csv'), generated: resolve(workDirectory, 'generated.en-et.csv'),
    evidence: resolve(workDirectory, 'evidence.jsonl'), report: resolve(workDirectory, 'report.json'),
  };
  const destinations = {
    authored: resolve(acceptedRoot, accepted.authored), generated: resolve(acceptedRoot, accepted.generated),
    evidence: resolve(acceptedRoot, accepted.evidence), report: resolve(acceptedRoot, accepted.report),
  };
  for (const path of Object.values(sources)) assertSafePath(workRoot, path, false);
  for (const path of Object.values(destinations)) assertSafePath(acceptedRoot, path, true);

  let report;
  try { report = parseBatchVerificationReport(JSON.parse(safeRead(sources.report).toString('utf8'))); }
  catch { throw new Error('Publication requires a passing verification report'); }
  if (!isPassingReport(report) || report.batchId !== batch.id) {
    throw new Error('Publication requires a passing verification report for this batch');
  }
  const bytes = {
    authored: safeRead(sources.authored), generated: safeRead(sources.generated),
    evidence: safeRead(sources.evidence), report: safeRead(sources.report),
  };
  for (const key of ['authored', 'generated', 'evidence'] as const) {
    if (digest(bytes[key]) !== report.artifactHashes[key]) throw new Error(`Artifact hash mismatch for ${key}`);
  }

  const rename = options.dependencies?.rename ?? renameSync;
  const token = randomUUID();
  const keys = ['authored', 'generated', 'evidence', 'report'] as const;
  const temporaries = Object.fromEntries(keys.map((key) => [key, `${destinations[key]}.${token}.tmp`])) as Record<typeof keys[number], string>;
  const backups = Object.fromEntries(keys.map((key) => [key, `${destinations[key]}.${token}.bak`])) as Record<typeof keys[number], string>;
  const hadOriginal = new Set<typeof keys[number]>();
  const replaced = new Set<typeof keys[number]>();
  try {
    for (const key of keys) {
      mkdirSync(dirname(destinations[key]), { recursive: true });
      assertSafePath(acceptedRoot, destinations[key], true);
      writeFileSync(temporaries[key], bytes[key], { flag: 'wx' });
    }
    for (const key of keys) {
      assertSafePath(acceptedRoot, destinations[key], true);
      if (existsSync(destinations[key])) {
        rename(destinations[key], backups[key]);
        hadOriginal.add(key);
      }
    }
    for (const key of keys) {
      assertSafePath(acceptedRoot, destinations[key], true);
      rename(temporaries[key], destinations[key]);
      replaced.add(key);
    }
  } catch (error) {
    for (const key of [...keys].reverse()) {
      if (replaced.has(key)) removeOwned(destinations[key]);
      if (hadOriginal.has(key) && existsSync(backups[key])) renameSync(backups[key], destinations[key]);
    }
    throw error;
  } finally {
    for (const key of keys) {
      removeOwned(temporaries[key]);
      removeOwned(backups[key]);
    }
  }
}

async function runCli(argv = process.argv.slice(2)): Promise<void> {
  const value = (name: string) => argv[argv.indexOf(name) + 1];
  const batchId = value('--batch');
  if (batchId === undefined) throw new Error('--batch is required');
  await publishBatch({
    batchId, workRoot: value('--work-root') ?? resolve('content/work'),
    acceptedRoot: value('--accepted-root') ?? process.cwd(),
  });
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  runCli().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 2;
  });
}

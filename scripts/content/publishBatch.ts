import { randomUUID, createHash } from 'node:crypto';
import {
  existsSync, lstatSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TextDecoder } from 'node:util';
import { parsePackCsv, type ParsedPack } from '../../src/main/content/csvPacks';
import { parseEvidenceJsonl, type ContentEvidence } from './evidence';
import {
  acceptedBatchPaths, getProductionBatch, type ProductionBatchDefinition,
} from './productionBatches';
import { parseBatchVerificationReport } from './verifyBatch';
import type { FullBatchVerificationReport } from './verifyBatch';
import { diagnoseTranslations } from './translationDiagnostics';
import { validateProductionContent } from './validate';

export interface PublishBatchDependencies {
  rename?(source: string, destination: string): void;
  restore?(source: string, destination: string): void;
  createTemporaryId?(): string;
  afterReportRead?(): void;
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

function decodeUtf8(bytes: Buffer): string {
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

function compareCodeUnits(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function expectedSamples(pack: ParsedPack, batch: ProductionBatchDefinition): Record<string, string[]> {
  const rows = [...pack.rows].sort((left, right) => compareCodeUnits(left.clue_id, right.clue_id));
  const cells = batch.distribution === null
    ? ['easy', 'medium', 'hard'].map((difficulty) => ({ key: difficulty, count: 15, difficulty, round: 'final' }))
    : ['easy', 'medium', 'hard'].flatMap((difficulty) => ['round-one', 'round-two']
      .map((round) => ({ key: `${difficulty}/${round}`, count: 5, difficulty, round })));
  return Object.fromEntries(cells.sort((left, right) => compareCodeUnits(left.key, right.key)).map((cell) => [
    cell.key,
    rows.filter((row) => row.difficulty === cell.difficulty && row.round === cell.round)
      .slice(0, cell.count).map((row) => row.clue_id),
  ]));
}

function coherentSuccessfulSource(source: FullBatchVerificationReport['sources'][number]): boolean {
  if (!source.ok || source.status === null || source.status < 200 || source.status >= 300
    || source.code !== null || source.retrievedAt === null
    || !Number.isFinite(Date.parse(source.retrievedAt))
    || new Date(source.retrievedAt).toISOString() !== source.retrievedAt
    || source.finalUrl === null) return false;
  try {
    const finalUrl = new URL(source.finalUrl);
    return finalUrl.protocol === 'https:' && finalUrl.username === '' && finalUrl.password === '';
  } catch { return false; }
}

function isPassingReport(
  report: FullBatchVerificationReport,
  batch: ProductionBatchDefinition,
  authoredPack: ParsedPack,
  generatedPack: ParsedPack,
  evidence: ReadonlyMap<string, ContentEvidence>,
): boolean {
  const samples = expectedSamples(generatedPack, batch);
  const expectedUrls = [...new Set([...evidence.values()].map((item) => item.supportingSource.url))].sort(compareCodeUnits);
  const actualUrls = report.sources.map((source) => source.url);
  const sampleIds = Object.values(report.samples).flat();
  const sampleSize = batch.distribution === null ? 15 : 5;
  const expectedSummary = report.validations.generated.summary;
  const authoredValidation = validateProductionContent([{ file: 'authored.csv', pack: authoredPack }], {
    mode: 'batch', allowMissingEt: true, evidenceByClueId: evidence, batch,
  });
  const generatedValidation = validateProductionContent([{ file: 'generated.en-et.csv', pack: generatedPack }], {
    mode: 'batch', evidenceByClueId: evidence, batch,
  });
  const translationDiagnostics = diagnoseTranslations([{ file: 'generated.en-et.csv', pack: generatedPack }]);
  const rowsAreBound = evidence.size === generatedPack.rows.length && generatedPack.rows.every((row) => {
    const record = evidence.get(row.clue_id);
    return record !== undefined && record.batchId === batch.id && record.translationReview !== null
      && record.supportingSource.title.trim() === row.source_title.trim()
      && record.supportingSource.url.trim() === row.source_url.trim()
      && record.supportingSource.license.trim() === row.source_license.trim()
      && record.supportingSource.retrievedAt.trim() === row.source_retrieved_at.trim()
      && record.assertion.trim() === `${row.response_en.trim()} — ${row.explanation_en.trim()}`;
  });
  return !report.blocking
    && !report.validations.authored.blocking
    && !report.validations.generated.blocking
    && !report.translationDiagnostics.blocking
    && !authoredValidation.blocking
    && !generatedValidation.blocking
    && !translationDiagnostics.blocking
    && report.validations.authored.issues.every((issue) => issue.severity !== 'error')
    && report.validations.generated.issues.every((issue) => issue.severity !== 'error')
    && report.translationDiagnostics.issues.every((issue) => issue.severity !== 'error')
    && report.translationDiagnostics.checkedRows === generatedPack.rows.length
    && rowsAreBound
    && expectedSummary.boardClues === batch.boardClues
    && expectedSummary.finalClues === batch.finalClues
    && JSON.stringify(authoredValidation.summary) === JSON.stringify(report.validations.authored.summary)
    && JSON.stringify(generatedValidation.summary) === JSON.stringify(report.validations.generated.summary)
    && JSON.stringify(report.validations.authored.summary) === JSON.stringify(expectedSummary)
    && report.sources.every(coherentSuccessfulSource)
    && JSON.stringify(actualUrls) === JSON.stringify(expectedUrls)
    && JSON.stringify(report.samples) === JSON.stringify(samples)
    && Object.values(report.samples).every((ids) => ids.length === sampleSize)
    && new Set(sampleIds).size === sampleIds.length
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
  let reportBytes: Buffer;
  try {
    reportBytes = safeRead(sources.report);
    report = parseBatchVerificationReport(JSON.parse(decodeUtf8(reportBytes)));
  }
  catch { throw new Error('Publication requires a passing verification report'); }
  if (report.kind !== 'verification' || report.batchId !== batch.id) {
    throw new Error('Publication requires a passing verification report for this batch');
  }
  options.dependencies?.afterReportRead?.();
  const bytes = {
    authored: safeRead(sources.authored), generated: safeRead(sources.generated),
    evidence: safeRead(sources.evidence), report: reportBytes,
  };
  for (const key of ['authored', 'generated', 'evidence'] as const) {
    if (digest(bytes[key]) !== report.artifactHashes[key]) throw new Error(`Artifact hash mismatch for ${key}`);
  }
  let authoredPack: ParsedPack;
  let generatedPack: ParsedPack;
  let evidence: ReadonlyMap<string, ContentEvidence>;
  try {
    authoredPack = parsePackCsv(decodeUtf8(bytes.authored));
    generatedPack = parsePackCsv(decodeUtf8(bytes.generated));
    evidence = parseEvidenceJsonl(decodeUtf8(bytes.evidence), 'evidence.jsonl');
  } catch { throw new Error('Publication requires a passing verification report with parseable artifacts'); }
  if (!isPassingReport(report, batch, authoredPack, generatedPack, evidence)) {
    throw new Error('Publication requires a passing verification report for this batch');
  }

  const rename = options.dependencies?.rename ?? renameSync;
  const restore = options.dependencies?.restore ?? renameSync;
  const token = (options.dependencies?.createTemporaryId ?? randomUUID)();
  const keys = ['authored', 'generated', 'evidence', 'report'] as const;
  const temporaries = Object.fromEntries(keys.map((key) => [key, `${destinations[key]}.${token}.tmp`])) as Record<typeof keys[number], string>;
  const backups = Object.fromEntries(keys.map((key) => [key, `${destinations[key]}.${token}.bak`])) as Record<typeof keys[number], string>;
  const hadOriginal = new Set<typeof keys[number]>();
  const replaced = new Set<typeof keys[number]>();
  const ownedTemporaries = new Set<string>();
  const ownedBackups = new Set<string>();
  try {
    for (const path of [...Object.values(temporaries), ...Object.values(backups)]) {
      if (lstatSync(path, { throwIfNoEntry: false }) !== undefined) {
        throw new Error(`Publisher-owned path collision: ${path}`);
      }
    }
    for (const key of keys) {
      mkdirSync(dirname(destinations[key]), { recursive: true });
      assertSafePath(acceptedRoot, destinations[key], true);
      writeFileSync(temporaries[key], bytes[key], { flag: 'wx' });
      ownedTemporaries.add(temporaries[key]);
    }
    for (const key of keys) {
      assertSafePath(acceptedRoot, destinations[key], true);
      if (existsSync(destinations[key])) {
        rename(destinations[key], backups[key]);
        hadOriginal.add(key);
        ownedBackups.add(backups[key]);
      }
    }
    for (const key of keys) {
      assertSafePath(acceptedRoot, destinations[key], true);
      rename(temporaries[key], destinations[key]);
      replaced.add(key);
      ownedTemporaries.delete(temporaries[key]);
    }
  } catch (error) {
    const rollbackErrors: Error[] = [];
    for (const key of [...keys].reverse()) {
      if (replaced.has(key)) {
        try { unlinkSync(destinations[key]); } catch (rollbackError) {
          if ((rollbackError as NodeJS.ErrnoException).code !== 'ENOENT') rollbackErrors.push(rollbackError as Error);
        }
      }
      if (hadOriginal.has(key)) {
        try {
          restore(backups[key], destinations[key]);
          ownedBackups.delete(backups[key]);
        } catch (rollbackError) {
          rollbackErrors.push(rollbackError as Error);
        }
      }
    }
    for (const temporary of ownedTemporaries) {
      try { unlinkSync(temporary); } catch (cleanupError) {
        if ((cleanupError as NodeJS.ErrnoException).code !== 'ENOENT') rollbackErrors.push(cleanupError as Error);
      }
    }
    if (rollbackErrors.length > 0) {
      throw new AggregateError([error, ...rollbackErrors], `Batch publication failed; rollback errors: ${rollbackErrors.map((item) => item.message).join('; ')}`);
    }
    throw error;
  }
  const cleanupErrors: Error[] = [];
  for (const path of [...ownedTemporaries, ...ownedBackups]) {
    try { unlinkSync(path); } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') cleanupErrors.push(error as Error);
    }
  }
  if (cleanupErrors.length > 0) throw new AggregateError(cleanupErrors, 'Batch publication succeeded but owned-file cleanup failed');
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

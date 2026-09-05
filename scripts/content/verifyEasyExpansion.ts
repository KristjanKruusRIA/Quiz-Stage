import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getProductionBatch, type BatchDistribution, type ProductionBatchDefinition,
} from './productionBatches';
import {
  verifyBatch, type BatchVerificationReport, type VerifyBatchOptions,
} from './verifyBatch';
import { restoreNpmRunArgs } from './npmCliCompatibility';
import { openFileSourceCache } from './sourceCheck';

const ORIGINAL_PACK_NUMBER = /^(?:0[1-9]|1[0-2])-/;
const BASELINE_BOARD_CLUES = 500;
const TARGET_BOARD_CLUES = 600;
const ADDED_EASY_SETS_PER_ROUND = 10;

function freezeRounds(rounds: Readonly<{ roundOne: number; roundTwo: number }>): Readonly<{
  roundOne: number;
  roundTwo: number;
}> {
  return Object.freeze({ roundOne: rounds.roundOne, roundTwo: rounds.roundTwo });
}

export function buildProvisionalEasyExpansionBatchFromCanonical(
  canonical: ProductionBatchDefinition,
): ProductionBatchDefinition {
  if (!ORIGINAL_PACK_NUMBER.test(canonical.id) || canonical.distribution === null) {
    throw new Error(`Easy expansion is limited to original packs 01-12: ${canonical.id}`);
  }
  if (canonical.boardClues !== BASELINE_BOARD_CLUES
    && canonical.boardClues !== TARGET_BOARD_CLUES) {
    throw new Error(
      `Easy expansion expects a 500-row baseline or 600-row target: ${canonical.id}`,
    );
  }
  const categorySets = Object.values(canonical.distribution)
    .flatMap((rounds) => [rounds.roundOne, rounds.roundTwo])
    .reduce((total, count) => total + count, 0);
  if (categorySets * 5 !== canonical.boardClues) {
    throw new Error(`Easy expansion batch inventory is inconsistent: ${canonical.id}`);
  }
  const needsExpansion = canonical.boardClues === BASELINE_BOARD_CLUES;
  const distribution: BatchDistribution = Object.freeze({
    easy: Object.freeze({
      roundOne: canonical.distribution.easy.roundOne
        + (needsExpansion ? ADDED_EASY_SETS_PER_ROUND : 0),
      roundTwo: canonical.distribution.easy.roundTwo
        + (needsExpansion ? ADDED_EASY_SETS_PER_ROUND : 0),
    }),
    medium: freezeRounds(canonical.distribution.medium),
    hard: freezeRounds(canonical.distribution.hard),
  });
  return Object.freeze({
    ...canonical,
    subthemes: Object.freeze([...canonical.subthemes]),
    distribution,
    boardClues: TARGET_BOARD_CLUES,
  });
}

export function buildProvisionalEasyExpansionBatch(batchId: string): ProductionBatchDefinition {
  return buildProvisionalEasyExpansionBatchFromCanonical(getProductionBatch(batchId));
}

export type VerifyEasyExpansionOptions = Omit<
  VerifyBatchOptions,
  'batchDefinition' | 'translationDiagnosticClueIds'
>;

export function buildEasyExpansionTranslationClueIds(
  packId: string,
): ReadonlySet<string> {
  return new Set(Array.from(
    { length: 100 },
    (_, index) => `${packId}-easy-expansion-${(index + 1).toString().padStart(3, '0')}`,
  ));
}

export function verifyEasyExpansion(options: VerifyEasyExpansionOptions): Promise<BatchVerificationReport> {
  const batchDefinition = buildProvisionalEasyExpansionBatch(options.batchId);
  const translationDiagnosticClueIds = buildEasyExpansionTranslationClueIds(batchDefinition.packId);
  return verifyBatch({
    ...options,
    batchDefinition,
    translationDiagnosticClueIds,
  });
}

async function runCli(argv = process.argv.slice(2)): Promise<number> {
  argv = restoreNpmRunArgs(argv, ['--batch', '--work-root', '--source-cache']);
  const value = (name: string): string | undefined => {
    const index = argv.indexOf(name);
    return index < 0 ? undefined : argv[index + 1];
  };
  const batchId = value('--batch');
  if (batchId === undefined) throw new Error('--batch is required');
  const workRoot = value('--work-root') ?? resolve('content/work/easy-expansion');
  const sourceCachePath = value('--source-cache');
  const sourceCache = sourceCachePath === undefined ? undefined : openFileSourceCache(sourceCachePath);
  const report = await verifyEasyExpansion({
    batchId,
    workRoot,
    ...(sourceCache === undefined ? {} : {
      sourceCache,
      reportDependencies: { beforeRename: () => sourceCache.publish() },
    }),
  });
  process.stdout.write(`${JSON.stringify(report)}\n`);
  return report.blocking ? 1 : 0;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  runCli().then((code) => { process.exitCode = code; }).catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  });
}

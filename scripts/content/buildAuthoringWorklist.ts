import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { OpenTdbAdaptedCandidate } from './adaptOpenTdb';
import {
  CANDIDATE_ROOT,
  WORK_ROOT,
  assertCandidateOutputPath,
  assertWorkOutputPath,
} from './candidatePaths';
import type { WikidataMappedCandidate } from './mapWikidataCandidates';
import { getProductionBatch } from './productionBatches';

const DEFAULT_OPEN_TDB_INPUT = resolve(CANDIDATE_ROOT, 'opentdb-candidates.jsonl');
const DEFAULT_WIKIDATA_INPUT = resolve(CANDIDATE_ROOT, 'wikidata-candidates.jsonl');

export type AuthoringWorkItem = {
  batchId: string;
  candidateId: string;
  origin: 'openTdbInspired' | 'wikidata';
  rawFact: string;
  factKey: string | null;
  sourceId: string | null;
  sourceUrl: string | null;
  selected: false;
};

type OpenTdbCandidateInput = OpenTdbAdaptedCandidate & { candidateId?: string };
type WikidataCandidateInput = WikidataMappedCandidate & { candidateId?: string };

export type BuildAuthoringWorklistOptions = {
  batchId: string;
  openTdbInput: string;
  wikidataInput: string;
  output: string;
};

function readJsonl<T>(path: string): T[] {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line) as T);
}

function compareCodeUnits(left: string | null, right: string | null): number {
  const leftValue = left ?? '';
  const rightValue = right ?? '';
  return leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
}

function compareWorkItems(left: AuthoringWorkItem, right: AuthoringWorkItem): number {
  return compareCodeUnits(left.origin, right.origin)
    || compareCodeUnits(left.candidateId, right.candidateId)
    || compareCodeUnits(left.factKey, right.factKey);
}

function toOpenTdbWorkItem(batchId: string, candidate: OpenTdbCandidateInput): AuthoringWorkItem {
  return {
    batchId,
    candidateId: candidate.candidateId ?? candidate.sourceId,
    origin: 'openTdbInspired',
    rawFact: `${candidate.question} | Answer: ${candidate.answer}`,
    factKey: null,
    sourceId: candidate.sourceId ?? null,
    sourceUrl: candidate.sourceUrl ?? null,
    selected: false,
  };
}

function toWikidataWorkItem(batchId: string, candidate: WikidataCandidateInput): AuthoringWorkItem {
  return {
    batchId,
    candidateId: candidate.candidateId ?? candidate.sourceId,
    origin: 'wikidata',
    rawFact: `${candidate.entityLabel} (${candidate.entityId}) | ${candidate.propertyLabel} (${candidate.propertyId}) | ${candidate.value}`,
    factKey: candidate.normalizedFactKey,
    sourceId: candidate.sourceId ?? null,
    sourceUrl: candidate.sourceUrl ?? null,
    selected: false,
  };
}

export function buildAuthoringWorklist(options: BuildAuthoringWorklistOptions): AuthoringWorkItem[] {
  const batch = getProductionBatch(options.batchId);
  const openTdbInput = assertCandidateOutputPath(options.openTdbInput);
  const wikidataInput = assertCandidateOutputPath(options.wikidataInput);
  const output = assertWorkOutputPath(options.output);
  const workItems = [
    ...readJsonl<OpenTdbCandidateInput>(openTdbInput).map((candidate) => toOpenTdbWorkItem(batch.id, candidate)),
    ...readJsonl<WikidataCandidateInput>(wikidataInput).map((candidate) => toWikidataWorkItem(batch.id, candidate)),
  ].sort(compareWorkItems);
  const payload = `${workItems.map((item) => JSON.stringify(item)).join('\n')}\n`;

  assertWorkOutputPath(output);
  mkdirSync(dirname(output), { recursive: true });
  const temporary = `${output}.${randomUUID()}.tmp`;
  try {
    assertWorkOutputPath(output);
    assertWorkOutputPath(temporary);
    writeFileSync(temporary, payload, { flag: 'wx' });
    assertWorkOutputPath(output);
    assertWorkOutputPath(temporary);
    renameSync(temporary, output);
  } finally {
    try {
      assertWorkOutputPath(temporary);
      unlinkSync(temporary);
    } catch { /* already renamed or no longer safe */ }
  }
  return workItems;
}

export function runBuildAuthoringWorklist(argv: string[] = process.argv.slice(2)): number {
  let batchId: string | undefined;
  let output: string | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--batch') {
      batchId = argv[index + 1];
      if (batchId === undefined || batchId === '') throw new Error('--batch requires an ID');
      index += 1;
    } else if (argument === '--output') {
      output = argv[index + 1];
      if (output === undefined || output === '') throw new Error('--output requires a path');
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  if (batchId === undefined) throw new Error('--batch is required');
  const batch = getProductionBatch(batchId);
  buildAuthoringWorklist({
    batchId: batch.id,
    openTdbInput: DEFAULT_OPEN_TDB_INPUT,
    wikidataInput: DEFAULT_WIKIDATA_INPUT,
    output: output === undefined ? resolve(WORK_ROOT, batch.id, 'worklist.jsonl') : resolve(output),
  });
  return 0;
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    process.exitCode = runBuildAuthoringWorklist(process.argv.slice(2));
  } catch (error: unknown) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 2;
  }
}

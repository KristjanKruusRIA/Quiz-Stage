import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { applyAccessibleEasyQuestions, buildAccessibleEasyQuestions } from './accessibleEasy';
import { selectRemovedOpenTdbInspirations } from './accessibleEasyEvidence';
import { parseEvidenceJsonl, serializeEvidence } from './evidence';
import { getProductionBatch } from './productionBatches';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const questions = buildAccessibleEasyQuestions();
const batchIds = [...new Set(questions.map((question) => question.batchId))];

function readRows(path: string): Array<Record<string, string>> {
  return parse(readFileSync(path, 'utf8'), { columns: true, skip_empty_lines: true }) as Array<Record<string, string>>;
}

function writeRows(path: string, rows: readonly Record<string, string>[]): void {
  writeFileSync(path, stringify([...rows], {
    header: true,
    columns: Object.keys(rows[0]),
    record_delimiter: '\r\n',
  }));
}

for (const batchId of batchIds) {
  const batchQuestions = questions.filter((question) => question.batchId === batchId);
  const authoredPath = resolve(repositoryRoot, `content/authored/${batchId}.csv`);
  const generatedPath = resolve(repositoryRoot, `content/generated/${batchId}.en-et.csv`);
  const evidencePath = resolve(repositoryRoot, `content/evidence/${batchId}.jsonl`);

  const authored = readRows(authoredPath);
  const generated = readRows(generatedPath);
  const authoredResult = applyAccessibleEasyQuestions(authored, batchQuestions);
  const preliminaryGeneratedResult = applyAccessibleEasyQuestions(generated, batchQuestions);
  const removedClueIds = new Set(authoredResult.replacedClueIds);
  if (removedClueIds.size !== 40) throw new Error(`${batchId} replaced ${removedClueIds.size} clues instead of 40`);

  const allEvidence = [...parseEvidenceJsonl(readFileSync(evidencePath, 'utf8'), evidencePath).values()];
  const existingEvidence = allEvidence.filter((record) => !removedClueIds.has(record.clueId));
  const requiredOpenTdb = getProductionBatch(batchId).requiredOpenTdbClues;
  const inspirations = selectRemovedOpenTdbInspirations(allEvidence, removedClueIds, requiredOpenTdb);
  const generatedResult = applyAccessibleEasyQuestions(generated, batchQuestions, inspirations);
  if (preliminaryGeneratedResult.rows.length !== generatedResult.rows.length) {
    throw new Error(`${batchId} generated replacement row count changed unexpectedly`);
  }
  writeRows(authoredPath, authoredResult.rows);
  writeRows(generatedPath, generatedResult.rows);
  writeFileSync(evidencePath, serializeEvidence([...existingEvidence, ...generatedResult.evidence]));
}

process.stdout.write(`Applied ${questions.length} accessible easy questions across ${batchIds.length} batches.\n`);

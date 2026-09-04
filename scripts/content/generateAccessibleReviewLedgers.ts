import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'csv-parse/sync';
import { buildAccessibleCorpus } from './accessibility/bank';
import { ACCESSIBLE_CATEGORY_TITLES } from './accessibility/categoryNames';
import { LEGACY_EASY_TARGETS } from './accessibility/targets';
import { stageAccessibleCorpus } from './applyAccessibleCorpus';

type Row = Readonly<Record<string, string>>;
type Evidence = Readonly<{ clueId: string; subjectKey?: string }>;

function normalized(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('en')
    .replace(/\p{P}+/gu, '').replace(/\s+/g, ' ').trim();
}

function variants(value: string): string[] {
  if (value === '') return [];
  const result: string[] = [];
  let current = '';
  let escaped = false;
  for (const character of value) {
    if (escaped) {
      current += character;
      escaped = false;
    } else if (character === '\\') escaped = true;
    else if (character === ';') {
      result.push(current);
      current = '';
    } else current += character;
  }
  result.push(current);
  return result;
}

function propositionHash(row: Row): string {
  return createHash('sha256').update([
    normalized(row.clue_en!), normalized(row.clue_et!),
    normalized(row.response_en!), normalized(row.response_et!),
  ].join('\0')).digest('hex').slice(0, 12);
}

function formatArray(name: string, values: readonly string[]): string {
  return `export const ${name} = [\n${values.map((value) => `  ${JSON.stringify(value)},`).join('\n')}\n] as const;`;
}

const repositoryRoot = resolve(import.meta.dirname, '../..');
const outputRoot = resolve(repositoryRoot, 'content/work/accessible-easy-overhaul/staged');
const batchIds = [...new Set(LEGACY_EASY_TARGETS.map(({ batchId }) => batchId))];

stageAccessibleCorpus({
  acceptedRoot: repositoryRoot,
  outputRoot,
  categories: buildAccessibleCorpus(),
  targets: LEGACY_EASY_TARGETS,
  titles: ACCESSIBLE_CATEGORY_TITLES,
});

const rows: Row[] = [];
const evidenceByClueId = new Map<string, Evidence>();
for (const batchId of batchIds) {
  const csv = readFileSync(resolve(outputRoot, `generated/${batchId}.en-et.csv`), 'utf8');
  rows.push(...(parse(csv, { columns: true, skip_empty_lines: true }) as Row[])
    .filter(({ difficulty }) => difficulty === 'easy'));
  const evidenceText = readFileSync(resolve(outputRoot, `evidence/${batchId}.jsonl`), 'utf8');
  for (const line of evidenceText.split(/\r?\n/u).filter(Boolean)) {
    const evidence = JSON.parse(line) as Evidence;
    evidenceByClueId.set(evidence.clueId, evidence);
  }
}

const owner = (row: Row): string => [
  row.clue_id,
  evidenceByClueId.get(row.clue_id!)?.subjectKey,
  propositionHash(row),
].join('@');

const rowsByResponse = new Map<string, Row[]>();
for (const row of rows) {
  const identity = [
    normalized(row.response_en!).replace(/^(?:a|an|the)\s+/u, ''),
    normalized(row.response_et!),
  ].join('|');
  const group = rowsByResponse.get(identity) ?? [];
  group.push(row);
  rowsByResponse.set(identity, group);
}
const responseGroups = [...rowsByResponse]
  .filter(([, group]) => group.length > 1)
  .map(([identity, group]) => `${identity}::${group.map(owner).sort().join(',')}`)
  .sort();

const rowsByLanguageResponse = new Map<string, Row[]>();
for (const row of rows) {
  for (const language of ['en', 'et'] as const) {
    const identity = `${language}|${normalized(row[`response_${language}`]!).replace(/^(?:a|an|the)\s+/u, '')}`;
    const group = rowsByLanguageResponse.get(identity) ?? [];
    group.push(row);
    rowsByLanguageResponse.set(identity, group);
  }
}
const primaryAliasGroups = [...rowsByLanguageResponse]
  .filter(([, group]) => group.length > 1 && new Set(group.map((row) => [
    normalized(row.response_en!).replace(/^(?:a|an|the)\s+/u, ''),
    normalized(row.response_et!),
  ].join('|'))).size > 1)
  .map(([identity, group]) => `${identity}::${group.map((row) => [
    row.clue_id, normalized(row.response_et!),
    evidenceByClueId.get(row.clue_id!)?.subjectKey, propositionHash(row),
  ].join('@')).sort().join(',')}`)
  .sort();

const ownersByAlias = new Map<string, Row[]>();
for (const row of rows) {
  for (const language of ['en', 'et'] as const) {
    const aliases = [row[`response_${language}`]!, ...variants(row[`accepted_variants_${language}`]!)]
      .map((value) => normalized(value).replace(/^(?:a|an|the)\s+/u, ''));
    for (const alias of new Set(aliases)) {
      const identity = `${language}|${alias}`;
      const group = ownersByAlias.get(identity) ?? [];
      group.push(row);
      ownersByAlias.set(identity, group);
    }
  }
}
const variantAliasGroups = [...ownersByAlias]
  .filter(([identity, group]) => {
    const language = identity.slice(0, 2) as 'en' | 'et';
    return group.length > 1 && new Set(group.map((row) =>
      normalized(row[`response_${language}`]!).replace(/^(?:a|an|the)\s+/u, ''))).size > 1;
  })
  .map(([identity, group]) => `${identity}::${group.map(owner).sort().join(',')}`)
  .sort();

const rowsBySource = new Map<string, Row[]>();
for (const row of rows) {
  const identity = row.source_url!.trim().toLocaleLowerCase('en');
  const group = rowsBySource.get(identity) ?? [];
  group.push(row);
  rowsBySource.set(identity, group);
}
const sourceGroups = [...rowsBySource]
  .filter(([, group]) => group.length > 1)
  .map(([identity, group]) => `${identity}::${group.map(owner).sort().join(',')}`)
  .sort();

const repeatedFile = [
  '// Every repeated bilingual response below was reviewed as distinct trivia.',
  '// The hash covers the normalized bilingual clue and response, so wording changes require review.',
  formatArray('REVIEWED_DISTINCT_EASY_RESPONSE_GROUPS', responseGroups),
  '',
  '// These primary-response labels match in one language but intentionally identify distinct facts.',
  formatArray('REVIEWED_DISTINCT_EASY_PRIMARY_ALIAS_GROUPS', primaryAliasGroups),
  '',
  '// Accepted variants can overlap even when primary labels differ.',
  formatArray('REVIEWED_DISTINCT_EASY_VARIANT_ALIAS_GROUPS', variantAliasGroups),
  '',
  '// Reused source pages support separately reviewed propositions.',
  formatArray('REVIEWED_DISTINCT_EASY_SOURCE_OWNER_GROUPS', sourceGroups),
  '',
].join('\n');
writeFileSync(resolve(repositoryRoot, 'tests/unit/content/reviewedRepeatedEasyFacts.ts'), repeatedFile);

const reviewedOwner = (row: Row): string => `${row.clue_id}@${propositionHash(row)}`;
const dateOwners = rows.filter((row) =>
  /\b(?:1[0-9]{3}|20[0-9]{2}|\d{2,})\b/u.test(row.clue_en!)
  || /\b(?:1[0-9]{3}|20[0-9]{2}|\d{2,})\b/u.test(row.clue_et!))
  .map(reviewedOwner).sort();
const numericOwners = rows.filter((row) =>
  /^\s*[\d.,-]+\s*$/u.test(row.response_en!)
  || /^\s*[\d.,-]+\s*$/u.test(row.response_et!))
  .map(reviewedOwner).sort();
const flagsFile = [
  '// These clue numbers were explicitly reviewed as iconic or necessary to the familiar fact.',
  formatArray('REVIEWED_DATE_OR_NUMBER_PROMPT_OWNERS', dateOwners),
  '',
  '// These numeric answers were explicitly reviewed as iconic numbered-title questions.',
  formatArray('REVIEWED_NUMERIC_RESPONSE_OWNERS', numericOwners),
  '',
].join('\n');
writeFileSync(resolve(repositoryRoot, 'tests/unit/content/reviewedAccessibleCorpusFlags.ts'), flagsFile);

process.stdout.write(JSON.stringify({
  rows: rows.length,
  responseGroups: responseGroups.length,
  primaryAliasGroups: primaryAliasGroups.length,
  variantAliasGroups: variantAliasGroups.length,
  sourceGroups: sourceGroups.length,
  dateOwners: dateOwners.length,
  numericOwners: numericOwners.length,
}) + '\n');

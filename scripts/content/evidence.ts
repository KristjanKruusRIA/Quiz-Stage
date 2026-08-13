import { lstat, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { glob } from 'glob';
import { z } from 'zod';
import { sourceUrlSchema } from '../../src/shared/content/sourceUrl';

const nonEmptyString = z.string().trim().min(1);
const dateTimeSchema = z.iso.datetime({ offset: true });

const reviewDecisionSchema = z.object({
  reviewer: nonEmptyString,
  reviewedAt: dateTimeSchema,
  decision: z.literal('approved'),
  notes: nonEmptyString.optional(),
}).strict();

const supportingSourceSchema = z.object({
  sourceId: nonEmptyString,
  title: nonEmptyString,
  url: sourceUrlSchema.refine((url) => new URL(url).protocol === 'https:', 'Supporting source URL must use HTTPS'),
  license: nonEmptyString,
  retrievedAt: z.iso.date(),
}).strict();

export const contentEvidenceSchema = z.object({
  version: z.literal(1),
  clueId: nonEmptyString,
  batchId: nonEmptyString,
  factKey: nonEmptyString,
  assertion: nonEmptyString,
  origin: z.enum(['openTdbInspired', 'wikidata', 'compatibleOpen']),
  authoring: z.object({
    author: nonEmptyString,
    authoredAt: dateTimeSchema,
  }).strict(),
  supportingSource: supportingSourceSchema,
  inspiration: z.union([
    z.null(),
    z.object({
      system: z.literal('OpenTDB'),
      candidateId: nonEmptyString,
      license: z.literal('CC-BY-SA-4.0'),
    }).strict(),
  ]),
  factualReview: reviewDecisionSchema,
  editorialReview: reviewDecisionSchema,
  translationReview: reviewDecisionSchema.nullable(),
}).strict().superRefine((record, ctx) => {
  if (record.origin === 'openTdbInspired' && record.inspiration?.system !== 'OpenTDB') {
    ctx.addIssue({ code: 'custom', path: ['inspiration'], message: 'OpenTDB inspiration is required' });
  }
  if (record.origin !== 'openTdbInspired' && record.inspiration !== null) {
    ctx.addIssue({ code: 'custom', path: ['inspiration'], message: 'Inspiration is only valid for OpenTDB records' });
  }
  if ([record.factualReview, record.editorialReview].some((review) => review.reviewer === record.authoring.author)) {
    ctx.addIssue({ code: 'custom', path: ['factualReview'], message: 'Author cannot approve factual or editorial review' });
  }

  for (const [name, review] of [
    ['factualReview', record.factualReview],
    ['editorialReview', record.editorialReview],
    ['translationReview', record.translationReview],
  ] as const) {
    if (review !== null && Date.parse(review.reviewedAt) <= Date.parse(record.authoring.authoredAt)) {
      ctx.addIssue({ code: 'custom', path: [name, 'reviewedAt'], message: 'Review must occur later than authoring' });
    }
  }
});

export type ContentEvidence = z.infer<typeof contentEvidenceSchema>;

async function resolveEvidenceInputs(patterns: readonly string[]): Promise<string[]> {
  if (patterns.length === 0) throw new Error('At least one evidence input glob is required');

  const files: string[] = [];
  for (const pattern of patterns) {
    const found = await glob(pattern, {
      absolute: true,
      cwd: process.cwd(),
      nodir: true,
      follow: false,
      windowsPathsNoEscape: true,
    });
    if (found.length === 0) throw new Error(`Evidence input glob matched no files: ${pattern}`);
    files.push(...found.map((file) => resolve(file)));
  }

  return files.sort((left, right) => left.localeCompare(right, 'en'));
}

export async function readEvidenceInputs(patterns: readonly string[]): Promise<ReadonlyMap<string, ContentEvidence>> {
  const records = new Map<string, ContentEvidence>();

  for (const file of await resolveEvidenceInputs(patterns)) {
    const before = await lstat(file);
    if (before.isSymbolicLink() || !before.isFile()) throw new Error(`Evidence input is not a safe regular file: ${file}`);
    const text = await readFile(file, 'utf8');
    const after = await lstat(file);
    if (after.isSymbolicLink() || !after.isFile()
      || before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size) {
      throw new Error(`Evidence input changed while reading: ${file}`);
    }

    const lines = text.split(/\r?\n/);
    if (lines.at(-1) === '') lines.pop();
    if (lines.length === 0) throw new Error(`Evidence input contains no records: ${file}`);

    for (const [index, line] of lines.entries()) {
      const location = `${file}:${index + 1}`;
      if (line.trim() === '') throw new Error(`Blank evidence line: ${location}`);
      let parsed: unknown;
      try {
        parsed = JSON.parse(line);
      } catch {
        throw new Error(`Malformed evidence JSON: ${location}`);
      }

      const result = contentEvidenceSchema.safeParse(parsed);
      if (!result.success) throw new Error(`Invalid evidence at ${location}: ${result.error.issues[0].message}`);
      if (records.has(result.data.clueId)) throw new Error(`Duplicate evidence for clue ID: ${result.data.clueId}`);
      records.set(result.data.clueId, result.data);
    }
  }

  return new Map([...records].sort(([left], [right]) => left.localeCompare(right, 'en')));
}

export function serializeEvidence(records: readonly ContentEvidence[]): string {
  return [...records]
    .map((record) => contentEvidenceSchema.parse(record))
    .sort((left, right) => left.clueId.localeCompare(right.clueId, 'en'))
    .map((record) => `${JSON.stringify(record)}\n`)
    .join('');
}

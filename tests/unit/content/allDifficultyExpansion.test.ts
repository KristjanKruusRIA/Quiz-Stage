import crypto from 'node:crypto';
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
import { describe, expect, it } from 'vitest';
import { readPreRepairContent } from './preRepairContent';

type Row = Record<string, string>;
type Evidence = { clueId: string; subjectKey?: string };
type Baseline = { batches: Record<string, Record<'authored' | 'generated' | 'evidence', Record<string, string>>> };
const baseline = JSON.parse(fs.readFileSync('content/reports/all-difficulty-expansion-baseline-record-hashes.json', 'utf8')) as Baseline;
const hash = (value: unknown) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const rows: Row[] = [];
const evidenceById = new Map<string, Evidence>();
for (const batchId of Object.keys(baseline.batches)) {
  rows.push(...parse<Row>(fs.readFileSync(`content/generated/${batchId}.en-et.csv`, 'utf8'), { columns: true, skip_empty_lines: true }));
  for (const line of fs.readFileSync(`content/evidence/${batchId}.jsonl`, 'utf8').trim().split(/\r?\n/u)) {
    const evidence = JSON.parse(line) as Evidence;
    evidenceById.set(evidence.clueId, evidence);
  }
}
const oldIds = new Set(Object.values(baseline.batches).flatMap((batch) => Object.keys(batch.generated)));
const additions = rows.filter((row) => !oldIds.has(row.clue_id));

describe('all-difficulty expansion accepted content', () => {
  it('adds exactly one thousand questions and one hundred sets in each round at each difficulty', () => {
    expect(rows).toHaveLength(11_374);
    expect(additions).toHaveLength(3_000);
    for (const difficulty of ['easy', 'medium', 'hard']) {
      const selected = additions.filter((row) => row.difficulty === difficulty);
      expect(selected, difficulty).toHaveLength(1_000);
      for (const round of ['round-one', 'round-two']) {
        const inRound = selected.filter((row) => row.round === round);
        expect(inRound, `${difficulty}/${round}`).toHaveLength(500);
        expect(new Set(inRound.map((row) => row.category_set_id)).size).toBe(100);
      }
    }
    expect(additions.every((row) => row.content_kind === 'board')).toBe(true);
  });

  it('preserves every expansion baseline record before the separately approved content repairs', () => {
    expect(oldIds.size).toBe(8_374);
    for (const [batchId, batch] of Object.entries(baseline.batches)) {
      for (const kind of ['authored', 'generated', 'evidence'] as const) {
        const records = kind === 'evidence'
          ? readPreRepairContent(`content/evidence/${batchId}.jsonl`).trim().split(/\r?\n/u).map((line) => JSON.parse(line))
          : parse(readPreRepairContent(`content/${kind}/${batchId}${kind === 'generated' ? '.en-et' : ''}.csv`), { columns: true, skip_empty_lines: true });
        const hashes = new Map<string, string>(records.map((record: Row) => [kind === 'evidence' ? record.clueId : record.clue_id, hash(record)]));
        for (const [id, expected] of Object.entries(batch[kind])) expect(hashes.get(id), `${kind}/${id}`).toBe(expected);
      }
    }
  });

  it('has complete bilingual additions and five distinct primary subjects per new category', () => {
    const sets = new Map<string, Row[]>();
    for (const row of additions) {
      for (const field of ['category_name_en', 'category_name_et', 'clue_en', 'clue_et', 'response_en', 'response_et', 'explanation_en', 'explanation_et']) expect(row[field]?.trim(), `${row.clue_id}/${field}`).toBeTruthy();
      expect(row.translation_status).toBe('reviewed');
      expect(row.enabled).toBe('true');
      sets.set(row.category_set_id, [...(sets.get(row.category_set_id) ?? []), row]);
    }
    expect(sets.size).toBe(600);
    for (const [id, set] of sets) {
      expect(set.map((row) => Number(row.tier)).sort(), id).toEqual([1, 2, 3, 4, 5]);
      const subjects = set.map((row) => evidenceById.get(row.clue_id)?.subjectKey);
      expect(subjects.every(Boolean), id).toBe(true);
      expect(new Set(subjects).size, id).toBe(5);
      expect(new Set(set.map((row) => row.response_en.toLocaleLowerCase('en'))).size, id).toBeGreaterThanOrEqual(4);
    }
  });
});

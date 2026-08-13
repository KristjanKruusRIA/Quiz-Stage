export interface NearDuplicateRecord { id: string; text: string }
export interface DuplicatePair { firstId: string; secondId: string; similarity: number }

const UUID = /\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b/giu;

function compareCodeUnits(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function normalizeForNearDuplicate(text: string): string {
  return text.normalize('NFKC').toLowerCase()
    .replace(UUID, ' ')
    .replace(/\p{P}+/gu, ' ')
    .split(/\s+/u)
    .filter((token) => token !== '' && !/\p{N}/u.test(token))
    .join(' ');
}

interface PreparedText {
  normalized: string;
  tokenCount: number;
  shingles: ReadonlySet<string>;
}

function prepare(text: string): PreparedText {
  const normalized = normalizeForNearDuplicate(text);
  const tokens = normalized === '' ? [] : normalized.split(' ');
  const shingles = new Set<string>();
  for (let index = 0; index <= tokens.length - 5; index += 1) {
    shingles.add(tokens.slice(index, index + 5).join(' '));
  }
  return { normalized, tokenCount: tokens.length, shingles };
}

function preparedSimilarity(left: PreparedText, right: PreparedText): number {
  if (left.normalized === '' || right.normalized === '') return 0;
  if (left.tokenCount < 5 && right.tokenCount < 5) {
    return left.normalized === right.normalized ? 1 : 0;
  }
  if (left.tokenCount < 5 || right.tokenCount < 5) return 0;

  let intersection = 0;
  for (const shingle of left.shingles) {
    if (right.shingles.has(shingle)) intersection += 1;
  }
  return intersection / (left.shingles.size + right.shingles.size - intersection);
}

export function nearDuplicateSimilarity(left: string, right: string): number {
  return preparedSimilarity(prepare(left), prepare(right));
}

export function findNearDuplicatePairs(records: readonly NearDuplicateRecord[]): readonly DuplicatePair[] {
  const prepared = [...records]
    .sort((left, right) => compareCodeUnits(left.id, right.id))
    .map((record) => ({ ...record, prepared: prepare(record.text) }));
  const pairs: DuplicatePair[] = [];

  for (let leftIndex = 0; leftIndex < prepared.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < prepared.length; rightIndex += 1) {
      const similarity = preparedSimilarity(prepared[leftIndex].prepared, prepared[rightIndex].prepared);
      if (similarity >= 0.8) {
        pairs.push({
          firstId: prepared[leftIndex].id,
          secondId: prepared[rightIndex].id,
          similarity,
        });
      }
    }
  }

  return pairs;
}

import { createHash } from 'node:crypto';

export const WIKIDATA_SOURCE_TITLE = 'Wikidata';
export const WIKIDATA_SOURCE_LICENSE = 'CC0-1.0';
export const WIKIDATA_SOURCE_URL = 'https://www.wikidata.org';
const WIKIDATA_ENTITY_URI_PREFIXES = ['http://www.wikidata.org/entity/', 'https://www.wikidata.org/entity/'];

export interface WikidataBinding {
  item?: { value?: string };
  itemLabel?: { value?: string };
  property?: { value?: string };
  propertyLabel?: { value?: string };
  value?: { type?: string; value?: string };
  valueLabel?: { value?: string };
}

export interface WikidataResponse {
  results?: {
    bindings?: readonly WikidataBinding[];
  };
}

export interface WikidataMappedCandidate {
  candidateId: string;
  sourceSystem: 'Wikidata';
  sourceId: string;
  sourceTitle: typeof WIKIDATA_SOURCE_TITLE;
  sourceUrl: string;
  sourceLicense: typeof WIKIDATA_SOURCE_LICENSE;
  entityId: string;
  propertyId: string;
  entityLabel: string;
  propertyLabel: string;
  value: string;
  valueEntityId?: string;
  factSourceIds: readonly string[];
  normalizedFactKey: string;
  sourceRecipe: string;
  sourceEntityUrl: string;
  requiresFactualSource: true;
  fetchedAt: string;
}

export interface WikidataCandidateSet {
  candidates: WikidataMappedCandidate[];
  skipped: number;
}

function normalizeValue(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('en').replace(/\s+/g, ' ').trim();
}

export function extractWikidataId(candidate: string): string | null {
  const direct = candidate.trim();
  if (/^[QP]\d+$/.test(direct)) return direct;
  const prefix = WIKIDATA_ENTITY_URI_PREFIXES.find((value) => direct.startsWith(value));
  if (prefix === undefined) return null;
  const withoutPrefix = direct.slice(prefix.length);
  if (withoutPrefix === undefined || withoutPrefix === '') return null;
  return withoutPrefix.startsWith('Q') || withoutPrefix.startsWith('P') ? withoutPrefix : null;
}

export function buildWikidataFactKey(entityId: string, propertyId: string, value: string): string {
  return [entityId, propertyId, normalizeValue(value)].join('|');
}

export function buildWikidataSourceId(factKey: string): string {
  return `wikidata:${createHash('sha1').update(factKey).digest('hex')}`;
}

export function parseWikidataResponse(raw: string): WikidataBinding[] {
  const parsed = JSON.parse(raw) as WikidataResponse;
  if (!Array.isArray(parsed.results?.bindings)) {
    throw new Error(`Wikidata response was malformed: ${raw.slice(0, 120)}`);
  }
  return parsed.results.bindings;
}

export function mapWikidataCandidates(
  recipeName: string,
  bindings: readonly WikidataBinding[],
  fetchedAt: string,
): WikidataCandidateSet {
  const candidates: WikidataMappedCandidate[] = [];
  let skipped = 0;
  for (const binding of bindings) {
    const itemId = extractWikidataId(binding.item?.value ?? '');
    const propertyId = extractWikidataId(binding.property?.value ?? '');
    const itemLabel = (binding.itemLabel?.value ?? '').trim();
    const propertyLabel = (binding.propertyLabel?.value ?? '').trim();
    const rawValue = binding.value?.value ?? '';
    const value = normalizeValue((binding.valueLabel?.value ?? rawValue).trim());
    if (itemId === null || propertyId === null || itemLabel === '' || propertyLabel === '' || value === '') {
      skipped += 1;
      continue;
    }
    const valueEntityId = binding.value?.type === 'uri' ? extractWikidataId(rawValue) : undefined;
    const ids = new Set<string>([itemId, propertyId]);
    if (valueEntityId !== undefined) ids.add(valueEntityId);
    const normalizedFactKey = buildWikidataFactKey(itemId, propertyId, value);
    const candidateId = buildWikidataSourceId(normalizedFactKey);
    candidates.push({
      candidateId,
      sourceSystem: 'Wikidata',
      sourceId: candidateId,
      sourceTitle: WIKIDATA_SOURCE_TITLE,
      sourceUrl: `${WIKIDATA_SOURCE_URL}/wiki/${itemId}`,
      sourceLicense: WIKIDATA_SOURCE_LICENSE,
      entityId: itemId,
      propertyId,
      entityLabel: itemLabel,
      propertyLabel,
      value,
      valueEntityId,
      factSourceIds: [...ids].sort((a, b) => a.localeCompare(b, 'en')),
      normalizedFactKey,
      sourceRecipe: recipeName,
      sourceEntityUrl: `${WIKIDATA_SOURCE_URL}/wiki/${itemId}`,
      requiresFactualSource: true,
      fetchedAt,
    });
  }
  return { candidates, skipped };
}

export function extractWikidataLastItemId(bindings: readonly WikidataBinding[]): string | null {
  const last = bindings.at(-1);
  if (last === undefined) return null;
  return extractWikidataId(last.item?.value ?? '');
}

import type { ContentEvidence } from './evidence';

type EvidenceInspirationRecord = Pick<ContentEvidence, 'clueId' | 'origin' | 'inspiration'>;
type OpenTdbInspiration = NonNullable<ContentEvidence['inspiration']>;

export function selectRemovedOpenTdbInspirations(
  evidence: readonly EvidenceInspirationRecord[],
  removedClueIds: ReadonlySet<string>,
  requiredOpenTdb: number,
): OpenTdbInspiration[] {
  const retainedOpenTdb = evidence.filter(
    (record) => !removedClueIds.has(record.clueId) && record.origin === 'openTdbInspired',
  );
  const neededOpenTdb = requiredOpenTdb - retainedOpenTdb.length;
  if (neededOpenTdb < 0) throw new Error('Retained evidence exceeds the OpenTDB composition quota');

  const inspirations = evidence
    .filter((record) => removedClueIds.has(record.clueId) && record.origin === 'openTdbInspired')
    .flatMap((record) => record.inspiration === null ? [] : [record.inspiration])
    .slice(0, neededOpenTdb);
  if (inspirations.length !== neededOpenTdb) {
    throw new Error('Removed evidence cannot satisfy the OpenTDB composition quota');
  }
  return inspirations;
}

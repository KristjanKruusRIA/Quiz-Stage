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

  const removedOpenTdb = evidence
    .filter((record) => removedClueIds.has(record.clueId) && record.origin === 'openTdbInspired')
    .filter((record): record is EvidenceInspirationRecord & {
      inspiration: OpenTdbInspiration;
    } => record.inspiration !== null)
    .slice(0, neededOpenTdb);
  const retainedCandidateIds = new Set(retainedOpenTdb.flatMap((record) =>
    record.inspiration === null ? [] : [record.inspiration.candidateId]));
  const selectedCandidateIds = new Set<string>();
  for (const record of removedOpenTdb) {
    const { candidateId } = record.inspiration;
    if (retainedCandidateIds.has(candidateId)) {
      throw new Error(`OpenTDB candidate ${candidateId} is already owned by retained evidence`);
    }
    if (selectedCandidateIds.has(candidateId)) {
      throw new Error(
        `OpenTDB candidate ${candidateId} is owned by multiple removed evidence records`,
      );
    }
    selectedCandidateIds.add(candidateId);
  }
  const inspirations = removedOpenTdb.map(({ inspiration }) => inspiration);
  if (inspirations.length !== neededOpenTdb) {
    throw new Error('Removed evidence cannot satisfy the OpenTDB composition quota');
  }
  return inspirations;
}

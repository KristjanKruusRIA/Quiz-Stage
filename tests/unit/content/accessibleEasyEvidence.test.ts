import { describe, expect, it } from 'vitest';
import { selectRemovedOpenTdbInspirations } from '../../../scripts/content/accessibleEasyEvidence';

describe('accessible easy evidence selection', () => {
  it('selects replacement inspirations from removed evidence instead of retained clues', () => {
    const removedClueIds = new Set(['removed-open-tdb', 'removed-compatible-open']);
    const evidence = [
      {
        clueId: 'removed-open-tdb',
        origin: 'openTdbInspired' as const,
        inspiration: {
          system: 'OpenTDB' as const,
          candidateId: 'removed-candidate',
          license: 'CC-BY-SA-4.0' as const,
        },
      },
      {
        clueId: 'removed-compatible-open',
        origin: 'compatibleOpen' as const,
        inspiration: null,
      },
      {
        clueId: 'retained-open-tdb',
        origin: 'openTdbInspired' as const,
        inspiration: {
          system: 'OpenTDB' as const,
          candidateId: 'retained-candidate',
          license: 'CC-BY-SA-4.0' as const,
        },
      },
    ];

    expect(selectRemovedOpenTdbInspirations(evidence, removedClueIds, 2)).toEqual([
      {
        system: 'OpenTDB',
        candidateId: 'removed-candidate',
        license: 'CC-BY-SA-4.0',
      },
    ]);
  });
});

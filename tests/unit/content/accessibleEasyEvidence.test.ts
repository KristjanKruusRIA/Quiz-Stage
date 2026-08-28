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

  it('rejects a removed inspiration already owned by retained evidence', () => {
    const inspiration = {
      system: 'OpenTDB' as const,
      candidateId: 'shared-candidate',
      license: 'CC-BY-SA-4.0' as const,
    };
    expect(() => selectRemovedOpenTdbInspirations([
      { clueId: 'removed', origin: 'openTdbInspired', inspiration },
      { clueId: 'retained', origin: 'openTdbInspired', inspiration },
    ], new Set(['removed']), 2)).toThrowError(
      'OpenTDB candidate shared-candidate is already owned by retained evidence',
    );
  });

  it('rejects duplicate candidate ownership within removed evidence', () => {
    const inspiration = {
      system: 'OpenTDB' as const,
      candidateId: 'shared-candidate',
      license: 'CC-BY-SA-4.0' as const,
    };
    expect(() => selectRemovedOpenTdbInspirations([
      { clueId: 'removed-a', origin: 'openTdbInspired', inspiration },
      { clueId: 'removed-b', origin: 'openTdbInspired', inspiration },
    ], new Set(['removed-a', 'removed-b']), 2)).toThrowError(
      'OpenTDB candidate shared-candidate is owned by multiple removed evidence records',
    );
  });
});

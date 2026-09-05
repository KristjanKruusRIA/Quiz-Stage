import { describe, expect, it } from 'vitest';
import { ART_MYTHOLOGY_CATEGORIES } from '../../../scripts/content/accessibility/banks/artMythology';
import { auditPlayability } from '../../../scripts/content/playability/audit';
import { PACKS_05_TO_08_CATEGORIES } from '../../../scripts/content/playability/banks/packs05to08';

const ART_PACK_ID = 'built-in-art-architecture';
const ART_CATEGORIES = PACKS_05_TO_08_CATEGORIES.filter(
  ({ packId }) => packId === ART_PACK_ID,
);

function category(setNumber: string) {
  const found = ART_CATEGORIES.find(
    ({ categorySetId }) => categorySetId.endsWith(`-set-${setNumber}`),
  );
  if (found === undefined) throw new Error(`Missing Art & Architecture set ${setNumber}`);
  return found;
}

function question(setNumber: string, tier: 1 | 2 | 3 | 4 | 5) {
  const found = category(setNumber).questions[tier - 1];
  if (found === undefined) throw new Error(`Missing Art & Architecture question ${setNumber}:${tier}`);
  return found;
}

describe('Art & Architecture playable pack', () => {
  it('keeps the complete medium and hard pack free of playability diagnostics', () => {
    const categories = ART_CATEGORIES;
    const questions = categories.flatMap(({ questions }) => questions);
    const rows = categories.flatMap((category) => category.questions.map((question) => ({
      clue_id: question.key,
      category_set_id: category.categorySetId,
      category_name_en: category.name.en,
      category_name_et: category.name.et,
      clue_en: question.clue.en,
      clue_et: question.clue.et,
      response_en: question.response.en,
      response_et: question.response.et,
      accepted_variants_en: question.acceptedVariants.en.join(';'),
      accepted_variants_et: question.acceptedVariants.et.join(';'),
      subject_key: question.subjectKey,
      source_title: question.source.title,
    })));

    expect(categories).toHaveLength(67);
    expect(questions).toHaveLength(335);
    expect(auditPlayability(rows).diagnostics).toEqual([]);
  });

  it('replaces the frozen Easy Warhol duplicate while preserving the Medium slot', () => {
    const frozenEasy = ART_MYTHOLOGY_CATEGORIES
      .find(({ categorySetId }) => categorySetId === 'built-in-art-architecture-set-008')
      ?.questions.find(({ tier }) => tier === 2);
    if (frozenEasy === undefined) throw new Error('Missing frozen Easy Art question 008:2');

    expect(frozenEasy).toMatchObject({
      key: 'art-modern-warhol-soup-cans',
      tier: 2,
      subjectKey: 'person:andy-warhol',
      response: { en: 'Andy Warhol', et: 'Andy Warhol' },
    });

    const replacement = question('034', 1);
    expect(replacement).toEqual({
      key: 'built-in-art-architecture-set-034:tier-1',
      factKey: 'artwork:drowning-girl-lichtenstein:creator',
      tier: 1,
      subjectKey: 'artwork:drowning-girl-lichtenstein',
      clue: {
        en: 'Which American painter created Drowning Girl as a giant comic-book-like image, using black outlines and fields of coloured dots?',
        et: 'Milline Ameerika maalikunstnik lõi hiiglaslikku koomiksikaadrit meenutava teose „Drowning Girl“, kasutades musti kontuure ja värvilisi täpivälju?',
      },
      response: { en: 'Roy Lichtenstein', et: 'Roy Lichtenstein' },
      acceptedVariants: { en: ['Lichtenstein'], et: ['Lichtenstein'] },
      explanation: {
        en: 'Drowning Girl uses a simplified comic-strip style and hand-painted dots that imitate commercial printing.',
        et: '„Drowning Girl“ kasutab lihtsustatud koomiksilaadi ja käsitsi maalitud täppe, mis matkivad kommertstrükki.',
      },
      source: {
        sourceId: 'wikipedia:drowning-girl',
        title: 'Drowning Girl — Wikipedia',
        url: 'https://en.wikipedia.org/wiki/Drowning_Girl',
        license: 'CC BY-SA 4.0',
        retrievedAt: '2026-09-05',
      },
    });
    expect(replacement.subjectKey).not.toBe(frozenEasy.subjectKey);
    expect(replacement.response).not.toEqual(frozenEasy.response);
    expect(replacement.source.url).not.toBe(frozenEasy.source.url);
  });
});

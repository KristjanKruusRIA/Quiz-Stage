import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { auditPlayability } from '../../../scripts/content/playability/audit';
import { PACKS_09_TO_12_CATEGORIES } from '../../../scripts/content/playability/banks/packs09to12';
import {
  completeEnabledAuthorityCorpus,
  findAuthorityCollisions,
  findAuthorityOneWayAliasLeaks,
  normalizeAuthorityText,
} from './enabledAuthorityCollisionTestUtils';

const TECHNOLOGY_PACK_ID = 'built-in-technology-inventions';
const PROTECTED_IDS = [
  'built-in-technology-inventions-set-044:question:4',
  'built-in-technology-inventions-set-053:question:2',
  'built-in-technology-inventions-set-054:question:2',
  'built-in-technology-inventions-set-061:question:2',
];
const LANGUAGES = ['en', 'et'] as const;
const TARGET_SLOTS = new Set([
  '036:5',
  '043:2',
  '044:4',
  '045:4',
  '047:2',
  '048:3',
  '050:2',
  '050:4',
  '051:2',
  '051:4',
  '053:2',
  '054:1',
  '054:2',
  '054:3',
  '055:2',
  '056:1',
  '057:1',
  '061:2',
  '064:4',
  '065:2',
  '065:4',
  '068:1',
  '069:5',
  '070:3',
  '072:1',
  '076:3',
  '076:4',
  '077:2',
  '077:3',
  '077:4',
  '077:5',
  '078:2',
  '078:3',
  '079:3',
  '080:4',
  '082:3',
  '083:1',
  '083:2',
  '083:4',
  '083:5',
  '085:2',
  '085:5',
  '086:4',
  '087:5',
  '088:1',
  '088:3',
  '088:5',
  '089:1',
  '089:2',
  '090:2',
  '090:3',
  '091:1',
  '091:2',
  '092:2',
  '093:1',
  '093:3',
  '093:4',
  '094:1',
  '094:3',
  '095:1',
  '096:2',
  '096:5',
  '098:5',
  '099:3',
  '100:3',
  '100:5',
]);
const TITLE_TARGETS = new Set(['077', '082', '097']);
const REVIEWED_ALIAS_TEACHING_REFERENCES = [
  'built-in-technology-inventions-set-054:question:2:response-in-clue:en:medium-hard:built-in-music-set-090:tier-2',
  'built-in-technology-inventions-set-054:question:2:response-in-explanation:en:medium-hard:built-in-music-set-063:tier-4',
  'built-in-technology-inventions-set-054:question:2:response-in-explanation:en:medium-hard:built-in-music-set-090:tier-2',
];

const TECHNOLOGY_CATEGORIES = PACKS_09_TO_12_CATEGORIES.filter(
  ({ packId }) => packId === TECHNOLOGY_PACK_ID,
);

function category(setNumber: string) {
  const found = TECHNOLOGY_CATEGORIES.find(
    ({ categorySetId }) => categorySetId.endsWith(`-set-${setNumber}`),
  );
  if (found === undefined) throw new Error(`Missing Technology & Inventions set ${setNumber}`);
  return found;
}

function question(setNumber: string, tier: 1 | 2 | 3 | 4 | 5) {
  const found = category(setNumber).questions.find((candidate) => candidate.tier === tier);
  if (found === undefined) {
    throw new Error(`Missing Technology & Inventions question ${setNumber}:${tier}`);
  }
  return found;
}

function protectedReplacements() {
  const corpus = completeEnabledAuthorityCorpus();
  const replacements = PROTECTED_IDS.map((id) => {
    const replacement = corpus.find((candidate) => candidate.id === id);
    if (replacement === undefined) throw new Error(`Missing protected replacement ${id}`);
    return replacement;
  });
  return { corpus, replacements };
}

function canonicalResponse(value: string, language: (typeof LANGUAGES)[number]): string {
  const normalized = normalizeAuthorityText(value);
  return language === 'en' ? normalized.replace(/^(?:a|an|the)\s+/u, '') : normalized;
}

function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function protectedQuestionRows() {
  return TECHNOLOGY_CATEGORIES.flatMap((currentCategory) =>
    currentCategory.questions.map((currentQuestion) => ({
      slot: `${currentCategory.categorySetId.slice(-3)}:${currentQuestion.tier}`,
      value: {
        categorySetId: currentCategory.categorySetId,
        batchId: currentCategory.batchId,
        packId: currentCategory.packId,
        difficulty: currentCategory.difficulty,
        question: currentQuestion,
      },
    })));
}

describe('Technology & Inventions playable pack', () => {
  it('keeps the complete medium and hard pack free of playability diagnostics', () => {
    const questions = TECHNOLOGY_CATEGORIES.flatMap(
      ({ questions: currentQuestions }) => currentQuestions,
    );
    const rows = TECHNOLOGY_CATEGORIES.flatMap((currentCategory) =>
      currentCategory.questions.map((currentQuestion) => ({
        clue_id: currentQuestion.key,
        category_set_id: currentCategory.categorySetId,
        category_name_en: currentCategory.name.en,
        category_name_et: currentCategory.name.et,
        clue_en: currentQuestion.clue.en,
        clue_et: currentQuestion.clue.et,
        response_en: currentQuestion.response.en,
        response_et: currentQuestion.response.et,
        accepted_variants_en: currentQuestion.acceptedVariants.en.join(';'),
        accepted_variants_et: currentQuestion.acceptedVariants.et.join(';'),
        subject_key: currentQuestion.subjectKey,
        source_title: currentQuestion.source.title,
      })));

    expect(TECHNOLOGY_CATEGORIES).toHaveLength(67);
    expect(questions).toHaveLength(335);
    expect(TECHNOLOGY_CATEGORIES.filter(({ difficulty }) => difficulty === 'medium'))
      .toHaveLength(33);
    expect(TECHNOLOGY_CATEGORIES.filter(({ difficulty }) => difficulty === 'hard'))
      .toHaveLength(34);
    expect(auditPlayability(rows).diagnostics).toEqual([]);
  });

  it('locks the exact airplane-mode replacement payload', () => {
    expect(question('061', 2)).toEqual({
      key: 'built-in-technology-inventions-set-061:question:2',
      factKey: 'built-in-technology-inventions:everyday-digital-connections:medium:airplane-mode',
      tier: 2,
      subjectKey: 'technology:airplane-mode',
      clue: {
        en: 'Which phone setting switches off cellular transmission for a flight and is usually shown with an aircraft icon?',
        et: 'Milline telefoni seade lülitab lennu ajaks mobiilside välja ja on tavaliselt tähistatud lennukiikooniga?',
      },
      response: { en: 'airplane mode', et: 'lennurežiim' },
      acceptedVariants: {
        en: ['flight mode', 'aeroplane mode'],
        et: ['lennukirežiim', 'Airplane Mode'],
      },
      explanation: {
        en: 'Airplane mode disables a device’s cellular radio transmission for air travel. Wi-Fi or Bluetooth can often be switched back on separately when the airline allows it.',
        et: 'Lennurežiim lülitab lennureisi ajaks seadme mobiilside raadiosaatja välja. Kui lennufirma seda lubab, saab Wi‑Fi või Bluetoothi sageli eraldi uuesti sisse lülitada.',
      },
      source: {
        sourceId: 'wikipedia:Airplane_mode',
        title: 'Airplane mode',
        url: 'https://en.wikipedia.org/wiki/Airplane_mode',
        license: 'CC-BY-SA-4.0',
        retrievedAt: '2026-09-05',
      },
    });
  });

  it('keeps fair short answers while removing only normalized duplicates', () => {
    expect(question('048', 3).acceptedVariants.et).toContain('Li-ion');
    expect(question('055', 2).acceptedVariants).toEqual({
      en: ['dozer'],
      et: ['roomikbuldooser'],
    });
    expect(question('095', 3).acceptedVariants).toEqual({
      en: ['lotus-effect paint', 'self-cleaning lotus coating', 'lotus effect'],
      et: ['lootoseefektiga värv', 'isepuhastuv lootosepinnakate', 'lootoseefekt'],
    });
  });

  it('locks the final source, answer-boundary, and Estonian-copy corrections', () => {
    expect(question('043', 2).clue.et)
      .toBe('Telefon võib avaneda, kui sõrmejälje joonte kaared, silmused ja keerised vastavad salvestatud mallile. Milline andur seda kontrollib?');
    expect(question('043', 2).explanation.et)
      .toBe('Sõrmejäljelugeja salvestab sõrmejäljemustri iseloomulikud tunnused ja võrdleb neid registreeritud digitaalse malliga.');
    expect(question('044', 4).source).toEqual({
      sourceId: 'wikipedia:laminated-glass',
      title: 'Laminated glass',
      url: 'https://en.wikipedia.org/wiki/Laminated_glass',
      license: 'CC-BY-SA-4.0',
      retrievedAt: '2026-09-05',
    });
    expect(question('053', 2).source).toEqual({
      sourceId: 'wikipedia:email-filtering',
      title: 'Email filtering',
      url: 'https://en.wikipedia.org/wiki/Email_filtering',
      license: 'CC-BY-SA-4.0',
      retrievedAt: '2026-09-05',
    });
    expect(question('054', 2).acceptedVariants).toEqual({
      en: ['TTS', 'speech synthesis'],
      et: ['TTS', 'tekst kõneks', 'kõnesüntees'],
    });
  });

  it('locks all 66 changed question payloads', () => {
    const changedRows = protectedQuestionRows()
      .filter(({ slot }) => TARGET_SLOTS.has(slot))
      .map(({ value }) => value);

    expect(changedRows).toHaveLength(66);
    expect(hash(changedRows))
      .toBe('2ae78c430fef57201c4cd40483eb64acb344e04aafa30e32087f5a76423bb8d2');
  });

  it('keeps the other 269 question payloads byte-for-byte unchanged', () => {
    const unchangedRows = protectedQuestionRows()
      .filter(({ slot }) => !TARGET_SLOTS.has(slot))
      .map(({ value }) => value);

    expect(unchangedRows).toHaveLength(269);
    expect(hash(unchangedRows))
      .toBe('4da44a2ad9a8abddd63141ebc0a0bda587c8237b831fac7d445c70abaa163dce');
  });

  it('locks the three reviewed category-title corrections', () => {
    expect(TECHNOLOGY_CATEGORIES
      .filter(({ categorySetId }) => TITLE_TARGETS.has(categorySetId.slice(-3)))
      .map(({ categorySetId, name }) => ({ categorySetId, name }))).toEqual([
      {
        categorySetId: 'built-in-technology-inventions-set-077',
        name: {
          en: 'Satellites That Changed the View',
          et: 'Satelliidid, mis muutsid meie maailmapilti',
        },
      },
      {
        categorySetId: 'built-in-technology-inventions-set-082',
        name: {
          en: 'Calculators Before Electronics',
          et: 'Arvutusvahendid enne elektroonikat',
        },
      },
      {
        categorySetId: 'built-in-technology-inventions-set-097',
        name: {
          en: 'Gaming Hardware Hits and Experiments',
          et: 'Mänguriistvara hitid ja eksperimendid',
        },
      },
    ]);
  });

  it('keeps the other 64 category titles byte-for-byte unchanged', () => {
    const unchangedTitles = TECHNOLOGY_CATEGORIES
      .filter(({ categorySetId }) => !TITLE_TARGETS.has(categorySetId.slice(-3)))
      .map(({ categorySetId, name }) => ({ categorySetId, name }));

    expect(unchangedTitles).toHaveLength(64);
    expect(hash(unchangedTitles))
      .toBe('993226171982dc26d3139e2b3f1dfcc969f7a15455c346723a314ac89c6d908c');
  });

  it('keeps the protected replacements collision-free across all 8,200 authority rows', () => {
    const { corpus, replacements } = protectedReplacements();
    const counts = Object.fromEntries(['easy', 'medium-hard', 'adult', 'estonia'].map(
      (authority) => [authority, corpus.filter((row) => row.authority === authority).length],
    ));

    expect(counts).toEqual({ easy: 3_200, 'medium-hard': 4_000, adult: 500, estonia: 500 });
    expect(corpus).toHaveLength(8_200);
    expect(replacements).toHaveLength(4);
    expect(replacements.flatMap((replacement) =>
      findAuthorityCollisions(replacement, corpus).map((collision) =>
        `${replacement.id}:${collision}`))).toEqual([]);
  }, 10_000);

  it('locks the exact benign teaching references to protected replacement aliases', () => {
    const { corpus, replacements } = protectedReplacements();

    expect(replacements.flatMap((replacement) =>
      findAuthorityOneWayAliasLeaks(replacement, corpus).map((leak) =>
        `${replacement.id}:${leak}`))).toEqual(REVIEWED_ALIAS_TEACHING_REFERENCES);
  }, 10_000);

  it('does not repeat any normalized answer within one response family', () => {
    const redundantVariants = TECHNOLOGY_CATEGORIES.flatMap((currentCategory) =>
      currentCategory.questions.flatMap((currentQuestion) => LANGUAGES.flatMap((language) => {
        const seen = new Set<string>();
        return [
          currentQuestion.response[language],
          ...currentQuestion.acceptedVariants[language],
        ].flatMap((answer) => {
          const normalized = canonicalResponse(answer, language);
          if (seen.has(normalized)) {
            return [`${currentQuestion.key}:${language}:${answer}`];
          }
          seen.add(normalized);
          return [];
        });
      })));

    expect(redundantVariants).toEqual([]);
  });
});

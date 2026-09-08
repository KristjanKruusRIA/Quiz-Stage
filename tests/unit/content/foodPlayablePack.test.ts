import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { auditPlayability } from '../../../scripts/content/playability/audit';
import { PACKS_09_TO_12_CATEGORIES } from '../../../scripts/content/playability/banks/packs09to12';
import {
  completeEnabledAuthorityCorpus,
  findAuthorityCollisions,
  findAuthorityOneWayAliasLeaks,
} from './enabledAuthorityCollisionTestUtils';

const TARGET_SLOTS = new Set([
  'built-in-food-drink-set-039:4',
  'built-in-food-drink-set-041:2',
  'built-in-food-drink-set-041:5',
  'built-in-food-drink-set-042:1',
  'built-in-food-drink-set-066:2',
  'built-in-food-drink-set-084:2',
  'built-in-food-drink-set-084:3',
  'built-in-food-drink-set-095:1',
  'built-in-food-drink-set-100:1',
]);
const REPLACEMENT_IDS = [
  'built-in-food-drink-set-039:question:4',
  'built-in-food-drink-set-041:question:2',
  'built-in-food-drink-set-041:question:5',
  'built-in-food-drink-set-042:question:1',
  'built-in-food-drink-set-066:question:2',
  'built-in-food-drink-set-084:question:2',
  'built-in-food-drink-set-084:question:3',
  'built-in-food-drink-set-095:question:1',
  'built-in-food-drink-set-100:question:1',
];

const FOOD_CATEGORIES = PACKS_09_TO_12_CATEGORIES.filter(
  ({ categorySetId }) => categorySetId.startsWith('built-in-food-drink-set-'),
);

function category(setNumber: string) {
  const found = FOOD_CATEGORIES.find(
    ({ categorySetId }) => categorySetId.endsWith(`-set-${setNumber}`),
  );
  if (found === undefined) throw new Error(`Missing Food & Drink set ${setNumber}`);
  return found;
}

function question(setNumber: string, tier: 1 | 2 | 3 | 4 | 5) {
  const found = category(setNumber).questions.find((candidate) => candidate.tier === tier);
  if (found === undefined) throw new Error(`Missing Food & Drink question ${setNumber}:${tier}`);
  return found;
}

describe('Food & Drink playable pack', () => {
  it('keeps the complete medium and hard pack free of playability diagnostics', () => {
    const questions = FOOD_CATEGORIES.flatMap(({ questions: currentQuestions }) =>
      currentQuestions);
    const rows = FOOD_CATEGORIES.flatMap((currentCategory) =>
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

    expect(FOOD_CATEGORIES).toHaveLength(67);
    expect(questions).toHaveLength(335);
    expect(auditPlayability(rows).diagnostics).toEqual([]);
  });

  it('keeps every one of the other 326 Food & Drink rows byte-for-byte unchanged', () => {
    const unchangedRows = FOOD_CATEGORIES.flatMap((currentCategory) =>
      currentCategory.questions.map((currentQuestion) => ({
        categorySetId: currentCategory.categorySetId,
        batchId: currentCategory.batchId,
        packId: currentCategory.packId,
        difficulty: currentCategory.difficulty,
        categoryName: currentCategory.name,
        question: currentQuestion,
      }))).filter(({ categorySetId, question: currentQuestion }) =>
      !TARGET_SLOTS.has(`${categorySetId}:${currentQuestion.tier}`));

    expect(unchangedRows).toHaveLength(326);
    expect(createHash('sha256').update(JSON.stringify(unchangedRows)).digest('hex'))
      .toBe('9dea602967243b891794b46f30bcc4e8e6b7e1054cceb7f1c980c71114e3dd9d');
  });

  it('locks the exact nine replacement payloads', () => {
    expect([
      question('039', 4),
      question('041', 2),
      question('041', 5),
      question('042', 1),
      question('066', 2),
      question('084', 2),
      question('084', 3),
      question('095', 1),
      question('100', 1),
    ]).toEqual([
      {
        key: 'built-in-food-drink-set-039:question:4',
        factKey: 'built-in-food-drink:food-refresh:muhammara-red-pepper-walnut-dip',
        tier: 4,
        subjectKey: 'dish:muhammara',
        clue: {
          en: 'Which Levantine dip from Aleppo blends red peppers and walnuts with breadcrumbs and pomegranate molasses?',
          et: 'Milline Aleppost pärit Levandi dip ühendab punase paprika ja Kreeka pähklid riivsaia ning granaatõunamelassiga?',
        },
        response: { en: 'muhammara', et: 'muhammara' },
        acceptedVariants: {
          en: ['mhammara'],
          et: ['muhamara', 'mhammara'],
        },
        explanation: {
          en: 'Muhammara is an Aleppo-born dip whose sweet-tart pomegranate molasses balances red pepper and walnuts.',
          et: 'Muhammara on Aleppost pärit dip, milles magushapu granaatõunamelass tasakaalustab punast paprikat ja Kreeka pähkleid.',
        },
        source: {
          sourceId: 'wikipedia:muhammara',
          title: 'Muhammara',
          url: 'https://en.wikipedia.org/wiki/Muhammara',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-09-05',
        },
      },
      {
        key: 'built-in-food-drink-set-041:question:2',
        factKey: 'built-in-food-drink:food-refresh:kohlrabi-swollen-stem-not-root',
        tier: 2,
        subjectKey: 'plant:kohlrabi',
        clue: {
          en: 'Which familiar cabbage relative has a turnip-like round edible part that is an enlarged stem rather than a root?',
          et: 'Millise tuttava kapsalise naeritaoline ümar söödav osa on paksenenud vars, mitte juur?',
        },
        response: { en: 'kohlrabi', et: 'nuikapsas' },
        acceptedVariants: { en: ['German turnip'], et: ['koolrabi'] },
        explanation: {
          en: 'Kohlrabi belongs to the cabbage family, but its turnip-like edible part is an enlarged stem.',
          et: 'Nuikapsas kuulub kapsaste hulka, kuid selle naeritaoline söödav osa on paksenenud vars.',
        },
        source: {
          sourceId: 'wikipedia:kohlrabi',
          title: 'Kohlrabi',
          url: 'https://en.wikipedia.org/wiki/Kohlrabi',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-09-05',
        },
      },
      {
        key: 'built-in-food-drink-set-041:question:5',
        factKey: 'built-in-food-drink:food-refresh:mace-aril-around-nutmeg-seed',
        tier: 5,
        subjectKey: 'spice:mace',
        clue: {
          en: 'Which spice is made from the lacy red covering around the seed that becomes nutmeg?',
          et: 'Milline vürts saadakse pitsilisest punasest seemnerüüst, mis ümbritseb muskaatpähkliks saavat seemet?',
        },
        response: { en: 'mace', et: 'muskaatõis' },
        acceptedVariants: { en: [], et: [] },
        explanation: {
          en: 'One nutmeg fruit yields two spices: nutmeg from the seed and mace from the dried aril around it.',
          et: 'Ühest muskaatpähklipuu viljast saadakse kaks vürtsi: seemnest muskaatpähkel ja seda ümbritsevast kuivatatud seemnerüüst muskaatõis.',
        },
        source: {
          sourceId: 'wikipedia:nutmeg',
          title: 'Nutmeg',
          url: 'https://en.wikipedia.org/wiki/Nutmeg',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-09-05',
        },
      },
      {
        key: 'built-in-food-drink-set-042:question:1',
        factKey: 'built-in-food-drink:food-refresh:focaccia-olive-oil-dimpled-ligurian-flatbread',
        tier: 1,
        subjectKey: 'bread:focaccia',
        clue: {
          en: 'Which Italian flatbread—especially in its Genoese form—is brushed with olive oil and marked by finger-sized dimples?',
          et: 'Milline Itaalia lameleib, eriti selle Genova variant, kaetakse oliiviõliga ja sellesse vajutatakse sõrmesuurused lohud?',
        },
        response: { en: 'focaccia', et: 'focaccia' },
        acceptedVariants: {
          en: ['focaccia bread'],
          et: ['focaccia-sai', 'focaccia sai'],
        },
        explanation: {
          en: 'Focaccia genovese is brushed with olive oil and marked with finger-sized dimples before baking.',
          et: 'Focaccia Genova variant kaetakse oliiviõliga ning sellesse vajutatakse enne küpsetamist sõrmesuurused lohud.',
        },
        source: {
          sourceId: 'wikipedia:focaccia',
          title: 'Focaccia',
          url: 'https://en.wikipedia.org/wiki/Focaccia',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-09-05',
        },
      },
      {
        key: 'built-in-food-drink-set-066:question:2',
        factKey: 'built-in-food-drink:food-refresh:cannoli-sicilian-fried-shell-ricotta',
        tier: 2,
        subjectKey: 'dessert:cannoli',
        clue: {
          en: 'Which Sicilian sweet fills crisp fried pastry tubes with sweetened ricotta?',
          et: 'Millise Sitsiilia maiuse krõbedad praetud tainatorud täidetakse magusa ricotta-kreemiga?',
        },
        response: { en: 'cannoli', et: 'cannoli' },
        acceptedVariants: { en: ['cannolo'], et: ['cannolo'] },
        explanation: {
          en: 'Cannoli are Sicilian fried pastry shells filled with a sweet ricotta-based cream.',
          et: 'Cannoli on Sitsiilia praetud tainatorud, mis täidetakse magusa ricotta-põhise kreemiga.',
        },
        source: {
          sourceId: 'wikipedia:cannoli',
          title: 'Cannoli',
          url: 'https://en.wikipedia.org/wiki/Cannoli',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-09-05',
        },
      },
      {
        key: 'built-in-food-drink-set-084:question:2',
        factKey: 'built-in-food-drink:food-refresh:bagel-boiled-before-baking',
        tier: 2,
        subjectKey: 'bread:bagel',
        clue: {
          en: 'Which dense ring-shaped bread is briefly boiled before baking and is often served with cream cheese and salmon?',
          et: 'Milline tihke rõngakujuline sai keedetakse enne küpsetamist korraks vees ning seda süüakse sageli toorjuustu ja lõhega?',
        },
        response: { en: 'bagel', et: 'bagel' },
        acceptedVariants: { en: ['bagel bread'], et: ['rõngassai', 'vesikringel'] },
        explanation: {
          en: 'Bagels are shaped into rings, briefly boiled and then baked, producing their glossy crust and chewy crumb.',
          et: 'Bagel vormitakse rõngaks, keedetakse korraks ja seejärel küpsetatakse, mis annab läikiva kooriku ning sitke sisu.',
        },
        source: {
          sourceId: 'wikipedia:bagel',
          title: 'Bagel',
          url: 'https://en.wikipedia.org/wiki/Bagel',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-09-05',
        },
      },
      {
        key: 'built-in-food-drink-set-084:question:3',
        factKey: 'built-in-food-drink:food-refresh:pain-au-chocolat-laminated-dough-chocolate',
        tier: 3,
        subjectKey: 'pastry:pain-au-chocolat',
        clue: {
          en: 'Which rectangular French pastry wraps one or two bars of chocolate in flaky laminated yeast dough?',
          et: 'Millise ristkülikukujulise Prantsuse küpsetise kihilise pärmitaina sisse on keeratud üks või kaks šokolaadipulka?',
        },
        response: { en: 'pain au chocolat', et: 'pain au chocolat' },
        acceptedVariants: {
          en: ['chocolate croissant', 'chocolatine'],
          et: ['šokolaadisai', 'šokolaadi-croissant'],
        },
        explanation: {
          en: 'Pain au chocolat uses the same laminated yeast dough as a croissant, wrapped around chocolate and baked as a rectangle.',
          et: 'Pain au chocolat tehakse sarvesaiaga samast kihilisest pärmitainast, mis keeratakse šokolaadi ümber ja küpsetatakse ristkülikuna.',
        },
        source: {
          sourceId: 'wikipedia:pain-au-chocolat',
          title: 'Pain au chocolat',
          url: 'https://en.wikipedia.org/wiki/Pain_au_chocolat',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-09-05',
        },
      },
      {
        key: 'built-in-food-drink-set-095:question:1',
        factKey: 'built-in-food-drink:food-refresh:shortcrust-fat-flour-crumbly-pie-base',
        tier: 1,
        subjectKey: 'pastry:shortcrust-pastry',
        clue: {
          en: 'Which crumbly pastry, commonly used for pie and tart bases, is made by mixing fat into flour before adding liquid?',
          et: 'Milline piruka- ja koogipõhjades levinud tainas valmib rasva segamisel jahusse enne vedeliku lisamist ning jääb küpsedes muredaks?',
        },
        response: { en: 'shortcrust pastry', et: 'muretainas' },
        acceptedVariants: { en: ['short pastry'], et: ['muretaigen'] },
        explanation: {
          en: 'Coating flour with fat limits gluten formation, giving shortcrust pastry its tender, crumbly texture.',
          et: 'Jahu segamine rasvaga piirab gluteeni teket ja annab muretainale õrna, mureneva tekstuuri.',
        },
        source: {
          sourceId: 'wikipedia:shortcrust-pastry',
          title: 'Shortcrust pastry',
          url: 'https://en.wikipedia.org/wiki/Shortcrust_pastry',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-09-05',
        },
      },
      {
        key: 'built-in-food-drink-set-100:question:1',
        factKey: 'built-in-food-drink:food-refresh:bunny-chow-curry-hollowed-loaf',
        tier: 1,
        subjectKey: 'dish:bunny-chow',
        clue: {
          en: 'Which South African street food serves curry inside a hollowed-out loaf of bread?',
          et: 'Millises Lõuna-Aafrika tänavatoidus serveeritakse karrit seest õõnestatud saiapätsi sees?',
        },
        response: { en: 'bunny chow', et: 'bunny chow' },
        acceptedVariants: { en: [], et: [] },
        explanation: {
          en: 'Bunny chow originated in Durban and turns a hollowed loaf into an edible container for curry.',
          et: 'Bunny chow pärineb Durbanist ning selles saab õõnestatud saiapätsist karri söödav anum.',
        },
        source: {
          sourceId: 'wikipedia:bunny-chow',
          title: 'Bunny chow',
          url: 'https://en.wikipedia.org/wiki/Bunny_chow',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-09-05',
        },
      },
    ]);
  });

  it('keeps all nine replacements collision-free across every enabled authority row', () => {
    const corpus = completeEnabledAuthorityCorpus();
    const replacements = REPLACEMENT_IDS.map((id) => {
      const row = corpus.find((candidate) => candidate.id === id);
      if (row === undefined) throw new Error(`Missing protected replacement ${id}`);
      return row;
    });
    const counts = Object.fromEntries(['easy', 'medium-hard', 'adult', 'estonia'].map(
      (authority) => [authority, corpus.filter((row) => row.authority === authority).length],
    ));

    expect(counts).toEqual({ easy: 3_200, 'medium-hard': 4_000, adult: 500, estonia: 500 });
    expect(corpus).toHaveLength(8_200);
    expect(replacements).toHaveLength(9);
    expect(replacements.flatMap((candidate) =>
      findAuthorityCollisions(candidate, corpus).map((collision) =>
        `${candidate.id}:${collision}`))).toEqual([]);
  });

  it('keeps all nine response aliases out of every other clue and explanation', () => {
    const corpus = completeEnabledAuthorityCorpus();
    const replacements = REPLACEMENT_IDS.map((id) => {
      const row = corpus.find((candidate) => candidate.id === id);
      if (row === undefined) throw new Error(`Missing protected replacement ${id}`);
      return row;
    });

    expect(replacements.flatMap((candidate) =>
      findAuthorityOneWayAliasLeaks(candidate, corpus).map((leak) =>
        `${candidate.id}:${leak}`))).toEqual([]);
  });
});

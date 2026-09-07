import { describe, expect, it } from 'vitest';
import { auditAccessibility } from '../../../scripts/content/accessibility/audit';
import type { AccessibilityAudit, AccessibilityReason } from '../../../scripts/content/accessibility/types';
import { completeCumulativeAuthorityCorpus } from './enabledAuthorityCollisionTestUtils';

const row = (overrides: Record<string, string>): Record<string, string> => ({
  clue_id: 'clue-default',
  category_set_id: 'category-default',
  category_name_en: 'Art',
  category_name_et: 'Kunst',
  clue_en: 'Who painted the Mona Lisa?',
  clue_et: 'Kes maalis Mona Lisa?',
  response_en: 'Leonardo da Vinci',
  response_et: 'Leonardo da Vinci',
  source_title: 'Mona Lisa',
  ...overrides,
});

describe('accessibility audit', () => {
  it('reports each approved clue and category signal without flagging accessible counterexamples', () => {
    const rows = [
      row({
        clue_id: 'clue-source-prefix',
        clue_en: 'Mona Lisa: Who painted it?',
        source_title: 'Mona Lisa',
      }),
      row({
        clue_id: 'clue-infobox-residue',
        clue_en: 'Who was Ada Lovelace (10 December 1815 – 27 November 1852)?',
        source_title: 'Ada Lovelace',
      }),
      row({
        clue_id: 'clue-exact-date',
        clue_en: 'On what exact date was the first Moon landing?',
        response_en: 'July twentieth nineteen sixty-nine',
      }),
      row({
        clue_id: 'clue-numeric-answer',
        clue_en: 'What is the answer to this number question?',
        response_en: '42',
      }),
      row({
        clue_id: 'clue-long-answer',
        clue_en: 'Which animal is the largest alive today?',
        response_en: 'A blue whale is the largest animal alive',
      }),
      row({
        clue_id: 'clue-multi-item-answer',
        clue_en: 'What colors appear on this flag?',
        response_en: 'red, white; blue',
      }),
      row({
        clue_id: 'clue-binary-question',
        clue_en: 'Is the Pacific Ocean larger than the Atlantic Ocean?',
        response_en: 'Yes',
      }),
      row({
        clue_id: 'clue-generic-category',
        category_set_id: 'category-generic',
        category_name_en: 'General Knowledge',
        category_name_et: 'Üldteadmised',
        clue_en: 'What is the capital of Finland?',
        source_title: 'Helsinki',
      }),
      row({
        clue_id: 'clue-accessible-art',
        clue_en: 'Who painted the Mona Lisa?',
        source_title: 'Mona Lisa',
      }),
      row({
        clue_id: 'clue-accessible-geography',
        clue_en: 'What is the capital of Finland?',
        source_title: 'Helsinki',
      }),
      row({
        clue_id: 'clue-accessible-iconic-year',
        clue_en: 'When did the Berlin Wall fall?',
        response_en: '1989',
        source_title: 'Berlin Wall',
      }),
    ];

    const audit: AccessibilityAudit = auditAccessibility(rows);

    expect([...audit.clueReasons]).toEqual([
      ['clue-binary-question', ['binary-question']],
      ['clue-exact-date', ['exact-date-or-number']],
      ['clue-infobox-residue', ['infobox-residue']],
      ['clue-long-answer', ['long-answer']],
      ['clue-multi-item-answer', ['multi-item-answer']],
      ['clue-numeric-answer', ['numeric-answer']],
      ['clue-source-prefix', ['source-prefix']],
    ]);
    expect([...audit.categoryReasons]).toEqual([
      ['category-generic', ['generic-category-title']],
    ]);
    const expectedCounts: Record<AccessibilityReason, number> = {
      'binary-question': 1,
      'exact-date-or-number': 1,
      'generic-category-title': 1,
      'infobox-residue': 1,
      'long-answer': 1,
      'multi-item-answer': 1,
      'numeric-answer': 1,
      'source-prefix': 1,
    };
    expect(audit.counts).toEqual(expectedCounts);
  });

  it('normalizes only for inspection and leaves supplied rows unchanged', () => {
    const rows = [row({
      clue_id: 'clue-whitespace',
      clue_en: '  Mona Lisa:   Who painted it?  ',
      source_title: 'Mona Lisa',
    })];
    const before = structuredClone(rows);

    const audit = auditAccessibility(rows);

    expect([...audit.clueReasons]).toEqual([
      ['clue-whitespace', ['source-prefix']],
    ]);
    expect(rows).toEqual(before);
  });

  it('does not flag commas that belong to canonical titles, quotes, or numbers', () => {
    const audit = auditAccessibility([
      row({
        clue_id: 'clue-mina-supervaras',
        response_en: 'Despicable Me',
        response_et: 'Mina, supervaras',
      }),
      row({
        clue_id: 'clue-beverly-hills',
        response_en: 'Beverly Hills, 90210',
        response_et: 'Beverly Hills, 90210',
      }),
      row({
        clue_id: 'clue-hello-dolly',
        response_en: '"Hello, Dolly!"',
        response_et: '"Tere, Dolly!"',
      }),
      row({
        clue_id: 'clue-i-claudius',
        response_en: 'I, Claudius',
        response_et: 'Mina, Claudius',
      }),
      row({
        clue_id: 'clue-copular-title-en',
        clue_en: 'What is the title?',
        response_en: 'Hello, Dolly!',
      }),
      row({
        clue_id: 'clue-copular-title-et',
        clue_et: 'Mis on selle filmi pealkiri?',
        response_et: 'Mina, Claudius',
      }),
      row({
        clue_id: 'clue-popular-film',
        clue_en: 'Which popular film has this plot?',
        response_en: 'Hello, Dolly!',
      }),
      row({
        clue_id: 'clue-animated-film',
        clue_en: 'Which animated film features this character?',
        response_en: 'Planes, Trains and Automobiles',
      }),
      row({
        clue_id: 'clue-actor-stars',
        clue_en: 'Which actor stars in this film?',
        response_en: 'Doe, Jane',
      }),
      row({
        clue_id: 'clue-animal-homograph',
        clue_en: 'Which animal lives in this habitat?',
        response_en: 'deer, Cervus elaphus',
      }),
      row({
        clue_id: 'clue-singular-alias',
        clue_en: 'Which alias is used by this spy?',
        response_en: 'Bond, James Bond',
      }),
      row({
        clue_id: 'clue-singular-gas',
        clue_en: 'What gas is used in this lamp?',
        response_en: 'mercury, Hg',
      }),
    ]);

    expect([...audit.clueReasons]).toEqual([]);
  });

  it('flags semicolon responses and comma responses requested as multiple items', () => {
    const audit = auditAccessibility([
      row({
        clue_id: 'clue-semicolon-list',
        clue_en: 'Name this flag.',
        response_en: 'red, white; blue',
      }),
      row({
        clue_id: 'clue-three-kingdoms',
        clue_en: 'Which three kingdoms were ruled by this monarch?',
        clue_et: 'Millised kolm kuningriiki olid selle monarhi võimu all?',
        response_en: 'England, Scotland, Ireland',
        response_et: 'Inglismaa, Šotimaa, Iirimaa',
      }),
      row({
        clue_id: 'clue-four-grim-costs',
        clue_en: 'Which four grim costs are named here?',
        clue_et: 'Millised neli sünget kulu on siin nimetatud?',
        response_en: 'war, famine, disease, death',
        response_et: 'sõda, nälg, haigus, surm',
      }),
      row({
        clue_id: 'clue-both-rome',
        clue_en: 'Name both Rome’s founding brothers.',
        clue_et: 'Nimeta nii Rooma rajajavennad kui ka nende ema.',
        response_en: 'Romulus, Remus',
        response_et: 'Romulus, Remus',
      }),
      row({
        clue_id: 'clue-estonian-both',
        clue_en: 'Name this statue.',
        clue_et: 'Nimeta nii Rooma rajajavennad kui ka nende ema.',
        response_en: 'Romulus, Remus',
        response_et: 'Romulus, Remus',
      }),
      row({
        clue_id: 'clue-complete-four-item',
        clue_en: 'What is the complete four-item sequence?',
        clue_et: 'Mis on täielik neljaosaline järgnevus?',
        response_en: 'spring, summer, autumn, winter',
        response_et: 'kevad, suvi, sügis, talv',
      }),
    ]);

    expect([...audit.clueReasons]).toEqual([
      ['clue-both-rome', ['multi-item-answer']],
      ['clue-complete-four-item', ['multi-item-answer']],
      ['clue-estonian-both', ['multi-item-answer']],
      ['clue-four-grim-costs', ['multi-item-answer']],
      ['clue-semicolon-list', ['multi-item-answer']],
      ['clue-three-kingdoms', ['multi-item-answer']],
    ]);
  });

  it('inspects direct answer requests without treating incidental plural narrative as a list prompt', () => {
    const audit = auditAccessibility([
      row({
        clue_id: 'clue-ambiguous-deer',
        clue_en: 'Name the deer shown in this scene.',
        response_en: 'red deer, fallow deer',
      }),
      row({
        clue_id: 'clue-what-colors',
        clue_en: 'What colors appear on this flag?',
        response_en: 'red, white',
      }),
      row({
        clue_id: 'clue-copular-colors-en',
        clue_en: 'What are the colors on this flag?',
        response_en: 'red, white',
      }),
      row({
        clue_id: 'clue-copular-colors-et',
        clue_et: 'Millised on selle lipu värvid?',
        response_et: 'punane, valge',
      }),
      row({
        clue_id: 'clue-mis-varvid',
        clue_et: 'Mis värvid on sellel lipul?',
        response_et: 'punane, valge',
      }),
      row({
        clue_id: 'clue-name-the-colors',
        clue_en: 'Name the colors on this flag.',
        response_en: 'red, white',
      }),
      row({
        clue_id: 'clue-nimeta-varvid',
        clue_et: 'Nimeta selle lipu värvid.',
        response_et: 'punane, valge',
      }),
      row({
        clue_id: 'clue-name-all-colors',
        clue_en: 'Name all colors on this flag.',
        response_en: 'red, white',
      }),
      row({
        clue_id: 'clue-nimeta-koik-varvid',
        clue_et: 'Nimeta kõik selle lipu värvid.',
        response_et: 'punane, valge',
      }),
      row({
        clue_id: 'clue-what-animals',
        clue_en: 'What animals live in this habitat?',
        response_en: 'lions, zebras',
      }),
      row({
        clue_id: 'clue-mountains',
        clue_en: 'Which mountains border this valley?',
        response_en: 'Alps, Dolomites',
      }),
      row({
        clue_id: 'clue-ingredients',
        clue_en: 'Name the ingredients in this sauce.',
        response_en: 'tomatoes, basil',
      }),
      row({
        clue_id: 'clue-famous-actors',
        clue_en: 'Which famous actors played these roles?',
        response_en: 'Jane Doe, John Smith',
      }),
      row({
        clue_id: 'clue-primary-colors',
        clue_en: 'Name primary colors.',
        response_en: 'red, blue',
      }),
      row({
        clue_id: 'clue-popular-films',
        clue_en: 'Which popular films won these awards?',
        response_en: 'Moonlight, Parasite',
      }),
      row({
        clue_id: 'clue-major-cities',
        clue_en: 'What major cities stand on this river?',
        response_en: 'London, Oxford',
      }),
      row({
        clue_id: 'clue-animated-films',
        clue_en: 'Which animated films feature this character?',
        response_en: 'Toy Story, Toy Story 2',
      }),
      row({
        clue_id: 'clue-oceans',
        clue_en: 'What oceans border this continent?',
        response_en: 'Atlantic, Indian',
      }),
      row({
        clue_id: 'clue-continents-et',
        clue_et: 'Mis mandrid piirnevad selle ookeaniga?',
        response_et: 'Aafrika, Austraalia',
      }),
      row({
        clue_id: 'clue-tuntud-filmid',
        clue_et: 'Mis tuntud filmid jälgivad kolme reisijat?',
        response_et: 'Film üks, Film kaks',
      }),
      row({
        clue_id: 'clue-singular-status',
        clue_en: 'What status does this territory hold?',
        response_en: 'Bonaire, Netherlands',
      }),
      row({
        clue_id: 'clue-singular-series',
        clue_en: 'Which series follows these teenagers?',
        response_en: 'Beverly Hills, 90210',
      }),
      row({
        clue_id: 'clue-plural-series',
        clue_en: 'Which series are set in Miami?',
        response_en: 'Miami Vice, Burn Notice',
      }),
      row({
        clue_id: 'clue-plural-answers',
        clue_en: 'What answers does this book give?',
        response_en: 'yes, no',
      }),
      row({
        clue_id: 'clue-singular-famous-actor',
        clue_en: 'Which famous actor played this role?',
        response_en: 'Doe, Jane',
      }),
      row({
        clue_id: 'clue-singular-us-city',
        clue_en: 'Which US city is the federal capital?',
        response_en: 'Washington, D.C.',
      }),
      row({
        clue_id: 'clue-singular-famous-film',
        clue_en: 'Which famous film follows three travellers?',
        response_en: 'Planes, Trains and Automobiles',
      }),
      row({
        clue_id: 'clue-singular-james-bond-film',
        clue_en: 'Which James Bond film has this plot?',
        response_en: 'Hello, Dolly!',
      }),
      row({
        clue_id: 'clue-singular-tuntud-film',
        clue_et: 'Mis tuntud film jälgib kolme reisijat?',
        response_et: 'Hüvasti, Lenin!',
      }),
      row({
        clue_id: 'clue-singular-tuntud-title',
        clue_et: 'Mis tuntud pealkiri kuulub sellele teosele?',
        response_et: 'Mina, Claudius',
      }),
      row({
        clue_id: 'clue-incidental-both',
        clue_en: 'Both sisters work in the same newsroom. Name this series.',
        response_en: 'Good Morning, Miami',
      }),
      row({
        clue_id: 'clue-incidental-nii',
        clue_et: 'Nii Mari kui ka Jüri töötavad samas uudistetoimetuses. Nimeta sari.',
        response_et: 'Tere hommikust, Miami',
      }),
    ]);

    expect([...audit.clueReasons]).toEqual([
      ['clue-ambiguous-deer', ['multi-item-answer']],
      ['clue-animated-films', ['multi-item-answer']],
      ['clue-continents-et', ['multi-item-answer']],
      ['clue-copular-colors-en', ['multi-item-answer']],
      ['clue-copular-colors-et', ['multi-item-answer']],
      ['clue-famous-actors', ['multi-item-answer']],
      ['clue-ingredients', ['multi-item-answer']],
      ['clue-major-cities', ['multi-item-answer']],
      ['clue-mis-varvid', ['multi-item-answer']],
      ['clue-mountains', ['multi-item-answer']],
      ['clue-name-all-colors', ['multi-item-answer']],
      ['clue-name-the-colors', ['multi-item-answer']],
      ['clue-nimeta-koik-varvid', ['multi-item-answer']],
      ['clue-nimeta-varvid', ['multi-item-answer']],
      ['clue-oceans', ['multi-item-answer']],
      ['clue-plural-answers', ['multi-item-answer']],
      ['clue-plural-series', ['multi-item-answer']],
      ['clue-popular-films', ['multi-item-answer']],
      ['clue-primary-colors', ['multi-item-answer']],
      ['clue-tuntud-filmid', ['multi-item-answer']],
      ['clue-what-animals', ['multi-item-answer']],
      ['clue-what-colors', ['multi-item-answer']],
    ]);
  });

  it('classifies all 43 current comma-bearing authority rows at TP4 FP0 FN0 TN39', () => {
    const commaRows = completeCumulativeAuthorityCorpus().filter(({ response }) => (
      /,/u.test(response.en) || /,/u.test(response.et)
    ));
    const expectedMultiItemIds = new Set([
      'medium-hard:playable:built-in-history-set-075:1',
      'medium-hard:built-in-mythology-religion-philosophy-set-051:question:2',
      'medium-hard:built-in-mythology-religion-philosophy-set-076:question:3',
      'medium-hard:built-in-politics-economics-society-set-068:question:3',
    ]);
    const audit = auditAccessibility(commaRows.map((candidate) => ({
      clue_id: `${candidate.authority}:${candidate.id}`,
      category_set_id: candidate.categorySetId ?? '',
      category_name_en: candidate.categoryTitle?.en ?? '',
      category_name_et: candidate.categoryTitle?.et ?? '',
      clue_en: candidate.clue.en,
      clue_et: candidate.clue.et,
      response_en: candidate.response.en,
      response_et: candidate.response.et,
      source_title: candidate.source.title,
    })));
    const predictedMultiItemIds = new Set(
      [...audit.clueReasons]
        .filter(([, reasons]) => reasons.includes('multi-item-answer'))
        .map(([clueId]) => clueId),
    );
    const truePositives = [...predictedMultiItemIds]
      .filter((clueId) => expectedMultiItemIds.has(clueId)).length;
    const falsePositives = [...predictedMultiItemIds]
      .filter((clueId) => !expectedMultiItemIds.has(clueId)).length;
    const falseNegatives = [...expectedMultiItemIds]
      .filter((clueId) => !predictedMultiItemIds.has(clueId)).length;

    expect({
      rows: commaRows.length,
      truePositives,
      falsePositives,
      falseNegatives,
      trueNegatives:
        commaRows.length - truePositives - falsePositives - falseNegatives,
    }).toEqual({
      rows: 43,
      truePositives: 4,
      falsePositives: 0,
      falseNegatives: 0,
      trueNegatives: 39,
    });
  });
});

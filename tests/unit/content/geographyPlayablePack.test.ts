import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { auditPlayability } from '../../../scripts/content/playability/audit';
import { GEOGRAPHY_CATEGORIES } from '../../../scripts/content/playability/banks/packs01to04/geography';
import {
  completeEnabledAuthorityCorpus,
  findAuthorityCollisions,
  findAuthorityOneWayAliasLeaks,
} from './enabledAuthorityCollisionTestUtils';

const TARGETS = [
  ['000', 1],
  ['022', 1],
  ['025', 1],
  ['039', 2],
  ['042', 3],
  ['046', 5],
  ['048', 4],
  ['049', 1],
  ['054', 1],
  ['061', 3],
  ['067', 3],
  ['076', 1],
  ['081', 1],
  ['090', 2],
  ['092', 1],
  ['096', 2],
] as const;

const TARGET_SLOTS = new Set(TARGETS.map(([setNumber, tier]) =>
  `built-in-geography-set-${setNumber}:${tier}`));

function category(setNumber: string) {
  const found = GEOGRAPHY_CATEGORIES.find(
    ({ categorySetId }) => categorySetId.endsWith(`-set-${setNumber}`),
  );
  if (found === undefined) throw new Error(`Missing Geography set ${setNumber}`);
  return found;
}

function question(setNumber: string, tier: 1 | 2 | 3 | 4 | 5) {
  const found = category(setNumber).questions.find((candidate) => candidate.tier === tier);
  if (found === undefined) throw new Error(`Missing Geography question ${setNumber}:${tier}`);
  return found;
}

function protectedReplacements() {
  const corpus = completeEnabledAuthorityCorpus();
  const replacements = TARGETS.map(([setNumber, tier]) => {
    const id = question(setNumber, tier).key;
    const row = corpus.find((candidate) => candidate.id === id);
    if (row === undefined) throw new Error(`Missing protected replacement ${id}`);
    return row;
  });
  return { corpus, replacements };
}

describe('Geography playable pack', () => {
  it('keeps the complete medium and hard pack free of playability diagnostics', () => {
    const questions = GEOGRAPHY_CATEGORIES.flatMap(
      ({ questions: currentQuestions }) => currentQuestions,
    );
    const rows = GEOGRAPHY_CATEGORIES.flatMap((currentCategory) =>
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

    expect(GEOGRAPHY_CATEGORIES).toHaveLength(66);
    expect(questions).toHaveLength(330);
    expect(auditPlayability(rows).diagnostics).toEqual([]);
  });

  it('keeps every one of the other 314 Geography rows byte-for-byte unchanged', () => {
    const unchangedRows = GEOGRAPHY_CATEGORIES.flatMap((currentCategory) =>
      currentCategory.questions.map((currentQuestion) => ({
        categorySetId: currentCategory.categorySetId,
        batchId: currentCategory.batchId,
        packId: currentCategory.packId,
        difficulty: currentCategory.difficulty,
        categoryName: currentCategory.name,
        question: currentQuestion,
      }))).filter(({ categorySetId, question: currentQuestion }) =>
      !TARGET_SLOTS.has(`${categorySetId}:${currentQuestion.tier}`));

    expect(unchangedRows).toHaveLength(314);
    expect(createHash('sha256').update(JSON.stringify(unchangedRows)).digest('hex'))
      .toBe('ff50b559310eb53d3b1d8ac13ac488ecc07a9391964a7f9b2a54e4b49ffac316');
  });

  it('locks the exact sixteen replacement payloads', () => {
    expect(TARGETS.map(([setNumber, tier]) => question(setNumber, tier))).toEqual([
      {
        key: 'playable-geography:built-in-geography-set-000:bratislava-danube-capital',
        factKey: 'geography:bratislava-danube-capital',
        tier: 1,
        subjectKey: 'place:bratislava',
        clue: {
          en: 'The Danube flows through which Slovak capital, just east of Vienna?',
          et: 'Millist Slovakkia pealinna läbib Doonau vahetult Viinist ida pool?',
        },
        response: { en: 'Bratislava', et: 'Bratislava' },
        acceptedVariants: { en: [], et: [] },
        explanation: {
          en: 'Bratislava stands on both banks of the Danube near Slovakia’s borders with Austria and Hungary.',
          et: 'Bratislava asub Doonau mõlemal kaldal Austria ja Ungari piiri lähedal.',
        },
        source: {
          sourceId: 'wikipedia:bratislava',
          title: 'Bratislava',
          url: 'https://en.wikipedia.org/wiki/Bratislava',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable-geography:built-in-geography-set-022:ice-age-glacial-erratics',
        factKey: 'geography:ice-age-glacial-erratics',
        tier: 1,
        subjectKey: 'landform:glacial-erratic',
        clue: {
          en: 'During the Ice Age, glaciers carried huge boulders into Estonia. What are these isolated rocks called?',
          et: 'Jääajal kandsid liustikud Eestisse suuri kivirahne. Kuidas nimetatakse selliseid üksikuid rahne?',
        },
        response: { en: 'glacial erratics', et: 'rändrahnud' },
        acceptedVariants: {
          en: ['glacial erratic', 'erratic'],
          et: ['rändrahn', 'rändkivi'],
        },
        explanation: {
          en: 'Glacial erratics are rocks transported by ice and deposited far from the bedrock where they formed.',
          et: 'Rändrahnud on jääga teisale kantud kivimiplokid, mis jäid maha kaugel oma lähtekohast.',
        },
        source: {
          sourceId: 'wikipedia:glacial_erratic',
          title: 'Glacial erratic',
          url: 'https://en.wikipedia.org/wiki/Glacial_erratic',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable-geography:built-in-geography-set-025:samoa-politically-divided-archipelago',
        factKey: 'geography:samoa-politically-divided-archipelago',
        tier: 1,
        subjectKey: 'place:samoan-islands',
        clue: {
          en: 'Which Polynesian island group is politically divided into an independent western state and an American territory to the east?',
          et: 'Milline Polüneesia saarterühm on poliitiliselt jagatud iseseisvaks läänepoolseks riigiks ja idapoolseks USA territooriumiks?',
        },
        response: { en: 'Samoan Islands', et: 'Samoa saared' },
        acceptedVariants: { en: ['Samoa'], et: ['Samoa'] },
        explanation: {
          en: 'The archipelago is split politically into Samoa in the west and American Samoa, a US territory, in the east.',
          et: 'Saarestik jaguneb poliitiliselt läänes asuvaks Samoa riigiks ja idas asuvaks USA territooriumiks Ameerika Samoaks.',
        },
        source: {
          sourceId: 'wikipedia:samoan_islands',
          title: 'Samoan Islands',
          url: 'https://en.wikipedia.org/wiki/Samoan_Islands',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable-geography:built-in-geography-set-039:klaipeda-baltic-seaport',
        factKey: 'geography:klaipeda-baltic-seaport',
        tier: 2,
        subjectKey: 'place:klaipeda',
        clue: {
          en: 'Which Lithuanian city on the Baltic coast is the country’s only major seaport?',
          et: 'Milline Läänemere rannikul asuv Leedu linn on riigi ainus suur meresadam?',
        },
        response: { en: 'Klaipėda', et: 'Klaipėda' },
        acceptedVariants: { en: ['Klaipeda'], et: ['Klaipeda'] },
        explanation: {
          en: 'Klaipėda stretches along the Curonian Lagoon and the Baltic Sea, and its port is Lithuania’s only major seaport.',
          et: 'Klaipėda ulatub Kura lahe ja Läänemere kallastele ning selle sadam on Leedu ainus suur meresadam.',
        },
        source: {
          sourceId: 'wikipedia:klaipėda',
          title: 'Klaipėda',
          url: 'https://en.wikipedia.org/wiki/Klaipėda',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable-geography:built-in-geography-set-042:nakhchivan-azerbaijan-exclave',
        factKey: 'geography:nakhchivan-azerbaijan-exclave',
        tier: 3,
        subjectKey: 'place:azerbaijan',
        clue: {
          en: 'Nakhchivan is an exclave of which country, separated from its main territory by Armenia?',
          et: 'Nahhitševan on millise riigi eksklaav, mida eraldab põhiterritooriumist Armeenia?',
        },
        response: { en: 'Azerbaijan', et: 'Aserbaidžaan' },
        acceptedVariants: { en: [], et: [] },
        explanation: {
          en: 'Nakhchivan is an autonomous republic of Azerbaijan bordered by Armenia, Iran and Turkey.',
          et: 'Nahhitševan on Aserbaidžaani autonoomne vabariik, mis piirneb Armeenia, Iraani ja Türgiga.',
        },
        source: {
          sourceId: 'wikipedia:nakhchivan_autonomous_republic',
          title: 'Nakhchivan Autonomous Republic',
          url: 'https://en.wikipedia.org/wiki/Nakhchivan_Autonomous_Republic',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable-geography:built-in-geography-set-046:persian-gulf-hormuz-strait',
        factKey: 'geography:persian-gulf-hormuz-strait',
        tier: 5,
        subjectKey: 'place:strait-of-hormuz',
        clue: {
          en: 'Which strait, overlooked by Oman’s Musandam Peninsula, is one of the world’s most important oil-shipping chokepoints?',
          et: 'Milline Omaani Musandami poolsaare juures asuv väin on üks maailma tähtsamaid naftaveo kitsaskohti?',
        },
        response: { en: 'Strait of Hormuz', et: 'Hormuzi väin' },
        acceptedVariants: {
          en: ['Hormuz Strait', 'Hormuz'],
          et: ['Hormuz'],
        },
        explanation: {
          en: 'The Strait of Hormuz connects the Persian Gulf with the Gulf of Oman and is a major oil-shipping route.',
          et: 'Hormuzi väin ühendab Pärsia lahte Omaani lahega ja on tähtis naftaveo meretee.',
        },
        source: {
          sourceId: 'wikipedia:strait_of_hormuz',
          title: 'Strait of Hormuz',
          url: 'https://en.wikipedia.org/wiki/Strait_of_Hormuz',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable-geography:built-in-geography-set-048:murmansk-kola-peninsula',
        factKey: 'geography:murmansk-kola-peninsula',
        tier: 4,
        subjectKey: 'place:kola-peninsula',
        clue: {
          en: "Murmansk lies on which peninsula in Russia's far northwest?",
          et: 'Millisel Venemaa kauges loodeosas asuval poolsaarel paikneb Murmansk?',
        },
        response: { en: 'Kola Peninsula', et: 'Koola poolsaar' },
        acceptedVariants: { en: ['Kola'], et: ['Koola'] },
        explanation: {
          en: 'The Kola Peninsula occupies Russia’s far northwest, with the Barents Sea to the north and the White Sea to the east and southeast.',
          et: 'Koola poolsaar asub Venemaa kauges loodeosas, Barentsi meri põhjas ning Valge meri idas ja kagus.',
        },
        source: {
          sourceId: 'wikipedia:kola_peninsula',
          title: 'Kola Peninsula',
          url: 'https://en.wikipedia.org/wiki/Kola_Peninsula',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable-geography:built-in-geography-set-049:rabat-atlantic-bou-regreg-capital',
        factKey: 'geography:rabat-atlantic-bou-regreg-capital',
        tier: 1,
        subjectKey: 'place:rabat',
        clue: {
          en: 'Which Moroccan capital stands on the Atlantic coast at the mouth of the Bou Regreg?',
          et: 'Milline Maroko pealinn asub Atlandi rannikul Bou Regregi jõe suudmes?',
        },
        response: { en: 'Rabat', et: 'Rabat' },
        acceptedVariants: { en: [], et: [] },
        explanation: {
          en: 'Rabat lies on the Atlantic at the mouth of the Bou Regreg, opposite the city of Salé.',
          et: 'Rabat asub Atlandi ookeani ääres Bou Regregi jõe suudmes Salé linna vastas.',
        },
        source: {
          sourceId: 'wikipedia:rabat',
          title: 'Rabat',
          url: 'https://en.wikipedia.org/wiki/Rabat',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable-geography:built-in-geography-set-054:utah-great-salt-lake-city-name',
        factKey: 'geography:utah-great-salt-lake-city-name',
        tier: 1,
        subjectKey: 'place:great-salt-lake',
        clue: {
          en: 'Which salt lake in Utah gave its name to Salt Lake City?',
          et: 'Milline Utah’ soolajärv andis nime Salt Lake Cityle?',
        },
        response: { en: 'Great Salt Lake', et: 'Suur Soolajärv' },
        acceptedVariants: { en: [], et: [] },
        explanation: {
          en: 'The Great Salt Lake is the Western Hemisphere’s largest saltwater lake and a terminal lake in northern Utah.',
          et: 'Suur Soolajärv on läänepoolkera suurim soolajärv ning Põhja-Utah’ umbjärv.',
        },
        source: {
          sourceId: 'wikipedia:great_salt_lake',
          title: 'Great Salt Lake',
          url: 'https://en.wikipedia.org/wiki/Great_Salt_Lake',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable-geography:built-in-geography-set-061:surface-rock-units-map',
        factKey: 'geography:surface-rock-units-map',
        tier: 3,
        subjectKey: 'map:geologic-map',
        clue: {
          en: 'Which map uses colours and symbols to show the rock types and geological ages exposed at the surface?',
          et: 'Milline kaart näitab värvide ja tingmärkidega maapinnal paljanduvate kivimite tüüpe ja geoloogilist vanust?',
        },
        response: { en: 'Geological map', et: 'geoloogiline kaart' },
        acceptedVariants: {
          en: ['geologic map'],
          et: ['geoloogiakaart'],
        },
        explanation: {
          en: 'A geological map records the distribution of rock units and geological features at Earth’s surface.',
          et: 'Geoloogiline kaart kujutab maapinnal paljanduvate kivimiüksuste ja geoloogiliste struktuuride levikut.',
        },
        source: {
          sourceId: 'wikipedia:geologic_map',
          title: 'Geologic map',
          url: 'https://en.wikipedia.org/wiki/Geologic_map',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable-geography:built-in-geography-set-067:czech-germany-north-sea-river',
        factKey: 'geography:czech-germany-north-sea-river',
        tier: 3,
        subjectKey: 'river:elbe',
        clue: {
          en: 'Dresden and Hamburg stand on which river that rises in Czechia and crosses Germany?',
          et: 'Millise Tšehhist algava ja Saksamaad läbiva jõe ääres asuvad Dresden ning Hamburg?',
        },
        response: { en: 'Elbe', et: 'Elbe' },
        acceptedVariants: { en: ['Elbe River'], et: ['Elbe jõgi'] },
        explanation: {
          en: 'The Elbe flows from Czechia through Germany and enters the North Sea near Cuxhaven.',
          et: 'Elbe voolab Tšehhist läbi Saksamaa ja suubub Cuxhaveni lähedal Põhjamerre.',
        },
        source: {
          sourceId: 'wikipedia:elbe',
          title: 'Elbe',
          url: 'https://en.wikipedia.org/wiki/Elbe',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable-geography:built-in-geography-set-076:opposite-greenwich-pacific-meridian',
        factKey: 'geography:opposite-greenwich-pacific-meridian',
        tier: 1,
        subjectKey: 'line:180th-meridian',
        clue: {
          en: 'Which meridian lies directly opposite Greenwich and passes mostly through the Pacific Ocean?',
          et: 'Milline meridiaan asub Greenwichi vastasküljel ja kulgeb peamiselt läbi Vaikse ookeani?',
        },
        response: { en: '180th meridian', et: '180. meridiaan' },
        acceptedVariants: { en: ['antimeridian'], et: ['antimeridiaan'] },
        explanation: {
          en: 'The 180th meridian is opposite the prime meridian and broadly forms the basis of the International Date Line.',
          et: '180. meridiaan asub algmeridiaani vastasküljel ning on üldjoontes rahvusvahelise kuupäevaraja aluseks.',
        },
        source: {
          sourceId: 'wikipedia:180th_meridian',
          title: '180th meridian',
          url: 'https://en.wikipedia.org/wiki/180th_meridian',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable-geography:built-in-geography-set-081:madras-modern-indian-city',
        factKey: 'geography:madras-modern-indian-city',
        tier: 1,
        subjectKey: 'place:chennai',
        clue: {
          en: 'Madras was the former English name of which major city on India’s southeast coast?',
          et: 'Millise India kaguranniku suurlinna varasem ingliskeelne nimi oli Madras?',
        },
        response: { en: 'Chennai', et: 'Chennai' },
        acceptedVariants: { en: [], et: [] },
        explanation: {
          en: 'The city was officially renamed from Madras to Chennai in 1996.',
          et: 'Linn nimetati 1996. aastal ametlikult Madrasest Chennaiks.',
        },
        source: {
          sourceId: 'wikipedia:chennai',
          title: 'Chennai',
          url: 'https://en.wikipedia.org/wiki/Chennai',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable-geography:built-in-geography-set-090:tokyo-osaka-1964-high-speed-rail',
        factKey: 'geography:tokyo-osaka-1964-high-speed-rail',
        tier: 2,
        subjectKey: 'route:shinkansen',
        clue: {
          en: 'What name is given to Japan’s high-speed rail network, whose first line opened between Tokyo and Osaka in 1964?',
          et: 'Mis nime kannab Jaapani kiirraudteevõrk, mille esimene liin avati 1964. aastal Tokyo ja Osaka vahel?',
        },
        response: { en: 'Shinkansen', et: 'Shinkansen' },
        acceptedVariants: {
          en: ['bullet train'],
          et: ['Jaapani kiirrong'],
        },
        explanation: {
          en: 'The Tōkaidō Shinkansen began service in 1964 between Tokyo and Osaka, starting Japan’s high-speed rail era.',
          et: 'Tōkaidō Shinkansen alustas 1964. aastal liiklust Tokyo ja Osaka vahel ning sellega algas Jaapanis kiirraudtee ajastu.',
        },
        source: {
          sourceId: 'wikipedia:shinkansen',
          title: 'Shinkansen',
          url: 'https://en.wikipedia.org/wiki/Shinkansen',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable-geography:built-in-geography-set-092:miami-cuban-exile-neighbourhood',
        factKey: 'geography:miami-cuban-exile-neighbourhood',
        tier: 1,
        subjectKey: 'place:little-havana',
        clue: {
          en: 'Which Miami neighbourhood, named after Cuba’s capital, became the best-known home of Cuban exiles?',
          et: 'Milline Kuuba pealinna järgi nime saanud Miami linnaosa sai tuntuks Kuuba pagulaste koduna?',
        },
        response: { en: 'Little Havana', et: 'Little Havana' },
        acceptedVariants: { en: [], et: [] },
        explanation: {
          en: 'Little Havana emerged in the 1960s as Cuban refugees settled west of downtown Miami.',
          et: 'Little Havana kujunes 1960. aastatel, kui Kuuba pagulased asusid elama Miami kesklinnast lääne poole.',
        },
        source: {
          sourceId: 'wikipedia:little_havana',
          title: 'Little Havana',
          url: 'https://en.wikipedia.org/wiki/Little_Havana',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable-geography:built-in-geography-set-096:fairy-chimneys-cave-balloons-region',
        factKey: 'geography:fairy-chimneys-cave-balloons-region',
        tier: 2,
        subjectKey: 'place:cappadocia',
        clue: {
          en: 'Fairy chimneys, cave homes, and hot-air balloons are signatures of which region in central Turkey?',
          et: 'Millisele Kesk-Türgi piirkonnale on iseloomulikud haldjakorstnad, koobaselamud ja kuumaõhupallid?',
        },
        response: { en: 'Cappadocia', et: 'Kapadookia' },
        acceptedVariants: { en: [], et: [] },
        explanation: {
          en: 'Cappadocia is known for eroded volcanic rock formations, historic cave dwellings, and balloon flights.',
          et: 'Kapadookia on tuntud erosiooni kujundatud vulkaaniliste kivimoodustiste, ajalooliste koobaselamute ja õhupallilendude poolest.',
        },
        source: {
          sourceId: 'wikipedia:cappadocia',
          title: 'Cappadocia',
          url: 'https://en.wikipedia.org/wiki/Cappadocia',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
    ]);
  });

  it('keeps all sixteen replacements collision-free across every enabled authority row', () => {
    const { corpus, replacements } = protectedReplacements();
    const counts = Object.fromEntries(['easy', 'medium-hard', 'adult', 'estonia'].map(
      (authority) => [authority, corpus.filter((row) => row.authority === authority).length],
    ));

    expect(counts).toEqual({ easy: 2_000, 'medium-hard': 4_000, adult: 500, estonia: 500 });
    expect(corpus).toHaveLength(7_000);
    expect(replacements).toHaveLength(16);
    expect(replacements.flatMap((candidate) =>
      findAuthorityCollisions(candidate, corpus).map((collision) =>
        `${candidate.id}:${collision}`))).toEqual([]);
  }, 10_000);

  it('keeps all sixteen response aliases out of every other clue and explanation', () => {
    const { corpus, replacements } = protectedReplacements();

    expect(replacements.flatMap((candidate) =>
      findAuthorityOneWayAliasLeaks(candidate, corpus).map((leak) =>
        `${candidate.id}:${leak}`))).toEqual([]);
  }, 10_000);
});

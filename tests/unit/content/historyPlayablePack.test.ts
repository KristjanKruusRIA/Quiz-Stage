import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { auditPlayability } from '../../../scripts/content/playability/audit';
import { HISTORY_CATEGORIES } from '../../../scripts/content/playability/banks/packs01to04/history';
import {
  completeEnabledAuthorityCorpus,
  findAuthorityCollisions,
  findAuthorityOneWayAliasLeaks,
} from './enabledAuthorityCollisionTestUtils';

const TARGETS = [
  ['005', 4],
  ['038', 1],
  ['045', 4],
  ['061', 3],
  ['063', 2],
  ['064', 1],
  ['065', 3],
  ['065', 5],
  ['066', 1],
  ['077', 4],
  ['084', 1],
  ['084', 2],
  ['089', 3],
  ['091', 2],
  ['096', 1],
] as const;

const TARGET_SLOTS = new Set(TARGETS.map(([setNumber, tier]) =>
  `built-in-history-set-${setNumber}:${tier}`));

function category(setNumber: string) {
  const found = HISTORY_CATEGORIES.find(
    ({ categorySetId }) => categorySetId.endsWith(`-set-${setNumber}`),
  );
  if (found === undefined) throw new Error(`Missing History set ${setNumber}`);
  return found;
}

function question(setNumber: string, tier: 1 | 2 | 3 | 4 | 5) {
  const found = category(setNumber).questions.find((candidate) => candidate.tier === tier);
  if (found === undefined) throw new Error(`Missing History question ${setNumber}:${tier}`);
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

describe('History playable pack', () => {
  it('keeps the complete medium and hard pack free of playability diagnostics', () => {
    const questions = HISTORY_CATEGORIES.flatMap(
      ({ questions: currentQuestions }) => currentQuestions,
    );
    const rows = HISTORY_CATEGORIES.flatMap((currentCategory) =>
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

    expect(HISTORY_CATEGORIES).toHaveLength(66);
    expect(questions).toHaveLength(330);
    expect(auditPlayability(rows).diagnostics).toEqual([]);
  });

  it('keeps every one of the other 315 History rows byte-for-byte unchanged', () => {
    const unchangedRows = HISTORY_CATEGORIES.flatMap((currentCategory) =>
      currentCategory.questions.map((currentQuestion) => ({
        categorySetId: currentCategory.categorySetId,
        batchId: currentCategory.batchId,
        packId: currentCategory.packId,
        difficulty: currentCategory.difficulty,
        categoryName: currentCategory.name,
        question: currentQuestion,
      }))).filter(({ categorySetId, question: currentQuestion }) =>
      !TARGET_SLOTS.has(`${categorySetId}:${currentQuestion.tier}`));

    expect(unchangedRows).toHaveLength(315);
    expect(createHash('sha256').update(JSON.stringify(unchangedRows)).digest('hex'))
      .toBe('015838f8ff9d2f8f74d0e6933a516d5634be0fb483981a5453933db36f2cf460');
  });

  it('locks the exact fifteen replacement payloads', () => {
    expect(TARGETS.map(([setNumber, tier]) => question(setNumber, tier))).toEqual([
      {
        key: 'playable:built-in-history-set-005:4',
        factKey: 'fact:history:canopic-jar:1kuajh8',
        tier: 4,
        subjectKey: 'history:canopic-jar',
        clue: {
          en: 'What name is given to the four vessels that held organs removed during ancient Egyptian mummification?',
          et: 'Kuidas nimetatakse nelja anumat, milles säilitati Vana-Egiptuse mumifitseerimisel eemaldatud siseelundeid?',
        },
        response: { en: 'canopic jars', et: 'kanoobid' },
        acceptedVariants: { en: [], et: [] },
        explanation: {
          en: 'The jars preserved the liver, lungs, stomach and intestines, each protected by one of the Four Sons of Horus.',
          et: 'Kanoopides säilitati maksa, kopse, magu ja soolestikku; igaüht neist kaitses üks Horuse neljast pojast.',
        },
        source: {
          sourceId: 'source:history:canopic-jar',
          title: 'Canopic jar — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Canopic_jar',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable:built-in-history-set-038:1',
        factKey: 'fact:history:pericles:1ujhbn',
        tier: 1,
        subjectKey: 'history:pericles',
        clue: {
          en: 'Which statesman led Athens during much of its fifth-century golden age and delivered a famous funeral speech?',
          et: 'Milline riigimees juhtis Ateenat suurema osa 5. sajandi eKr kuldajast ja pidas kuulsa matusekõne?',
        },
        response: { en: 'Pericles', et: 'Perikles' },
        acceptedVariants: { en: ['Perikles'], et: ['Pericles'] },
        explanation: {
          en: 'Pericles promoted Athenian democracy and backed the major building programme on the Acropolis.',
          et: 'Perikles edendas Ateena demokraatiat ja toetas Akropoli suurt ehitusprogrammi.',
        },
        source: {
          sourceId: 'source:history:pericles',
          title: 'Pericles — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Pericles',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable:built-in-history-set-045:4',
        factKey: 'fact:history:spqr:1av684a',
        tier: 4,
        subjectKey: 'history:spqr',
        clue: {
          en: 'Which four-letter abbreviation found on Roman monuments, public works and coins stood for “the Senate and People of Rome”?',
          et: 'Milline Rooma monumentidel, avalikel rajatistel ja müntidel leiduv neljatäheline lühend tähendas „Rooma senatit ja rahvast“?',
        },
        response: { en: 'SPQR', et: 'SPQR' },
        acceptedVariants: { en: [], et: [] },
        explanation: {
          en: 'SPQR abbreviates the Latin Senatus Populusque Romanus and continued in use under the Roman Empire.',
          et: 'SPQR lühendab ladinakeelset väljendit Senatus Populusque Romanus ja jäi kasutusele ka Rooma keisririigi ajal.',
        },
        source: {
          sourceId: 'source:history:spqr',
          title: 'SPQR — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/SPQR',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable:built-in-history-set-061:3',
        factKey: 'fact:history:truman-doctrine:rp02ln',
        tier: 3,
        subjectKey: 'history:truman-doctrine',
        clue: {
          en: 'Which 1947 US policy promised support to countries resisting communist pressure, beginning with aid to Greece and Turkey?',
          et: 'Milline USA 1947. aasta poliitika lubas toetada kommunistlikule survele vastu seisvaid riike, alustades Kreeka ja Türgi abistamisest?',
        },
        response: { en: 'the Truman Doctrine', et: 'Trumani doktriin' },
        acceptedVariants: { en: [], et: [] },
        explanation: {
          en: 'President Harry Truman presented aid to Greece and Turkey as part of a wider policy of containing Soviet expansion.',
          et: 'President Harry Truman esitas Kreeka ja Türgi abistamist osana laiemast Nõukogude mõju laienemise tõkestamise poliitikast.',
        },
        source: {
          sourceId: 'source:history:truman-doctrine',
          title: 'Truman Doctrine — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Truman_Doctrine',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable:built-in-history-set-063:2',
        factKey: 'fact:history:salt-march:3sxc11',
        tier: 2,
        subjectKey: 'history:salt-march',
        clue: {
          en: 'What name is given to Gandhi’s 1930 protest walk to Dandi against Britain’s monopoly on a common seasoning?',
          et: 'Mis nime kannab Gandhi 1930. aasta protestirännak Dandisse Briti kehtestatud ühe tavalise maitseaine monopoli vastu?',
        },
        response: { en: 'the Salt March', et: 'soolamarss' },
        acceptedVariants: { en: ['Dandi March'], et: ['Dandi marss'] },
        explanation: {
          en: 'At the coast, Gandhi broke British law by making salt, turning the march into a symbol of Indian civil disobedience.',
          et: 'Rannikul rikkus Gandhi Briti seadust, valmistades soola, ning muutis marsi India kodanikuallumatuse sümboliks.',
        },
        source: {
          sourceId: 'source:history:salt-march',
          title: 'Salt March — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Salt_March',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable:built-in-history-set-064:1',
        factKey: 'fact:history:european-court-of-human-rights:11pttel',
        tier: 1,
        subjectKey: 'history:european-court-of-human-rights',
        clue: {
          en: 'Which Strasbourg court hears claims that member states violated rights in the European Convention on Human Rights?',
          et: 'Milline Strasbourgis asuv kohus arutab kaebusi, et liikmesriik on rikkunud Euroopa inimõiguste konventsiooni?',
        },
        response: {
          en: 'the European Court of Human Rights',
          et: 'Euroopa Inimõiguste Kohus',
        },
        acceptedVariants: {
          en: ['ECtHR'],
          et: ['EIK'],
        },
        explanation: {
          en: 'The court was established under the convention within the Council of Europe system and issued its first judgment in 1960.',
          et: 'Kohus loodi konventsiooni alusel Euroopa Nõukogu süsteemis ning tegi esimese otsuse 1960. aastal.',
        },
        source: {
          sourceId: 'source:history:european-court-of-human-rights',
          title: 'European Court of Human Rights — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/European_Court_of_Human_Rights',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable:built-in-history-set-065:3',
        factKey: 'fact:history:palazzo-vecchio:fl0oca',
        tier: 3,
        subjectKey: 'history:palazzo-vecchio',
        clue: {
          en: 'Which fortress-like town hall overlooks Florence’s Piazza della Signoria and displays a copy of Michelangelo’s David at its entrance?',
          et: 'Michelangelo „Taaveti“ koopia seisab millise Firenzes Piazza della Signoria ääres kõrguva kindluselaadse raekoja sissepääsu juures?',
        },
        response: { en: 'the Palazzo Vecchio', et: 'Palazzo Vecchio' },
        acceptedVariants: {
          en: ['Palazzo Vecchio'],
          et: ['Firenze raekoda'],
        },
        explanation: {
          en: 'The medieval palace remains Florence’s town hall; Michelangelo’s original David stood outside it before being moved to the Accademia.',
          et: 'Keskaegne palee on endiselt Firenze raekoda; Michelangelo algupärane „Taavet“ seisis selle ees, kuni viidi Accademia galeriisse.',
        },
        source: {
          sourceId: 'source:history:palazzo-vecchio',
          title: 'Palazzo Vecchio — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Palazzo_Vecchio',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable:built-in-history-set-065:5',
        factKey: 'fact:history:lorenzo-ghiberti:zavcwi',
        tier: 5,
        subjectKey: 'history:lorenzo-ghiberti',
        clue: {
          en: 'Which sculptor created the gilded bronze Florence Baptistery doors known as the Gates of Paradise?',
          et: 'Milline skulptor lõi Firenze baptisteeriumi kullatud pronksuksed, mida tuntakse Paradiisiväravatena?',
        },
        response: { en: 'Lorenzo Ghiberti', et: 'Lorenzo Ghiberti' },
        acceptedVariants: { en: ['Ghiberti'], et: ['Ghiberti'] },
        explanation: {
          en: 'Ghiberti’s ten-panel east doors depict scenes from the Old Testament.',
          et: 'Ghiberti kümne paneeliga idauksed kujutavad stseene Vanast Testamendist.',
        },
        source: {
          sourceId: 'source:history:lorenzo-ghiberti',
          title: 'Lorenzo Ghiberti — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Lorenzo_Ghiberti',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable:built-in-history-set-066:1',
        factKey: 'fact:history:civil-rights-act-of-1964:2pnk7s',
        tier: 1,
        subjectKey: 'history:civil-rights-act-of-1964',
        clue: {
          en: 'Which landmark law signed by Lyndon B. Johnson outlawed segregation in public places and employment discrimination?',
          et: 'Milline Lyndon B. Johnsoni allkirjastatud pöördeline seadus keelustas segregatsiooni avalikes kohtades ja tööalase diskrimineerimise?',
        },
        response: {
          en: 'the Civil Rights Act of 1964',
          et: '1964. aasta kodanikuõiguste seadus',
        },
        acceptedVariants: {
          en: ['Civil Rights Act', 'Civil Rights Act of 1964'],
          et: ['kodanikuõiguste seadus'],
        },
        explanation: {
          en: 'The act barred segregation in public accommodations and prohibited employment discrimination based on race, colour, religion, sex or national origin.',
          et: 'Seadus keelas segregatsiooni avalikes teeninduskohtades ning tööalase diskrimineerimise rassi, nahavärvi, usu, soo või rahvusliku päritolu alusel.',
        },
        source: {
          sourceId: 'source:history:civil-rights-act-of-1964',
          title: 'Civil Rights Act of 1964 — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Civil_Rights_Act_of_1964',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable:built-in-history-set-077:4',
        factKey: 'fact:history:miguel-hidalgo-y-costilla:ys10z4',
        tier: 4,
        subjectKey: 'history:miguel-hidalgo-y-costilla',
        clue: {
          en: 'Which priest launched Mexico’s independence struggle with the Cry of Dolores in 1810?',
          et: 'Milline preester käivitas 1810. aastal Dolorese hüüdega Mehhiko iseseisvusvõitluse?',
        },
        response: { en: 'Miguel Hidalgo', et: 'Miguel Hidalgo' },
        acceptedVariants: {
          en: ['Miguel Hidalgo y Costilla', 'Hidalgo'],
          et: ['Miguel Hidalgo y Costilla', 'Hidalgo'],
        },
        explanation: {
          en: 'Hidalgo’s call in the town of Dolores sparked an uprising against Spanish rule.',
          et: 'Hidalgo üleskutse Dolorese linnas vallandas ülestõusu Hispaania võimu vastu.',
        },
        source: {
          sourceId: 'source:history:miguel-hidalgo-y-costilla',
          title: 'Miguel Hidalgo y Costilla — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Miguel_Hidalgo_y_Costilla',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable:built-in-history-set-084:1',
        factKey: 'fact:history:richard-iii-of-england:15s4yxq',
        tier: 1,
        subjectKey: 'history:richard-iii-of-england',
        clue: {
          en: 'The remains of which English king, killed at Bosworth Field, were found beneath a Leicester car park in 2012?',
          et: 'Millise Bosworthi lahingus langenud Inglise kuninga säilmed leiti 2012. aastal Leicesteri parkla alt?',
        },
        response: { en: 'Richard III', et: 'Richard III' },
        acceptedVariants: {
          en: ['King Richard III'],
          et: ['kuningas Richard III'],
        },
        explanation: {
          en: 'DNA and other evidence identified the skeleton as the king killed at Bosworth Field in 1485.',
          et: 'DNA ja muud tõendid kinnitasid, et luustik kuulus 1485. aastal Bosworthi lahingus langenud kuningale.',
        },
        source: {
          sourceId: 'source:history:richard-iii-of-england',
          title: 'Richard III of England — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Richard_III_of_England',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable:built-in-history-set-084:2',
        factKey: 'fact:history:heinrich-schliemann:tcjmg9',
        tier: 2,
        subjectKey: 'history:heinrich-schliemann',
        clue: {
          en: 'Which German archaeologist, whose first name was Heinrich, excavated Hisarlik, the site identified with ancient Troy?',
          et: 'Milline Saksa arheoloog eesnimega Heinrich kaevas Hisarlıkis, mida peetakse muistse Trooja asukohaks?',
        },
        response: { en: 'Heinrich Schliemann', et: 'Heinrich Schliemann' },
        acceptedVariants: { en: ['Schliemann'], et: ['Schliemann'] },
        explanation: {
          en: 'Schliemann’s excavations helped make the archaeological remains at Hisarlik famous.',
          et: 'Schliemanni väljakaevamised tegid Hisarlıki arheoloogilised jäänused kuulsaks.',
        },
        source: {
          sourceId: 'source:history:heinrich-schliemann',
          title: 'Heinrich Schliemann — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Heinrich_Schliemann',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable:built-in-history-set-089:3',
        factKey: 'fact:history:penny-black:vo37hd',
        tier: 3,
        subjectKey: 'history:penny-black',
        clue: {
          en: 'What was the name of the world’s first adhesive postage stamp, issued by Britain in 1840?',
          et: 'Mis nime kandis maailma esimene postmark, mille Suurbritannia andis välja 1840. aastal?',
        },
        response: { en: 'the Penny Black', et: 'Penny Black' },
        acceptedVariants: { en: ['Penny Black'], et: ['Penny Black', 'Black Penny'] },
        explanation: {
          en: 'Issued in 1840, the British stamp featured a profile of Queen Victoria and had a face value of one penny.',
          et: '1840. aastal välja antud Briti margil oli kuninganna Victoria profiil ja selle nimiväärtus oli üks penn.',
        },
        source: {
          sourceId: 'source:history:penny-black',
          title: 'Penny Black — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Penny_Black',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable:built-in-history-set-091:2',
        factKey: 'fact:history:polio-vaccine:1xtlhv5',
        tier: 2,
        subjectKey: 'history:polio-vaccine',
        clue: {
          en: 'Jonas Salk developed a landmark vaccine against which disease?',
          et: 'Millise haiguse vastu töötas Jonas Salk välja murrangulise vaktsiini?',
        },
        response: { en: 'polio', et: 'lastehalvatus' },
        acceptedVariants: { en: ['poliomyelitis'], et: ['poliomüeliit'] },
        explanation: {
          en: 'Salk’s inactivated-virus vaccine was the first effective polio vaccine, and its success was announced in 1955.',
          et: 'Salki inaktiveeritud viirusega vaktsiin oli esimene tõhus lastehalvatuse vaktsiin ning selle edust teatati 1955. aastal.',
        },
        source: {
          sourceId: 'source:history:polio-vaccine',
          title: 'Polio vaccine — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Polio_vaccine',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'playable:built-in-history-set-096:1',
        factKey: 'fact:history:maastricht-treaty:ah482v',
        tier: 1,
        subjectKey: 'history:maastricht-treaty',
        clue: {
          en: 'Which 1992 treaty created the European Union and laid the groundwork for the euro?',
          et: 'Milline 1992. aasta leping lõi Euroopa Liidu ja pani aluse eurole?',
        },
        response: { en: 'the Maastricht Treaty', et: 'Maastrichti leping' },
        acceptedVariants: {
          en: ['Treaty on European Union'],
          et: ['Euroopa Liidu leping'],
        },
        explanation: {
          en: 'The treaty entered into force in 1993, establishing the European Union and a path toward economic and monetary union.',
          et: 'Leping jõustus 1993. aastal, luues Euroopa Liidu ning tee majandus- ja rahaliiduni.',
        },
        source: {
          sourceId: 'source:history:maastricht-treaty',
          title: 'Maastricht Treaty — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Maastricht_Treaty',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-28',
        },
      },
    ]);
  });

  it('keeps all fifteen replacements collision-free across every enabled authority row', () => {
    const { corpus, replacements } = protectedReplacements();
    const counts = Object.fromEntries(['easy', 'medium-hard', 'adult', 'estonia'].map(
      (authority) => [authority, corpus.filter((row) => row.authority === authority).length],
    ));

    expect(counts).toEqual({ easy: 2_000, 'medium-hard': 4_000, adult: 500, estonia: 500 });
    expect(corpus).toHaveLength(7_000);
    expect(replacements).toHaveLength(15);
    expect(replacements.flatMap((candidate) =>
      findAuthorityCollisions(candidate, corpus).map((collision) =>
        `${candidate.id}:${collision}`))).toEqual([]);
  }, 10_000);

  it('keeps all fifteen response aliases out of every other clue and explanation', () => {
    const { corpus, replacements } = protectedReplacements();

    expect(replacements.flatMap((candidate) =>
      findAuthorityOneWayAliasLeaks(candidate, corpus).map((leak) =>
        `${candidate.id}:${leak}`))).toEqual([]);
  }, 10_000);
});

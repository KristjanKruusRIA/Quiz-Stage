import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { auditPlayability } from '../../../scripts/content/playability/audit';
import { PACKS_05_TO_08_CATEGORIES } from '../../../scripts/content/playability/banks/packs05to08';
import {
  completeEnabledAuthorityCorpus,
  findAuthorityCollisions,
  findAuthorityOneWayAliasLeaks,
} from './enabledAuthorityCollisionTestUtils';

const TARGET_SLOTS = new Set([
  'built-in-music-set-036:1',
  'built-in-music-set-036:4',
  'built-in-music-set-036:5',
  'built-in-music-set-044:2',
  'built-in-music-set-044:4',
  'built-in-music-set-046:2',
  'built-in-music-set-059:1',
  'built-in-music-set-059:2',
  'built-in-music-set-061:1',
  'built-in-music-set-080:2',
]);
const REPLACEMENT_IDS = [
  'built-in-music-set-036:tier-1',
  'built-in-music-set-036:tier-4',
  'built-in-music-set-036:tier-5',
  'built-in-music-set-044:tier-2',
  'built-in-music-set-044:tier-4',
  'built-in-music-set-046:tier-2',
  'built-in-music-set-059:tier-1',
  'built-in-music-set-059:tier-2',
  'built-in-music-set-061:tier-1',
  'built-in-music-set-080:tier-2',
];

const MUSIC_CATEGORIES = PACKS_05_TO_08_CATEGORIES.filter(
  ({ packId }) => packId === 'built-in-music',
);

function category(setNumber: string) {
  const found = MUSIC_CATEGORIES.find(
    ({ categorySetId }) => categorySetId.endsWith(`-set-${setNumber}`),
  );
  if (found === undefined) throw new Error(`Missing Music set ${setNumber}`);
  return found;
}

function question(setNumber: string, tier: 1 | 2 | 3 | 4 | 5) {
  const found = category(setNumber).questions.find((candidate) => candidate.tier === tier);
  if (found === undefined) throw new Error(`Missing Music question ${setNumber}:${tier}`);
  return found;
}

function protectedReplacements() {
  const corpus = completeEnabledAuthorityCorpus();
  const replacements = REPLACEMENT_IDS.map((id) => {
    const row = corpus.find((candidate) => candidate.id === id);
    if (row === undefined) throw new Error(`Missing protected replacement ${id}`);
    return row;
  });
  return { corpus, replacements };
}

describe('Music playable pack', () => {
  it('keeps the complete medium and hard pack free of playability diagnostics', () => {
    const questions = MUSIC_CATEGORIES.flatMap(({ questions: currentQuestions }) =>
      currentQuestions);
    const rows = MUSIC_CATEGORIES.flatMap((currentCategory) =>
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

    expect(MUSIC_CATEGORIES).toHaveLength(67);
    expect(questions).toHaveLength(335);
    expect(auditPlayability(rows).diagnostics).toEqual([]);
  });

  it('keeps every one of the other 325 Music rows byte-for-byte unchanged', () => {
    const unchangedRows = MUSIC_CATEGORIES.flatMap((currentCategory) =>
      currentCategory.questions.map((currentQuestion) => ({
        categorySetId: currentCategory.categorySetId,
        batchId: currentCategory.batchId,
        packId: currentCategory.packId,
        difficulty: currentCategory.difficulty,
        categoryName: currentCategory.name,
        question: currentQuestion,
      }))).filter(({ categorySetId, question: currentQuestion }) =>
      !TARGET_SLOTS.has(`${categorySetId}:${currentQuestion.tier}`));

    expect(unchangedRows).toHaveLength(325);
    expect(createHash('sha256').update(JSON.stringify(unchangedRows)).digest('hex'))
      .toBe('946c8d1b548d2d0f98c953f919d77e1df5411edde264dd305609bbca4b24fdd7');
  });

  it('locks the exact ten replacement payloads', () => {
    expect([
      question('036', 1),
      question('036', 4),
      question('036', 5),
      question('044', 2),
      question('044', 4),
      question('046', 2),
      question('059', 1),
      question('059', 2),
      question('061', 1),
      question('080', 2),
    ]).toEqual([
      {
        key: 'built-in-music-set-036:tier-1',
        factKey: 'album:wish-you-were-here-cover:cover-image',
        tier: 1,
        subjectKey: 'album:wish-you-were-here-cover',
        clue: {
          en: 'Which Pink Floyd album has a title-free cover showing two businessmen shaking hands while one of them is on fire?',
          et: 'Millise Pink Floydi albumi pealkirjata kaanel suruvad kätt kaks ärimeest, kellest üks põleb?',
        },
        response: { en: 'Wish You Were Here', et: 'Wish You Were Here' },
        acceptedVariants: { en: [], et: [] },
        explanation: {
          en: 'Hipgnosis used the burning handshake to evoke empty business dealings; the original LP was even shrink-wrapped without the band or album name.',
          et: 'Hipgnosis kasutas põlevat käepigistust tühjade äritehingute sümbolina; algne LP oli koguni pakitud musta kilesse ilma bändi või albumi nimeta.',
        },
        source: {
          sourceId: 'pinkfloyd:wish-you-were-here-album',
          title: 'Wish You Were Here | Pink Floyd Album',
          url: 'https://www.pinkfloyd.com/albums/wish-you-were-here/',
          license: 'All rights reserved',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'built-in-music-set-036:tier-4',
        factKey: 'album:screamadelica-cover:cover-image',
        tier: 4,
        subjectKey: 'album:screamadelica-cover',
        clue: {
          en: 'A splashed red-and-yellow sun face painted by Paul Cannell fills the title-free cover of which Primal Scream album?',
          et: 'Millise Primal Screami albumi pealkirjata kaant täidab Paul Cannelli maalitud pritsmeline puna-kollane päikesenägu?',
        },
        response: { en: 'Screamadelica', et: 'Screamadelica' },
        acceptedVariants: { en: [], et: [] },
        explanation: {
          en: 'Paul Cannell painted the brightly coloured, part-sunburst, part-psychedelic-face design that defined the album’s early-1990s imagery.',
          et: 'Paul Cannell maalis erksavärvilise, osalt päikesekiiri ja osalt psühhedeelset nägu meenutava kujunduse, mis määratles albumi 1990. aastate alguse visuaalse ilme.',
        },
        source: {
          sourceId: 'radiox:screamadelica-cover',
          title: 'Who designed the cover of Screamadelica by Primal Scream?',
          url: 'https://www.radiox.co.uk/artists/primal-scream/who-designed-the-cover-of-screamadelica/',
          license: 'All rights reserved',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'built-in-music-set-036:tier-5',
        factKey: 'album:in-the-court-crimson-cover:cover-image',
        tier: 5,
        subjectKey: 'album:in-the-court-crimson-cover',
        clue: {
          en: 'Which King Crimson debut has a title-free cover filled by Barry Godber’s painting of a terrified screaming face?',
          et: 'Millise King Crimsoni debüütalbumi pealkirjata kaant täidab Barry Godberi maalitud hirmunud karjuv nägu?',
        },
        response: {
          en: 'In the Court of the Crimson King',
          et: 'In the Court of the Crimson King',
        },
        acceptedVariants: {
          en: ['Court of the Crimson King'],
          et: ['Court of the Crimson King'],
        },
        explanation: {
          en: 'Godber, a computer programmer, used his own face in a mirror as the model; it was his only painting.',
          et: 'Arvutiprogrammeerija Godber kasutas modellina oma peegelpilti; see jäi tema ainsaks maaliks.',
        },
        source: {
          sourceId: 'wikipedia:in-the-court-of-the-crimson-king',
          title: 'In the Court of the Crimson King — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/In_the_Court_of_the_Crimson_King',
          license: 'CC BY-SA 4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'built-in-music-set-044:tier-2',
        factKey: 'song:mr-brightside-michigan:stadium-adoption',
        tier: 2,
        subjectKey: 'song:mr-brightside-michigan',
        clue: {
          en: 'At the break between the third and fourth quarters, Michigan football fans turn which Killers hit into a mass singalong?',
          et: 'Millise The Killersi hiti laulab Michigani ülikooli jalgpallipublik kolmanda ja neljanda veerandaja vahel üheskoos?',
        },
        response: { en: 'Mr. Brightside', et: 'Mr. Brightside' },
        acceptedVariants: { en: ['Mr Brightside'], et: ['Mr Brightside'] },
        explanation: {
          en: 'Michigan Stadium made the chorus a crowd tradition at the end of the third quarter.',
          et: 'Michigan Stadiumil sai refrääni ühislaulmisest kolmanda veerandaja lõpu tava.',
        },
        source: {
          sourceId: 'ap:college-football-songs-2025',
          title: 'How Garth Brooks, The Killers and Tom Petty became stars of college football Saturdays',
          url: 'https://apnews.com/article/806aa9a18d18b5d69566a21c46f8bdbf',
          license: 'All rights reserved',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'built-in-music-set-044:tier-4',
        factKey: 'song:kernkraft-400-stadium:stadium-adoption',
        tier: 4,
        subjectKey: 'song:kernkraft-400-stadium',
        clue: {
          en: 'Seattle Mariners fans chant the wordless hook of which Zombie Nation track during rallies?',
          et: 'Millise Zombie Nationi pala sõnadeta meloodiat skandeerivad Seattle Marinersi fännid siis, kui meeskond kogub hoogu?',
        },
        response: { en: 'Kernkraft 400', et: 'Kernkraft 400' },
        acceptedVariants: { en: [], et: [] },
        explanation: {
          en: 'The Mariners began playing it during rallies in 2000, and fans chant along to its hook.',
          et: 'Mariners hakkas seda 2000. aastal mängu pöördehetkedel mängima ning fännid skandeerivad meloodiale kaasa.',
        },
        source: {
          sourceId: 'espn:mariners-kernkraft-400',
          title: 'Stadium Songs: Seattle Mariners',
          url: 'https://www.espn.com/blog/music/post/_/id/2378/stadium-songs-seattle-mariners',
          license: 'All rights reserved',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'built-in-music-set-046:tier-2',
        factKey: 'song:candle-in-the-wind-1997:news-event',
        tier: 2,
        subjectKey: 'song:candle-in-the-wind-1997',
        clue: {
          en: 'After Princess Diana died, Bernie Taupin rewrote an earlier Marilyn Monroe tribute and Elton John performed it at her funeral. Which 1997 single?',
          et: 'Pärast printsess Diana surma kirjutas Bernie Taupin ümber varasema Marilyn Monroe mälestuslaulu ning Elton John esitas uue versiooni Diana matustel. Milline 1997. aasta singel see oli?',
        },
        response: { en: 'Candle in the Wind 1997', et: 'Candle in the Wind 1997' },
        acceptedVariants: {
          en: ['Candle in the Wind', 'Candle in the Wind ’97', 'Goodbye England’s Rose'],
          et: ['Candle in the Wind', 'Candle in the Wind ’97', 'Goodbye England’s Rose'],
        },
        explanation: {
          en: 'Bernie Taupin replaced the original Marilyn Monroe lyrics with words honouring Diana; Elton John performed the new version at her funeral and it became a worldwide hit.',
          et: 'Bernie Taupin asendas Marilyn Monroele pühendatud algteksti Diana mälestuseks kirjutatud sõnadega; Elton John esitas uue versiooni tema matustel ning sellest sai üleilmne hitt.',
        },
        source: {
          sourceId: 'wikipedia:candle-in-the-wind-1997',
          title: 'Candle in the Wind 1997 — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Candle_in_the_Wind_1997',
          license: 'CC BY-SA 4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'built-in-music-set-059:tier-1',
        factKey: 'song:satisfaction-sleep-riff:riff-origin',
        tier: 1,
        subjectKey: 'song:satisfaction-sleep-riff',
        clue: {
          en: 'Keith Richards captured a guitar riff on a cassette player; the tape then held forty minutes of his snoring. Which Rolling Stones hit grew from it?',
          et: 'Keith Richards salvestas kassettmakile kitarririfi; lindile jäi seejärel nelikümmend minutit tema norskamist. Milline Rolling Stonesi hitt sellest sündis?',
        },
        response: {
          en: '(I Can’t Get No) Satisfaction',
          et: '(I Can’t Get No) Satisfaction',
        },
        acceptedVariants: {
          en: [
            'Satisfaction',
            'I Can’t Get No Satisfaction',
            "(I Can't Get No) Satisfaction",
            "I Can't Get No Satisfaction",
          ],
          et: [
            'Satisfaction',
            'I Can’t Get No Satisfaction',
            "(I Can't Get No) Satisfaction",
            "I Can't Get No Satisfaction",
          ],
        },
        explanation: {
          en: 'The tape held about two minutes of acoustic guitar, then the sound of Richards dropping his pick and snoring for the next forty minutes.',
          et: 'Lindile jäi umbes kaks minutit akustilist kitarri, seejärel Richardsi plektri kukkumine ja tema järgmise neljakümne minuti norskamine.',
        },
        source: {
          sourceId: 'wikipedia:i-can-27t-get-no-satisfaction',
          title: '(I Can\'t Get No) Satisfaction — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/(I_Can%27t_Get_No)_Satisfaction',
          license: 'CC BY-SA 4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'built-in-music-set-059:tier-2',
        factKey: 'song:sweet-home-alabama-ed-king-riff:riff-origin',
        tier: 2,
        subjectKey: 'song:sweet-home-alabama-ed-king-riff',
        clue: {
          en: 'Ed King wrote the signature opening riff for which Lynyrd Skynyrd answer to Neil Young’s “Southern Man” and “Alabama”?',
          et: 'Millise Lynyrd Skynyrdi vastuslaulu Neil Youngi lugudele „Southern Man“ ja „Alabama“ avab Ed Kingi tunnusriff?',
        },
        response: { en: 'Sweet Home Alabama', et: 'Sweet Home Alabama' },
        acceptedVariants: { en: [], et: [] },
        explanation: {
          en: 'Ed King wrote and played the signature riff; the band wrote “Sweet Home Alabama” in response to Neil Young’s criticism of the American South.',
          et: 'Ed King kirjutas ja mängis tunnusrifi; ansambel lõi loo „Sweet Home Alabama“ vastuseks Neil Youngi kriitikale USA lõunaosariikide aadressil.',
        },
        source: {
          sourceId: 'wikipedia:sweet-home-alabama',
          title: 'Sweet Home Alabama — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Sweet_Home_Alabama',
          license: 'CC BY-SA 4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'built-in-music-set-061:tier-1',
        factKey: 'song:hollaback-girl-drum-machine:percussion-moment',
        tier: 1,
        subjectKey: 'song:hollaback-girl-drum-machine',
        clue: {
          en: 'A sparse drum-machine stomp and a cheerleader-style chant drive which 2005 Gwen Stefani hit?',
          et: 'Millist Gwen Stefani 2005. aasta hitti kannavad napp trummimasinabiit ja ergutushüüdu meenutav skandeering?',
        },
        response: { en: 'Hollaback Girl', et: 'Hollaback Girl' },
        acceptedVariants: { en: [], et: [] },
        explanation: {
          en: 'The Neptunes produced “Hollaback Girl” around a minimal programmed beat, while its cheerleading motif shapes the song’s shouted hook.',
          et: 'The Neptunes ehitas loo „Hollaback Girl“ minimalistlikule programmeeritud biidile, millele annab äratuntava kuju ergutushüüu motiiv.',
        },
        source: {
          sourceId: 'wikipedia:hollaback-girl',
          title: 'Hollaback Girl — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Hollaback_Girl',
          license: 'CC BY-SA 4.0',
          retrievedAt: '2026-08-28',
        },
      },
      {
        key: 'built-in-music-set-080:tier-2',
        factKey: 'work:beethoven-eroica-dedication:classical-creation-story',
        tier: 2,
        subjectKey: 'work:beethoven-eroica-dedication',
        clue: {
          en: 'Beethoven initially dedicated his Third Symphony to Napoleon, then withdrew the dedication after Napoleon declared himself emperor. By what name is the work known?',
          et: 'Beethoven pühendas oma kolmanda sümfoonia algul Napoleonile, kuid võttis pühenduse tagasi, kui Napoleon kuulutas end keisriks. Millise nime all seda sümfooniat tuntakse?',
        },
        response: { en: 'the Eroica Symphony', et: 'Eroica' },
        acceptedVariants: {
          en: ['Eroica', 'Eroica Symphony', 'Sinfonia eroica'],
          et: ['Eroica sümfoonia', 'Sinfonia eroica'],
        },
        explanation: {
          en: 'Beethoven’s manuscript shows Napoleon’s name erased from the title page; the published work was titled “Sinfonia eroica”.',
          et: 'Beethoveni käsikirja tiitellehel on Napoleoni nimi maha kraabitud; trükis ilmus teos pealkirjaga „Sinfonia eroica“.',
        },
        source: {
          sourceId: 'wikipedia:symphony-no-3-beethoven',
          title: 'Symphony No. 3 (Beethoven) — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Symphony_No._3_(Beethoven)',
          license: 'CC BY-SA 4.0',
          retrievedAt: '2026-08-28',
        },
      },
    ]);
  });

  it('keeps all ten replacements collision-free across every enabled authority row', () => {
    const { corpus, replacements } = protectedReplacements();
    const counts = Object.fromEntries(['easy', 'medium-hard', 'adult', 'estonia'].map(
      (authority) => [authority, corpus.filter((row) => row.authority === authority).length],
    ));

    expect(counts).toEqual({ easy: 2_000, 'medium-hard': 4_000, adult: 500, estonia: 500 });
    expect(corpus).toHaveLength(7_000);
    expect(replacements.map(({ id }) => id)).toEqual(REPLACEMENT_IDS);
    expect(replacements.flatMap((candidate) =>
      findAuthorityCollisions(candidate, corpus).map((collision) =>
        `${candidate.id}:${collision}`))).toEqual([]);
  }, 10_000);

  it('keeps all ten response aliases out of every other clue and explanation', () => {
    const { corpus, replacements } = protectedReplacements();

    expect(replacements.flatMap((candidate) =>
      findAuthorityOneWayAliasLeaks(candidate, corpus).map((leak) =>
        `${candidate.id}:${leak}`))).toEqual([]);
  }, 10_000);
});

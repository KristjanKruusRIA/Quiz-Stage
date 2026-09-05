import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { buildAccessibleCorpus } from '../../../scripts/content/accessibility/bank';
import { auditPlayability } from '../../../scripts/content/playability/audit';
import { LITERATURE_LANGUAGE_CATEGORIES } from '../../../scripts/content/playability/banks/packs01to04/literatureLanguage';
import {
  completeEnabledAuthorityCorpus,
  findAuthorityCollisions,
} from './enabledAuthorityCollisionTestUtils';

const TARGET_SLOTS = new Set([
  'built-in-literature-language-set-033:1',
  'built-in-literature-language-set-050:1',
  'built-in-literature-language-set-050:5',
  'built-in-literature-language-set-058:4',
  'built-in-literature-language-set-061:1',
  'built-in-literature-language-set-061:2',
  'built-in-literature-language-set-083:1',
]);

function category(setNumber: string) {
  const found = LITERATURE_LANGUAGE_CATEGORIES.find(
    ({ categorySetId }) => categorySetId.endsWith(`-set-${setNumber}`),
  );
  if (found === undefined) throw new Error(`Missing Literature & Language set ${setNumber}`);
  return found;
}

function question(setNumber: string, tier: 1 | 2 | 3 | 4 | 5) {
  const found = category(setNumber).questions.find((candidate) => candidate.tier === tier);
  if (found === undefined) {
    throw new Error(`Missing Literature & Language question ${setNumber}:${tier}`);
  }
  return found;
}

function easyQuestion(
  categorySetId: string,
  tier: 1 | 2 | 3 | 4 | 5,
) {
  const found = buildAccessibleCorpus()
    .find((candidate) => candidate.categorySetId === categorySetId)
    ?.questions.find((candidate) => candidate.tier === tier);
  if (found === undefined) throw new Error(`Missing Easy question ${categorySetId}:${tier}`);
  return found;
}

describe('Literature & Language playable pack', () => {
  it('keeps the complete medium and hard pack free of playability diagnostics', () => {
    const categories = LITERATURE_LANGUAGE_CATEGORIES;
    const questions = categories.flatMap(({ questions }) => questions);
    const rows = categories.flatMap((currentCategory) =>
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

    expect(categories).toHaveLength(66);
    expect(questions).toHaveLength(330);
    expect(auditPlayability(rows).diagnostics).toEqual([]);
  });

  it('keeps all seven authoritative Easy rows byte-for-byte unchanged', () => {
    expect([
      easyQuestion('built-in-literature-language-set-005', 3),
      easyQuestion('built-in-history-set-024', 3),
      easyQuestion('built-in-history-set-024', 5),
      easyQuestion('built-in-literature-language-set-003', 2),
      easyQuestion('built-in-literature-language-set-004', 4),
      easyQuestion('built-in-literature-language-set-004', 3),
      easyQuestion('built-in-literature-language-set-022', 5),
    ]).toEqual([
      {
        key: 'retained-easy-04:built-in-literature-language-set-005:life-of-pi-tiger-lifeboat',
        tier: 3,
        subjectKey: 'retained-easy-04:work:life-of-pi',
        clue: {
          en: 'Which novel strands a boy in a lifeboat with a Bengal tiger named Richard Parker?',
          et: 'Millises romaanis jääb poiss päästepaati koos Bengali tiigriga, kelle nimi on Richard Parker?',
        },
        response: { en: 'Life of Pi', et: '„Pii elu”' },
        acceptedVariants: { en: ['The Life of Pi'], et: ['Life of Pi', 'Pii elu'] },
        explanation: {
          en: 'Life of Pi recounts Pi Patel’s survival at sea with Richard Parker.',
          et: '„Pii elu” jutustab Pi Pateli ellujäämisest merel koos Richard Parkeriga.',
        },
        source: {
          sourceId: 'retained-easy-04:source:life_of_pi',
          title: 'Life of Pi',
          url: 'https://en.wikipedia.org/wiki/Life_of_Pi',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-31',
        },
      },
      {
        key: 'retained-easy-01-04:fact:h024-boycott',
        tier: 3,
        subjectKey: 'retained-easy-01-04:subject:h024-boycott',
        clue: {
          en: 'Which word for deliberately refusing to buy something originated with an ostracised Irish land agent?',
          et: 'Milline teadliku ostmisest keeldumise sõna sai alguse Iirimaal tõrjutud maavalitseja loost?',
        },
        response: { en: 'A boycott', et: 'Boikott' },
        acceptedVariants: { en: ['Boycotting'], et: ['Boikoteerimine'] },
        explanation: {
          en: 'Charles Boycott’s name became a verb and noun after his community organised a campaign of social and economic isolation against him.',
          et: 'Charles Boycotti nimest sai tegusõna ja nimisõna pärast seda, kui kogukond korraldas tema vastu sotsiaalse ja majandusliku tõrjumise kampaania.',
        },
        source: {
          sourceId: 'retained-easy-01-04:source:h024-boycott',
          title: 'Boycott — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/Boycott',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-31',
        },
      },
      {
        key: 'retained-easy-01-04:fact:h024-earl-of-cardigan',
        tier: 5,
        subjectKey: 'retained-easy-01-04:subject:h024-earl-of-cardigan',
        clue: {
          en: 'Which Crimean War commander gave his title to a buttoned knitted garment?',
          et: 'Milline Krimmi sõja väejuht andis oma tiitli nööbitavale kootud rõivaesemele?',
        },
        response: { en: 'The Earl of Cardigan', et: 'Cardigani krahv' },
        acceptedVariants: {
          en: ['James Brudenell', 'Seventh Earl of Cardigan'],
          et: ['James Brudenell', 'Cardigani seitsmes krahv'],
        },
        explanation: {
          en: 'The cardigan was named after James Brudenell, the seventh Earl of Cardigan.',
          et: 'Kardigan sai nime Cardigani seitsmenda krahvi James Brudenelli järgi.',
        },
        source: {
          sourceId: 'retained-easy-01-04:source:h024-earl-of-cardigan',
          title: 'James Brudenell, 7th Earl of Cardigan — Wikipedia',
          url: 'https://en.wikipedia.org/wiki/James_Brudenell,_7th_Earl_of_Cardigan',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-31',
        },
      },
      {
        key: 'retained-easy-04:built-in-literature-language-set-003:moominvalley-moomin-home',
        tier: 2,
        subjectKey: 'retained-easy-04:place:moominvalley',
        clue: {
          en: 'Which peaceful valley is home to the Moomin family and their friends?',
          et: 'Milline rahulik org on muumipere ja nende sõprade kodu?',
        },
        response: { en: 'Moominvalley', et: 'Muumiorg' },
        acceptedVariants: {
          en: ['Moomin Valley'],
          et: ['Muumide org', 'Moominvalley'],
        },
        explanation: {
          en: 'Moominvalley is the central home setting of Tove Jansson’s Moomin stories.',
          et: 'Muumiorg on Tove Janssoni muumilugude keskne kodupaik.',
        },
        source: {
          sourceId: 'retained-easy-04:source:moominvalley',
          title: 'Moominvalley',
          url: 'https://en.wikipedia.org/wiki/Moominvalley',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-31',
        },
      },
      {
        key: 'retained-easy-04:built-in-literature-language-set-004:anagram-rearranged-letters',
        tier: 4,
        subjectKey: 'retained-easy-04:language:anagram',
        clue: {
          en: 'What word puzzle rearranges all the letters of one expression to make another?',
          et: 'Milline sõnamõistatus paigutab ühe väljendi kõik tähed ümber, et saada teine väljend?',
        },
        response: { en: 'Anagram', et: 'anagramm' },
        acceptedVariants: { en: ['letter rearrangement'], et: ['tähepaigutus'] },
        explanation: {
          en: 'An anagram uses the same letters in a different order to form a new word or phrase.',
          et: 'Anagramm kasutab samu tähti teises järjekorras, et moodustada uus sõna või fraas.',
        },
        source: {
          sourceId: 'retained-easy-04:source:anagram',
          title: 'Anagram',
          url: 'https://en.wikipedia.org/wiki/Anagram',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-31',
        },
      },
      {
        key: 'retained-easy-04:built-in-literature-language-set-004:homophone-same-sound',
        tier: 3,
        subjectKey: 'retained-easy-04:language:homophone',
        clue: {
          en: 'What do we call words such as “sea” and “see” that sound alike but differ in meaning?',
          et: 'Kuidas nimetatakse sõnu, mis kõlavad ühtemoodi, kuid mille tähendus on erinev?',
        },
        response: { en: 'Homophones', et: 'homofonid' },
        acceptedVariants: { en: ['homophone'], et: ['homofon'] },
        explanation: {
          en: 'Homophones share a pronunciation even though their meanings or spellings differ.',
          et: 'Homofonid häälduvad ühtemoodi, kuigi nende tähendus või kirjapilt on erinev.',
        },
        source: {
          sourceId: 'retained-easy-04:source:homophone',
          title: 'Homophone',
          url: 'https://en.wikipedia.org/wiki/Homophone',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-31',
        },
      },
      {
        key: 'retained-easy-04:built-in-literature-language-set-022:catch-22-no-win-rule',
        tier: 5,
        subjectKey: 'retained-easy-04:expression:catch-22',
        clue: {
          en: 'What expression describes a no-win situation where the rule for solving a problem prevents the solution?',
          et: 'Milline väljend kirjeldab väljapääsmatut olukorda, kus probleemi lahendamise reegel ise takistab lahendust?',
        },
        response: { en: 'Catch-22', et: 'Catch-22' },
        acceptedVariants: {
          en: ['catch twenty-two', 'no-win situation'],
          et: ['nokk-kinni-saba-lahti-olukord', 'väljapääsmatu olukord', 'surnud ring'],
        },
        explanation: {
          en: 'Catch-22 names a circular rule that makes escape from a problem impossible.',
          et: 'Catch-22 tähistab ringreeglit, mis muudab probleemist pääsemise võimatuks.',
        },
        source: {
          sourceId: 'retained-easy-04:source:catch-22_(logic)',
          title: 'Catch-22',
          url: 'https://en.wikipedia.org/wiki/Catch-22_(logic)',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-31',
        },
      },
    ]);
  });

  it('replaces exactly the seven duplicate medium and hard slots', () => {
    expect([
      question('033', 1),
      question('050', 1),
      question('050', 5),
      question('058', 4),
      question('061', 1),
      question('061', 2),
      question('083', 1),
    ]).toEqual([
      {
        key: 'playable-literature-language:built-in-literature-language-set-033:tempest-prospero-island',
        factKey: 'literature-language:tempest-prospero-shipwrecked-nobles-island',
        tier: 1,
        subjectKey: 'work:the-tempest',
        clue: {
          en: 'Which Shakespeare play strands shipwrecked nobles on the island where the exiled magician Prospero lives with Miranda and Ariel?',
          et: 'Millises Shakespeare’i näidendis satuvad merehädalised aadlikud saarele, kus pagendatud võlur Prospero elab koos Miranda ja Arieliga?',
        },
        response: { en: 'The Tempest', et: '„Torm“' },
        acceptedVariants: { en: ['Tempest', 'Torm'], et: ['The Tempest', 'Tempest'] },
        explanation: {
          en: 'Prospero uses the storm and the island’s magic to confront the nobles who exiled him and arrange Miranda’s future.',
          et: 'Prospero kasutab tormi ja saare maagiat, et astuda vastu teda pagendanud aadlikele ning korraldada Miranda tulevikku.',
        },
        source: {
          sourceId: 'wikipedia:tempest-prospero-island',
          title: 'The Tempest',
          url: 'https://en.wikipedia.org/wiki/The_Tempest',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-30',
        },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-050:nicotine-jean-nicot',
        factKey: 'literature-language:nicotine-named-through-tobacco-for-jean-nicot',
        tier: 1,
        subjectKey: 'word:nicotine',
        clue: {
          en: 'Which tobacco alkaloid ultimately takes its name from Jean Nicot, the French diplomat who sent tobacco and seeds to Paris?',
          et: 'Millise tubaka alkaloidi nimi pärineb tubakataime nimetuse kaudu Prantsuse diplomaadilt Jean Nicot, kes saatis tubakat ja seemneid Pariisi?',
        },
        response: { en: 'nicotine', et: 'nikotiin' },
        acceptedVariants: {
          en: ['nicotin', 'nikotiin'],
          et: ['nicotine'],
        },
        explanation: {
          en: 'Nicotine is named through the tobacco plant Nicotiana, which honours Jean Nicot after he sent tobacco and seeds to Paris in 1560.',
          et: 'Nikotiin sai nime tubakataime Nicotiana kaudu; taim nimetati Jean Nicot’ auks pärast seda, kui ta saatis 1560. aastal Pariisi tubakat ja seemneid.',
        },
        source: {
          sourceId: 'wikipedia:nicotine-jean-nicot',
          title: 'Nicotine',
          url: 'https://en.wikipedia.org/wiki/Nicotine',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-30',
        },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-050:shrapnel-henry-artillery',
        factKey: 'literature-language:shrapnel-word-named-for-henry-artillery-shell',
        tier: 5,
        subjectKey: 'word:shrapnel',
        clue: {
          en: 'Which word for fragments scattered by an exploding shell comes from a British artillery officer named Henry, who developed bursting ammunition?',
          et: 'Milline plahvatustes laiali paiskuvaid kilde tähistav sõna pärineb Briti suurtükiväeohvitserilt Henrylt, kes arendas kuule laiali paiskavat lõhkemürsku?',
        },
        response: { en: 'shrapnel', et: 'šrapnellikillud' },
        acceptedVariants: {
          en: ['shrapnel fragments', 'shrapnel shell fragments'],
          et: ['šrapnellikild', 'šrapnelli killud', 'shrapnel', 'shrapnel fragments'],
        },
        explanation: {
          en: 'Henry Shrapnel developed a bursting shell that released shot; his surname later became the English word for fragments scattered by explosions.',
          et: 'Henry Shrapnel arendas kuule laiali paiskava lõhkemürsu; tema perekonnanimest kujunes hiljem ingliskeelne plahvatuskildude nimetus shrapnel.',
        },
        source: {
          sourceId: 'wikipedia:henry-shrapnel-eponym',
          title: 'Henry Shrapnel',
          url: 'https://en.wikipedia.org/wiki/Henry_Shrapnel',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-30',
        },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-058:fortress-solitude-superman',
        factKey: 'literature-language:fortress-of-solitude-superman-arctic-retreat',
        tier: 4,
        subjectKey: 'place:fortress-of-solitude',
        clue: {
          en: 'What Arctic stronghold serves as Superman’s private headquarters and place of retreat?',
          et: 'Milline arktiline tugipunkt on Supermani erapeakorter ja pelgupaik?',
        },
        response: { en: 'the Fortress of Solitude', et: 'Üksinduse kindlus' },
        acceptedVariants: {
          en: ['Fortress of Solitude', 'Üksinduse kindlus'],
          et: ['Fortress of Solitude', 'the Fortress of Solitude'],
        },
        explanation: {
          en: 'The Fortress of Solitude is Superman’s secluded headquarters, traditionally located in the Arctic.',
          et: 'Üksinduse kindlus on Supermani eraldatud peakorter, mis asub traditsiooniliselt Arktikas.',
        },
        source: {
          sourceId: 'wikipedia:fortress-of-solitude-superman',
          title: 'Fortress of Solitude',
          url: 'https://en.wikipedia.org/wiki/Fortress_of_Solitude',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-30',
        },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-061:onomatopoeia-sound-imitation',
        factKey: 'literature-language:onomatopoeia-word-imitates-sound',
        tier: 1,
        subjectKey: 'device:onomatopoeia',
        clue: {
          en: 'Which language device uses words such as ‘buzz’ or ‘hiss’ to imitate the sounds they describe?',
          et: 'Milline keeleline võte kasutab sõnu nagu „mjäu“ või „plärts“, et jäljendada helisid, mida need kirjeldavad?',
        },
        response: { en: 'onomatopoeia', et: 'onomatopöa' },
        acceptedVariants: {
          en: ['onomatopoeic word', 'onomatopöa'],
          et: ['helijäljendus', 'onomatopoeia'],
        },
        explanation: {
          en: 'Onomatopoeia imitates or suggests a sound through the form of a word, as “buzz” evokes an insect’s hum.',
          et: 'Onomatopöa jäljendab või meenutab sõna kuju kaudu heli, näiteks mjäu kassi häälitsust.',
        },
        source: {
          sourceId: 'wikipedia:onomatopoeia-sound-imitation',
          title: 'Onomatopoeia',
          url: 'https://en.wikipedia.org/wiki/Onomatopoeia',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-30',
        },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-061:pangram-every-letter',
        factKey: 'literature-language:pangram-uses-every-alphabet-letter',
        tier: 2,
        subjectKey: 'device:pangram',
        clue: {
          en: 'What term names a sentence that uses every letter of an alphabet, like “The quick brown fox jumps over the lazy dog”?',
          et: 'Kuidas nimetatakse lauset, milles kasutatakse tähestiku iga tähte, näiteks inglise „The quick brown fox jumps over the lazy dog“?',
        },
        response: { en: 'a pangram', et: 'pangramm' },
        acceptedVariants: {
          en: ['pangram', 'pangram sentence'],
          et: ['pangram'],
        },
        explanation: {
          en: 'A pangram contains every letter in its alphabet at least once; the fox-and-dog sentence is a famous English example.',
          et: 'Pangramm sisaldab tähestiku iga tähte vähemalt korra; rebase ja koera lause on kuulus ingliskeelne näide.',
        },
        source: {
          sourceId: 'wikipedia:pangram-every-letter',
          title: 'Pangram',
          url: 'https://en.wikipedia.org/wiki/Pangram',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-30',
        },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-083:quixotic-don-quixote',
        factKey: 'literature-language:quixotic-impractical-idealism-from-don-quixote',
        tier: 1,
        subjectKey: 'word:quixotic',
        clue: {
          en: 'Which adjective for impractically idealistic behaviour comes from the hero of Cervantes’s Don Quixote?',
          et: 'Milline ebapraktiliselt idealistlikku käitumist tähistav omadussõna pärineb Cervantese Don Quijote nimest?',
        },
        response: { en: 'quixotic', et: 'donkihhotlik' },
        acceptedVariants: { en: ['quixotical', 'donkihhotlik'], et: ['quixotic'] },
        explanation: {
          en: 'The adjective derives from Don Quixote and describes noble but impractical idealism.',
          et: 'Omadussõna pärineb Don Quijote nimest ning kirjeldab õilsat, kuid ebapraktilist idealismi.',
        },
        source: {
          sourceId: 'wikipedia:quixotism-adjective',
          title: 'Quixotism',
          url: 'https://en.wikipedia.org/wiki/Quixotism',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-08-30',
        },
      },
    ]);
  });

  it('keeps every one of the other 323 Literature rows byte-for-byte unchanged', () => {
    const unchangedRows = LITERATURE_LANGUAGE_CATEGORIES.flatMap((currentCategory) =>
      currentCategory.questions.map((currentQuestion) => ({
        categorySetId: currentCategory.categorySetId,
        batchId: currentCategory.batchId,
        packId: currentCategory.packId,
        difficulty: currentCategory.difficulty,
        categoryName: currentCategory.name,
        question: currentQuestion,
      }))).filter(({ categorySetId, question: currentQuestion }) =>
      !TARGET_SLOTS.has(`${categorySetId}:${currentQuestion.tier}`));

    expect(unchangedRows).toHaveLength(323);
    expect(createHash('sha256').update(JSON.stringify(unchangedRows)).digest('hex'))
      .toBe('281744284cd301fbda98f5a32a4b607d78b613a8dd942803a2af0cf54882e281');
  });

  it('keeps all seven replacements collision-free across every enabled authority row', () => {
    const corpus = completeEnabledAuthorityCorpus();
    const counts = Object.fromEntries(['easy', 'medium-hard', 'adult', 'estonia'].map(
      (authority) => [authority, corpus.filter((row) => row.authority === authority).length],
    ));
    const replacementIds = [
      'playable-literature-language:built-in-literature-language-set-033:tempest-prospero-island',
      'playable-literature-language:built-in-literature-language-set-050:nicotine-jean-nicot',
      'playable-literature-language:built-in-literature-language-set-050:shrapnel-henry-artillery',
      'playable-literature-language:built-in-literature-language-set-058:fortress-solitude-superman',
      'playable-literature-language:built-in-literature-language-set-061:onomatopoeia-sound-imitation',
      'playable-literature-language:built-in-literature-language-set-061:pangram-every-letter',
      'playable-literature-language:built-in-literature-language-set-083:quixotic-don-quixote',
    ];
    const replacements = replacementIds.map((id) => {
      const row = corpus.find((candidate) => candidate.id === id);
      if (row === undefined) throw new Error(`Missing protected replacement ${id}`);
      return row;
    });

    expect(counts).toEqual({ easy: 2_000, 'medium-hard': 4_000, adult: 500, estonia: 500 });
    expect(corpus).toHaveLength(7_000);
    expect(replacements.flatMap((candidate) =>
      findAuthorityCollisions(candidate, corpus).map((collision) =>
        `${candidate.id}:${collision}`))).toEqual([]);
  });
});

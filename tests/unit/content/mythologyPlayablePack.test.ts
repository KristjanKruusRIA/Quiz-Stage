import { describe, expect, it } from 'vitest';
import { auditPlayability } from '../../../scripts/content/playability/audit';
import { PACKS_09_TO_12_CATEGORIES } from '../../../scripts/content/playability/banks/packs09to12';

const MYTHOLOGY_PACK_ID = 'built-in-mythology-religion-philosophy';
const MYTHOLOGY_CATEGORIES = PACKS_09_TO_12_CATEGORIES.filter(
  ({ packId }) => packId === MYTHOLOGY_PACK_ID,
);

function category(setNumber: string) {
  const found = MYTHOLOGY_CATEGORIES.find(
    ({ categorySetId }) => categorySetId.endsWith(`-set-${setNumber}`),
  );
  if (found === undefined) throw new Error(`Missing Mythology set ${setNumber}`);
  return found;
}

function question(setNumber: string, tier: 1 | 2 | 3 | 4 | 5) {
  const found = category(setNumber).questions[tier - 1];
  if (found === undefined) throw new Error(`Missing Mythology question ${setNumber}:${tier}`);
  return found;
}

describe('Mythology, Religion & Philosophy playable pack', () => {
  it('keeps the complete pack free of playability diagnostics', () => {
    const categories = MYTHOLOGY_CATEGORIES;
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

  it('keeps the independently reviewed closure wording and difficulty order', () => {
    expect(category('040').name).toEqual({
      en: 'Faith and Symbols on National Flags',
      et: 'Usk ja sümbolid riigilippudel',
    });
    expect(question('041', 1).clue.et).toBe(
      'Millise hindu kevadpüha ajal loobivad rahvahulgad kuulsalt üksteise pihta erksavärvilist pulbrit ja vett?',
    );
    expect(question('046', 4).clue.et).toBe(
      'Nimeta budistlik suutra, mille 868. aasta eksemplar on üks varasemaid dateeritud puulõiketehnikas trükitud raamatuid ning mis leiti Mogao koobastiku raamatukogust.',
    );
    expect(category('050').name).toEqual({
      en: 'Saints, Symbols and Patronage',
      et: 'Pühakud, sümbolid ja eestkoste',
    });
    expect(question('052', 4).clue.et).toBe(
      'Kuidas nimetatakse mütoloogilist otsust, milles Trooja prints annab kuldõuna ühele kolmest jumalannast ja aitab sellega Trooja sõja vallandada?',
    );
    expect(question('061', 3).clue.et).toBe(
      'Milline Normandia pühapaik on loodetesaar, millel asub klooster?',
    );
    expect(question('063', 1).clue.et).toBe(
      'Millist kehastust kujutatakse tavaliselt kapuutsiga luukerena, kes kannab vikatit?',
    );
    expect(question('064', 1).clue.et).toBe(
      'Milline tuttav ese on peenike käes hoitav pulk, mida lugudes kasutavad võlurid, haldjad ja maagid?',
    );
    expect(question('065', 1).clue.en).toBe(
      'Which public figure founded the Missionaries of Charity in Kolkata, a congregation whose members became known for white saris with blue borders?',
    );
    expect(question('065', 3).explanation.en).toBe(
      'Pope John Paul II was Polish, travelled widely as pope and opposed communism.',
    );
    expect(question('065', 5).clue.et).toBe(
      'Milline Austraaliast pärit evangelist ja motivatsioonikõneleja sündis ilma käte ja jalgadeta?',
    );
    expect(question('066', 3).explanation.et).toBe(
      'Käejoonte lugemine uurib käejooni ning käsitab neid iseloomu ja tuleviku märkidena.',
    );
    expect(question('066', 5).clue.et).toBe(
      'Milline meetod kasutab tassi jäänud teepaksust moodustunud kujundeid?',
    );

    expect(question('084', 3)).toMatchObject({
      key: 'built-in-mythology-religion-philosophy-set-084:question:3',
      tier: 3,
      factKey: 'mythology-hard:084:4:odyssey-peloponnesian-kassandra-alexios',
      subjectKey: 'game:assassins-creed-odyssey',
      response: { en: "Assassin's Creed Odyssey", et: "Assassin's Creed Odyssey" },
      source: { url: 'https://en.wikipedia.org/wiki/Assassin%27s_Creed_Odyssey' },
    });
    expect(question('084', 4)).toMatchObject({
      key: 'built-in-mythology-religion-philosophy-set-084:question:4',
      tier: 4,
      factKey: 'mythology-hard:084:3:age-of-mythology-three-pantheons',
      subjectKey: 'game:age-of-mythology',
      response: { en: 'Age of Mythology', et: 'Age of Mythology' },
      source: { url: 'https://en.wikipedia.org/wiki/Age_of_Mythology' },
    });

    expect(question('093', 1).clue.et).toBe(
      'Milline Madonna 1989. aasta singel kasutab gospelkoori ning mille videos näeb kirikut ja katoliiklikku sümboolikat?',
    );
    expect(question('093', 1).explanation).toEqual({
      en: '“Like a Prayer” features gospel vocals; its video includes a church and shows Madonna with stigmata-like wounds.',
      et: '„Like a Prayeris“ kõlab gospelkoor; videos näeb kirikut ja Madonnal stigmasid meenutavaid haavu.',
    });
    expect(question('094', 4).clue).toEqual({
      en: 'Which Afro-Brazilian martial art and game combines dance and music inside a ceremonial roda?',
      et: 'Milline afrobrasiilia võitluskunst ja mäng ühendab tantsu ning muusika tseremoniaalses rodas?',
    });
    expect(question('096', 2).clue).toEqual({
      en: 'What name is given to the series of events in which the Roman Inquisition condemned heliocentrism and later put a famous astronomer under house arrest?',
      et: 'Kuidas nimetatakse sündmuste jada, milles Rooma inkvisitsioon mõistis hukka heliotsentrismi ning kuulus astronoom pandi hiljem koduaresti?',
    });
    expect(question('096', 2).explanation.et).toBe(
      'Galilei protsess hõlmab inkvisitsiooni tegevust Galilei vastu, kuna ta kaitses heliotsentrismi.',
    );
    expect(question('096', 4).clue.et).toBe(
      'Milline vaidlus kasvas Salman Rushdie 1988. aasta romaanist tsensuuri ja vägivalla teemaliseks poleemikaks ning tõi 1989. aastal kaasa Khomeini fatvaa?',
    );
    expect(question('097', 2)).toMatchObject({
      response: { en: 'Michael', et: 'Miikael' },
      acceptedVariants: { en: ['Miikael'], et: ['Michael'] },
      explanation: {
        et: 'Miikael pärineb heebrea retoorilisest küsimusest ning esineb Taanieli raamatus peaingli nimena.',
      },
    });
    expect(question('098', 1).explanation).toEqual({
      en: 'In Indian traditions, a guru is a teacher or spiritual guide; in wider use, the word also means an expert.',
      et: 'India traditsioonides on guru õpetaja või vaimne teejuht; laiemas kasutuses tähendab sõna ka eksperti.',
    });
    expect(question('098', 2).clue.et).toBe(
      'Milline laensõna tähistab ühiskondlikul taval põhinevat keeldu ning pärineb polüneesia sõnast tapu, mille James Cook Tongal üles märkis?',
    );
    expect(question('098', 3).clue).toEqual({
      en: 'What term for someone who provides early capital to startups was first used for wealthy Broadway theatre backers?',
      et: 'Milline termin tähistab idufirma varajast rahastajat ja oli algselt kasutusel jõukate Broadway teatritoetajate kohta?',
    });
    expect(question('100', 1).explanation.en).toBe(
      'Dawkins introduced “meme” for a unit of cultural transmission that spreads through imitation.',
    );

    expect(question('039', 1).clue).toEqual({
      en: 'Which gold-covered biblical chest, said to have held the tablets of the Ten Commandments, is sought in Raiders of the Lost Ark?',
      et: 'Millist kullatud piibellikku laegast, kus hoiti kümne käsu kivitahvleid, jahitakse filmis „Kadunud laeka jälil”?',
    });
    expect(question('057', 4).clue).toEqual({
      en: 'Which legendary knot did Alexander the Great supposedly sever with one stroke of his sword?',
      et: 'Millise legendaarse sõlme raius Aleksander Suur pärimuse järgi ühe mõõgalöögiga läbi?',
    });
    expect(question('063', 4)).toMatchObject({
      factKey: 'fortuna:roman-goddess-wheel-changing-fortune',
      subjectKey: 'deity:fortuna',
      clue: {
        en: "Which Roman goddess of fortune is commonly shown with a wheel symbolizing life's changing fortunes?",
        et: 'Millist Rooma õnne- ja saatusejumalannat kujutatakse sageli rattaga, mis sümboliseerib elu muutlikku õnne?',
      },
      response: { en: 'Fortuna', et: 'Fortuna' },
      acceptedVariants: { en: [], et: [] },
      explanation: {
        en: "Fortuna is the Roman goddess of luck and fortune; her wheel symbolizes life's changing fortunes.",
        et: 'Fortuna on Rooma õnne- ja saatusejumalanna; tema ratas sümboliseerib elu muutlikku õnne.',
      },
    });
    expect(question('067', 5).clue).toEqual({
      en: 'What is the name of a Greek nymph of trees, originally especially oaks?',
      et: 'Kuidas nimetatakse Kreeka mütoloogias puude, algselt eriti tammede nümfi?',
    });
    expect(question('070', 2).clue).toEqual({
      en: 'Which insect-shaped amulet of ancient Egypt symbolized the sun, regeneration and rebirth?',
      et: 'Milline Vana-Egiptuse putukakujuline amulett sümboliseeris päikest, uuenemist ja taassündi?',
    });
  });
});

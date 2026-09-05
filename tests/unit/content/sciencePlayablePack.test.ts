import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { auditPlayability } from '../../../scripts/content/playability/audit';
import { SCIENCE_NATURE_CATEGORIES } from '../../../scripts/content/playability/banks/packs01to04/scienceNature';
import {
  completeEnabledAuthorityCorpus,
  findAuthorityCollisions,
  findAuthorityOneWayAliasLeaks,
} from './enabledAuthorityCollisionTestUtils';

const TARGETS = [
  ['005', 1],
  ['005', 3],
  ['005', 5],
  ['012', 3],
  ['041', 2],
  ['042', 5],
  ['045', 2],
  ['048', 1],
  ['048', 3],
  ['050', 1],
  ['055', 4],
  ['063', 3],
  ['075', 3],
] as const;

const TARGET_SLOTS = new Set(TARGETS.map(([setNumber, tier]) =>
  `built-in-science-nature-set-${setNumber}:${tier}`));

function category(setNumber: string) {
  const found = SCIENCE_NATURE_CATEGORIES.find(
    ({ categorySetId }) => categorySetId.endsWith(`-set-${setNumber}`),
  );
  if (found === undefined) throw new Error(`Missing Science & Nature set ${setNumber}`);
  return found;
}

function question(setNumber: string, tier: 1 | 2 | 3 | 4 | 5) {
  const found = category(setNumber).questions.find((candidate) => candidate.tier === tier);
  if (found === undefined) {
    throw new Error(`Missing Science & Nature question ${setNumber}:${tier}`);
  }
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

describe('Science & Nature playable pack', () => {
  it('keeps the complete medium and hard pack free of playability diagnostics', () => {
    const questions = SCIENCE_NATURE_CATEGORIES.flatMap(
      ({ questions: currentQuestions }) => currentQuestions,
    );
    const rows = SCIENCE_NATURE_CATEGORIES.flatMap((currentCategory) =>
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

    expect(SCIENCE_NATURE_CATEGORIES).toHaveLength(66);
    expect(questions).toHaveLength(330);
    expect(auditPlayability(rows).diagnostics).toEqual([]);
  });

  it('keeps every one of the other 317 Science & Nature rows byte-for-byte unchanged', () => {
    const unchangedRows = SCIENCE_NATURE_CATEGORIES.flatMap((currentCategory) =>
      currentCategory.questions.map((currentQuestion) => ({
        categorySetId: currentCategory.categorySetId,
        batchId: currentCategory.batchId,
        packId: currentCategory.packId,
        difficulty: currentCategory.difficulty,
        categoryName: currentCategory.name,
        question: currentQuestion,
      }))).filter(({ categorySetId, question: currentQuestion }) =>
      !TARGET_SLOTS.has(`${categorySetId}:${currentQuestion.tier}`));

    expect(unchangedRows).toHaveLength(317);
    expect(createHash('sha256').update(JSON.stringify(unchangedRows)).digest('hex'))
      .toBe('4f8ab7287fe1fcff46cf041cd259b13eda60fc66684f85a4f5bf56ad5f30858b');
  });

  it('locks the exact thirteen replacement payloads', () => {
    expect(TARGETS.map(([setNumber, tier]) => question(setNumber, tier))).toEqual([
      {
        key: 'playable-science-nature:built-in-science-nature-set-005:balanced-forces-tug-of-war',
        factKey: 'science-nature:balanced-forces-tug-of-war',
        tier: 1,
        subjectKey: 'concept:balanced-forces',
        clue: {
          en: 'Two equally matched teams pull opposite ends of a tug-of-war rope, yet the centre marker stays still. In school physics, what two-word label describes the forces on the stationary rope?',
          et: 'Kaks võrdset võistkonda tõmbavad köieveonööri vastassuundades, kuid keskmärk püsib paigal. Millise kahesõnalise nimetusega kirjeldatakse koolifüüsikas paigal seisvale köiele mõjuvaid jõude?',
        },
        response: { en: 'balanced forces', et: 'tasakaalus jõud' },
        acceptedVariants: {
          en: ['forces in balance'],
          et: ['tasakaalustatud jõud'],
        },
        explanation: {
          en: 'Equal, opposite pulls give a net force of zero, so the rope’s motion does not change.',
          et: 'Võrdsed vastassuunalised tõmbejõud annavad resultantjõuks nulli, mistõttu nööri liikumine ei muutu.',
        },
        source: {
          sourceId: 'wikipedia:mechanical-equilibrium',
          title: 'Mechanical equilibrium',
          url: 'https://en.wikipedia.org/wiki/Mechanical_equilibrium',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-09-05',
        },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-005:torque-door-handle',
        factKey: 'science-nature:torque-door-handle',
        tier: 3,
        subjectKey: 'quantity:torque',
        clue: {
          en: 'A door opens more easily when you push its handle than when you push near the hinges, because the same force has more turning effect. What quantity describes that effect?',
          et: 'Uks avaneb käepidemest lükates kergemini kui hinge lähedalt lükates, sest sama jõu pöörav toime on suurem. Milline füüsikaline suurus seda kirjeldab?',
        },
        response: { en: 'torque', et: 'pöördemoment' },
        acceptedVariants: {
          en: ['turning moment', 'moment of force'],
          et: ['jõumoment'],
        },
        explanation: {
          en: 'Torque measures a force’s turning effect; it grows with force and perpendicular distance from the pivot.',
          et: 'Pöördemoment mõõdab jõu pööravat toimet ning suureneb jõu ja pöörlemisteljest mõõdetud ristsuunalise kaugusega.',
        },
        source: {
          sourceId: 'wikipedia:torque-door-handle',
          title: 'Torque',
          url: 'https://en.wikipedia.org/wiki/Torque',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-09-05',
        },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-005:magnus-effect-curving-football',
        factKey: 'science-nature:magnus-effect-curving-football',
        tier: 5,
        subjectKey: 'effect:magnus',
        clue: {
          en: 'A spinning football can curve sideways through the air because its spin creates a pressure difference around the ball. Which named effect explains the bend?',
          et: 'Keerlev jalgpall võib õhus kõrvale kaarduda, sest pöörlemine tekitab palli ümber rõhuerinevuse. Milline efekt seda kõrvalekallet seletab?',
        },
        response: { en: 'Magnus effect', et: 'Magnuse efekt' },
        acceptedVariants: { en: [], et: [] },
        explanation: {
          en: 'The Magnus effect produces a sideways force on a spinning object moving through a fluid such as air.',
          et: 'Magnuse efekt tekitab õhus liikuvale pöörlevale kehale külgsuunalise jõu.',
        },
        source: {
          sourceId: 'wikipedia:magnus-effect-football',
          title: 'Magnus effect',
          url: 'https://en.wikipedia.org/wiki/Magnus_effect',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-09-05',
        },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-012:negative-afterimage',
        factKey: 'science-nature:negative-afterimage-complementary-colour',
        tier: 3,
        subjectKey: 'effect:afterimage',
        clue: {
          en: 'Stare at a bright red shape, then look at a white wall: a ghostly shape may appear in a complementary colour. What visual effect is this?',
          et: 'Vaata mõnda aega eredat punast kujundit ja seejärel valget seina: kummituslik kujund võib ilmuda vastandvärvis. Kuidas seda nägemisnähtust nimetatakse?',
        },
        response: { en: 'an afterimage', et: 'järelkujutis' },
        acceptedVariants: {
          en: ['afterimage', 'a negative afterimage'],
          et: ['negatiivne järelkujutis'],
        },
        explanation: {
          en: 'A negative afterimage appears while the visual system adapts; opponent-colour processing makes the complementary hue stand out.',
          et: 'Negatiivne järelkujutis tekib nägemissüsteemi kohanemisel; vastandvärvide töötlus toob esile algse värvi vastandtooni.',
        },
        source: {
          sourceId: 'wikipedia:afterimage-complementary-colour',
          title: 'Afterimage',
          url: 'https://en.wikipedia.org/wiki/Afterimage',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-09-05',
        },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-041:lava-tube-drained-flow',
        factKey: 'science-nature:lava-tube-drained-flow',
        tier: 2,
        subjectKey: 'landform:lava-tube',
        clue: {
          en: 'The surface of a lava flow can harden while molten lava keeps moving underneath; when it drains away, what tunnel-like feature remains?',
          et: 'Laavavoolu pind võib tahkuda, samal ajal kui sulalaava selle all edasi liigub. Milline tunnelilaadne pinnavorm jääb alles, kui laava välja voolab?',
        },
        response: { en: 'a lava tube', et: 'laavatunnel' },
        acceptedVariants: { en: ['lava tube', 'lava tunnel'], et: ['laavatoru'] },
        explanation: {
          en: 'A lava tube forms when the crust of a lava flow stays in place after the still-molten interior drains away.',
          et: 'Laavatunnel tekib, kui laavavoolu tahkunud koorik jääb paigale pärast selle all voolanud sulalaava äravoolamist.',
        },
        source: {
          sourceId: 'wikipedia:lava-tube-drained-flow',
          title: 'Lava tube',
          url: 'https://en.wikipedia.org/wiki/Lava_tube',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-09-05',
        },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-042:polar-vortex-cold-air',
        factKey: 'science-nature:polar-vortex-cold-air',
        tier: 5,
        subjectKey: 'weather:polar-vortex',
        clue: {
          en: 'A huge area of low pressure and cold air normally circles a pole; when it expands, severe cold can spill farther south. What is it called?',
          et: 'Poolust ümbritseb tavaliselt ulatuslik madalrõhuala ja külma õhu ringlus; selle laienemisel võib karm külm kanduda kaugemale lõunasse. Kuidas seda nimetatakse?',
        },
        response: { en: 'the polar vortex', et: 'polaarpööris' },
        acceptedVariants: {
          en: ['polar vortex'],
          et: ['polaarne pööris'],
        },
        explanation: {
          en: 'The polar vortex is a broad circulation of low pressure and cold air around a pole, strongest in winter.',
          et: 'Polaarpööris on pooluse ümber paiknev ulatuslik madalrõhu ja külma õhu ringlus, mis on tugevaim talvel.',
        },
        source: {
          sourceId: 'nws:polar-vortex',
          title: 'What is the Polar Vortex?',
          url: 'https://www.weather.gov/safety/cold-polar-vortex',
          license: 'Public Domain',
          retrievedAt: '2026-09-05',
        },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-045:wilting-water-loss',
        factKey: 'science-nature:wilting-water-loss',
        tier: 2,
        subjectKey: 'response:wilting',
        clue: {
          en: 'A thirsty houseplant’s leaves and stems droop as its cells lose water pressure. What visible response is this?',
          et: 'Januse toataime lehed ja varred vajuvad longu, kui selle rakud kaotavad veesurve. Kuidas seda nähtavat reaktsiooni nimetatakse?',
        },
        response: { en: 'wilting', et: 'närbumine' },
        acceptedVariants: { en: [], et: [] },
        explanation: {
          en: 'Water loss reduces turgor pressure in plant cells, leaving leaves and stems limp.',
          et: 'Veekadu vähendab taimerakkude turgorrõhku ning lehed ja varred vajuvad longu.',
        },
        source: {
          sourceId: 'wikipedia:wilting-water-loss',
          title: 'Wilting',
          url: 'https://en.wikipedia.org/wiki/Wilting',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-09-05',
        },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-048:moon-illusion-horizon-size',
        factKey: 'science-nature:moon-illusion-horizon-size',
        tier: 1,
        subjectKey: 'phenomenon:moon-illusion',
        clue: {
          en: 'Near the horizon, the Moon often looks much larger than it does high in the sky, even though photographs show nearly the same width. What visual effect is this?',
          et: 'Horisondi lähedal paistab Kuu sageli palju suurem kui kõrgel taevas, kuigi fotodel on selle laius peaaegu sama. Mis nägemisnähtus see on?',
        },
        response: { en: 'the Moon illusion', et: 'kuuillusioon' },
        acceptedVariants: { en: ['Moon illusion'], et: ['Kuu illusioon'] },
        explanation: {
          en: 'The apparent enlargement is a perception effect rather than atmospheric magnification; its exact psychological cause remains unsettled.',
          et: 'Näiline suurenemine on tajuefekt, mitte atmosfääri suurendus; selle täpse psühholoogilise põhjuse üle vaieldakse endiselt.',
        },
        source: {
          sourceId: 'nasa:moon-illusion-horizon-size',
          title: 'The Moon Illusion: Why Does the Moon Look So Big Sometimes? — NASA Science',
          url: 'https://science.nasa.gov/solar-system/moon/the-moon-illusion-why-does-the-moon-look-so-big-sometimes/',
          license: 'Public Domain',
          retrievedAt: '2026-09-05',
        },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-048:fogbow-white-arc',
        factKey: 'science-nature:fogbow-white-arc',
        tier: 3,
        subjectKey: 'phenomenon:fogbow',
        clue: {
          en: 'Sunlight behind you and fog ahead can produce a broad, almost colourless cousin of a rainbow. What is it called?',
          et: 'Kui Päike on vaatleja selja taga ja ees on udu, võib tekkida lai peaaegu värvitu vikerkaare sugulane. Kuidas seda nimetatakse?',
        },
        response: { en: 'a fogbow', et: 'udukaar' },
        acceptedVariants: {
          en: ['fogbow', 'fog bow', 'white rainbow'],
          et: ['uduvikerkaar', 'valge vikerkaar'],
        },
        explanation: {
          en: 'Fog droplets are much smaller than raindrops, so diffraction smears the colours and leaves a pale or nearly white arc.',
          et: 'Udupiisad on vihmapiiskadest palju väiksemad, mistõttu difraktsioon hajutab värvid ja jätab kaare kahvatuks või peaaegu valgeks.',
        },
        source: {
          sourceId: 'metoffice:fogbow-optical-wonders',
          title: 'Rainbows: optical wonders — Met Office',
          url: 'https://weather.metoffice.gov.uk/learn-about/weather/optical-effects/rainbows',
          license: 'All rights reserved',
          retrievedAt: '2026-09-05',
        },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-050:emperor-penguin-huddle-warmth',
        factKey: 'science-nature:emperor-penguin-huddle-warmth',
        tier: 1,
        subjectKey: 'behaviour:emperor-penguin-huddling',
        clue: {
          en: 'Emperor penguins survive Antarctic winter winds by packing tightly and taking turns in the warmer centre. What group strategy are they using?',
          et: 'Keiserpingviinid peavad Antarktika talvetuultele vastu tihedalt kokku kogunedes ja kordamööda soojemas keskosas viibides. Kuidas seda rühmakäitumist nimetatakse?',
        },
        response: { en: 'huddling', et: 'kobarasse kogunemine' },
        acceptedVariants: {
          en: ['group huddling', 'forming a huddle'],
          et: ['kobaras püsimine'],
        },
        explanation: {
          en: 'The moving huddle sharply reduces heat loss while continually cycling birds between its exposed edge and warmer centre.',
          et: 'Liikuv kobar vähendab tugevalt soojakadu ning viib linde pidevalt paljastatud servast soojemasse keskossa ja tagasi.',
        },
        source: {
          sourceId: 'australian-antarctic-program:emperor-penguin-huddling',
          title: 'Emperor penguin — Australian Antarctic Program',
          url: 'https://www.antarctica.gov.au/about-antarctica/animals/penguins/emperor-penguin/',
          license: 'All rights reserved',
          retrievedAt: '2026-09-05',
        },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-055:zebrafish-heart-regeneration',
        factKey: 'science-nature:zebrafish-heart-regeneration',
        tier: 4,
        subjectKey: 'animal:zebrafish',
        clue: {
          en: 'Which small striped aquarium fish, widely used in laboratories, can repair a damaged heart without leaving a permanent scar?',
          et: 'Milline väike triibuline akvaariumikala, keda kasutatakse palju laborites, suudab kahjustatud südame taastada püsivat armi jätmata?',
        },
        response: { en: 'the zebrafish', et: 'sebrakala' },
        acceptedVariants: {
          en: ['zebra fish', 'Danio rerio'],
          et: ['vöödiline pisidaanio', 'Danio rerio'],
        },
        explanation: {
          en: 'This fish can regenerate cardiac muscle after injury, one reason scientists study it as a model for tissue repair.',
          et: 'See kala suudab pärast vigastust südamelihast taastada, mistõttu uuritakse teda kudede paranemise mudelina.',
        },
        source: {
          sourceId: 'wikipedia:zebrafish-heart-regeneration',
          title: 'Zebrafish',
          url: 'https://en.wikipedia.org/wiki/Zebrafish',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-09-05',
        },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-063:tumbleweed-rolling-seeds',
        factKey: 'science-nature:tumbleweed-rolling-seeds',
        tier: 3,
        subjectKey: 'plant-form:tumbleweed',
        clue: {
          en: 'In old Westerns, what dry ball of plant material rolls across empty ground while the wind shakes out its seeds?',
          et: 'Milline kuiv taimepall veereb vanades vesternides üle tühja maastiku, puistates tuule käes seemneid?',
        },
        response: { en: 'a tumbleweed', et: 'kõrbepall' },
        acceptedVariants: {
          en: ['tumbleweed'],
          et: ['tumbleweed', 'ogamalt', 'ogamalts', 'veerev kõrbepall'],
        },
        explanation: {
          en: 'A mature above-ground plant part breaks free, and tumbling gradually releases seeds along its route.',
          et: 'Küps maapealne taimeosa murdub lahti ning veeremine puistab teekonnal järk-järgult seemneid.',
        },
        source: {
          sourceId: 'wikipedia:tumbleweed-rolling-seeds',
          title: 'Tumbleweed',
          url: 'https://en.wikipedia.org/wiki/Tumbleweed',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-09-05',
        },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-075:corpus-callosum-hemispheres',
        factKey: 'science-nature:corpus-callosum-hemispheres',
        tier: 3,
        subjectKey: 'tract:corpus-callosum',
        clue: {
          en: 'Which broad band of nerve fibres carries information between the brain’s left and right hemispheres?',
          et: 'Milline lai närvikiudude kimp vahendab infot aju vasaku ja parema poolkera vahel?',
        },
        response: { en: 'the corpus callosum', et: 'mõhnkeha' },
        acceptedVariants: {
          en: ['corpus callosum'],
          et: ['corpus callosum'],
        },
        explanation: {
          en: 'This white-matter bridge lets the hemispheres share sensory, motor, and cognitive information.',
          et: 'See valgeaineühendus võimaldab ajupoolkeradel vahetada meelelist, motoorset ja mõtlemisega seotud infot.',
        },
        source: {
          sourceId: 'wikipedia:corpus-callosum-hemispheres',
          title: 'Corpus callosum',
          url: 'https://en.wikipedia.org/wiki/Corpus_callosum',
          license: 'CC-BY-SA-4.0',
          retrievedAt: '2026-09-05',
        },
      },
    ]);
  });

  it('keeps all thirteen replacements collision-free across every enabled authority row', () => {
    const { corpus, replacements } = protectedReplacements();
    const counts = Object.fromEntries(['easy', 'medium-hard', 'adult', 'estonia'].map(
      (authority) => [authority, corpus.filter((row) => row.authority === authority).length],
    ));

    expect(counts).toEqual({ easy: 2_000, 'medium-hard': 4_000, adult: 500, estonia: 500 });
    expect(corpus).toHaveLength(7_000);
    expect(replacements).toHaveLength(13);
    expect(replacements.flatMap((candidate) =>
      findAuthorityCollisions(candidate, corpus).map((collision) =>
        `${candidate.id}:${collision}`))).toEqual([]);
  }, 10_000);

  it('keeps all thirteen response aliases out of every other clue and explanation', () => {
    const { corpus, replacements } = protectedReplacements();

    expect(replacements.flatMap((candidate) =>
      findAuthorityOneWayAliasLeaks(candidate, corpus).map((leak) =>
        `${candidate.id}:${leak}`))).toEqual([]);
  }, 10_000);
});

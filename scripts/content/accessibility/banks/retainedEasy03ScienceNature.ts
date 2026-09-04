import type { AccessibleCategory, AccessibleQuestion } from '../types';

type TextPair = readonly [en: string, et: string];
type VariantPair = readonly [en: readonly string[], et: readonly string[]];
type QuestionSeed = readonly [
  slug: string,
  clue: TextPair,
  response: TextPair,
  variants: VariantPair,
  explanation: TextPair,
  sourcePage: string,
];

const PREFIX = 'retained-easy-03:';
const BATCH_ID = '03-science-nature';
const EXPECTED_IDS = [
  'built-in-science-nature-set-000',
  'built-in-science-nature-set-001',
  'built-in-science-nature-set-002',
  'built-in-science-nature-set-003',
  'built-in-science-nature-set-004',
  'built-in-science-nature-set-007',
  'built-in-science-nature-set-010',
  'built-in-science-nature-set-011',
] as const;

function source(slug: string, page: string): AccessibleQuestion['source'] {
  const title = decodeURIComponent(page).replaceAll('_', ' ');
  return {
    sourceId: `${PREFIX}source:${slug}`,
    title: `${title} — Wikipedia`,
    url: `https://en.wikipedia.org/wiki/${page}`,
    license: 'CC-BY-SA-4.0',
    retrievedAt: '2026-08-31',
  };
}

function category(
  categorySetId: (typeof EXPECTED_IDS)[number],
  name: TextPair,
  seeds: readonly QuestionSeed[],
): AccessibleCategory {
  return {
    categorySetId,
    batchId: BATCH_ID,
    name: { en: name[0], et: name[1] },
    questions: seeds.map((seed, index) => {
      const [slug, clue, response, variants, explanation, sourcePage] = seed;
      return {
        key: `${PREFIX}fact:${slug}`,
        tier: (index + 1) as AccessibleQuestion['tier'],
        subjectKey: `${PREFIX}subject:${slug}`,
        clue: { en: clue[0], et: clue[1] },
        response: { en: response[0], et: response[1] },
        acceptedVariants: { en: variants[0], et: variants[1] },
        explanation: { en: explanation[0], et: explanation[1] },
        source: source(slug, sourcePage),
      };
    }),
  };
}

function normalize(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('en')
    .replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/gu, ' ').trim();
}

function validate(categories: readonly AccessibleCategory[]): readonly AccessibleCategory[] {
  const ids = categories.map(({ categorySetId }) => categorySetId);
  if (ids.join('|') !== EXPECTED_IDS.join('|')) {
    throw new Error(`Unexpected retained Science & Nature order: ${ids.join(', ')}`);
  }

  const keys = new Set<string>();
  const subjects = new Set<string>();
  const pairs = new Set<string>();
  const titles = new Set<string>();
  for (const categoryValue of categories) {
    if (categoryValue.batchId !== BATCH_ID || categoryValue.questions.length !== 5) {
      throw new Error(`Invalid retained Science & Nature category: ${categoryValue.categorySetId}`);
    }
    for (const language of ['en', 'et'] as const) {
      const title = normalize(categoryValue.name[language]);
      if (title === '' || titles.has(`${language}|${title}`)) {
        throw new Error(`Duplicate or empty title: ${categoryValue.categorySetId}`);
      }
      titles.add(`${language}|${title}`);
    }

    categoryValue.questions.forEach((question, index) => {
      if (question.tier !== index + 1 || !question.key.startsWith(PREFIX)
        || !question.subjectKey.startsWith(PREFIX) || keys.has(question.key)
        || subjects.has(question.subjectKey)) {
        throw new Error(`Invalid identity or tier: ${question.key}`);
      }
      keys.add(question.key);
      subjects.add(question.subjectKey);

      if (question.acceptedVariants.en.length === 0 || question.acceptedVariants.et.length === 0
        || new URL(question.source.url).protocol !== 'https:') {
        throw new Error(`Missing variants or HTTPS source: ${question.key}`);
      }
      for (const language of ['en', 'et'] as const) {
        const fields = [question.clue[language], question.response[language],
          question.explanation[language], ...question.acceptedVariants[language]];
        if (fields.some((field) => normalize(field) === '')
          || !/^\p{Lu}/u.test(question.explanation[language])) {
          throw new Error(`Invalid ${language} copy: ${question.key}`);
        }
        if (` ${normalize(question.clue[language])} `
          .includes(` ${normalize(question.response[language])} `)
          || ` ${normalize(categoryValue.name[language])} `
            .includes(` ${normalize(question.response[language])} `)) {
          throw new Error(`Response leak in ${language}: ${question.key}`);
        }
      }
      const pair = `${normalize(question.clue.en)}\0${normalize(question.response.en)}`;
      if (pairs.has(pair)) throw new Error(`Duplicate clue/answer pair: ${question.key}`);
      pairs.add(pair);
    });
  }
  return categories;
}

export const RETAINED_EASY_03_SCIENCE_NATURE_CATEGORIES = validate([
  category('built-in-science-nature-set-000', ['Science in the Kitchen', 'Teadus köögis'], [
    ['s000-carbon-dioxide',
      ['Which gas forms the bubbles in sparkling water and fizzy drinks?', 'Milline gaas moodustab mullid gaseeritud vees ja kihisevates jookides?'],
      ['Carbon dioxide', 'Süsinikdioksiid'], [['CO2', 'CO₂'], ['CO2', 'CO₂', 'Süsihappegaas']],
      ['Carbon dioxide dissolves under pressure and escapes as bubbles when the container is opened.', 'Süsinikdioksiid lahustub rõhu all ja pääseb anuma avamisel mullidena välja.'], 'Carbon_dioxide'],
    ['s000-conduction',
      ['What heat-transfer process warms food where it touches a hot pan?', 'Milline soojusülekande viis kuumutab toitu seal, kus see puutub vastu kuuma panni?'],
      ['Conduction', 'Soojusjuhtivus'], [['Heat conduction'], ['Soojuse juhtivus']],
      ['Conduction transfers thermal energy through direct contact between materials.', 'Soojusjuhtivus kannab soojusenergiat edasi materjalide vahetu kokkupuute kaudu.'], 'Thermal_conduction'],
    ['s000-pectin',
      ['Which substance found naturally in fruit helps jam set as it cools?', 'Milline puuviljades looduslikult leiduv aine aitab moosil jahtudes tarretuda?'],
      ['Pectin', 'Pektiin'], [['Fruit pectin'], ['Puuviljapektiin', 'Pektiinaine']],
      ['Pectin forms a gel under suitable conditions of acidity and sugar, giving jam its set texture.', 'Pektiin moodustab sobiva happesuse ja suhkrusisalduse juures geeli, mis annab moosile tarretunud tekstuuri.'], 'Pectin'],
    ['s000-caramelisation',
      ['What browning process gives heated sugar a deeper colour and nutty flavour?', 'Milline pruunistumisprotsess annab kuumutatud suhkrule tumedama värvi ja pähklise maitse?'],
      ['Caramelisation', 'Karamellistumine'], [['Caramelization'], ['Karamelliseerumine', 'Karamelliseerimine']],
      ['Caramelisation creates new colours and flavours as sugar is heated.', 'Karamellistumisel tekivad suhkru kuumutamisel uued värvid ja maitsed.'], 'Caramelization'],
    ['s000-protein-denaturation',
      ['What process makes egg-white proteins lose their folded shape and firm up when heated?', 'Kuidas nimetatakse protsessi, mille käigus kaotavad munavalgevalgud kuumutamisel oma ruumilise kuju ja tahkuvad?'],
      ['Protein denaturation', 'Valkude denatureerumine'], [['Denaturation'], ['Valkude denaturatsioon', 'Denaturatsioon']],
      ['Heat denatures egg-white proteins, allowing them to form a firm network as the egg cooks.', 'Kuumus denatureerib munavalgevalgud ning võimaldab neil küpsemisel tugeva võrgustiku moodustada.'], 'Denaturation_(biochemistry)'],
  ]),

  category('built-in-science-nature-set-001', ['Science You Can See Outdoors', 'Teadus, mida näeb õues'], [
    ['s001-shadow',
      ['What dark shape appears on a surface when an object blocks light?', 'Milline tume kujutis tekib pinnale, kui ese varjab valguse?'],
      ['A shadow', 'Vari'], [['Shadow'], ['Heidetud vari']],
      ['A shadow forms where an opaque object prevents light from reaching a surface.', 'Vari tekib seal, kus läbipaistmatu ese takistab valgusel pinnani jõudmist.'], 'Shadow'],
    ['s001-thunder',
      ['What sound follows lightning when heated air expands suddenly?', 'Milline heli järgneb välgule, kui kuumenenud õhk järsult paisub?'],
      ['Thunder', 'Kõu'], [['A thunderclap'], ['Müristamine', 'Kõuemürin']],
      ['Lightning heats the surrounding air extremely quickly, producing a pressure wave heard as thunder.', 'Välk kuumutab ümbritsevat õhku väga kiiresti ning tekitab kõuna kuuldava rõhulaine.'], 'Thunder'],
    ['s001-dew',
      ['What tiny drops collect on cool grass when water vapour condenses overnight?', 'Millised väikesed piisad kogunevad jahedale rohule, kui veeaur öösel kondenseerub?'],
      ['Dew', 'Kaste'], [['Morning dew'], ['Hommikukaste']],
      ['Dew forms when a surface cools below the point at which nearby water vapour condenses.', 'Kaste tekib, kui pind jahtub temperatuurini, mille juures läheduses olev veeaur kondenseerub.'], 'Dew'],
    ['s001-mirage',
      ['What optical effect can make water seem to shimmer in the distance above a hot road?', 'Milline optiline nähtus võib tekitada kuuma tee kohal kauguses virvendava veelombi mulje?'],
      ['A mirage', 'Miraaž'], [['Heat mirage'], ['Terendus', 'Õhupeegeldus']],
      ['A mirage forms when light bends through layers of air at different temperatures.', 'Miraaž tekib, kui valgus murdub erineva temperatuuriga õhukihtides.'], 'Mirage'],
    ['s001-sun-dog',
      ['What bright spot can appear beside the Sun when ice crystals bend sunlight in the atmosphere?', 'Milline ere valguslaik võib ilmuda Päikese kõrvale, kui jääkristallid atmosfääris päikesevalgust murravad?'],
      ['A sun dog', 'Ebapäike'], [['Parhelion'], ['Parheelium']],
      ['A sun dog is a halo phenomenon produced when plate-shaped ice crystals refract sunlight.', 'Ebapäike on halonähtus, mis tekib siis, kui plaadikujulised jääkristallid päikesevalgust murravad.'], 'Sun_dog'],
  ]),

  category('built-in-science-nature-set-002', ["Your Body's Everyday Jobs", 'Sinu keha igapäevatöö'], [
    ['s002-heart',
      ['Which muscular organ pumps blood around the body?', 'Milline lihaseline elund pumpab verd läbi keha?'],
      ['The heart', 'Süda'], [['Heart'], ['Inimese süda']],
      ['The heart contracts rhythmically to move blood through the circulatory system.', 'Süda tõmbub korrapäraselt kokku ja liigutab verd vereringes.'], 'Heart'],
    ['s002-eardrum',
      ['Which thin membrane vibrates when sound waves enter the ear?', 'Milline õhuke kile hakkab helilainete kõrva jõudes võnkuma?'],
      ['The eardrum', 'Kuulmekile'], [['Tympanic membrane', 'Ear drum'], ['Trummikile']],
      ['The eardrum transfers sound vibrations from the ear canal to the middle ear.', 'Kuulmekile kannab helivõnked kuulmekäigust edasi keskkõrva.'], 'Eardrum'],
    ['s002-iris',
      ['Which coloured part of the eye changes the pupil’s size?', 'Milline silma värviline osa muudab pupilli suurust?'],
      ['The iris', 'Vikerkest'], [['Iris'], ['Iiris']],
      ['Muscles in the iris adjust the pupil and regulate how much light enters the eye.', 'Vikerkesta lihased muudavad pupilli suurust ja reguleerivad silma jõudva valguse hulka.'], 'Iris_(anatomy)'],
    ['s002-insulin',
      ['Which pancreatic hormone helps cells take glucose from the blood?', 'Milline kõhunäärmehormoon aitab rakkudel verest glükoosi omastada?'],
      ['Insulin', 'Insuliin'], [['The hormone insulin'], ['Insuliinhormoon']],
      ['Insulin helps regulate blood glucose by signalling cells to absorb and store it.', 'Insuliin aitab veresuhkrut reguleerida, andes rakkudele märku glükoosi omastada ja talletada.'], 'Insulin'],
    ['s002-cerebellum',
      ['Which part at the back of the brain is especially important for balance and coordinated movement?', 'Milline aju tagaosas paiknev osa on eriti tähtis tasakaalu ja koordineeritud liikumise jaoks?'],
      ['The cerebellum', 'Väikeaju'], [['Cerebellum'], ['Aju väikeaju']],
      ['The cerebellum fine-tunes movement and contributes to posture and balance.', 'Väikeaju täpsustab liigutusi ning aitab hoida rühti ja tasakaalu.'], 'Cerebellum'],
  ]),

  category('built-in-science-nature-set-003', ["Nature's Clever Tricks", 'Looduse nutikad võtted'], [
    ['s003-camouflage',
      ['What adaptation helps an animal blend into its surroundings?', 'Milline kohastumus aitab loomal ümbritsevasse keskkonda sulanduda?'],
      ['Camouflage', 'Kamuflaaž'], [['Crypsis'], ['Kaitsevärvus', 'Varjevärvus']],
      ['Camouflage can hide an animal from predators or help it approach prey.', 'Kamuflaaž võib varjata looma kiskjate eest või aidata tal saagile läheneda.'], 'Camouflage'],
    ['s003-hibernation',
      ['What energy-saving winter state greatly slows an animal’s activity and metabolism?', 'Milline energiat säästev talvine seisund aeglustab tugevalt looma aktiivsust ja ainevahetust?'],
      ['Hibernation', 'Talveuni'], [['Winter sleep'], ['Hibernatsioon', 'Taliuinak']],
      ['Hibernation lets some animals survive cold periods when food is scarce.', 'Talveuni aitab mõnel loomal üle elada külma aja, mil toitu napib.'], 'Hibernation'],
    ['s003-seed-dispersal',
      ['What process carries plant seeds away from their parent by wind, water, or animals?', 'Milline protsess viib taimeseemned tuule, vee või loomade abil emataimest eemale?'],
      ['Seed dispersal', 'Seemnete levik'], [['Seed distribution'], ['Seemnelevi', 'Seemnete levimine']],
      ['Seed dispersal reduces crowding and helps plants reach new habitats.', 'Seemnete levik vähendab konkurentsi ja aitab taimedel jõuda uutesse kasvukohtadesse.'], 'Seed_dispersal'],
    ['s003-echolocation',
      ['What ability uses returning echoes to help bats navigate in darkness?', 'Milline võime kasutab tagasipeegelduvaid helisid, et aidata nahkhiirtel pimedas liikuda?'],
      ['Echolocation', 'Kajalokatsioon'], [['Biosonar', 'Bio sonar'], ['Biosonar', 'Kajaorientatsioon']],
      ['Bats emit sounds and analyse the echoes reflected by nearby objects.', 'Nahkhiired tekitavad helisid ja analüüsivad lähedastelt esemetelt tagasi peegelduvaid kajasid.'], 'Animal_echolocation'],
    ['s003-bioluminescence',
      ['What natural light production makes many fireflies and deep-sea creatures glow?', 'Milline looduslik valguse tekitamine paneb paljud jaanimardikad ja süvamereloomad helendama?'],
      ['Bioluminescence', 'Bioluminestsents'], [['Biological light'], ['Bioloogiline helendus', 'Elusorganismide helendus']],
      ['Bioluminescent organisms create light through chemical reactions in their bodies.', 'Bioluminestseeruvad organismid tekitavad kehas toimuvate keemiliste reaktsioonidega valgust.'], 'Bioluminescence'],
  ]),

  category('built-in-science-nature-set-004', ['The World Up Close', 'Maailm lähedalt'], [
    ['s004-cell',
      ['What is the smallest structural unit that can carry out all basic processes of life?', 'Milline on väikseim ehitusüksus, mis suudab täita kõiki elu põhiprotsesse?'],
      ['A cell', 'Rakk'], [['Cell'], ['Elusrakk']],
      ['Cells are the fundamental structural and functional units of living organisms.', 'Rakud on elusorganismide põhilised ehituslikud ja talitluslikud üksused.'], 'Cell_(biology)'],
    ['s004-snowflake',
      ['What ice crystal usually grows with six-fold symmetry as it falls through a cloud?', 'Milline jääkristall kasvab pilves langedes tavaliselt kuuekordse sümmeetriaga?'],
      ['A snowflake', 'Lumehelves'], [['Snow crystal'], ['Lumekristall', 'Lumehelbeke']],
      ['The molecular structure of ice leads snow crystals to develop six-sided forms.', 'Jää molekulaarne ehitus paneb lumekristallid kujunema kuueharulisteks.'], 'Snowflake'],
    ['s004-fingerprint',
      ['What pattern of ridges left by a fingertip can help identify a person?', 'Milline sõrmeotsa nahajoonte muster võib aidata inimest tuvastada?'],
      ['A fingerprint', 'Sõrmejälg'], [['Finger print'], ['Sõrme jälg']],
      ['Friction-ridge patterns on fingertips are highly distinctive and persist through life.', 'Sõrmeotsa nahajoonte muster on väga isikupärane ja püsib kogu elu.'], 'Fingerprint'],
    ['s004-pollen',
      ['What fine powder made by seed plants carries their male reproductive cells?', 'Milline seemnetaimede toodetud peen pulber kannab nende isassugurakke?'],
      ['Pollen', 'Õietolm'], [['Pollen grains'], ['Tolmuterad', 'Õietolmuterad']],
      ['Pollen grains transfer male genetic material during plant reproduction.', 'Õietolmuterad kannavad taimede paljunemisel edasi isasgeneetilist materjali.'], 'Pollen'],
    ['s004-stomata',
      ['What tiny pores in a leaf’s surface open and close to exchange gases?', 'Millised tillukesed avad lehe pinnal avanevad ja sulguvad, et gaase vahetada?'],
      ['Stomata', 'Õhulõhed'], [['Leaf pores', 'Stomatal pores'], ['Stoomid', 'Lehepoorid']],
      ['Stomata regulate the movement of carbon dioxide, oxygen, and water vapour through a leaf.', 'Õhulõhed reguleerivad süsinikdioksiidi, hapniku ja veeauru liikumist läbi lehe.'], 'Stoma'],
  ]),

  category('built-in-science-nature-set-007', ['Science at the Playground', 'Teadus mänguväljakul'], [
    ['s007-gravity',
      ['Which force pulls a tossed ball back toward the ground?', 'Milline jõud tõmbab õhku visatud palli tagasi maapinna poole?'],
      ['Gravity', 'Gravitatsioon'], [['The force of gravity'], ['Raskusjõud', 'Gravitatsioonijõud']],
      ['Earth’s gravity accelerates unsupported objects toward its centre.', 'Maa gravitatsioon kiirendab toeta esemeid Maa keskme suunas.'], 'Gravity_of_Earth'],
    ['s007-friction',
      ['Which force between touching surfaces slows a child sliding across the ground?', 'Milline kokkupuutuvate pindade vaheline jõud aeglustab mööda maad libisevat last?'],
      ['Friction', 'Hõõrdumine'], [['Frictional force'], ['Hõõre', 'Hõõrdejõud']],
      ['Friction opposes relative motion between surfaces in contact.', 'Hõõrdumine takistab kokkupuutuvate pindade omavahelist liikumist.'], 'Friction'],
    ['s007-air-resistance',
      ['What drag from the atmosphere slows a parachute and its passenger?', 'Milline atmosfääri tekitatud takistus aeglustab langevarju ja selle kasutajat?'],
      ['Air resistance', 'Õhutakistus'], [['Aerodynamic drag', 'Air drag'], ['Õhuvastupanu', 'Aerodünaamiline takistus']],
      ['A parachute creates a large area that increases aerodynamic drag.', 'Langevari tekitab suure pinna, mis suurendab aerodünaamilist takistust.'], 'Drag_(physics)'],
    ['s007-inertia',
      ['What tendency makes a passenger keep moving forward when a swing stops suddenly?', 'Milline kalduvus paneb sõitja edasi liikuma, kui kiik järsult peatub?'],
      ['Inertia', 'Inerts'], [['The principle of inertia'], ['Inertsus']],
      ['Inertia is the tendency of an object to resist a change in its state of motion.', 'Inerts on keha kalduvus seista vastu oma liikumisoleku muutumisele.'], 'Inertia'],
    ['s007-centripetal-force',
      ['What inward-directed force keeps a rider moving in a circle on a roundabout?', 'Milline sissepoole suunatud jõud hoiab karussellisõitja ringjoonel liikumas?'],
      ['Centripetal force', 'Kesktõmbejõud'], [['Centre-seeking force', 'Center-seeking force'], ['Tsentripetaaljõud', 'Kesksuunaline jõud']],
      ['A centripetal force continually bends an object’s velocity toward the centre of a circular path.', 'Kesktõmbejõud painutab keha kiirusvektorit pidevalt ringjoone keskme poole.'], 'Centripetal_force'],
  ]),

  category('built-in-science-nature-set-010', ['Animal Superpowers', 'Loomade supervõimed'], [
    ['s010-cheetah',
      ['Which spotted cat is the fastest land animal?', 'Milline täpiline kaslane on kiireim maismaaloom?'],
      ['The cheetah', 'Gepard'], [['Cheetah'], ['Gepard']],
      ['The cheetah’s flexible spine and long limbs support exceptional sprinting speed.', 'Gepardi painduv selg ja pikad jäsemed võimaldavad erakordselt kiiret spurti.'], 'Cheetah'],
    ['s010-gecko',
      ['Which small lizard can climb smooth walls using microscopic structures on its toe pads?', 'Milline väike sisalik suudab ronida siledatel seintel tänu varbapatjade mikroskoopilistele struktuuridele?'],
      ['A gecko', 'Geko'], [['Gecko', 'House gecko'], ['Gekolane']],
      ['A gecko’s toe pads contain tiny hair-like structures that create strong surface contact.', 'Geko varbapatjadel on tillukesed karvataolised struktuurid, mis tekitavad tugeva kontakti pinnaga.'], 'Gecko'],
    ['s010-electric-eel',
      ['Which South American freshwater animal can stun prey with powerful electric shocks?', 'Milline Lõuna-Ameerika mageveeloom suudab saaki tugevate elektrilöökidega uimastada?'],
      ['An electric eel', 'Elektriangerjas'], [['Electric eels'], ['Elektriangerjad']],
      ['Electric eels generate strong electric discharges with specialised organs in their bodies.', 'Elektriangerjad tekitavad kehas asuvate eriliste elunditega tugevaid elektrilahendusi.'], 'Electric_eel'],
    ['s010-octopus',
      ['Which eight-armed sea animal has three hearts?', 'Millisel kaheksa haarmega mereloomal on kolm südant?'],
      ['An octopus', 'Kaheksajalg'], [['Octopus'], ['Kaheksahaarmeline mollusk']],
      ['An octopus has two branchial hearts for the gills and one systemic heart for the body.', 'Kaheksajalal on kaks lõpusesüdant ja üks keha verega varustav süda.'], 'Octopus'],
    ['s010-axolotl',
      ['Which Mexican salamander is famous for regrowing lost limbs?', 'Milline Mehhikost pärit salamander on kuulus kaotatud jäsemete taastamise poolest?'],
      ['The axolotl', 'Aksolotl'], [['Axolotl', 'Mexican walking fish'], ['Mehhiko aksolotl']],
      ['Axolotls can regenerate limbs and repair several other complex tissues.', 'Aksolotlid suudavad taastada jäsemeid ja parandada mitut muud keerukat kude.'], 'Axolotl'],
  ]),

  category('built-in-science-nature-set-011', ['Our Restless Planet', 'Meie rahutu planeet'], [
    ['s011-volcano',
      ['What landform can erupt lava, ash, and gases from inside Earth?', 'Milline pinnavorm võib Maa sisemusest pursata laavat, tuhka ja gaase?'],
      ['A volcano', 'Vulkaan'], [['Volcano'], ['Tulemägi']],
      ['A volcano is an opening or landform through which magma and gases reach the surface.', 'Vulkaan on ava või pinnavorm, mille kaudu magma ja gaasid jõuavad maapinnale.'], 'Volcano'],
    ['s011-earthquake',
      ['What sudden ground shaking is caused by energy released within Earth’s crust?', 'Millise äkilise maapinna värisemise põhjustab maakoores vabanev energia?'],
      ['An earthquake', 'Maavärin'], [['Earthquake', 'Seismic event'], ['Seismiline sündmus']],
      ['An earthquake sends seismic waves outward from a rupture in the crust.', 'Maavärin saadab maakoore murrangust väljapoole seismilisi laineid.'], 'Earthquake'],
    ['s011-aftershock',
      ['What smaller earthquake follows the main shock in the same area?', 'Kuidas nimetatakse väiksemat maavärinat, mis järgneb samas piirkonnas põhitõukele?'],
      ['An aftershock', 'Järeltõuge'], [['Aftershock'], ['Järelvärin']],
      ['Aftershocks occur as the crust adjusts following the initial strong movement in an earthquake sequence.', 'Järeltõuked tekivad siis, kui maakoor pärast maavärinasarja esimest tugevat liikumist kohaneb.'], 'Aftershock'],
    ['s011-subduction',
      ['What process forces one tectonic plate beneath another at a plate boundary?', 'Kuidas nimetatakse protsessi, mille käigus surutakse üks laam laamapiiril teise alla?'],
      ['Subduction', 'Subduktsioon'], [['Plate subduction'], ['Laama sukeldumine']],
      ['Subduction carries one tectonic plate into the mantle beneath another and can drive earthquakes and volcanism.', 'Subduktsioon viib ühe laama teise all vahevöösse ning võib põhjustada maavärinaid ja vulkanismi.'], 'Subduction'],
    ['s011-caldera',
      ['What large volcanic depression can form when the ground collapses after an eruption?', 'Milline suur vulkaaniline nõgu võib tekkida, kui maapind pärast purset sisse vajub?'],
      ['A caldera', 'Kaldeera'], [['Volcanic caldera'], ['Vulkaanikaldeera']],
      ['A caldera forms when the roof above a magma chamber collapses after magma is withdrawn.', 'Kaldeera tekib siis, kui magmakambri kohal olev maapind pärast magma väljumist sisse vajub.'], 'Caldera'],
  ]),
]);

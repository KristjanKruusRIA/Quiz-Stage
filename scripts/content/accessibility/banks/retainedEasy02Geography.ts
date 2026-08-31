import type { AccessibleCategory, AccessibleQuestion } from '../types';
import { validateAccessibleCorpus } from '../validateBank';

type Fact = readonly [
  key: string,
  subjectKey: string,
  clueEn: string,
  clueEt: string,
  responseEn: string,
  responseEt: string,
  explanationEn: string,
  explanationEt: string,
  wikipediaPage: string,
  variantsEn?: readonly string[],
  variantsEt?: readonly string[],
];

type CategoryDraft = Readonly<{
  categorySetId: string;
  name: Readonly<{ en: string; et: string }>;
  facts: readonly Fact[];
}>;

const BATCH_ID = '02-geography';

const TARGETS = [
  { categorySetId: 'built-in-geography-set-001', batchId: BATCH_ID },
  { categorySetId: 'built-in-geography-set-003', batchId: BATCH_ID },
  { categorySetId: 'built-in-geography-set-010', batchId: BATCH_ID },
  { categorySetId: 'built-in-geography-set-011', batchId: BATCH_ID },
  { categorySetId: 'built-in-geography-set-013', batchId: BATCH_ID },
  { categorySetId: 'built-in-geography-set-018', batchId: BATCH_ID },
  { categorySetId: 'built-in-geography-set-030', batchId: BATCH_ID },
  { categorySetId: 'built-in-geography-set-033', batchId: BATCH_ID },
] as const;

const DRAFTS: readonly CategoryDraft[] = [
  {
    categorySetId: 'built-in-geography-set-001',
    name: { en: 'Geography: Natural Giants of Earth', et: 'Geograafia: Maa loodushiiglased' },
    facts: [
      ['giant-pacific-ocean', 'natural-pacific-ocean', 'Which ocean covers more of Earth than any other?', 'Milline ookean katab Maast suurema osa kui ükski teine ookean?', 'the Pacific Ocean', 'Vaikne ookean', 'The Pacific covers a wider area and reaches greater depths than the other ocean divisions.', 'Vaikne ookean katab teistest ookeanidest suurema ala ja ulatub sügavamale.', 'Pacific_Ocean', ['Pacific'], ['Pacific Ocean']],
      ['giant-everest-above-sea', 'natural-mount-everest', 'Which Himalayan peak reaches the greatest height above sea level?', 'Milline Himaalaja tipp ulatub merepinnast kõige kõrgemale?', 'Mount Everest', 'Mount Everest', 'Mount Everest’s summit stands farther above sea level than that of any other mountain.', 'Mount Everesti tipp asub merepinnast kõrgemal kui ühegi teise mäe tipp.', 'Mount_Everest', ['Everest'], ['Everest', 'Džomolungma']],
      ['giant-sahara-hot-desert', 'natural-sahara-desert', 'Which vast hot desert stretches across much of North Africa?', 'Milline tohutu kuum kõrb ulatub üle suure osa Põhja-Aafrikast?', 'the Sahara', 'Sahara', 'The Sahara spans most of North Africa between the Atlantic, Red Sea, Sahel, and Mediterranean.', 'Sahara katab suure osa Põhja-Aafrikast Atlandi ookeani, Punase mere, Saheli ja Vahemere vahel.', 'Sahara', ['Sahara Desert'], ['Sahara kõrb']],
      ['giant-salar-de-uyuni', 'natural-salar-de-uyuni', 'Which Bolivian salt flat becomes a giant natural mirror after rain?', 'Milline Boliivia soolatasandik muutub pärast vihma hiiglaslikuks looduslikuks peegliks?', 'Salar de Uyuni', 'Uyuni soolatasandik', 'A thin layer of rainwater can turn Salar de Uyuni’s vast white surface into a natural mirror.', 'Õhuke vihmaveekiht võib muuta Uyuni soolatasandiku avara valge pinna looduslikuks peegliks.', 'Salar_de_Uyuni', ['Uyuni salt flat'], ['Salar de Uyuni', 'Uyuni soolak']],
      ['giant-lake-baikal-deepest', 'natural-lake-baikal', 'Which Siberian lake is the deepest lake in the world?', 'Milline Siberi järv on maailma sügavaim?', 'Lake Baikal', 'Baikali järv', 'Lake Baikal reaches greater depths than any other lake and holds a vast volume of fresh water.', 'Baikali järv ulatub sügavamale kui ükski teine järv ning sisaldab tohutul hulgal magevett.', 'Lake_Baikal', ['Baikal'], ['Baikal']],
    ],
  },
  {
    categorySetId: 'built-in-geography-set-003',
    name: { en: 'Geography: Islands with a Story', et: 'Geograafia: Lugudega saared' },
    facts: [
      ['island-mallorca-palma', 'island-mallorca', 'Which Spanish Mediterranean island is home to Palma and is famous as a beach-holiday destination?', 'Millisel Hispaania Vahemere saarel asub Palma ning mis on tuntud rannapuhkuse sihtkoht?', 'Mallorca', 'Mallorca', 'Mallorca belongs to Spain’s Balearic Islands, and its capital is Palma.', 'Mallorca kuulub Hispaania Baleaaride saarestikku ning selle pealinn on Palma.', 'Mallorca', ['Majorca'], ['Mallorca saar', 'Majorca']],
      ['island-greenland-largest', 'island-greenland', 'Which huge Arctic island lies mostly beneath an ice sheet?', 'Milline tohutu Arktika saar asub suuresti jääkilbi all?', 'Greenland', 'Gröönimaa', 'Greenland is an Arctic island between the North Atlantic and Arctic oceans.', 'Gröönimaa on Arktika saar Põhja-Atlandi ja Põhja-Jäämere vahel.', 'Greenland'],
      ['island-rapa-nui-moai', 'island-rapa-nui', 'Which remote Pacific island is famous for giant stone statues called moai?', 'Milline kauge Vaikse ookeani saar on kuulus moai-nimeliste hiiglaslike kivikujude poolest?', 'Easter Island', 'Lihavõttesaar', 'Rapa Nui, also called Easter Island, is known for monumental moai carved by Polynesian islanders.', 'Rapa Nui ehk Lihavõttesaar on tuntud Polüneesia saareelanike raiutud monumentaalsete moai-kujude poolest.', 'Easter_Island', ['Rapa Nui'], ['Rapa Nui']],
      ['island-borneo-three-countries', 'island-borneo', 'Which Southeast Asian island is divided among Indonesia, Malaysia, and Brunei?', 'Milline Kagu-Aasia saar on jagatud Indoneesia, Malaisia ja Brunei vahel?', 'Borneo', 'Borneo', 'Indonesia occupies most of Borneo, while Malaysia and Brunei share its northern part.', 'Suurem osa Borneost kuulub Indoneesiale, põhjaosa jagavad Malaisia ja Brunei.', 'Borneo'],
      ['island-honshu-tokyo-fuji', 'island-honshu', 'Which Japanese island is home to both Tokyo and Mount Fuji?', 'Millisel Jaapani saarel asuvad nii Tokyo kui ka Fuji mägi?', 'Honshu', 'Honshū', 'Honshu contains Tokyo, Mount Fuji, and many other major Japanese cities.', 'Honshūl asuvad Tokyo, Fuji mägi ja paljud teised Jaapani suurlinnad.', 'Honshu', ['Honshū'], ['Honshu']],
    ],
  },
  {
    categorySetId: 'built-in-geography-set-010',
    name: { en: 'Geography: Routes That Changed the Map', et: 'Geograafia: Teed, mis muutsid kaarti' },
    facts: [
      ['route-panama-canal', 'route-panama-canal', 'Which canal lets ships cross between the Atlantic and Pacific without sailing around South America?', 'Milline kanal võimaldab laevadel liikuda Atlandi ja Vaikse ookeani vahel ümber Lõuna-Ameerika sõitmata?', 'the Panama Canal', 'Panama kanal', 'The Panama Canal cuts across the Isthmus of Panama and links the two oceans.', 'Panama kanal läbib Panama maakitsust ning ühendab kaks ookeani.', 'Panama_Canal', ['Panama Canal'], ['Panama Canal']],
      ['route-channel-tunnel', 'route-channel-tunnel', 'Which rail tunnel carries trains beneath the English Channel between Britain and France?', 'Milline raudteetunnel viib rongid Suurbritannia ja Prantsusmaa vahel La Manche’i väina alt läbi?', 'the Channel Tunnel', 'La Manche’i tunnel', 'The Channel Tunnel links Folkestone in England with Coquelles near Calais in France.', 'La Manche’i tunnel ühendab Inglismaal Folkestone’i ja Prantsusmaal Calais’ lähedal asuva Coquelles’i.', 'Channel_Tunnel', ['Channel Tunnel', 'Eurotunnel', 'Chunnel'], ['Eurotunnel']],
      ['route-suez-canal', 'route-suez-canal', 'Which Egyptian canal gives ships a direct route between the Mediterranean and Red seas?', 'Milline Egiptuse kanal annab laevadele otsetee Vahemere ja Punase mere vahel?', 'the Suez Canal', 'Suessi kanal', 'The Suez Canal crosses the Isthmus of Suez and avoids the voyage around Africa.', 'Suessi kanal läbib Suessi maakitsust ning võimaldab vältida ümber Aafrika sõitmist.', 'Suez_Canal', ['Suez Canal'], ['Suez Canal']],
      ['route-trans-siberian', 'route-trans-siberian-railway', 'Which famous railway crosses Russia from Moscow to Vladivostok?', 'Milline kuulus raudtee kulgeb läbi Venemaa Moskvast Vladivostokki?', 'the Trans-Siberian Railway', 'Trans-Siberi raudtee', 'The Trans-Siberian Railway forms the principal rail connection across Russia to the Pacific coast.', 'Trans-Siberi raudtee moodustab peamise raudteeühenduse läbi Venemaa Vaikse ookeani rannikule.', 'Trans-Siberian_Railway', ['Trans-Siberian Railroad', 'Trans-Siberian'], ['Transsiberi raudtee', 'Trans-Siberian Railway']],
      ['route-drake-passage', 'route-drake-passage', 'Which rough sea passage separates Cape Horn from Antarctica?', 'Milline tormine mereväin eraldab Hoorni neeme Antarktikast?', 'the Drake Passage', 'Drake’i väin', 'The Drake Passage lies between South America’s Cape Horn and the South Shetland Islands of Antarctica.', 'Drake’i väin asub Lõuna-Ameerika Hoorni neeme ja Antarktika Lõuna-Shetlandi saarte vahel.', 'Drake_Passage', ['Drake Passage', 'Sea of Hoces'], ['Drake Passage']],
    ],
  },
  {
    categorySetId: 'built-in-geography-set-011',
    name: { en: 'Geography: The World Is Full of Surprises', et: 'Geograafia: Maailm on täis üllatusi' },
    facts: [
      ['surprise-antarctica-desert', 'surprise-antarctica-desert', 'Which ice-covered continent is classed as a desert because it receives so little precipitation?', 'Millist jääga kaetud maailmajagu liigitatakse väheste sademete tõttu kõrbeks?', 'Antarctica', 'Antarktika', 'Antarctica receives so little precipitation that it is classified as a polar desert.', 'Antarktikas sajab nii vähe, et seda liigitatakse polaarkõrbeks.', 'Antarctica'],
      ['surprise-dead-sea-lake', 'surprise-dead-sea-lake', 'Despite its name, what kind of body of water is the Dead Sea?', 'Mis liiki veekogu on Surnumeri oma nimest hoolimata?', 'a salt lake', 'soolajärv', 'The Dead Sea is a landlocked hypersaline lake between Jordan and the West Bank.', 'Surnumeri on Jordaania ja Jordani Läänekalda vahel asuv äravooluta ülisoolane järv.', 'Dead_Sea', ['saline lake', 'lake'], ['soolane järv', 'järv']],
      ['surprise-netherlands-polders', 'surprise-netherlands-polders', 'Which European country is famous for polders reclaimed from lakes and the sea?', 'Milline Euroopa riik on tuntud järvedelt ja merelt tagasi võidetud poldermaade poolest?', 'the Netherlands', 'Madalmaad', 'Dutch dikes, drainage works, and polders have created extensive reclaimed land.', 'Madalmaade tammid, kuivendussüsteemid ja poldrid on loonud ulatuslikke merelt võidetud alasid.', 'Land_reclamation_in_the_Netherlands', ['Netherlands', 'Holland'], ['Holland']],
      ['surprise-lesotho-surrounded', 'surprise-lesotho-enclave', 'Which African kingdom is completely surrounded by South Africa?', 'Milline Aafrika kuningriik on igast küljest ümbritsetud Lõuna-Aafrika Vabariigiga?', 'Lesotho', 'Lesotho', 'Lesotho is an independent mountain kingdom entirely enclosed by South African territory.', 'Lesotho on iseseisev mägine kuningriik, mida ümbritseb täielikult Lõuna-Aafrika Vabariigi territoorium.', 'Lesotho', ['Kingdom of Lesotho'], ['Lesotho Kuningriik']],
      ['surprise-congo-crosses-equator', 'surprise-congo-river-equator', 'Which major African river crosses the Equator twice?', 'Milline suur Aafrika jõgi ületab ekvaatori kaks korda?', 'the Congo River', 'Kongo jõgi', 'The Congo’s broad arc carries it across the Equator once northward and once southward.', 'Kongo jõe lai kaar viib selle üle ekvaatori korra põhja ja korra lõuna suunas.', 'Congo_River', ['Congo', 'Zaire River'], ['Kongo', 'Sairi jõgi']],
    ],
  },
  {
    categorySetId: 'built-in-geography-set-013',
    name: { en: 'Geography: Weather That Travels', et: 'Geograafia: Rändav ilm' },
    facts: [
      ['weather-hurricane-atlantic', 'weather-atlantic-hurricane', 'What name is used for a powerful tropical cyclone over the North Atlantic?', 'Kuidas nimetatakse võimsat troopilist tsüklonit Põhja-Atlandil?', 'hurricane', 'orkaan', 'Tropical cyclones in the North Atlantic and northeastern Pacific are called hurricanes.', 'Põhja-Atlandi ja Vaikse ookeani kirdeosa troopilisi tsükloneid nimetatakse orkaanideks.', 'Tropical_cyclone', ['Atlantic hurricane'], ['hurikaan']],
      ['weather-monsoon', 'weather-monsoon', 'Which seasonal wind system brings a major rainy season to much of South Asia?', 'Milline hooajaline tuulesüsteem toob suurele osale Lõuna-Aasiast tugeva vihmaperioodi?', 'monsoon', 'mussoon', 'The South Asian monsoon reverses wind direction seasonally and carries moist ocean air over land.', 'Lõuna-Aasia mussoon muudab hooajaliselt tuule suunda ning kannab niisket ookeaniõhku maismaa kohale.', 'Monsoon'],
      ['weather-jet-stream', 'weather-jet-stream', 'What fast ribbon of air high in the atmosphere helps steer weather systems?', 'Milline kiire õhuvool kõrgel atmosfääris aitab ilmasüsteeme suunata?', 'the jet stream', 'jugavool', 'Jet streams are narrow bands of strong winds that influence the paths of weather systems.', 'Jugavoolud on kitsad tugevate tuulte vööndid, mis mõjutavad ilmasüsteemide liikumisteid.', 'Jet_stream', ['jetstream'], ['reaktiivvool']],
      ['weather-rain-shadow', 'weather-rain-shadow', 'What dry region forms on the sheltered side of a mountain range after moist air loses rain on the windward side?', 'Kuidas nimetatakse kuiva ala mäestiku varjuküljel, kui niiske õhk on tuulepealsel nõlval vihma maha sadanud?', 'rain shadow', 'vihmavari', 'Descending air warms and dries on the leeward side, producing a rain-shadow region.', 'Laskuv õhk soojeneb ja kuivab tuulealusel küljel ning tekitab vihmavarjualuse piirkonna.', 'Rain_shadow', ['precipitation shadow'], ['sademetevari', 'vihmavarjuala']],
      ['weather-atmospheric-river', 'weather-atmospheric-river', 'What name is given to a long, narrow band of air carrying huge amounts of water vapour?', 'Kuidas nimetatakse pikka kitsast õhuvööndit, mis kannab tohutul hulgal veeauru?', 'an atmospheric river', 'atmosfäärijõgi', 'Atmospheric rivers can transport tropical moisture over great distances and produce heavy rain or snow.', 'Atmosfäärijõed võivad kanda troopilist niiskust väga kaugele ning tuua tugevat vihma või lund.', 'Atmospheric_river', ['atmospheric river'], ['atmosfääri jõgi']],
    ],
  },
  {
    categorySetId: 'built-in-geography-set-018',
    name: { en: 'Geography: North, South, and the Polar World', et: 'Geograafia: Põhi, lõuna ja polaarmaailm' },
    facts: [
      ['polar-geographic-south-pole', 'polar-geographic-south-pole', 'What is the southern point where Earth’s rotation axis meets its surface called?', 'Kuidas nimetatakse Maa telje ja maapinna lõunapoolset lõikepunkti?', 'the South Pole', 'lõunapoolus', 'The geographic South Pole is the southern endpoint of Earth’s axis of rotation.', 'Geograafiline lõunapoolus on Maa pöörlemistelje lõunapoolne otspunkt.', 'South_Pole', ['geographic South Pole', 'South Pole'], ['geograafiline lõunapoolus']],
      ['polar-bears-arctic', 'polar-bear-arctic-range', 'Which polar region is the natural home of wild polar bears?', 'Milline polaarpiirkond on looduslike jääkarude kodu?', 'the Arctic', 'Arktika', 'Wild polar bears live around the ice-covered seas of the Arctic, not in Antarctica.', 'Looduslikud jääkarud elavad Arktika jääga kaetud merede ümbruses, mitte Antarktikas.', 'Polar_bear', ['Arctic region'], ['põhjapolaarala']],
      ['polar-penguins-southern', 'polar-penguin-southern-hemisphere', 'In which half of the globe are Antarctica and nearly all wild penguin populations found?', 'Kummal poolkeral asuvad Antarktika ja peaaegu kõik looduslikud pingviinipopulatsioonid?', 'the Southern Hemisphere', 'lõunapoolkera', 'Nearly all wild penguins live in the Southern Hemisphere, although Galápagos penguins can occur just north of the Equator.', 'Peaaegu kõik looduslikud pingviinid elavad lõunapoolkeral, ehkki Galápagose pingviine leidub ka vahetult ekvaatorist põhja pool.', 'Penguin', ['southern half of the globe'], ['lõunapoolne poolkera']],
      ['polar-midnight-sun', 'polar-midnight-sun', 'What phenomenon keeps the Sun visible at local midnight during polar summer?', 'Kuidas nimetatakse nähtust, mille puhul püsib Päike polaaraladel suvel nähtaval ka keskööl?', 'the midnight sun', 'keskööpäike', 'Inside the polar circles, Earth’s axial tilt can keep the Sun above the horizon through the night.', 'Polaarjoonte sees võib Maa telje kalle hoida Päikese kogu öö horisondi kohal.', 'Midnight_sun', ['polar day'], ['polaarpäev']],
      ['polar-aurora-australis', 'polar-aurora-australis', 'What is the southern counterpart of the aurora borealis called?', 'Kuidas nimetatakse virmaliste lõunapoolset vastet?', 'aurora australis', 'lõunatuled', 'Aurora australis is the Southern Hemisphere display produced by charged particles in Earth’s upper atmosphere.', 'Lõunatuled on lõunapoolkera valgusnähtus, mille tekitavad Maa ülakihtides laetud osakesed.', 'Aurora', ['southern lights', 'southern aurora'], ['aurora australis', 'lõunavirmalised']],
    ],
  },
  {
    categorySetId: 'built-in-geography-set-030',
    name: { en: 'Geography: Cities Shaped by Their Setting', et: 'Geograafia: Asukoha kujundatud linnad' },
    facts: [
      ['city-venice-lagoon', 'city-venice-lagoon', 'Which Italian city spreads across islands in a lagoon and uses canals as streets?', 'Milline Itaalia linn paikneb laguuni saartel ning kasutab kanaleid tänavatena?', 'Venice', 'Veneetsia', 'Venice was built on islands in the Venetian Lagoon and is linked by canals and bridges.', 'Veneetsia rajati Veneetsia laguuni saartele ning seda ühendavad kanalid ja sillad.', 'Venice'],
      ['city-budapest-danube', 'city-budapest-danube', 'Which European capital grew from Buda and Pest on opposite banks of the Danube?', 'Milline Euroopa pealinn kujunes Doonau vastaskallastel asunud Budast ja Pestist?', 'Budapest', 'Budapest', 'Buda and Pest were unified with Óbuda in 1873 to form Budapest on both sides of the Danube.', 'Buda ja Pest ühendati 1873. aastal Óbudaga ning nii tekkis mõlemal pool Doonaud asuv Budapest.', 'Budapest'],
      ['city-rio-guanabara', 'city-rio-guanabara-bay', 'Which Brazilian city curves around Guanabara Bay beneath Sugarloaf Mountain?', 'Milline Brasiilia linn kaardub Guanabara lahe ümber Suhkrupeamäe all?', 'Rio de Janeiro', 'Rio de Janeiro', 'Rio de Janeiro developed around Guanabara Bay between steep granite peaks and the Atlantic.', 'Rio de Janeiro kujunes Guanabara lahe ümber järskude graniittippude ja Atlandi ookeani vahel.', 'Rio_de_Janeiro', ['Rio'], ['Rio']],
      ['city-mexico-city-lakebed', 'city-mexico-city-lakebed', 'Which North American capital is slowly sinking because much of it was built on a former lakebed?', 'Milline Põhja-Ameerika pealinn vajub aeglaselt, sest suur osa sellest ehitati endisele järvepõhjale?', 'Mexico City', 'México', 'Mexico City was built over the drained bed of Lake Texcoco, and groundwater extraction has contributed to subsidence.', 'México rajati kuivendatud Texcoco järve põhjale ning põhjavee ammutamine on aidanud kaasa linna vajumisele.', 'Mexico_City', ['City of Mexico', 'CDMX'], ['Mexico City', 'México linn']],
      ['city-la-paz-andes-valley', 'city-la-paz-andes-valley', 'Which Bolivian seat of government fills a deep Andean valley beneath Mount Illimani?', 'Milline Boliivia valitsuse asukoht täidab sügavat Andide orgu Illimani mäe all?', 'La Paz', 'La Paz', 'La Paz spreads through a steep valley on the Altiplano’s eastern edge beneath Illimani.', 'La Paz laiub järsus orus Altiplano idaserval Illimani mäe all.', 'La_Paz', ['Nuestra Señora de La Paz'], ['Nuestra Señora de La Paz']],
    ],
  },
  {
    categorySetId: 'built-in-geography-set-033',
    name: { en: 'Geography: Clues Hidden in a Map', et: 'Geograafia: Kaardile peidetud vihjed' },
    facts: [
      ['map-legend-symbols', 'map-legend-symbols', 'What box on a map explains the meaning of its colours and symbols?', 'Milline kaardi osa selgitab selle värvide ja leppemärkide tähendust?', 'a map legend', 'kaardilegend', 'A map legend, also called a map key, links symbols and colours to the features they represent.', 'Kaardilegend ehk leppemärkide seletus seob sümbolid ja värvid nende kujutatud nähtustega.', 'Map_legend', ['map key'], ['kaardivõti', 'leppemärkide seletus']],
      ['map-equator', 'map-equator', 'Which imaginary line divides Earth into northern and southern hemispheres?', 'Milline kujuteldav joon jagab Maa põhja- ja lõunapoolkeraks?', 'the Equator', 'ekvaator', 'The Equator circles Earth midway between the geographic poles.', 'Ekvaator kulgeb ümber Maa geograafiliste pooluste vahelisel keskjoonel.', 'Equator', ['Equator'], ['Maa ekvaator']],
      ['map-scale', 'map-scale', 'What map feature explains how a distance on paper relates to the real distance on the ground?', 'Milline kaardi osa näitab, kuidas paberil mõõdetud vahemaa vastab tegelikule vahemaale maastikul?', 'scale', 'mõõtkava', 'A map scale expresses the ratio between a measured map distance and its real-world equivalent.', 'Kaardi mõõtkava väljendab kaardil mõõdetud vahemaa ja tegeliku vahemaa suhet.', 'Scale_(map)', ['map scale'], ['kaardi mõõtkava']],
      ['map-contour-line', 'map-contour-line', 'What line joins places of equal height on a topographic map?', 'Milline joon ühendab topograafilisel kaardil sama kõrgusega kohti?', 'contour line', 'samakõrgusjoon', 'Closely spaced contour lines indicate a steeper slope than widely spaced lines.', 'Tihedalt paiknevad samakõrgusjooned näitavad järsemat nõlva kui hõredad jooned.', 'Contour_line', ['contour'], ['horisontaal', 'kõrgusjoon']],
      ['map-prime-meridian', 'map-prime-meridian', 'Which reference meridian passes through Greenwich and divides eastern from western longitude?', 'Milline Greenwichi läbiv võrdlusmeridiaan eraldab ida- ja läänepikkusi?', 'the prime meridian', 'algmeridiaan', 'The Greenwich prime meridian is the conventional origin for measuring longitude.', 'Greenwichi algmeridiaan on geograafilise pikkuse mõõtmise kokkuleppeline lähtejoon.', 'Prime_meridian', ['Greenwich meridian', 'zero meridian'], ['Greenwichi meridiaan', 'nullmeridiaan']],
    ],
  },
];

function sourceTitle(page: string): string {
  return decodeURIComponent(page.split('#', 1)[0]!.replaceAll('_', ' '));
}

function buildQuestion(fact: Fact, tier: 1 | 2 | 3 | 4 | 5): AccessibleQuestion {
  const [
    key,
    subjectKey,
    clueEn,
    clueEt,
    responseEn,
    responseEt,
    explanationEn,
    explanationEt,
    wikipediaPage,
    variantsEn = [],
    variantsEt = [],
  ] = fact;
  return {
    key: `retained-easy-02:${key}`,
    tier,
    subjectKey: `retained-easy-02:${subjectKey}`,
    clue: { en: clueEn, et: clueEt },
    response: { en: responseEn, et: responseEt },
    acceptedVariants: { en: variantsEn, et: variantsEt },
    explanation: { en: explanationEn, et: explanationEt },
    source: {
      sourceId: `wikipedia:${wikipediaPage.toLocaleLowerCase('en')}`,
      title: sourceTitle(wikipediaPage),
      url: `https://en.wikipedia.org/wiki/${wikipediaPage}`,
      license: 'CC-BY-SA-4.0',
      retrievedAt: '2026-08-31',
    },
  };
}

const rawCategories: readonly AccessibleCategory[] = DRAFTS.map((draft) => ({
  categorySetId: draft.categorySetId,
  batchId: BATCH_ID,
  name: draft.name,
  questions: draft.facts.map((fact, index) =>
    buildQuestion(fact, (index + 1) as 1 | 2 | 3 | 4 | 5)),
}));

export const RETAINED_EASY_02_GEOGRAPHY_CATEGORIES = validateAccessibleCorpus(
  rawCategories,
  TARGETS,
);

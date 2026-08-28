import { PLAYABLE_TARGETS } from '../../targets';
import type { PlayableCategory } from '../../types';
import { validatePlayableCorpus } from '../../validateBank';

const ASSIGNED_TARGETS = PLAYABLE_TARGETS.filter(({ batchId }) => batchId === '03-science-nature');

const rawCategories = [
  {
    categorySetId: 'built-in-science-nature-set-005', batchId: '03-science-nature', packId: 'built-in-science-nature', difficulty: 'medium',
    name: { en: 'Forces You Can Feel', et: 'Jõud, mida saab tunda' },
    questions: [
      {
        key: 'playable-science-nature:built-in-science-nature-set-005:drag-falling-parachute', factKey: 'science-nature:drag-falling-parachute', tier: 1, subjectKey: 'concept:drag',
        clue: { en: 'A parachute slows a skydiver by meeting resistance from the air. What force is this?', et: 'Langevari aeglustab langevarjurit, sest kohtab õhu vastupanu. Mis jõud see on?' }, response: { en: 'drag', et: 'takistusjõud' }, acceptedVariants: { en: ['air resistance', 'fluid resistance'], et: ['õhutakistus', 'vedelikutakistus'] },
        explanation: { en: 'Drag is the force that opposes motion through a fluid such as air or water.', et: 'Takistusjõud on jõud, mis vastandub liikumisele vedelikus või gaasis, näiteks õhus või vees.' },
        source: { sourceId: 'wikipedia:drag-physics', title: 'Drag (physics)', url: 'https://en.wikipedia.org/wiki/Drag_(physics)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-005:friction-braking-bicycle', factKey: 'science-nature:friction-braking-bicycle', tier: 2, subjectKey: 'concept:friction',
        clue: { en: 'What force between a bicycle tyre and the road lets the rider brake without simply sliding onward?', et: 'Milline rehvi ja tee vaheline jõud võimaldab jalgratturil pidurdada ilma edasi libisemata?' }, response: { en: 'friction', et: 'hõõrdejõud' }, acceptedVariants: { en: ['frictional force'], et: ['hõõre'] },
        explanation: { en: 'Friction resists motion where surfaces touch and gives tyres their grip.', et: 'Hõõrdejõud takistab kokkupuutuvate pindade liikumist ja annab rehvidele haardumise.' },
        source: { sourceId: 'wikipedia:friction', title: 'Friction', url: 'https://en.wikipedia.org/wiki/Friction', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-005:inertia-seatbelt', factKey: 'science-nature:inertia-seatbelt', tier: 3, subjectKey: 'concept:inertia',
        clue: { en: 'A seat belt stops your body continuing forward when a car stops suddenly. What property is at work?', et: 'Turvavöö takistab su kehal auto järsul peatumisel edasi liikumast. Milline omadus on siin mängus?' }, response: { en: 'inertia', et: 'inerts' }, acceptedVariants: { en: ['inertial motion'], et: ['inertsus'] },
        explanation: { en: 'Inertia is the tendency of an object to resist a change in its motion.', et: 'Inerts on keha kalduvus oma liikumisoleku muutmisele vastu panna.' },
        source: { sourceId: 'wikipedia:inertia', title: 'Inertia', url: 'https://en.wikipedia.org/wiki/Inertia', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-005:buoyancy-floating-boat', factKey: 'science-nature:buoyancy-floating-boat', tier: 4, subjectKey: 'concept:buoyancy',
        clue: { en: 'What upward force lets a steel ship float while a loose steel nail sinks?', et: 'Milline ülespoole suunatud jõud laseb teraslaeval ujuda, kuigi üksik terasnael vajub põhja?' }, response: { en: 'buoyancy', et: 'üleslükkejõud' }, acceptedVariants: { en: ['buoyant force', 'upthrust'], et: ['ujuvusjõud', 'Archimedese jõud'] },
        explanation: { en: 'Buoyancy is the upward force a fluid exerts on an immersed object.', et: 'Üleslükkejõud on vedeliku sukeldunud kehale avaldatav ülespoole suunatud jõud.' },
        source: { sourceId: 'wikipedia:buoyancy', title: 'Buoyancy', url: 'https://en.wikipedia.org/wiki/Buoyancy', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-005:centripetal-turning-car', factKey: 'science-nature:centripetal-turning-car', tier: 5, subjectKey: 'concept:centripetal-force',
        clue: { en: 'What name is given to the inward net force required to keep a car following a curved path?', et: 'Kuidas nimetatakse sissepoole suunatud resultantjõudu, mida on vaja auto hoidmiseks kõveral trajektooril?' }, response: { en: 'centripetal force', et: 'kesktõmbejõud' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Centripetal force is the inward net force that produces centripetal acceleration; it is not itself an extra fundamental force.', et: 'Kesktõmbejõud on sissepoole suunatud resultantjõud, mis tekitab kesktõmbekiirenduse; see ei ole eraldi fundamentaaljõud.' },
        source: { sourceId: 'wikipedia:centripetal-force', title: 'Centripetal force', url: 'https://en.wikipedia.org/wiki/Centripetal_force', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
    ],
  },
  {
    categorySetId: 'built-in-science-nature-set-006', batchId: '03-science-nature', packId: 'built-in-science-nature', difficulty: 'medium',
    name: { en: 'Matter in Motion', et: 'Aine muutumises' },
    questions: [
      { key: 'playable-science-nature:built-in-science-nature-set-006:evaporation-laundry', factKey: 'science-nature:evaporation-laundry', tier: 1, subjectKey: 'process:evaporation', clue: { en: 'Wet laundry dries because surface water escapes into the air by which process?', et: 'Märg pesu kuivab, sest pinnavesi siirdub õhku millise protsessi kaudu?' }, response: { en: 'evaporation', et: 'aurumine' }, acceptedVariants: { en: [], et: [] }, explanation: { en: 'Evaporation is the escape of liquid molecules into a gas from a surface.', et: 'Aurumine on vedeliku molekulide lahkumine pinnalt gaasilisse olekusse.' }, source: { sourceId: 'wikipedia:evaporation', title: 'Evaporation', url: 'https://en.wikipedia.org/wiki/Evaporation', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' } },
      { key: 'playable-science-nature:built-in-science-nature-set-006:boiling-point-pressure', factKey: 'science-nature:boiling-point-pressure', tier: 2, subjectKey: 'property:boiling-point', clue: { en: 'What temperature is reached when a liquid’s vapour pressure equals the pressure around it?', et: 'Kuidas nimetatakse temperatuuri, mille juures vedeliku aururõhk võrdub ümbritseva rõhuga?' }, response: { en: 'boiling point', et: 'keemispunkt' }, acceptedVariants: { en: ['boiling temperature'], et: ['keemistemperatuur'] }, explanation: { en: 'At the boiling point, vapour bubbles can form throughout a liquid because its vapour pressure matches the surrounding pressure.', et: 'Keemispunktis saavad aurumullid tekkida kogu vedelikus, sest selle aururõhk võrdub ümbritseva rõhuga.' }, source: { sourceId: 'wikipedia:boiling-point', title: 'Boiling point', url: 'https://en.wikipedia.org/wiki/Boiling_point', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' } },
      { key: 'playable-science-nature:built-in-science-nature-set-006:deposition-frost', factKey: 'science-nature:deposition-frost', tier: 3, subjectKey: 'process:deposition', clue: { en: 'On a cold window, water vapour can turn directly into ice crystals without first becoming liquid. Name this phase change.', et: 'Külmal aknal võib veeaur muutuda otse jääkristallideks, ilma et tekiks esmalt vedelik. Nimeta see olekumuutus.' }, response: { en: 'deposition', et: 'härmatumine' }, acceptedVariants: { en: ['desublimation'], et: ['desublimatsioon'] }, explanation: { en: 'Deposition is the direct transition from a gas to a solid; frost can form this way.', et: 'Härmatumine on gaasi otsene üleminek tahkesse olekusse; nii võib tekkida härmatis.' }, source: { sourceId: 'wikipedia:deposition-phase-transition', title: 'Deposition (phase transition)', url: 'https://en.wikipedia.org/wiki/Deposition_(phase_transition)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' } },
      { key: 'playable-science-nature:built-in-science-nature-set-006:latent-heat-phase-change', factKey: 'science-nature:latent-heat-phase-change', tier: 4, subjectKey: 'energy:latent-heat', clue: { en: 'During a phase change, a substance can absorb energy while its temperature stays constant. What is this energy called?', et: 'Olekumuutuse ajal võib aine neelata energiat nii, et selle temperatuur ei tõuse. Kuidas seda energiat nimetatakse?' }, response: { en: 'latent heat', et: 'varjatud soojus' }, acceptedVariants: { en: ['heat of transformation'], et: ['peitsoojus', 'latentne soojus'] }, explanation: { en: 'Latent heat changes the arrangement of particles during a phase transition instead of raising temperature.', et: 'Varjatud soojus muudab faasisiirde ajal osakeste paigutust, selle asemel et tõsta temperatuuri.' }, source: { sourceId: 'wikipedia:latent-heat', title: 'Latent heat', url: 'https://en.wikipedia.org/wiki/Latent_heat', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' } },
      { key: 'playable-science-nature:built-in-science-nature-set-006:sublimation-dry-ice', factKey: 'science-nature:sublimation-dry-ice', tier: 5, subjectKey: 'process:sublimation', clue: { en: 'Dry ice disappears without making a puddle because solid carbon dioxide undergoes what process?', et: 'Kuiv jää kaob lompi tegemata, sest tahke süsinikdioksiid läbib millise protsessi?' }, response: { en: 'sublimation', et: 'sublimatsioon' }, acceptedVariants: { en: ['subliming'], et: ['sublimeerumine'] }, explanation: { en: 'Sublimation is a direct change from solid to gas without a liquid stage.', et: 'Sublimatsioon on otsene üleminek tahkest olekust gaasilisse, ilma vedela vaheetapita.' }, source: { sourceId: 'wikipedia:sublimation-phase-transition', title: 'Sublimation (phase transition)', url: 'https://en.wikipedia.org/wiki/Sublimation_(phase_transition)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' } },
    ],
  },
  {
    categorySetId: 'built-in-science-nature-set-012', batchId: '03-science-nature', packId: 'built-in-science-nature', difficulty: 'medium',
    name: { en: 'Light’s Tricks', et: 'Valguse trikid' },
    questions: [
      { key: 'playable-science-nature:built-in-science-nature-set-012:polarization-sunglasses', factKey: 'science-nature:polarization-sunglasses', tier: 1, subjectKey: 'phenomenon:polarization', clue: { en: 'Some sunglasses cut glare by allowing mainly one orientation of light waves through. Name this optical property.', et: 'Mõned päikeseprillid vähendavad helki, lastes läbi peamiselt ühe võnkesuunaga valguslaineid. Nimeta see optiline omadus.' }, response: { en: 'polarization', et: 'polarisatsioon' }, acceptedVariants: { en: ['polarisation'], et: ['valguse polarisatsioon'] }, explanation: { en: 'Polarization describes the orientation of a transverse wave; polarizing filters select particular orientations.', et: 'Polarisatsioon kirjeldab ristlaine võnkesuunda; polariseerivad filtrid lasevad läbi valitud suunaga valgust.' }, source: { sourceId: 'wikipedia:polarization-waves', title: 'Polarization (waves)', url: 'https://en.wikipedia.org/wiki/Polarization_(waves)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' } },
      { key: 'playable-science-nature:built-in-science-nature-set-012:total-internal-reflection-fibre', factKey: 'science-nature:total-internal-reflection-fibre', tier: 2, subjectKey: 'phenomenon:total-internal-reflection', clue: { en: 'Above a critical angle, light in a fibre-optic core bounces back instead of escaping into the cladding. Name this phenomenon.', et: 'Kriitilisest nurgast suurema nurga korral peegeldub valgus optilise kiu südamikku tagasi ega pääse kattekihti. Nimeta see nähtus.' }, response: { en: 'total internal reflection', et: 'täielik sisepeegeldus' }, acceptedVariants: { en: ['TIR'], et: ['täissisepeegeldus'] }, explanation: { en: 'Total internal reflection occurs when light travelling in the optically denser material meets the boundary above the critical angle.', et: 'Täielik sisepeegeldus tekib siis, kui optiliselt tihedamas aines leviv valgus jõuab piirpinnale kriitilisest nurgast suurema nurga all.' }, source: { sourceId: 'wikipedia:total-internal-reflection', title: 'Total internal reflection', url: 'https://en.wikipedia.org/wiki/Total_internal_reflection', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' } },
      { key: 'playable-science-nature:built-in-science-nature-set-012:dispersion-prism', factKey: 'science-nature:dispersion-prism', tier: 3, subjectKey: 'phenomenon:dispersion', clue: { en: 'A prism separates white light into colours by which optical effect also seen in a rainbow?', et: 'Prisma jagab valge valguse värvideks millise optilise nähtuse abil, mida näeb ka vikerkaares?' }, response: { en: 'dispersion', et: 'dispersioon' }, acceptedVariants: { en: ['chromatic dispersion'], et: ['valguse dispersioon'] }, explanation: { en: 'Dispersion separates colours because wavelengths refract by different amounts.', et: 'Dispersioon eraldab värvid, sest eri lainepikkused murduvad erinevalt.' }, source: { sourceId: 'wikipedia:dispersion-optics', title: 'Dispersion (optics)', url: 'https://en.wikipedia.org/wiki/Dispersion_(optics)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' } },
      { key: 'playable-science-nature:built-in-science-nature-set-012:absorption-black-shirt', factKey: 'science-nature:absorption-black-shirt', tier: 4, subjectKey: 'phenomenon:absorption', clue: { en: 'A black shirt grows warmer in sunshine because it takes in much incoming light. What is this called?', et: 'Must särk läheb päikese käes soojemaks, sest neelab suure osa sellele langevast valgusest. Kuidas seda nimetatakse?' }, response: { en: 'absorption', et: 'neeldumine' }, acceptedVariants: { en: ['light absorption'], et: ['valguse neeldumine'] }, explanation: { en: 'Absorption transfers light energy into a material rather than reflecting it.', et: 'Neeldumisel kandub valguse energia materjali, mitte ei peegeldu sellelt.' }, source: { sourceId: 'wikipedia:absorption-electromagnetic-radiation', title: 'Absorption (electromagnetic radiation)', url: 'https://en.wikipedia.org/wiki/Absorption_(electromagnetic_radiation)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' } },
      { key: 'playable-science-nature:built-in-science-nature-set-012:fluorescence-marker', factKey: 'science-nature:fluorescence-marker', tier: 5, subjectKey: 'phenomenon:fluorescence', clue: { en: 'Highlighter ink can glow under ultraviolet light after absorbing it and emitting visible light. Name the effect.', et: 'Tekstimarkeri tint võib ultraviolettvalguses helendada pärast selle neelamist ja nähtava valguse kiirgamist. Nimeta nähtus.' }, response: { en: 'fluorescence', et: 'fluorestsents' }, acceptedVariants: { en: ['fluorescent emission'], et: ['fluorestseerumine'] }, explanation: { en: 'Fluorescence is prompt visible emission after a substance absorbs higher-energy light.', et: 'Fluorestsents on nähtava valguse kiire kiirgumine pärast suurema energiaga valguse neeldumist.' }, source: { sourceId: 'wikipedia:fluorescence', title: 'Fluorescence', url: 'https://en.wikipedia.org/wiki/Fluorescence', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' } },
    ],
  },
  {
    categorySetId: 'built-in-science-nature-set-035', batchId: '03-science-nature', packId: 'built-in-science-nature', difficulty: 'medium',
    name: { en: 'Genetic Instructions', et: 'Geneetilised juhised' },
    questions: [
      {
        key: 'playable-science-nature:built-in-science-nature-set-035:nucleotide-building-block', factKey: 'science-nature:nucleotide-building-block', tier: 1, subjectKey: 'molecule:nucleotide',
        clue: { en: 'What single building block of DNA or RNA contains a sugar, a phosphate group, and a nitrogenous base?', et: 'Milline DNA või RNA ehitusüksus koosneb suhkrust, fosfaatrühmast ja lämmastikalusest?' }, response: { en: 'a nucleotide', et: 'nukleotiid' }, acceptedVariants: { en: ['nucleotide'], et: ['üks nukleotiid'] },
        explanation: { en: 'Nucleic acids are chains of nucleotides, each built from a sugar, phosphate, and base.', et: 'Nukleiinhapped on nukleotiidide ahelad ning iga nukleotiid koosneb suhkrust, fosfaadist ja alusest.' },
        source: { sourceId: 'wikipedia:nucleotide-components', title: 'Nucleotide', url: 'https://en.wikipedia.org/wiki/Nucleotide', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-035:thymine-pairs-adenine', factKey: 'science-nature:thymine-pairs-adenine', tier: 2, subjectKey: 'base:thymine',
        clue: { en: 'In double-stranded DNA, adenine pairs with which nitrogenous base?', et: 'Millise lämmastikalusega paaristub adeniin DNA kaksikahelas?' }, response: { en: 'thymine', et: 'tümiin' }, acceptedVariants: { en: ['T'], et: ['T'] },
        explanation: { en: 'Two hydrogen bonds join adenine to thymine across the DNA double helix.', et: 'DNA kaksikheeliksis ühendavad adeniini ja tümiini kaks vesiniksidet.' },
        source: { sourceId: 'wikipedia:base-pair-adenine-thymine', title: 'Base pair', url: 'https://en.wikipedia.org/wiki/Base_pair', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-035:messenger-rna-carries-code', factKey: 'science-nature:messenger-rna-carries-code', tier: 3, subjectKey: 'rna:messenger-rna',
        clue: { en: 'Which kind of RNA carries a copied genetic message from DNA to a ribosome for protein production?', et: 'Milline RNA liik kannab DNA-lt kopeeritud geneetilise sõnumi valgu tootmiseks ribosoomi?' }, response: { en: 'messenger RNA', et: 'informatsiooni-RNA' }, acceptedVariants: { en: ['mRNA'], et: ['mRNA'] },
        explanation: { en: 'Messenger RNA is transcribed from DNA and presents its sequence to a ribosome for translation.', et: 'Informatsiooni-RNA transkribeeritakse DNA-lt ning ribosoom kasutab selle järjestust translatsioonil.' },
        source: { sourceId: 'wikipedia:messenger-rna-function', title: 'Messenger RNA', url: 'https://en.wikipedia.org/wiki/Messenger_RNA', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-035:codon-three-bases', factKey: 'science-nature:codon-three-bases', tier: 4, subjectKey: 'sequence:codon',
        clue: { en: 'What name is given to a three-base sequence in messenger RNA that specifies an amino acid or a stop signal?', et: 'Kuidas nimetatakse informatsiooni-RNA kolmest alusest koosnevat järjestust, mis määrab aminohappe või lõpetamissignaali?' }, response: { en: 'a codon', et: 'koodon' }, acceptedVariants: { en: ['codon'], et: ['üks koodon'] },
        explanation: { en: 'The genetic code is read in three-nucleotide units called codons.', et: 'Geneetilist koodi loetakse kolmest nukleotiidist koosnevate üksuste ehk koodonitena.' },
        source: { sourceId: 'wikipedia:genetic-code-codon', title: 'Genetic code', url: 'https://en.wikipedia.org/wiki/Genetic_code', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-035:crispr-cas9-gene-editing', factKey: 'science-nature:crispr-cas9-gene-editing', tier: 5, subjectKey: 'system:crispr-cas9',
        clue: { en: 'Which gene-editing system uses a guide RNA to direct the Cas9 enzyme to a chosen DNA sequence?', et: 'Milline geenimuutmise süsteem kasutab juht-RNA-d, et suunata Cas9-ensüüm valitud DNA-järjestuse juurde?' }, response: { en: 'CRISPR-Cas9', et: 'CRISPR-Cas9' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'CRISPR-Cas9 adapts a bacterial defence mechanism to cut DNA at a sequence selected by guide RNA.', et: 'CRISPR-Cas9 kohandab bakterite kaitsemehhanismi, et lõigata DNA-d juht-RNA määratud järjestuse juures.' },
        source: { sourceId: 'wikipedia:crispr-cas9-editing', title: 'CRISPR gene editing', url: 'https://en.wikipedia.org/wiki/CRISPR_gene_editing', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
    ],
  },
  {
    categorySetId: 'built-in-science-nature-set-036', batchId: '03-science-nature', packId: 'built-in-science-nature', difficulty: 'medium',
    name: { en: 'The Immune Response', et: 'Immuunvastus' },
    questions: [
      {
        key: 'playable-science-nature:built-in-science-nature-set-036:fever-regulated-temperature', factKey: 'science-nature:fever-regulated-temperature', tier: 1, subjectKey: 'response:fever',
        clue: { en: 'What regulated rise in body temperature often accompanies an infection?', et: 'Kuidas nimetatakse kehatemperatuuri reguleeritud tõusu, mis sageli kaasneb nakkusega?' }, response: { en: 'a fever', et: 'palavik' }, acceptedVariants: { en: ['fever'], et: ['kehapalavik'] },
        explanation: { en: 'During a fever, the body raises its temperature set point as part of a coordinated response.', et: 'Palaviku ajal tõstab organism koordineeritud vastusena kehatemperatuuri seadepunkti.' },
        source: { sourceId: 'wikipedia:fever-regulated-rise', title: 'Fever', url: 'https://en.wikipedia.org/wiki/Fever', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-036:inflammation-redness-swelling', factKey: 'science-nature:inflammation-redness-swelling', tier: 2, subjectKey: 'response:inflammation',
        clue: { en: 'Redness, warmth, swelling, and pain around an injury are classic signs of which protective response?', et: 'Punetus, kuumus, turse ja valu vigastuse ümber on millise kaitsereaktsiooni tüüpilised tunnused?' }, response: { en: 'inflammation', et: 'põletik' }, acceptedVariants: { en: ['an inflammatory response'], et: ['põletikureaktsioon'] },
        explanation: { en: 'Inflammation brings blood flow and immune activity to damaged or infected tissue.', et: 'Põletik suurendab kahjustatud või nakatunud koe verevarustust ja immuuntegevust.' },
        source: { sourceId: 'wikipedia:inflammation-cardinal-signs', title: 'Inflammation', url: 'https://en.wikipedia.org/wiki/Inflammation', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-036:phagocytosis-engulfing-microbe', factKey: 'science-nature:phagocytosis-engulfing-microbe', tier: 3, subjectKey: 'process:phagocytosis',
        clue: { en: 'What process lets an immune cell surround, engulf, and digest a bacterium?', et: 'Millise protsessi abil saab immuunrakk bakteri ümbritseda, endasse haarata ja seedida?' }, response: { en: 'phagocytosis', et: 'fagotsütoos' }, acceptedVariants: { en: ['phagocytic engulfment'], et: ['fagotsüteerimine'] },
        explanation: { en: 'In phagocytosis, a cell encloses a particle in a membrane-bound compartment and breaks it down.', et: 'Fagotsütoosis sulgeb rakk osakese membraaniga ümbritsetud põiekesse ja lagundab selle.' },
        source: { sourceId: 'wikipedia:phagocytosis-immune-cell', title: 'Phagocytosis', url: 'https://en.wikipedia.org/wiki/Phagocytosis', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-036:t-cell-thymus', factKey: 'science-nature:t-cell-thymus', tier: 4, subjectKey: 'cell:t-cell',
        clue: { en: 'Which lymphocyte type matures in the thymus and can coordinate immunity or kill infected cells?', et: 'Milline lümfotsüüt küpseb harkelundis ning võib immuunvastust juhtida või nakatunud rakke hävitada?' }, response: { en: 'a T cell', et: 'T-rakk' }, acceptedVariants: { en: ['T lymphocyte'], et: ['T-lümfotsüüt'] },
        explanation: { en: 'T cells mature in the thymus; helper and cytotoxic types perform different immune roles.', et: 'T-rakud küpsevad harkelundis; abistaja- ja tsütotoksilistel T-rakkudel on erinevad immuunülesanded.' },
        source: { sourceId: 'wikipedia:t-cell-thymus', title: 'T cell', url: 'https://en.wikipedia.org/wiki/T_cell', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-036:immunological-memory-faster-response', factKey: 'science-nature:immunological-memory-faster-response', tier: 5, subjectKey: 'concept:immunological-memory',
        clue: { en: 'What feature of adaptive immunity enables a faster, stronger response after the body meets the same pathogen again?', et: 'Milline omandatud immuunsuse omadus võimaldab sama haigustekitajaga uuesti kohtudes kiiremat ja tugevamat vastust?' }, response: { en: 'immunological memory', et: 'immunoloogiline mälu' }, acceptedVariants: { en: ['immune memory'], et: ['immuunmälu'] },
        explanation: { en: 'Long-lived memory cells remain after an initial response and react rapidly on later exposure.', et: 'Pärast esmast vastust jäävad organismi pikaealised mälurakud, mis reageerivad järgmisel kokkupuutel kiiresti.' },
        source: { sourceId: 'wikipedia:immunological-memory', title: 'Immunological memory', url: 'https://en.wikipedia.org/wiki/Immunological_memory', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
    ],
  },
  {
    categorySetId: 'built-in-science-nature-set-037', batchId: '03-science-nature', packId: 'built-in-science-nature', difficulty: 'medium',
    name: { en: 'How Ecosystems Work', et: 'Ökosüsteemi toimimine' },
    questions: [
      {
        key: 'playable-science-nature:built-in-science-nature-set-037:autotroph-makes-organic-matter', factKey: 'science-nature:autotroph-makes-organic-matter', tier: 1, subjectKey: 'role:autotroph',
        clue: { en: 'What ecological term describes an organism that makes organic matter from inorganic sources, usually using light or chemical energy?', et: 'Milline ökoloogiline termin tähistab organismi, mis valmistab anorgaanilistest lähteainetest orgaanilist ainet, kasutades tavaliselt valgus- või keemilist energiat?' }, response: { en: 'an autotroph', et: 'autotroof' }, acceptedVariants: { en: ['autotroph', 'primary producer'], et: ['esmasprodutsent', 'tootja'] },
        explanation: { en: 'Autotrophs form the base of many food systems by producing organic compounds from inorganic material.', et: 'Autotroofid moodustavad paljude toitumissüsteemide aluse, tootes anorgaanilisest ainest orgaanilisi ühendeid.' },
        source: { sourceId: 'wikipedia:autotroph-definition', title: 'Autotroph', url: 'https://en.wikipedia.org/wiki/Autotroph', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-037:decomposer-recycles-nutrients', factKey: 'science-nature:decomposer-recycles-nutrients', tier: 2, subjectKey: 'role:decomposer',
        clue: { en: 'Fungi and many bacteria fill what ecosystem role by breaking down dead material and returning nutrients?', et: 'Millist rolli täidavad ökosüsteemis seened ja paljud bakterid, lagundades surnud ainet ning vabastades toitaineid?' }, response: { en: 'decomposers', et: 'lagundajad' }, acceptedVariants: { en: ['a decomposer'], et: ['lagundaja'] },
        explanation: { en: 'Decomposers break organic remains into simpler substances that can re-enter nutrient cycles.', et: 'Lagundajad muudavad orgaanilised jäänused lihtsamateks aineteks, mis saavad uuesti aineringesse siseneda.' },
        source: { sourceId: 'wikipedia:decomposer-nutrient-cycling', title: 'Decomposer', url: 'https://en.wikipedia.org/wiki/Decomposer', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-037:food-web-linked-chains', factKey: 'science-nature:food-web-linked-chains', tier: 3, subjectKey: 'network:food-web',
        clue: { en: 'What network diagram links many feeding relationships instead of showing only one straight food chain?', et: 'Milline võrgustik seob palju toitumissuhteid, selle asemel et näidata vaid üht sirget toiduahelat?' }, response: { en: 'a food web', et: 'toiduvõrk' }, acceptedVariants: { en: ['food web'], et: ['ökoloogiline toiduvõrk'] },
        explanation: { en: 'A food web combines intersecting food chains to show who eats whom in a community.', et: 'Toiduvõrk ühendab ristuvad toiduahelad ja näitab, kes koosluses keda sööb.' },
        source: { sourceId: 'wikipedia:food-web-network', title: 'Food web', url: 'https://en.wikipedia.org/wiki/Food_web', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-037:keystone-species-large-effect', factKey: 'science-nature:keystone-species-large-effect', tier: 4, subjectKey: 'role:keystone-species',
        clue: { en: 'What term describes a species whose effect on its ecosystem is disproportionately large compared with its abundance?', et: 'Kuidas nimetatakse liiki, mille mõju ökosüsteemile on tema arvukusega võrreldes ebaproportsionaalselt suur?' }, response: { en: 'a keystone species', et: 'võtmeliik' }, acceptedVariants: { en: ['keystone species'], et: ['ökosüsteemi võtmeliik'] },
        explanation: { en: 'Removing a keystone species can reorganize an ecological community far beyond its numerical share.', et: 'Võtmeliigi kadumine võib ökoloogilise koosluse tugevalt ümber kujundada, kuigi liik ei pruugi olla arvukas.' },
        source: { sourceId: 'wikipedia:keystone-species-definition', title: 'Keystone species', url: 'https://en.wikipedia.org/wiki/Keystone_species', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-037:ecological-succession-community-change', factKey: 'science-nature:ecological-succession-community-change', tier: 5, subjectKey: 'process:ecological-succession',
        clue: { en: 'What process describes the gradual change in a biological community after new habitat forms or a disturbance occurs?', et: 'Milline protsess kirjeldab elukoosluse järkjärgulist muutumist pärast uue elupaiga teket või häiringut?' }, response: { en: 'ecological succession', et: 'ökoloogiline suktsessioon' }, acceptedVariants: { en: ['succession'], et: ['suktsessioon'] },
        explanation: { en: 'During ecological succession, species composition changes over time as organisms alter and recolonize a habitat.', et: 'Ökoloogilise suktsessiooni käigus muutub liikide koosseis, kui organismid elupaika kujundavad ja taasasustavad.' },
        source: { sourceId: 'wikipedia:ecological-succession', title: 'Ecological succession', url: 'https://en.wikipedia.org/wiki/Ecological_succession', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
    ],
  },
  {
    categorySetId: 'built-in-science-nature-set-038', batchId: '03-science-nature', packId: 'built-in-science-nature', difficulty: 'medium',
    name: { en: 'Energy on the Move', et: 'Energia liikumises' },
    questions: [
      {
        key: 'playable-science-nature:built-in-science-nature-set-038:kinetic-energy-motion', factKey: 'science-nature:kinetic-energy-motion', tier: 1, subjectKey: 'energy:kinetic',
        clue: { en: 'What form of energy does an object possess because it is moving?', et: 'Milline energiavorm on kehal selle liikumise tõttu?' }, response: { en: 'kinetic energy', et: 'kineetiline energia' }, acceptedVariants: { en: ['energy of motion'], et: ['liikumisenergia'] },
        explanation: { en: 'Kinetic energy depends on mass and the square of speed.', et: 'Kineetiline energia sõltub massist ja kiiruse ruudust.' },
        source: { sourceId: 'wikipedia:kinetic-energy-motion', title: 'Kinetic energy', url: 'https://en.wikipedia.org/wiki/Kinetic_energy', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-038:gravitational-potential-height', factKey: 'science-nature:gravitational-potential-height', tier: 2, subjectKey: 'energy:gravitational-potential',
        clue: { en: 'A book raised onto a high shelf stores which form of energy because of its position in Earth’s gravitational field?', et: 'Milline energiavorm talletub kõrgele riiulile tõstetud raamatus selle asukoha tõttu Maa gravitatsiooniväljas?' }, response: { en: 'gravitational potential energy', et: 'gravitatsiooniline potentsiaalne energia' }, acceptedVariants: { en: ['potential energy'], et: ['potentsiaalne energia'] },
        explanation: { en: 'Lifting an object increases its gravitational potential energy, which can become motion as it falls.', et: 'Keha tõstmine suurendab selle gravitatsioonilist potentsiaalset energiat, mis võib kukkumisel muutuda liikumiseks.' },
        source: { sourceId: 'wikipedia:gravitational-potential-energy', title: 'Potential energy', url: 'https://en.wikipedia.org/wiki/Potential_energy#Gravitational_potential_energy', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-038:conduction-metal-spoon', factKey: 'science-nature:conduction-metal-spoon', tier: 3, subjectKey: 'transfer:conduction',
        clue: { en: 'A metal spoon becomes hot from the end resting in soup as neighbouring particles pass energy along. Name this heat-transfer process.', et: 'Metalllusikas kuumeneb supis olevast otsast alates, kui naaberosakesed energiat edasi annavad. Nimeta see soojusülekande viis.' }, response: { en: 'conduction', et: 'soojusjuhtimine' }, acceptedVariants: { en: ['thermal conduction'], et: ['soojuse juhtimine'] },
        explanation: { en: 'Conduction transfers thermal energy through microscopic interactions without bulk movement of the material.', et: 'Soojusjuhtimine kannab soojusenergiat edasi mikroskoopiliste vastastikmõjude kaudu, ilma aine suuremahulise liikumiseta.' },
        source: { sourceId: 'wikipedia:thermal-conduction', title: 'Thermal conduction', url: 'https://en.wikipedia.org/wiki/Thermal_conduction', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-038:convection-rising-fluid', factKey: 'science-nature:convection-rising-fluid', tier: 4, subjectKey: 'transfer:convection',
        clue: { en: 'What heat-transfer process occurs when warmer, less dense fluid rises while cooler fluid sinks?', et: 'Milline soojusülekande viis toimub siis, kui soojem ja hõredam vedelik või gaas tõuseb ning jahedam vajub?' }, response: { en: 'convection', et: 'konvektsioon' }, acceptedVariants: { en: ['convective heat transfer'], et: ['konvektiivne soojusülekanne'] },
        explanation: { en: 'Convection carries heat through the bulk movement of a liquid or gas.', et: 'Konvektsioon kannab soojust edasi vedeliku või gaasi suuremahulise liikumisega.' },
        source: { sourceId: 'wikipedia:convection-heat-transfer', title: 'Convection', url: 'https://en.wikipedia.org/wiki/Convection', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-038:energy-conservation-total', factKey: 'science-nature:energy-conservation-total', tier: 5, subjectKey: 'law:energy-conservation',
        clue: { en: 'Which physical law says energy may change form but the total in an isolated system cannot be created or destroyed?', et: 'Milline füüsikaseadus ütleb, et energia võib vormi muuta, kuid isoleeritud süsteemi koguenergiat ei saa luua ega hävitada?' }, response: { en: 'the law of conservation of energy', et: 'energia jäävuse seadus' }, acceptedVariants: { en: ['conservation of energy'], et: ['energiajäävuse seadus'] },
        explanation: { en: 'Energy conservation requires the total energy of an isolated system to remain constant through transformations.', et: 'Energia jäävuse seaduse järgi püsib isoleeritud süsteemi koguenergia muundumiste käigus muutumatu.' },
        source: { sourceId: 'wikipedia:conservation-of-energy', title: 'Conservation of energy', url: 'https://en.wikipedia.org/wiki/Conservation_of_energy', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
    ],
  },
  {
    categorySetId: 'built-in-science-nature-set-041', batchId: '03-science-nature', packId: 'built-in-science-nature', difficulty: 'medium',
    name: { en: 'A Dynamic Earth', et: 'Dünaamiline Maa' },
    questions: [
      {
        key: 'playable-science-nature:built-in-science-nature-set-041:mantle-between-crust-core', factKey: 'science-nature:mantle-between-crust-core', tier: 1, subjectKey: 'layer:mantle',
        clue: { en: 'What thick layer of Earth lies between the thin crust and the metallic core?', et: 'Milline paks Maa kiht asub õhukese maakoore ja metallilise tuuma vahel?' }, response: { en: 'the mantle', et: 'vahevöö' }, acceptedVariants: { en: ['mantle'], et: ['Maa vahevöö'] },
        explanation: { en: 'Earth’s mantle is mostly solid rock that can deform slowly over geological time.', et: 'Maa vahevöö koosneb peamiselt tahkest kivimist, mis võib geoloogilise aja jooksul aeglaselt deformeeruda.' },
        source: { sourceId: 'wikipedia:earth-mantle-layer', title: 'Earth’s mantle', url: 'https://en.wikipedia.org/wiki/Earth%27s_mantle', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-041:subduction-sinking-plate', factKey: 'science-nature:subduction-sinking-plate', tier: 2, subjectKey: 'process:subduction',
        clue: { en: 'What process occurs where one tectonic plate bends and sinks beneath another into the mantle?', et: 'Milline protsess toimub kohas, kus üks laam paindub ja vajub teise alla vahevöösse?' }, response: { en: 'subduction', et: 'subduktsioon' }, acceptedVariants: { en: ['plate subduction'], et: ['laama sukeldumine'] },
        explanation: { en: 'Subduction recycles lithosphere into the mantle at a convergent plate boundary.', et: 'Subduktsioon viib koonduval laamapiiril litosfääri tagasi vahevöösse.' },
        source: { sourceId: 'wikipedia:subduction-process', title: 'Subduction', url: 'https://en.wikipedia.org/wiki/Subduction', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-041:mid-ocean-ridge-divergent', factKey: 'science-nature:mid-ocean-ridge-divergent', tier: 3, subjectKey: 'landform:mid-ocean-ridge',
        clue: { en: 'What long underwater mountain system forms where oceanic plates separate and new crust is created?', et: 'Milline pikk veealune mäestik tekib kohas, kus ookeanilaamad lahknevad ja moodustub uus maakoor?' }, response: { en: 'a mid-ocean ridge', et: 'ookeani keskahelik' }, acceptedVariants: { en: ['mid-ocean ridge'], et: ['ookeani keskmäestik'] },
        explanation: { en: 'Magma rises at divergent boundaries and builds new seafloor along mid-ocean ridges.', et: 'Lahknevatel laamapiiridel tõuseb magma ning kasvatab ookeani keskahelikes uut merepõhja.' },
        source: { sourceId: 'wikipedia:mid-ocean-ridge-formation', title: 'Mid-ocean ridge', url: 'https://en.wikipedia.org/wiki/Mid-ocean_ridge', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-041:continental-drift-wegener', factKey: 'science-nature:continental-drift-wegener', tier: 4, subjectKey: 'theory:continental-drift',
        clue: { en: 'What idea, strongly associated with Alfred Wegener, proposed that continents slowly move across Earth’s surface?', et: 'Milline Alfred Wegeneriga tihedalt seotud idee väitis, et mandrid liiguvad aeglaselt üle Maa pinna?' }, response: { en: 'continental drift', et: 'mandrite triiv' }, acceptedVariants: { en: ['the theory of continental drift'], et: ['mandrite triivi teooria'] },
        explanation: { en: 'Continental drift anticipated plate tectonics by arguing that continents had moved and once fitted together.', et: 'Mandrite triivi idee eelnes laamtektoonikale ning väitis, et mandrid on liikunud ja olid kunagi ühendatud.' },
        source: { sourceId: 'wikipedia:continental-drift-wegener', title: 'Continental drift', url: 'https://en.wikipedia.org/wiki/Continental_drift', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-041:paleomagnetism-rock-record', factKey: 'science-nature:paleomagnetism-rock-record', tier: 5, subjectKey: 'evidence:paleomagnetism',
        clue: { en: 'What field studies the record of Earth’s past magnetic field preserved in rocks?', et: 'Milline uurimisala käsitleb kivimites säilinud Maa varasema magnetvälja jälgi?' }, response: { en: 'paleomagnetism', et: 'paleomagnetism' }, acceptedVariants: { en: ['palaeomagnetism'], et: ['paleomagnetismiuuringud'] },
        explanation: { en: 'Magnetic minerals can lock in field direction as rock forms, providing evidence for plate movement and field reversals.', et: 'Magnetilised mineraalid võivad kivimi tekkimisel talletada magnetvälja suuna ning anda tõendeid laamade liikumisest ja magnetvälja pöördumistest.' },
        source: { sourceId: 'wikipedia:paleomagnetism-rock-record', title: 'Paleomagnetism', url: 'https://en.wikipedia.org/wiki/Paleomagnetism', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
    ],
  },
  {
    categorySetId: 'built-in-science-nature-set-042', batchId: '03-science-nature', packId: 'built-in-science-nature', difficulty: 'medium',
    name: { en: 'Reading the Atmosphere', et: 'Atmosfääri lugemine' },
    questions: [
      {
        key: 'playable-science-nature:built-in-science-nature-set-042:humidity-water-vapour', factKey: 'science-nature:humidity-water-vapour', tier: 1, subjectKey: 'measure:humidity',
        clue: { en: 'What atmospheric quantity describes how much water vapour is present in the air?', et: 'Milline atmosfääri näitaja kirjeldab õhus oleva veeauru hulka?' }, response: { en: 'humidity', et: 'õhuniiskus' }, acceptedVariants: { en: ['air humidity'], et: ['niiskus'] },
        explanation: { en: 'Humidity measures water vapour in air and can be expressed in several ways, including relative humidity.', et: 'Õhuniiskus näitab veeauru hulka õhus ning seda saab väljendada mitmel viisil, näiteks suhtelise niiskusena.' },
        source: { sourceId: 'wikipedia:humidity-water-vapour', title: 'Humidity', url: 'https://en.wikipedia.org/wiki/Humidity', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-042:dew-point-saturation', factKey: 'science-nature:dew-point-saturation', tier: 2, subjectKey: 'temperature:dew-point',
        clue: { en: 'What temperature is reached when cooling air becomes saturated and water droplets can begin to form?', et: 'Kuidas nimetatakse temperatuuri, mille juures jahtuv õhk küllastub ja veepiisad võivad hakata tekkima?' }, response: { en: 'the dew point', et: 'kastepunkt' }, acceptedVariants: { en: ['dew point'], et: ['kastepunkti temperatuur'] },
        explanation: { en: 'At the dew point, air is saturated with water vapour and further cooling encourages condensation.', et: 'Kastepunktis on õhk veeauruga küllastunud ning edasine jahtumine soodustab kondenseerumist.' },
        source: { sourceId: 'wikipedia:dew-point-saturation', title: 'Dew point', url: 'https://en.wikipedia.org/wiki/Dew_point', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-042:warm-front-advancing-air', factKey: 'science-nature:warm-front-advancing-air', tier: 3, subjectKey: 'front:warm-front',
        clue: { en: 'What kind of weather boundary forms when an advancing warm air mass rises gradually over cooler air?', et: 'Milline õhumasside piir tekib siis, kui pealetungiv soe õhumass tõuseb järk-järgult jahedama õhu kohale?' }, response: { en: 'a warm front', et: 'soe front' }, acceptedVariants: { en: ['warm front'], et: ['sooja õhu front'] },
        explanation: { en: 'A warm front commonly brings layered cloud and steadier precipitation as warm air glides over retreating cool air.', et: 'Sooja frondiga kaasnevad sageli kihilised pilved ja ühtlasemad sademed, kui soe õhk liigub taanduva jaheda õhu kohale.' },
        source: { sourceId: 'wikipedia:warm-front-air-masses', title: 'Warm front', url: 'https://en.wikipedia.org/wiki/Warm_front', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-042:coriolis-effect-deflection', factKey: 'science-nature:coriolis-effect-deflection', tier: 4, subjectKey: 'effect:coriolis',
        clue: { en: 'What apparent deflection of moving air and water arises because Earth rotates beneath them?', et: 'Kuidas nimetatakse liikuva õhu ja vee näivat kõrvalekallet, mis tekib Maa pöörlemise tõttu nende all?' }, response: { en: 'the Coriolis effect', et: 'Coriolise efekt' }, acceptedVariants: { en: ['Coriolis force'], et: ['Coriolise jõud'] },
        explanation: { en: 'In Earth’s rotating reference frame, the Coriolis effect bends large-scale motion rightward in the north and leftward in the south.', et: 'Maa pöörlevas taustsüsteemis kallutab Coriolise efekt suuremõõtmelist liikumist põhjapoolkeral paremale ja lõunapoolkeral vasakule.' },
        source: { sourceId: 'wikipedia:coriolis-effect-earth', title: 'Coriolis force', url: 'https://en.wikipedia.org/wiki/Coriolis_force', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-042:jet-stream-fast-winds', factKey: 'science-nature:jet-stream-fast-winds', tier: 5, subjectKey: 'current:jet-stream',
        clue: { en: 'What narrow band of very fast winds high in the troposphere helps steer weather systems from west to east?', et: 'Milline kitsas väga kiirete tuulte vöönd troposfääri ülaosas aitab suunata ilmasüsteeme läänest itta?' }, response: { en: 'the jet stream', et: 'jugavool' }, acceptedVariants: { en: ['jet stream'], et: ['atmosfääri jugavool'] },
        explanation: { en: 'Jet streams form near strong temperature contrasts and influence the paths of weather systems.', et: 'Jugavoolud kujunevad tugevate temperatuurierinevuste lähedal ja mõjutavad ilmasüsteemide liikumisteid.' },
        source: { sourceId: 'wikipedia:jet-stream-troposphere', title: 'Jet stream', url: 'https://en.wikipedia.org/wiki/Jet_stream', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
    ],
  },
  {
    categorySetId: 'built-in-science-nature-set-043', batchId: '03-science-nature', packId: 'built-in-science-nature', difficulty: 'medium',
    name: { en: 'Messages from Starlight', et: 'Tähevalguse sõnumid' },
    questions: [
      {
        key: 'playable-science-nature:built-in-science-nature-set-043:light-year-distance', factKey: 'science-nature:light-year-distance', tier: 1, subjectKey: 'unit:light-year',
        clue: { en: 'What distance unit equals how far light travels through a vacuum in one year?', et: 'Milline kaugusühik võrdub teepikkusega, mille valgus läbib vaakumis ühe aastaga?' }, response: { en: 'a light-year', et: 'valgusaasta' }, acceptedVariants: { en: ['light-year'], et: ['üks valgusaasta'] },
        explanation: { en: 'A light-year measures distance, not time, and is about 9.46 trillion kilometres.', et: 'Valgusaasta mõõdab kaugust, mitte aega, ning võrdub ligikaudu 9,46 triljoni kilomeetriga.' },
        source: { sourceId: 'wikipedia:light-year-distance', title: 'Light-year', url: 'https://en.wikipedia.org/wiki/Light-year', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-043:exoplanet-other-star', factKey: 'science-nature:exoplanet-other-star', tier: 2, subjectKey: 'object:exoplanet',
        clue: { en: 'What general term describes a planet orbiting a star beyond our Solar System?', et: 'Milline üldnimetus tähistab planeeti, mis tiirleb väljaspool Päikesesüsteemi mõne teise tähe ümber?' }, response: { en: 'an exoplanet', et: 'eksoplaneet' }, acceptedVariants: { en: ['extrasolar planet'], et: ['Päikesesüsteemi-väline planeet'] },
        explanation: { en: 'Exoplanets orbit stars other than the Sun and range from small rocky worlds to gas giants.', et: 'Eksoplaneedid tiirlevad teiste tähtede kui Päikese ümber ning ulatuvad väikestest kiviplaneetidest gaashiidudeni.' },
        source: { sourceId: 'wikipedia:exoplanet-definition', title: 'Exoplanet', url: 'https://en.wikipedia.org/wiki/Exoplanet', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-043:redshift-longer-wavelengths', factKey: 'science-nature:redshift-longer-wavelengths', tier: 3, subjectKey: 'effect:redshift',
        clue: { en: 'What name is given to the shift of spectral lines toward longer wavelengths, often seen from a receding object?', et: 'Kuidas nimetatakse spektrijoonte nihkumist pikemate lainepikkuste poole, mida sageli täheldatakse eemalduva objekti puhul?' }, response: { en: 'redshift', et: 'punanihe' }, acceptedVariants: { en: ['a red shift'], et: ['punanihkumine'] },
        explanation: { en: 'Redshift can result from relative motion, cosmic expansion, or a strong gravitational field.', et: 'Punanihe võib tuleneda suhtelisest liikumisest, kosmilisest paisumisest või tugevast gravitatsiooniväljast.' },
        source: { sourceId: 'wikipedia:redshift-longer-wavelength', title: 'Redshift', url: 'https://en.wikipedia.org/wiki/Redshift', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-043:transit-method-brightness-dip', factKey: 'science-nature:transit-method-brightness-dip', tier: 4, subjectKey: 'method:transit',
        clue: { en: 'Which exoplanet-detection technique looks for a small, repeated dip in a star’s brightness as a planet crosses in front?', et: 'Milline eksoplaneetide avastamise meetod otsib tähe heleduses väikest korduvat langust, kui planeet liigub tähe eest läbi?' }, response: { en: 'the transit method', et: 'transiidimeetod' }, acceptedVariants: { en: ['transit photometry'], et: ['transiitfotomeetria'] },
        explanation: { en: 'A planetary transit blocks a fraction of starlight, producing a repeatable signature in the light curve.', et: 'Planeedi transiit varjab osa tähevalgusest ning tekitab valguskõveral korduva jälje.' },
        source: { sourceId: 'wikipedia:transit-method-exoplanets', title: 'Transit photometry', url: 'https://en.wikipedia.org/wiki/Transit_photometry', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-043:hr-diagram-luminosity-temperature', factKey: 'science-nature:hr-diagram-luminosity-temperature', tier: 5, subjectKey: 'diagram:hertzsprung-russell',
        clue: { en: 'Which famous astronomy diagram plots stars by luminosity against surface temperature or spectral type?', et: 'Milline kuulus astronoomiadiagramm paigutab tähed heleduse ning pinnatemperatuuri või spektriklassi järgi?' }, response: { en: 'the Hertzsprung–Russell diagram', et: 'Hertzsprungi–Russelli diagramm' }, acceptedVariants: { en: ['H-R diagram', 'HR diagram'], et: ['H-R-diagramm', 'HR-diagramm'] },
        explanation: { en: 'The Hertzsprung–Russell diagram reveals groups such as the main sequence, giants, and white dwarfs.', et: 'Hertzsprungi–Russelli diagrammil eristuvad muu hulgas peajada, hiidude ja valgete kääbuste rühmad.' },
        source: { sourceId: 'wikipedia:hertzsprung-russell-diagram', title: 'Hertzsprung–Russell diagram', url: 'https://en.wikipedia.org/wiki/Hertzsprung%E2%80%93Russell_diagram', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
    ],
  },
  {
    categorySetId: 'built-in-science-nature-set-044', batchId: '03-science-nature', packId: 'built-in-science-nature', difficulty: 'medium',
    name: { en: 'Chemistry at Work', et: 'Keemia toimimas' },
    questions: [
      {
        key: 'playable-science-nature:built-in-science-nature-set-044:catalyst-speeds-reaction', factKey: 'science-nature:catalyst-speeds-reaction', tier: 1, subjectKey: 'agent:catalyst',
        clue: { en: 'What substance speeds up a chemical reaction without being consumed overall?', et: 'Milline aine kiirendab keemilist reaktsiooni, ilma et see reaktsiooni käigus kokkuvõttes ära kuluks?' }, response: { en: 'a catalyst', et: 'katalüsaator' }, acceptedVariants: { en: ['catalyst'], et: ['keemiline katalüsaator'] },
        explanation: { en: 'A catalyst provides a reaction pathway with lower activation energy and is regenerated by the end.', et: 'Katalüsaator võimaldab väiksema aktivatsioonienergiaga reaktsioonitee ning taastub reaktsiooni lõpuks.' },
        source: { sourceId: 'wikipedia:catalyst-reaction-rate', title: 'Catalysis', url: 'https://en.wikipedia.org/wiki/Catalysis', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-044:ph-acidity-scale', factKey: 'science-nature:ph-acidity-scale', tier: 2, subjectKey: 'scale:ph',
        clue: { en: 'At 25 °C, which familiar scale uses values below 7 for acidic solutions and above 7 for basic ones?', et: 'Millise tuntud skaala väärtused on 25 °C juures happelisel lahusel alla 7 ja aluselisel lahusel üle 7?' }, response: { en: 'the pH scale', et: 'pH-skaala' }, acceptedVariants: { en: ['pH'], et: ['pH'] },
        explanation: { en: 'The pH scale is logarithmic and relates to hydrogen-ion activity in a solution.', et: 'pH-skaala on logaritmiline ning seostub vesinikioonide aktiivsusega lahuses.' },
        source: { sourceId: 'wikipedia:ph-acidity-scale', title: 'pH', url: 'https://en.wikipedia.org/wiki/PH', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-044:endothermic-absorbs-heat', factKey: 'science-nature:endothermic-absorbs-heat', tier: 3, subjectKey: 'reaction:endothermic',
        clue: { en: 'What kind of chemical reaction absorbs heat from its surroundings?', et: 'Millist liiki keemiline reaktsioon neelab ümbritsevast keskkonnast soojust?' }, response: { en: 'an endothermic reaction', et: 'endotermiline reaktsioon' }, acceptedVariants: { en: ['endothermic process'], et: ['endotermiline protsess'] },
        explanation: { en: 'An endothermic reaction takes in thermal energy, so its surroundings may cool.', et: 'Endotermiline reaktsioon neelab soojusenergiat, mistõttu ümbritsev keskkond võib jahtuda.' },
        source: { sourceId: 'wikipedia:endothermic-process-heat', title: 'Endothermic process', url: 'https://en.wikipedia.org/wiki/Endothermic_process', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-044:emulsion-liquid-droplets', factKey: 'science-nature:emulsion-liquid-droplets', tier: 4, subjectKey: 'mixture:emulsion',
        clue: { en: 'Mayonnaise is what type of mixture, with droplets of one liquid dispersed through another liquid that normally would not mix with it?', et: 'Mis tüüpi segu on majonees, milles ühe vedeliku piisad on hajutatud teises vedelikus, millega see tavaliselt ei seguneks?' }, response: { en: 'an emulsion', et: 'emulsioon' }, acceptedVariants: { en: ['emulsion'], et: ['vedelikemulsioon'] },
        explanation: { en: 'An emulsion disperses droplets of one immiscible liquid through another, often with an emulsifier for stability.', et: 'Emulsioon hajutab ühe mitteseguneva vedeliku piisad teises; stabiilsust aitab sageli hoida emulgaator.' },
        source: { sourceId: 'wikipedia:emulsion-liquid-mixture', title: 'Emulsion', url: 'https://en.wikipedia.org/wiki/Emulsion', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-044:buffer-solution-resists-ph-change', factKey: 'science-nature:buffer-solution-resists-ph-change', tier: 5, subjectKey: 'solution:buffer',
        clue: { en: 'What kind of solution resists a large change in acidity when small amounts of acid or base are added?', et: 'Milline lahus ei lase väikese happe- või alusekoguse lisamisel happesusel palju muutuda?' }, response: { en: 'a buffer solution', et: 'puhverlahus' }, acceptedVariants: { en: ['buffer'], et: ['puhver'] },
        explanation: { en: 'A buffer contains components that neutralize modest additions of acid or base, limiting the resulting change in pH.', et: 'Puhverlahuse komponendid neutraliseerivad väikese lisatud happe- või alusekoguse ning piiravad pH muutust.' },
        source: { sourceId: 'wikipedia:buffer-solution-ph', title: 'Buffer solution', url: 'https://en.wikipedia.org/wiki/Buffer_solution', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
    ],
  },
] as const satisfies readonly PlayableCategory[];

export const SCIENCE_NATURE_CATEGORIES = validatePlayableCorpus(rawCategories, ASSIGNED_TARGETS.slice(0, rawCategories.length));

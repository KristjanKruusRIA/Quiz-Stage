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
  {
    categorySetId: 'built-in-science-nature-set-045', batchId: '03-science-nature', packId: 'built-in-science-nature', difficulty: 'medium',
    name: { en: 'How Plants Read Their World', et: 'Kuidas taimed keskkonda tajuvad' },
    questions: [
      {
        key: 'playable-science-nature:built-in-science-nature-set-045:seed-dormancy-pause', factKey: 'science-nature:seed-dormancy-pause', tier: 1, subjectKey: 'state:seed-dormancy',
        clue: { en: 'A viable seed can pause growth until light, moisture, or temperature becomes favourable. What is this waiting state called?', et: 'Elujõuline seeme võib kasvu peatada, kuni valgus-, niiskus- või temperatuuriolud muutuvad soodsaks. Kuidas seda ooteolekut nimetatakse?' }, response: { en: 'dormancy', et: 'puhkeolek' }, acceptedVariants: { en: ['seed dormancy'], et: ['seemne puhkeolek'] },
        explanation: { en: 'Dormancy prevents a seed from sprouting when conditions are unsuitable for the young plant.', et: 'Puhkeolek takistab seemnel idaneda ajal, mil tingimused on noorele taimele ebasoodsad.' },
        source: { sourceId: 'wikipedia:seed-dormancy-conditions', title: 'Seed dormancy', url: 'https://en.wikipedia.org/wiki/Seed_dormancy', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-045:stomata-leaf-pores', factKey: 'science-nature:stomata-leaf-pores', tier: 2, subjectKey: 'structure:stomata',
        clue: { en: 'What tiny adjustable pores in leaves let carbon dioxide enter while water vapour and oxygen leave?', et: 'Millised väikesed reguleeritavad poorid lehtedes lasevad süsinikdioksiidil siseneda ning veeaurul ja hapnikul väljuda?' }, response: { en: 'stomata', et: 'õhulõhed' }, acceptedVariants: { en: ['leaf stomata'], et: ['lehe õhulõhed'] },
        explanation: { en: 'Pairs of guard cells open and close each stoma to regulate gas exchange.', et: 'Iga õhulõhe avanemist ja sulgumist juhib paar sulgrakke, mis reguleerib gaasivahetust.' },
        source: { sourceId: 'wikipedia:stoma-gas-exchange', title: 'Stoma', url: 'https://en.wikipedia.org/wiki/Stoma', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-045:transpiration-water-loss', factKey: 'science-nature:transpiration-water-loss', tier: 3, subjectKey: 'process:transpiration',
        clue: { en: 'Name the process by which a plant loses water as vapour, mainly from its leaves.', et: 'Nimeta protsess, mille käigus taim kaotab peamiselt lehtede kaudu vett veeauruna.' }, response: { en: 'transpiration', et: 'transpiratsioon' }, acceptedVariants: { en: ['plant transpiration'], et: ['taimede transpiratsioon'] },
        explanation: { en: 'This water loss helps pull a continuous stream of water and dissolved minerals upward through a plant.', et: 'Selline veekadu aitab tõmmata pidevat vee ja lahustunud mineraalainete voogu taimes ülespoole.' },
        source: { sourceId: 'wikipedia:transpiration-water-loss', title: 'Transpiration', url: 'https://en.wikipedia.org/wiki/Transpiration', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-045:phototropism-growing-toward-light', factKey: 'science-nature:phototropism-growing-toward-light', tier: 4, subjectKey: 'response:phototropism',
        clue: { en: 'A houseplant shoot bends toward a bright window as it grows. What directional growth response is this?', et: 'Toataime võrse paindub kasvades heleda akna poole. Milline suunatud kasvureaktsioon see on?' }, response: { en: 'phototropism', et: 'fototropism' }, acceptedVariants: { en: ['positive phototropism'], et: ['positiivne fototropism'] },
        explanation: { en: 'Uneven growth on opposite sides of the shoot curves it toward the light source.', et: 'Võrse vastaskülgede ebaühtlane kasv painutab selle valgusallika poole.' },
        source: { sourceId: 'wikipedia:phototropism-light-response', title: 'Phototropism', url: 'https://en.wikipedia.org/wiki/Phototropism', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-045:vernalization-cold-flowering', factKey: 'science-nature:vernalization-cold-flowering', tier: 5, subjectKey: 'process:vernalization',
        clue: { en: 'Some winter cereals flower only after a prolonged spell of cold. What is this cold-triggered preparation for flowering called?', et: 'Mõni taliteravili õitseb alles pärast pikemat külmaperioodi. Kuidas nimetatakse sellist külma toimel õitsemiseks valmistumist?' }, response: { en: 'vernalization', et: 'vernalisatsioon' }, acceptedVariants: { en: ['vernalisation'], et: ['jarovisatsioon'] },
        explanation: { en: 'Vernalization makes flowering possible after a plant experiences the required low temperatures.', et: 'Vernalisatsioon võimaldab taimel õitsema hakata pärast vajalikku kokkupuudet madala temperatuuriga.' },
        source: { sourceId: 'wikipedia:vernalization-cold-exposure', title: 'Vernalization', url: 'https://en.wikipedia.org/wiki/Vernalization', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
    ],
  },
  {
    categorySetId: 'built-in-science-nature-set-046', batchId: '03-science-nature', packId: 'built-in-science-nature', difficulty: 'medium',
    name: { en: 'Materials Made Smarter', et: 'Nutikamaks muudetud materjalid' },
    questions: [
      {
        key: 'playable-science-nature:built-in-science-nature-set-046:alloy-metal-mixture', factKey: 'science-nature:alloy-metal-mixture', tier: 1, subjectKey: 'material:alloy',
        clue: { en: 'Steel and bronze belong to what broad class of materials made by combining a metal with other elements?', et: 'Millisesse laia materjaliklassi kuuluvad teras ja pronks, mis saadakse metalli ühendamisel teiste elementidega?' }, response: { en: 'alloys', et: 'sulamid' }, acceptedVariants: { en: ['an alloy', 'alloy'], et: ['sulam'] },
        explanation: { en: 'Combining elements can give an alloy useful properties that its main metal lacks.', et: 'Elementide ühendamine võib anda sulamile kasulikke omadusi, mida selle põhimetallil ei ole.' },
        source: { sourceId: 'wikipedia:alloy-metal-mixture', title: 'Alloy', url: 'https://en.wikipedia.org/wiki/Alloy', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-046:vulcanization-rubber-sulfur', factKey: 'science-nature:vulcanization-rubber-sulfur', tier: 2, subjectKey: 'process:vulcanization',
        clue: { en: 'Charles Goodyear became famous for which process that uses heat and usually sulfur to make rubber tougher and more durable?', et: 'Millise protsessiga sai kuulsaks Charles Goodyear, kes muutis kummi kuumuse ja tavaliselt väävli abil sitkemaks ning vastupidavamaks?' }, response: { en: 'vulcanization', et: 'vulkaniseerimine' }, acceptedVariants: { en: ['vulcanisation'], et: ['vulkanisatsioon'] },
        explanation: { en: 'Vulcanization creates links between polymer chains, improving rubber’s strength and elasticity.', et: 'Vulkaniseerimine tekitab polümeeriahelate vahele sidemeid ning parandab kummi tugevust ja elastsust.' },
        source: { sourceId: 'wikipedia:vulcanization-rubber-sulfur', title: 'Vulcanization', url: 'https://en.wikipedia.org/wiki/Vulcanization', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-046:tempered-glass-safety-fragments', factKey: 'science-nature:tempered-glass-safety-fragments', tier: 3, subjectKey: 'material:tempered-glass',
        clue: { en: 'Side windows in many cars use what heat-strengthened safety material that breaks into small granular pieces rather than long jagged shards?', et: 'Millist kuumtöödeldud turvamaterjali kasutatakse paljude autode külgakendes, sest see puruneb pikkade teravate kildude asemel väikesteks teradeks?' }, response: { en: 'tempered glass', et: 'karastatud klaas' }, acceptedVariants: { en: ['toughened glass'], et: ['termiliselt karastatud klaas'] },
        explanation: { en: 'Controlled heating and rapid cooling place the surface under compression, making the glass stronger and changing how it breaks.', et: 'Kontrollitud kuumutamine ja kiire jahutamine tekitavad pinnas survepinge, mis muudab klaasi tugevamaks ja mõjutab selle purunemisviisi.' },
        source: { sourceId: 'wikipedia:tempered-glass-safety', title: 'Tempered glass', url: 'https://en.wikipedia.org/wiki/Tempered_glass', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-046:aerogel-frozen-smoke', factKey: 'science-nature:aerogel-frozen-smoke', tier: 4, subjectKey: 'material:aerogel',
        clue: { en: 'Which extremely light, porous solid is sometimes nicknamed “frozen smoke” and used as a thermal insulator?', et: 'Millist ülikerget poorset tahket ainet hüütakse mõnikord „külmunud suitsuks” ning kasutatakse soojusisolaatorina?' }, response: { en: 'aerogel', et: 'aerogeel' }, acceptedVariants: { en: ['an aerogel'], et: ['aerogeelne materjal'] },
        explanation: { en: 'In an aerogel, gas replaces most of a gel’s liquid while the delicate solid network remains.', et: 'Aerogeelis asendab gaas suurema osa geeli vedelikust, kuid õrn tahke võrgustik jääb alles.' },
        source: { sourceId: 'wikipedia:aerogel-porous-insulator', title: 'Aerogel', url: 'https://en.wikipedia.org/wiki/Aerogel', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-046:shape-memory-alloy-heated', factKey: 'science-nature:shape-memory-alloy-heated', tier: 5, subjectKey: 'material:shape-memory-alloy',
        clue: { en: 'What kind of metal mixture can be bent while cool and then return toward a pre-set form when heated?', et: 'Millist liiki metallisegu saab jahedana painutada, kuid mis liigub kuumutamisel tagasi etteantud kuju poole?' }, response: { en: 'a shape-memory alloy', et: 'mälusulam' }, acceptedVariants: { en: ['shape-memory alloy', 'memory metal'], et: ['kujumuutmäluga sulam'] },
        explanation: { en: 'A reversible change in crystal structure lets this material recover its trained shape as its temperature rises.', et: 'Kristallstruktuuri pöörduv muutus laseb sellel materjalil temperatuuri tõustes taastada varem antud kuju.' },
        source: { sourceId: 'wikipedia:shape-memory-alloy-heating', title: 'Shape-memory alloy', url: 'https://en.wikipedia.org/wiki/Shape-memory_alloy', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
    ],
  },
  {
    categorySetId: 'built-in-science-nature-set-047', batchId: '03-science-nature', packId: 'built-in-science-nature', difficulty: 'medium',
    name: { en: 'Clues from Classic Experiments', et: 'Klassikaliste katsete jälgedel' },
    questions: [
      {
        key: 'playable-science-nature:built-in-science-nature-set-047:pavlov-classical-conditioning', factKey: 'science-nature:pavlov-classical-conditioning', tier: 1, subjectKey: 'process:classical-conditioning',
        clue: { en: 'Pavlov’s dogs learned to salivate at a previously neutral signal after it was repeatedly paired with food. What learning process did this demonstrate?', et: 'Pavlovi koerad õppisid eritama sülge varem neutraalse signaali peale, kui seda oli korduvalt seostatud toiduga. Millist õppimisprotsessi see näitas?' }, response: { en: 'classical conditioning', et: 'klassikaline tingimine' }, acceptedVariants: { en: ['Pavlovian conditioning'], et: ['Pavlovi tingimine'] },
        explanation: { en: 'Repeated pairing can make a neutral signal trigger a response that originally followed another stimulus.', et: 'Korduv seostamine võib panna neutraalse signaali esile kutsuma reaktsiooni, mille tekitas algselt teine stiimul.' },
        source: { sourceId: 'wikipedia:classical-conditioning-pavlov', title: 'Classical conditioning', url: 'https://en.wikipedia.org/wiki/Classical_conditioning', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-047:foucault-pendulum-earth-rotation', factKey: 'science-nature:foucault-pendulum-earth-rotation', tier: 2, subjectKey: 'experiment:foucault-pendulum',
        clue: { en: 'The swing plane of a freely moving Foucault pendulum appears to turn relative to the floor. Which motion of Earth does this demonstrate?', et: 'Vabalt liikuva Foucault’ pendli võnketasand näib põranda suhtes pöörduvat. Millist Maa liikumist see näitab?' }, response: { en: 'Earth’s rotation', et: 'Maa pöörlemine' }, acceptedVariants: { en: ['the rotation of Earth'], et: ['Maa pöördliikumine'] },
        explanation: { en: 'The pendulum keeps nearly the same swing direction in space while the ground rotates beneath it.', et: 'Pendel säilitab ruumis peaaegu sama võnkesuuna, samal ajal kui maapind selle all pöörleb.' },
        source: { sourceId: 'wikipedia:foucault-pendulum-earth-rotation', title: 'Foucault pendulum', url: 'https://en.wikipedia.org/wiki/Foucault_pendulum', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-047:double-slit-interference', factKey: 'science-nature:double-slit-interference', tier: 3, subjectKey: 'experiment:double-slit',
        clue: { en: 'Passing light through two narrow openings produces alternating bright and dark bands. Which famous experiment demonstrates this interference?', et: 'Valguse suunamisel läbi kahe kitsa ava tekivad vahelduvad heledad ja tumedad ribad. Milline kuulus katse näitab sellist interferentsi?' }, response: { en: 'the double-slit experiment', et: 'kahe pilu katse' }, acceptedVariants: { en: ['Young’s double-slit experiment', 'two-slit experiment'], et: ['Youngi kahe pilu katse', 'topeltpilukatse'] },
        explanation: { en: 'Waves from the two openings overlap, reinforcing one another in some places and cancelling in others.', et: 'Kahest avast lähtuvad lained kattuvad, võimendades teineteist mõnes kohas ja kustutades teises.' },
        source: { sourceId: 'wikipedia:double-slit-interference', title: 'Double-slit experiment', url: 'https://en.wikipedia.org/wiki/Double-slit_experiment', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-047:gold-foil-nucleus', factKey: 'science-nature:gold-foil-nucleus', tier: 4, subjectKey: 'experiment:gold-foil',
        clue: { en: 'Alpha particles fired at a thin sheet mostly passed through, but a few bounced sharply back, revealing a small dense atomic nucleus. Name the experiment.', et: 'Õhukesele metallilehele suunatud alfaosakesed läbisid selle enamasti, kuid mõni põrkus järsult tagasi, paljastades aatomi väikese tiheda tuuma. Nimeta katse.' }, response: { en: 'the gold foil experiment', et: 'Rutherfordi kullalehekatse' }, acceptedVariants: { en: ['Rutherford’s gold foil experiment', 'Geiger–Marsden experiment'], et: ['kullalehekatse', 'Geigeri–Marsdeni katse'] },
        explanation: { en: 'The scattering result overturned the diffuse “plum pudding” model and led to the nuclear model of the atom.', et: 'Hajumistulemus lükkas ümber hajusa „rosinapudingimudeli” ning viis aatomi tuumamudelini.' },
        source: { sourceId: 'wikipedia:geiger-marsden-gold-foil', title: 'Geiger–Marsden experiments', url: 'https://en.wikipedia.org/wiki/Geiger%E2%80%93Marsden_experiments', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-047:oil-drop-electron-charge', factKey: 'science-nature:oil-drop-electron-charge', tier: 5, subjectKey: 'experiment:oil-drop',
        clue: { en: 'Robert Millikan balanced tiny charged droplets between electric and gravitational forces to measure the elementary electric charge. Name this experiment.', et: 'Robert Millikan tasakaalustas pisikesi laetud piisku elektri- ja raskusjõu vahel, et mõõta elementaarlaengut. Nimeta see katse.' }, response: { en: 'the oil-drop experiment', et: 'õlitilga katse' }, acceptedVariants: { en: ['Millikan oil-drop experiment', 'Millikan’s oil-drop experiment'], et: ['Millikani õlitilga katse', 'Millikani katse'] },
        explanation: { en: 'The measured droplet charges came in whole-number multiples of one smallest charge value.', et: 'Mõõdetud piiskade laengud olid ühe vähima laenguväärtuse täisarvkordsed.' },
        source: { sourceId: 'wikipedia:oil-drop-elementary-charge', title: 'Oil drop experiment', url: 'https://en.wikipedia.org/wiki/Oil_drop_experiment', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
    ],
  },
  {
    categorySetId: 'built-in-science-nature-set-048', batchId: '03-science-nature', packId: 'built-in-science-nature', difficulty: 'medium',
    name: { en: 'Optical Surprises in the Sky', et: 'Optilised üllatused taevas' },
    questions: [
      {
        key: 'playable-science-nature:built-in-science-nature-set-048:mirage-hot-road', factKey: 'science-nature:mirage-hot-road', tier: 1, subjectKey: 'phenomenon:mirage',
        clue: { en: 'A hot road can seem to have a pool of water ahead because layers of air bend light differently. What illusion is this?', et: 'Kuumal teel võib ees paista veelomp, sest eri temperatuuriga õhukihid murravad valgust erinevalt. Mis nähtus see on?' }, response: { en: 'a mirage', et: 'miraaž' }, acceptedVariants: { en: ['mirage'], et: ['õhumiraaž'] },
        explanation: { en: 'A steep temperature gradient changes the path of light and can create a displaced image of the sky.', et: 'Järsk temperatuurigradient muudab valguse teed ja võib tekitada taeva nihkunud kujutise.' },
        source: { sourceId: 'wikipedia:mirage-hot-road', title: 'Mirage', url: 'https://en.wikipedia.org/wiki/Mirage', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-048:halo-ice-crystal-ring', factKey: 'science-nature:halo-ice-crystal-ring', tier: 2, subjectKey: 'phenomenon:halo',
        clue: { en: 'What ring around the Sun or Moon forms when high-altitude ice crystals refract and reflect light?', et: 'Milline rõngas Päikese või Kuu ümber tekib siis, kui kõrgpilvede jääkristallid valgust murravad ja peegeldavad?' }, response: { en: 'a halo', et: 'halo' }, acceptedVariants: { en: ['an ice halo'], et: ['halonähtus'] },
        explanation: { en: 'Hexagonal ice crystals redirect incoming light at characteristic angles, often producing a 22-degree ring.', et: 'Kuusnurksed jääkristallid suunavad valgust iseloomulike nurkade all ning tekitavad sageli 22-kraadise rõnga.' },
        source: { sourceId: 'wikipedia:22-degree-halo-ice-crystals', title: '22° halo', url: 'https://en.wikipedia.org/wiki/22%C2%B0_halo', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-048:sundog-bright-spot', factKey: 'science-nature:sundog-bright-spot', tier: 3, subjectKey: 'phenomenon:sundog',
        clue: { en: 'What is the bright, sometimes rainbow-tinted patch that can appear to either side of the Sun when light passes through ice crystals?', et: 'Kuidas nimetatakse heledat, vahel vikerkaarevärvilist laiku, mis võib jääkristalle läbinud valguse tõttu ilmuda Päikese kummalegi küljele?' }, response: { en: 'a sundog', et: 'ebapäike' }, acceptedVariants: { en: ['sun dog', 'parhelion'], et: ['kõrvalpäike', 'parheelion'] },
        explanation: { en: 'Plate-shaped crystals commonly place these bright patches at the same height as the Sun.', et: 'Plaadikujulised kristallid tekitavad need heledad laigud tavaliselt Päikesega samale kõrgusele.' },
        source: { sourceId: 'wikipedia:sundog-ice-crystals', title: 'Sun dog', url: 'https://en.wikipedia.org/wiki/Sun_dog', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-048:light-pillar-vertical-column', factKey: 'science-nature:light-pillar-vertical-column', tier: 4, subjectKey: 'phenomenon:light-pillar',
        clue: { en: 'Flat ice crystals can make a streetlamp or the low Sun seem to extend as a vertical column. Name this effect.', et: 'Lamedad jääkristallid võivad jätta mulje, et tänavalatern või madal Päike ulatub püstise sambana üles või alla. Nimeta nähtus.' }, response: { en: 'a light pillar', et: 'valgussammas' }, acceptedVariants: { en: ['light pillar'], et: ['valguspilar'] },
        explanation: { en: 'Many crystals reflect light toward the observer from slightly different heights, visually joining into a column.', et: 'Paljud eri kõrgustel paiknevad kristallid peegeldavad valgust vaatleja poole ning nende kujutised liituvad näiliseks sambaks.' },
        source: { sourceId: 'wikipedia:light-pillar-ice-crystals', title: 'Light pillar', url: 'https://en.wikipedia.org/wiki/Light_pillar', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-048:green-flash-horizon', factKey: 'science-nature:green-flash-horizon', tier: 5, subjectKey: 'phenomenon:green-flash',
        clue: { en: 'Just as the Sun disappears below a clear horizon, its upper edge may briefly turn emerald. What rare sight is this?', et: 'Selge horisondi taha kaduva Päikese ülaserv võib hetkeks smaragdroheliseks muutuda. Kuidas seda haruldast vaatepilti nimetatakse?' }, response: { en: 'the green flash', et: 'roheline kiir' }, acceptedVariants: { en: ['a green flash'], et: ['roheline välgatus'] },
        explanation: { en: 'Atmospheric refraction and colour separation can make the final visible sliver of the Sun appear green.', et: 'Atmosfääri refraktsioon ja valguse lahknemine värvusteks võivad muuta Päikese viimase nähtava serva roheliseks.' },
        source: { sourceId: 'wikipedia:green-flash-horizon', title: 'Green flash', url: 'https://en.wikipedia.org/wiki/Green_flash', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
    ],
  },
  {
    categorySetId: 'built-in-science-nature-set-049', batchId: '03-science-nature', packId: 'built-in-science-nature', difficulty: 'medium',
    name: { en: 'Close Company in Nature', et: 'Lähikooselu looduses' },
    questions: [
      {
        key: 'playable-science-nature:built-in-science-nature-set-049:tapeworm-intestinal-flatworm', factKey: 'science-nature:tapeworm-intestinal-flatworm', tier: 1, subjectKey: 'animal:tapeworm',
        clue: { en: 'Which ribbon-like, segmented flatworm has no digestive tract and absorbs nutrients while living in a vertebrate’s intestine?', et: 'Milline linditaoline lüliline lameuss elab selgroogse soolestikus, tal puudub seedekulgla ja ta omastab toitaineid läbi kehapinna?' }, response: { en: 'a tapeworm', et: 'paeluss' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Its flattened body takes up digested nutrients directly from the host’s gut.', et: 'Lame keha omastab peremehe soolestikust juba seeditud toitaineid.' },
        source: { sourceId: 'wikipedia:tapeworm-intestinal-flatworm', title: 'Cestoda', url: 'https://en.wikipedia.org/wiki/Cestoda', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-049:remora-suction-disc', factKey: 'science-nature:remora-suction-disc', tier: 2, subjectKey: 'animal:remora',
        clue: { en: 'Which fish uses a suction disc on top of its head to hitch rides on sharks, rays, or turtles?', et: 'Milline kala kasutab pea peal olevat iminappa, et sõita kaasa haide, raide või kilpkonnade küljes?' }, response: { en: 'a remora', et: 'imikala' }, acceptedVariants: { en: ['remora', 'suckerfish'], et: ['remora'] },
        explanation: { en: 'The modified dorsal fin forms a disc that grips a larger marine animal without piercing it.', et: 'Muundunud seljauim moodustab ketta, mis kinnitub suurema merelooma külge tema nahka läbistamata.' },
        source: { sourceId: 'wikipedia:remora-suction-disc', title: 'Remora', url: 'https://en.wikipedia.org/wiki/Remora', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-049:coral-bleaching-algae-loss', factKey: 'science-nature:coral-bleaching-algae-loss', tier: 3, subjectKey: 'process:coral-bleaching',
        clue: { en: 'Heat stress can make corals expel the microscopic algae that give them colour, leaving the pale skeleton visible. What is this event called?', et: 'Kuumastress võib panna korallid väljutama neile värvi andvad mikroskoopilised vetikad, nii et hele lubiskelett jääb nähtavale. Kuidas seda nähtust nimetatakse?' }, response: { en: 'coral bleaching', et: 'korallide pleekimine' }, acceptedVariants: { en: ['coral bleaching event'], et: ['korallide valgenemine'] },
        explanation: { en: 'A bleached coral is still alive at first, but prolonged loss of its algal partners can lead to starvation and death.', et: 'Pleekinud korall on esialgu elus, kuid vetikpartnerite pikaajaline puudumine võib viia nälgimise ja surmani.' },
        source: { sourceId: 'wikipedia:coral-bleaching-algae-loss', title: 'Coral bleaching', url: 'https://en.wikipedia.org/wiki/Coral_bleaching', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-049:lichen-fungus-alga', factKey: 'science-nature:lichen-fungus-alga', tier: 4, subjectKey: 'organism:lichen',
        clue: { en: 'What composite organism commonly consists of a fungus living closely with an alga or cyanobacterium?', et: 'Milline liitorganism koosneb tavaliselt seenest, kes elab tihedalt koos vetika või tsüanobakteriga?' }, response: { en: 'a lichen', et: 'samblik' }, acceptedVariants: { en: ['lichen'], et: ['lihhen'] },
        explanation: { en: 'The fungal partner provides structure, while the photosynthetic partner supplies organic nutrients.', et: 'Seenpartner loob struktuuri, fotosünteesiv partner aga toodab orgaanilisi toitaineid.' },
        source: { sourceId: 'wikipedia:lichen-fungus-photosynthetic-partner', title: 'Lichen', url: 'https://en.wikipedia.org/wiki/Lichen', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-049:mycorrhiza-fungus-root', factKey: 'science-nature:mycorrhiza-fungus-root', tier: 5, subjectKey: 'association:mycorrhiza',
        clue: { en: 'What name is given to the close association in which a fungus helps plant roots absorb water and minerals in exchange for sugars?', et: 'Kuidas nimetatakse kooslust, milles seen aitab taimejuurtel vett ja mineraalaineid omastada ning saab vastu suhkruid?' }, response: { en: 'mycorrhiza', et: 'mükoriisa' }, acceptedVariants: { en: ['a mycorrhiza', 'mycorrhizal association'], et: ['seenjuur', 'mükoriisne kooslus'] },
        explanation: { en: 'Fungal threads extend the root’s reach through soil, while the plant provides carbon-rich compounds.', et: 'Seeneniidid laiendavad juure ulatust mullas ning taim annab vastu süsinikurikkaid ühendeid.' },
        source: { sourceId: 'wikipedia:mycorrhiza-root-fungus-exchange', title: 'Mycorrhiza', url: 'https://en.wikipedia.org/wiki/Mycorrhiza', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
    ],
  },
  {
    categorySetId: 'built-in-science-nature-set-050', batchId: '03-science-nature', packId: 'built-in-science-nature', difficulty: 'medium',
    name: { en: 'Seasonal Survival Strategies', et: 'Hooajalised ellujäämisvõtted' },
    questions: [
      {
        key: 'playable-science-nature:built-in-science-nature-set-050:hibernation-winter-slowdown', factKey: 'science-nature:hibernation-winter-slowdown', tier: 1, subjectKey: 'strategy:hibernation',
        clue: { en: 'Bats and hedgehogs can spend winter in a prolonged state of greatly reduced metabolism. What seasonal strategy is this?', et: 'Nahkhiired ja siilid võivad veeta talve pikaajalises tugevalt aeglustunud ainevahetusega seisundis. Milline hooajaline strateegia see on?' }, response: { en: 'hibernation', et: 'talveuni' }, acceptedVariants: { en: ['winter hibernation'], et: ['hibernatsioon'] },
        explanation: { en: 'Hibernation conserves energy when cold weather and scarce food make normal activity costly.', et: 'Talveuni säästab energiat ajal, mil külm ilm ja toidunappus muudavad tavapärase aktiivsuse kulukaks.' },
        source: { sourceId: 'wikipedia:hibernation-winter-metabolism', title: 'Hibernation', url: 'https://en.wikipedia.org/wiki/Hibernation', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-050:estivation-hot-dry', factKey: 'science-nature:estivation-hot-dry', tier: 2, subjectKey: 'strategy:estivation',
        clue: { en: 'Some snails and lungfish become inactive during a hot, dry season to limit water loss. What is this warm-weather dormancy called?', et: 'Mõned teod ja kopskalad muutuvad kuumal kuival ajal veekao piiramiseks passiivseks. Kuidas nimetatakse sellist sooja aja puhkeseisundit?' }, response: { en: 'estivation', et: 'suveuni' }, acceptedVariants: { en: ['aestivation'], et: ['estivatsioon'] },
        explanation: { en: 'This reduced-activity state helps an animal survive heat or drought until conditions improve.', et: 'Selline vähenenud aktiivsusega seisund aitab loomal kuumuse või põua üle elada, kuni tingimused paranevad.' },
        source: { sourceId: 'wikipedia:estivation-hot-dry-dormancy', title: 'Aestivation', url: 'https://en.wikipedia.org/wiki/Aestivation', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-050:torpor-short-metabolic-drop', factKey: 'science-nature:torpor-short-metabolic-drop', tier: 3, subjectKey: 'state:torpor',
        clue: { en: 'A hummingbird may sharply lower its body temperature and metabolic rate for a single cold night. What short-term state is this?', et: 'Koolibri võib üheks külmaks ööks oma kehatemperatuuri ja ainevahetuse järsult langetada. Kuidas seda lühiajalist seisundit nimetatakse?' }, response: { en: 'torpor', et: 'tardumus' }, acceptedVariants: { en: ['daily torpor'], et: ['ööpäevane tardumus'] },
        explanation: { en: 'Torpor is a reversible metabolic slowdown that can last for hours and greatly reduce energy use.', et: 'Tardumus on tundide kaupa kestev pöörduv ainevahetuse aeglustumine, mis vähendab oluliselt energiakulu.' },
        source: { sourceId: 'wikipedia:torpor-short-term-metabolic', title: 'Torpor', url: 'https://en.wikipedia.org/wiki/Torpor', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-050:diapause-insect-development', factKey: 'science-nature:diapause-insect-development', tier: 4, subjectKey: 'state:diapause',
        clue: { en: 'Many insects survive an unfavourable season by entering a hormonally programmed pause in development. What is this pause called?', et: 'Paljud putukad elavad ebasoodsa aastaaja üle, peatades hormonaalse programmi alusel oma arengu. Kuidas seda arengupausi nimetatakse?' }, response: { en: 'diapause', et: 'diapaus' }, acceptedVariants: { en: ['insect diapause'], et: ['putukate diapaus'] },
        explanation: { en: 'Diapause begins before conditions become severe and ends only after particular environmental cues.', et: 'Diapaus algab enne tingimuste karmistumist ning lõpeb alles kindlate keskkonnasignaalide järel.' },
        source: { sourceId: 'wikipedia:diapause-programmed-development', title: 'Diapause', url: 'https://en.wikipedia.org/wiki/Diapause', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-050:antifreeze-proteins-ice-growth', factKey: 'science-nature:antifreeze-proteins-ice-growth', tier: 5, subjectKey: 'protein:antifreeze',
        clue: { en: 'Polar fish can keep their body fluids from freezing by making molecules that bind to tiny ice crystals and stop them growing. What are these molecules called?', et: 'Polaaralade kalad võivad takistada kehavedelike külmumist molekulidega, mis seonduvad tillukeste jääkristallidega ja peatavad nende kasvu. Kuidas neid molekule nimetatakse?' }, response: { en: 'antifreeze proteins', et: 'antifriisivalgud' }, acceptedVariants: { en: ['antifreeze protein', 'ice-binding proteins'], et: ['külmumisvastased valgud', 'jääga seonduvad valgud'] },
        explanation: { en: 'These proteins lower the temperature at which ice crystals can grow in biological fluids.', et: 'Need valgud langetavad temperatuuri, mille juures jääkristallid saavad kehavedelikes edasi kasvada.' },
        source: { sourceId: 'wikipedia:antifreeze-protein-ice-growth', title: 'Antifreeze protein', url: 'https://en.wikipedia.org/wiki/Antifreeze_protein', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
    ],
  },
  {
    categorySetId: 'built-in-science-nature-set-008', batchId: '03-science-nature', packId: 'built-in-science-nature', difficulty: 'hard',
    name: { en: 'Instruments for Invisible Evidence', et: 'Nähtamatu maailma mõõteriistad' },
    questions: [
      {
        key: 'playable-science-nature:built-in-science-nature-set-008:geiger-counter-radiation', factKey: 'science-nature:geiger-counter-radiation', tier: 1, subjectKey: 'instrument:geiger-counter',
        clue: { en: 'Which handheld detector often signals each pulse of ionizing radiation with a characteristic click?', et: 'Milline käeshoitav detektor annab igast ioniseeriva kiirguse impulsist sageli märku iseloomuliku klõpsuga?' }, response: { en: 'a Geiger counter', et: 'Geigeri loendur' }, acceptedVariants: { en: ['Geiger counter', 'Geiger–Müller counter'], et: ['Geigeri–Mülleri loendur', 'Geiger-Mülleri loendur'] },
        explanation: { en: 'Incoming radiation ionizes gas in the tube, producing an electrical pulse that can be counted.', et: 'Saabuv kiirgus ioniseerib torus oleva gaasi ning tekitab loendatava elektriimpulsi.' },
        source: { sourceId: 'wikipedia:geiger-counter-ionizing-radiation', title: 'Geiger counter', url: 'https://en.wikipedia.org/wiki/Geiger_counter', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-008:calorimeter-heat-transfer', factKey: 'science-nature:calorimeter-heat-transfer', tier: 2, subjectKey: 'instrument:calorimeter',
        clue: { en: 'A chemist puts a reaction in an insulated vessel and tracks a temperature change to determine transferred heat. What instrument is being used?', et: 'Keemik viib reaktsiooni läbi isoleeritud anumas ning jälgib temperatuuri muutust, et määrata ülekantud soojushulk. Millist mõõteriista ta kasutab?' }, response: { en: 'a calorimeter', et: 'kalorimeeter' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Known heat capacities and measured temperature changes allow the exchanged energy to be calculated.', et: 'Teadaolevate soojusmahtuvuste ja mõõdetud temperatuurimuutuste abil saab vahetatud energia arvutada.' },
        source: { sourceId: 'wikipedia:calorimeter-heat-measurement', title: 'Calorimeter', url: 'https://en.wikipedia.org/wiki/Calorimeter', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-008:mass-spectrometer-mass-charge', factKey: 'science-nature:mass-spectrometer-mass-charge', tier: 3, subjectKey: 'instrument:mass-spectrometer',
        clue: { en: 'Which laboratory instrument identifies chemical species by separating ions according to their mass-to-charge ratio?', et: 'Milline laboriseade tuvastab keemilisi osakesi, eraldades ioone nende massi ja laengu suhte järgi?' }, response: { en: 'a mass spectrometer', et: 'massispektromeeter' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The resulting spectrum shows ion signals at characteristic mass-to-charge values.', et: 'Saadud spekter näitab ioonide signaale neile iseloomulike massi ja laengu suhete juures.' },
        source: { sourceId: 'wikipedia:mass-spectrometry-mass-charge', title: 'Mass spectrometry', url: 'https://en.wikipedia.org/wiki/Mass_spectrometry', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-008:cloud-chamber-particle-tracks', factKey: 'science-nature:cloud-chamber-particle-tracks', tier: 4, subjectKey: 'instrument:cloud-chamber',
        clue: { en: 'Charged particles leave visible condensation trails through supersaturated vapour in what classic detector?', et: 'Millises klassikalises detektoris jätavad laetud osakesed üleküllastunud auru läbides nähtavad kondensatsioonijäljed?' }, response: { en: 'a cloud chamber', et: 'pilvekamber' }, acceptedVariants: { en: ['cloud chamber', 'Wilson cloud chamber'], et: ['Wilsoni pilvekamber'] },
        explanation: { en: 'Ions along a particle’s path act as centres around which tiny droplets form.', et: 'Osakese rajale tekkinud ioonid toimivad keskustena, mille ümber moodustuvad pisikesed tilgad.' },
        source: { sourceId: 'wikipedia:cloud-chamber-condensation-tracks', title: 'Cloud chamber', url: 'https://en.wikipedia.org/wiki/Cloud_chamber', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-008:interferometer-tiny-changes', factKey: 'science-nature:interferometer-tiny-changes', tier: 5, subjectKey: 'instrument:interferometer',
        clue: { en: 'Which precision instrument splits a wave and recombines its paths so shifts in the interference pattern reveal extremely small changes in distance?', et: 'Milline täppisinstrument jagab laine eri teedele ja liidab need uuesti, nii et interferentsipildi nihe paljastab üliväikese vahemaa muutuse?' }, response: { en: 'an interferometer', et: 'interferomeeter' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'A tiny path difference changes the relative phase of the recombined waves and moves the pattern.', et: 'Väike teepikkuste erinevus muudab taasühendatud lainete suhtelist faasi ning nihutab interferentsipilti.' },
        source: { sourceId: 'wikipedia:interferometry-path-difference', title: 'Interferometry', url: 'https://en.wikipedia.org/wiki/Interferometry', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
    ],
  },
  {
    categorySetId: 'built-in-science-nature-set-009', batchId: '03-science-nature', packId: 'built-in-science-nature', difficulty: 'hard',
    name: { en: 'Reading Earth’s Deep Past', et: 'Maa süvaajaloo lugemine' },
    questions: [
      {
        key: 'playable-science-nature:built-in-science-nature-set-009:mohs-scale-scratch-hardness', factKey: 'science-nature:mohs-scale-scratch-hardness', tier: 1, subjectKey: 'scale:mohs',
        clue: { en: 'A geologist compares whether one mineral can scratch another, ranking relative hardness from talc to diamond. Which scale is being used?', et: 'Geoloog võrdleb, kas üks mineraal kriimustab teist, ning järjestab suhtelise kõvaduse talgist teemandini. Millist skaalat ta kasutab?' }, response: { en: 'the Mohs scale', et: 'Mohsi skaala' }, acceptedVariants: { en: ['Mohs scale', 'Mohs hardness scale'], et: ['Mohsi kõvadusskaala'] },
        explanation: { en: 'The scale orders ten reference minerals by scratch resistance rather than measuring hardness in equal numerical steps.', et: 'Skaala järjestab kümme võrdlusmineraali kriimustuskindluse järgi, kuid arvulised astmed ei ole omavahel võrdsed.' },
        source: { sourceId: 'wikipedia:mohs-scale-scratch-hardness', title: 'Mohs scale', url: 'https://en.wikipedia.org/wiki/Mohs_scale', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-009:index-fossil-correlate-layers', factKey: 'science-nature:index-fossil-correlate-layers', tier: 2, subjectKey: 'evidence:index-fossil',
        clue: { en: 'A fossil from a widespread species that existed for a relatively short time can help match the ages of distant rock layers. What is it called?', et: 'Laialt levinud, kuid suhteliselt lühikest aega elanud liigi kivistis aitab võrrelda kaugete kivimikihtide vanust. Kuidas seda nimetatakse?' }, response: { en: 'an index fossil', et: 'juhtkivistis' }, acceptedVariants: { en: ['index fossil', 'guide fossil'], et: ['indekskivistis'] },
        explanation: { en: 'Finding the same diagnostic fossil in separate locations helps geologists correlate the layers.', et: 'Sama iseloomuliku kivistise leidmine eri paikades aitab geoloogidel kihte omavahel rööbistada.' },
        source: { sourceId: 'wikipedia:index-fossil-correlation', title: 'Index fossil', url: 'https://en.wikipedia.org/wiki/Index_fossil', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-009:radiometric-dating-isotope-clock', factKey: 'science-nature:radiometric-dating-isotope-clock', tier: 3, subjectKey: 'method:radiometric-dating',
        clue: { en: 'Which dating method compares radioactive parent isotopes with their decay products to calculate the age of a rock or mineral?', et: 'Milline dateerimismeetod võrdleb radioaktiivseid lähteisotoope nende lagunemissaadustega, et arvutada kivimi või mineraali vanus?' }, response: { en: 'radiometric dating', et: 'radiomeetriline dateerimine' }, acceptedVariants: { en: ['radioisotope dating'], et: ['radiomeetriline vanusemääramine', 'radioisotoopdateerimine'] },
        explanation: { en: 'A known decay rate turns the measured parent-to-product ratio into a geological clock.', et: 'Teadaolev lagunemiskiirus muudab mõõdetud lähte- ja tütarisotoopide suhte geoloogiliseks kellaks.' },
        source: { sourceId: 'wikipedia:radiometric-dating-parent-daughter', title: 'Radiometric dating', url: 'https://en.wikipedia.org/wiki/Radiometric_dating', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-009:unconformity-missing-time', factKey: 'science-nature:unconformity-missing-time', tier: 4, subjectKey: 'feature:unconformity',
        clue: { en: 'What geological surface marks missing time where deposition stopped or older rock was eroded before younger layers formed?', et: 'Milline geoloogiline piirpind tähistab puuduva ajavahemikuga kohta, kus settimine katkes või vanem kivim kulutati enne nooremate kihtide teket?' }, response: { en: 'an unconformity', et: 'stratigraafiline katkestus' }, acceptedVariants: { en: ['unconformity'], et: ['diskordants'] },
        explanation: { en: 'The boundary represents a gap in the local rock record rather than continuous deposition.', et: 'See piir tähistab kohalikus kivimite läbilõikes lünka, mitte pidevat settimist.' },
        source: { sourceId: 'wikipedia:unconformity-gap-rock-record', title: 'Unconformity', url: 'https://en.wikipedia.org/wiki/Unconformity', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-009:uniformitarianism-present-past', factKey: 'science-nature:uniformitarianism-present-past', tier: 5, subjectKey: 'principle:uniformitarianism',
        clue: { en: '“The present is the key to the past” summarizes which geological principle that uses directly observed processes to interpret ancient rocks?', et: 'Ütlus „olevik on mineviku võti” võtab kokku millise geoloogilise printsiibi, mis tõlgendab muistseid kivimeid vaadeldavate loodusprotsesside abil?' }, response: { en: 'uniformitarianism', et: 'aktualism' }, acceptedVariants: { en: ['the principle of uniformitarianism'], et: ['aktualismiprintsiip', 'uniformitarism'] },
        explanation: { en: 'The principle assumes that the same natural laws and recurring processes can explain geological history.', et: 'Printsiibi järgi aitavad samad loodusseadused ja korduvad protsessid selgitada geoloogilist ajalugu.' },
        source: { sourceId: 'wikipedia:uniformitarianism-present-past', title: 'Uniformitarianism', url: 'https://en.wikipedia.org/wiki/Uniformitarianism', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
    ],
  },
  {
    categorySetId: 'built-in-science-nature-set-067', batchId: '03-science-nature', packId: 'built-in-science-nature', difficulty: 'hard',
    name: { en: 'How Nerve Signals Travel', et: 'Närvisignaalide teekond' },
    questions: [
      {
        key: 'playable-science-nature:built-in-science-nature-set-067:synapse-neuron-junction', factKey: 'science-nature:synapse-neuron-junction', tier: 1, subjectKey: 'structure:synapse',
        clue: { en: 'What junction lets one neuron pass a signal to another cell, commonly by releasing a chemical messenger across a tiny gap?', et: 'Milline ühenduskoht võimaldab närvirakul anda signaali järgmisele rakule, saates tavaliselt üle tillukese pilu keemilise virgatsaine?' }, response: { en: 'a synapse', et: 'sünaps' }, acceptedVariants: { en: ['synapse', 'synaptic junction'], et: ['sünaptiline ühendus'] },
        explanation: { en: 'At a chemical synapse, the sending cell releases messenger molecules that bind to receptors on the receiving cell.', et: 'Keemilises sünapsis vabastab saatjarakk virgatsaineid, mis seonduvad vastuvõtjaraku retseptoritega.' },
        source: { sourceId: 'wikipedia:synapse-neuron-junction', title: 'Synapse', url: 'https://en.wikipedia.org/wiki/Synapse', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-067:reflex-arc-withdrawal', factKey: 'science-nature:reflex-arc-withdrawal', tier: 2, subjectKey: 'pathway:reflex-arc',
        clue: { en: 'Touching a hot surface triggers a rapid route from sensory receptor through the spinal cord to a muscle. What is this neural pathway called?', et: 'Kuuma pinna puudutamisel kulgeb kiire signaalitee meeleretseptorist seljaaju kaudu lihasesse. Kuidas seda närviteed nimetatakse?' }, response: { en: 'a reflex arc', et: 'refleksikaar' }, acceptedVariants: { en: ['reflex arc'], et: ['refleksitee'] },
        explanation: { en: 'The pathway produces a quick protective response before detailed conscious processing is complete.', et: 'See närvitee tekitab kiire kaitsereaktsiooni enne, kui teadlik töötlus on lõpule jõudnud.' },
        source: { sourceId: 'wikipedia:reflex-arc-neural-pathway', title: 'Reflex arc', url: 'https://en.wikipedia.org/wiki/Reflex_arc', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-067:myelin-axon-insulation', factKey: 'science-nature:myelin-axon-insulation', tier: 3, subjectKey: 'substance:myelin',
        clue: { en: 'What fatty insulating substance wraps many axons and greatly increases the speed of nerve impulses?', et: 'Milline rasvarikas isoleeriv aine ümbritseb paljusid aksoneid ja suurendab märgatavalt närviimpulsside kiirust?' }, response: { en: 'myelin', et: 'müeliin' }, acceptedVariants: { en: ['myelin sheath'], et: ['müeliinkest'] },
        explanation: { en: 'The insulating layers reduce current loss and allow rapid transmission along the fibre.', et: 'Isoleerivad kihid vähendavad voolukadu ning võimaldavad signaalil piki närvikiudu kiiresti levida.' },
        source: { sourceId: 'wikipedia:myelin-axon-insulation', title: 'Myelin', url: 'https://en.wikipedia.org/wiki/Myelin', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-067:action-potential-voltage-pulse', factKey: 'science-nature:action-potential-voltage-pulse', tier: 4, subjectKey: 'signal:action-potential',
        clue: { en: 'What all-or-none electrical pulse briefly reverses the voltage across a neuron’s membrane and propagates along it?', et: 'Milline kõik-või-mitte-midagi elektriimpulss pöörab hetkeks närviraku membraanipinge vastupidiseks ning levib mööda rakku?' }, response: { en: 'an action potential', et: 'aktsioonipotentsiaal' }, acceptedVariants: { en: ['action potential', 'nerve impulse'], et: ['toimepotentsiaal', 'närviimpulss'] },
        explanation: { en: 'Ion channels open in sequence, producing a self-propagating change in membrane voltage.', et: 'Ioonkanalid avanevad järjest ning tekitavad iseeneslikult edasi leviva membraanipinge muutuse.' },
        source: { sourceId: 'wikipedia:action-potential-membrane-voltage', title: 'Action potential', url: 'https://en.wikipedia.org/wiki/Action_potential', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-067:saltatory-conduction-node-jumps', factKey: 'science-nature:saltatory-conduction-node-jumps', tier: 5, subjectKey: 'process:saltatory-conduction',
        clue: { en: 'In an insulated axon, the electrical signal is regenerated only at exposed gaps and seems to leap from gap to gap. Name this mode of transmission.', et: 'Isoleeritud aksonis taastub elektrisignaal üksnes katmata sõlmekohtades ning näib hüppavat ühest pilust teise. Nimeta selline levimisviis.' }, response: { en: 'saltatory conduction', et: 'hüppeline erutusjuhtimine' }, acceptedVariants: { en: ['saltatory propagation'], et: ['saltatoorne juhtimine', 'hüppeline juhtimine'] },
        explanation: { en: 'Regeneration at the nodes of Ranvier makes transmission faster than continuous propagation along every membrane segment.', et: 'Signaali taastumine Ranvier’ soonistes muudab leviku kiiremaks kui pidev edasikandumine membraani igas lõigus.' },
        source: { sourceId: 'wikipedia:saltatory-conduction-nodes', title: 'Saltatory conduction', url: 'https://en.wikipedia.org/wiki/Saltatory_conduction', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
    ],
  },
  {
    categorySetId: 'built-in-science-nature-set-068', batchId: '03-science-nature', packId: 'built-in-science-nature', difficulty: 'hard',
    name: { en: 'Engines of the Ocean', et: 'Ookeani liikumapanevad jõud' },
    questions: [
      {
        key: 'playable-science-nature:built-in-science-nature-set-068:upwelling-nutrient-rich-water', factKey: 'science-nature:upwelling-nutrient-rich-water', tier: 1, subjectKey: 'process:upwelling',
        clue: { en: 'What process brings cold, nutrient-rich deep water toward the sea surface, supporting productive fisheries off coasts such as Peru?', et: 'Milline protsess toob külma ja toitainerikka süvavee merepinna poole ning toetab kalandust näiteks Peruu rannikul?' }, response: { en: 'upwelling', et: 'süvaveekerge' }, acceptedVariants: { en: ['ocean upwelling'], et: ['uhkvool', 'apvelling'] },
        explanation: { en: 'When winds move surface water away, deeper water rises to replace it and carries dissolved nutrients upward.', et: 'Kui tuul viib pinnavee eemale, tõuseb sügavam vesi seda asendama ning kannab lahustunud toitained üles.' },
        source: { sourceId: 'wikipedia:upwelling-nutrient-rich-water', title: 'Upwelling', url: 'https://en.wikipedia.org/wiki/Upwelling', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-068:thermocline-temperature-gradient', factKey: 'science-nature:thermocline-temperature-gradient', tier: 2, subjectKey: 'layer:thermocline',
        clue: { en: 'What ocean layer separates warm surface water from colder deep water and has a rapid temperature change with depth?', et: 'Millises ookeanikihis muutub temperatuur sügavuse suurenedes kiiresti, eraldades sooja pinnavee külmast süvaveest?' }, response: { en: 'the thermocline', et: 'termokliin' }, acceptedVariants: { en: ['thermocline'], et: ['temperatuuri hüppekiht'] },
        explanation: { en: 'Within this transition layer, a relatively small increase in depth produces a large temperature drop.', et: 'Selles üleminekukihis toob suhteliselt väike sügavuse kasv kaasa suure temperatuurilanguse.' },
        source: { sourceId: 'wikipedia:thermocline-ocean-layer', title: 'Thermocline', url: 'https://en.wikipedia.org/wiki/Thermocline', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-068:ocean-gyre-circular-currents', factKey: 'science-nature:ocean-gyre-circular-currents', tier: 3, subjectKey: 'system:ocean-gyre',
        clue: { en: 'The Gulf Stream forms part of what type of vast circular current system shaped by global winds and Earth’s rotation?', et: 'Millist liiki hiiglaslikku ringjat hoovustesüsteemi kuulub Golfi hoovus, kui selliseid süsteeme kujundavad püsivad tuuled ja Maa pöörlemine?' }, response: { en: 'an ocean gyre', et: 'ookeani ringhoovus' }, acceptedVariants: { en: ['ocean gyre', 'gyre'], et: ['ookeanikeeris', 'ookeani hoovusering'] },
        explanation: { en: 'Major basins contain rotating current systems that redistribute heat and floating material across great distances.', et: 'Suurtes ookeanibasseinides pöörlevad hoovustesüsteemid kannavad soojust ja ujuvat materjali väga pikkade vahemaade taha.' },
        source: { sourceId: 'wikipedia:ocean-gyre-circular-currents', title: 'Ocean gyre', url: 'https://en.wikipedia.org/wiki/Ocean_gyre', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-068:thermohaline-density-circulation', factKey: 'science-nature:thermohaline-density-circulation', tier: 4, subjectKey: 'circulation:thermohaline',
        clue: { en: 'What global deep-water circulation is driven by density differences caused mainly by temperature and salinity?', et: 'Kuidas nimetatakse üleilmset süvaveeringlust, mida käitavad peamiselt temperatuurist ja soolsusest tingitud tiheduserinevused?' }, response: { en: 'thermohaline circulation', et: 'termohaliinne tsirkulatsioon' }, acceptedVariants: { en: ['the global conveyor belt'], et: ['termohaliinne ringlus', 'globaalne konveierlint'] },
        explanation: { en: 'Cold, salty water sinks in key regions and participates in a connected system of deep and surface flows.', et: 'Külm soolane vesi vajub teatud piirkondades põhja ning osaleb omavahel seotud süva- ja pinnahoovuste süsteemis.' },
        source: { sourceId: 'wikipedia:thermohaline-circulation-density', title: 'Thermohaline circulation', url: 'https://en.wikipedia.org/wiki/Thermohaline_circulation', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-068:ekman-transport-right-angle', factKey: 'science-nature:ekman-transport-right-angle', tier: 5, subjectKey: 'process:ekman-transport',
        clue: { en: 'Because rotating Earth deflects each moving layer, wind can drive the net upper-ocean flow roughly at right angles to its own direction. Name this transport.', et: 'Maa pöörlemise tõttu kaldub iga liikuv veekiht kõrvale ning tuul võib panna ookeani ülakihi summaarse voolu liikuma enda suunaga ligikaudu risti. Nimeta see transport.' }, response: { en: 'Ekman transport', et: 'Ekmani transport' }, acceptedVariants: { en: ['the Ekman transport'], et: ['Ekmani ülekanne'] },
        explanation: { en: 'Friction transfers motion downward while rotational deflection turns successive layers, producing a sideways net flow.', et: 'Hõõrdumine kannab liikumise allapoole, pöörlemisest tingitud kõrvalekalle aga pöörab järjestikuseid kihte ja tekitab külgsuunalise summaarse voolu.' },
        source: { sourceId: 'wikipedia:ekman-transport-net-flow', title: 'Ekman transport', url: 'https://en.wikipedia.org/wiki/Ekman_transport', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
    ],
  },
  {
    categorySetId: 'built-in-science-nature-set-069', batchId: '03-science-nature', packId: 'built-in-science-nature', difficulty: 'hard',
    name: { en: 'Signals in the Climate System', et: 'Kliimasüsteemi signaalid' },
    questions: [
      {
        key: 'playable-science-nature:built-in-science-nature-set-069:albedo-reflected-fraction', factKey: 'science-nature:albedo-reflected-fraction', tier: 1, subjectKey: 'property:albedo',
        clue: { en: 'Fresh snow reflects much more sunlight than dark ocean water. What name is given to the fraction of incoming radiation a surface reflects?', et: 'Värske lumi peegeldab palju rohkem päikesevalgust kui tume ookeanivesi. Kuidas nimetatakse pinnalt tagasi peegelduva kiirguse osakaalu?' }, response: { en: 'albedo', et: 'albeedo' }, acceptedVariants: { en: ['surface albedo'], et: ['pinna albeedo'] },
        explanation: { en: 'A high value means a surface returns a large share of incoming energy instead of absorbing it.', et: 'Suur väärtus tähendab, et pind saadab suure osa saabuvast energiast tagasi ega neela seda.' },
        source: { sourceId: 'wikipedia:albedo-reflected-radiation', title: 'Albedo', url: 'https://en.wikipedia.org/wiki/Albedo', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-069:carbon-sink-net-uptake', factKey: 'science-nature:carbon-sink-net-uptake', tier: 2, subjectKey: 'reservoir:carbon-sink',
        clue: { en: 'A forest, soil, or ocean region that absorbs more carbon than it releases is known by what two-word term?', et: 'Kuidas nimetatakse metsa, mulda või ookeanipiirkonda, mis seob rohkem süsinikku, kui seda vabastab?' }, response: { en: 'a carbon sink', et: 'süsiniku siduja' }, acceptedVariants: { en: ['carbon sink'], et: ['süsinikuneel', 'süsiniku neeldaja'] },
        explanation: { en: 'Net uptake stores carbon in biomass, soils, dissolved compounds, or sediments.', et: 'Netosidumine talletab süsinikku biomassis, mullas, lahustunud ühendites või setetes.' },
        source: { sourceId: 'wikipedia:carbon-sink-net-uptake', title: 'Carbon sink', url: 'https://en.wikipedia.org/wiki/Carbon_sink', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-069:ocean-acidification-carbon-dioxide', factKey: 'science-nature:ocean-acidification-carbon-dioxide', tier: 3, subjectKey: 'process:ocean-acidification',
        clue: { en: 'What process lowers seawater pH as the ocean absorbs atmospheric carbon dioxide and forms carbonic acid?', et: 'Milline protsess alandab merevee pH-d, kui ookean neelab atmosfääri süsinikdioksiidi ja tekib süsihape?' }, response: { en: 'ocean acidification', et: 'ookeani hapestumine' }, acceptedVariants: { en: ['acidification of the ocean'], et: ['ookeanide hapestumine', 'merevee hapestumine'] },
        explanation: { en: 'The added carbon dioxide shifts seawater chemistry and reduces the availability of carbonate ions.', et: 'Lisandunud süsinikdioksiid muudab merevee keemilist tasakaalu ning vähendab karbonaatioonide kättesaadavust.' },
        source: { sourceId: 'wikipedia:ocean-acidification-carbon-dioxide', title: 'Ocean acidification', url: 'https://en.wikipedia.org/wiki/Ocean_acidification', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-069:climate-proxy-indirect-record', factKey: 'science-nature:climate-proxy-indirect-record', tier: 4, subjectKey: 'evidence:climate-proxy',
        clue: { en: 'Tree rings, pollen in sediments, and coral growth bands can stand in for thermometer readings from before instruments existed. What is such indirect evidence called?', et: 'Aastarõngad, setetes leiduv õietolm ja korallide kasvuvööndid võivad asendada mõõteriistade-eelse aja temperatuuriandmeid. Kuidas sellist kaudset tõendit nimetatakse?' }, response: { en: 'a climate proxy', et: 'kliimaproksi' }, acceptedVariants: { en: ['climate proxy', 'proxy record'], et: ['kliima asendusnäitaja', 'proksiandmed'] },
        explanation: { en: 'A calibrated relationship lets a preserved natural feature estimate a past climate variable.', et: 'Kalibreeritud seos võimaldab säilinud loodusliku tunnuse abil hinnata mineviku kliimanäitajat.' },
        source: { sourceId: 'wikipedia:proxy-climate-indirect-record', title: 'Proxy (climate)', url: 'https://en.wikipedia.org/wiki/Proxy_(climate)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
      {
        key: 'playable-science-nature:built-in-science-nature-set-069:milankovitch-orbital-cycles', factKey: 'science-nature:milankovitch-orbital-cycles', tier: 5, subjectKey: 'cycle:milankovitch',
        clue: { en: 'Which named cycles combine slow changes in Earth’s orbital shape, axial tilt, and precession to alter the distribution of sunlight over thousands of years?', et: 'Millised nime saanud tsüklid ühendavad Maa orbiidi kuju, teljekalde ja pretsessiooni aeglased muutused, mis muudavad tuhandete aastate jooksul päikesekiirguse jaotust?' }, response: { en: 'Milankovitch cycles', et: 'Milankovići tsüklid' }, acceptedVariants: { en: ['Milanković cycles'], et: ['Milankovitchi tsüklid'] },
        explanation: { en: 'The three orbital variations change seasonal and regional insolation and help pace long-term glacial cycles.', et: 'Kolm orbiidimuutust mõjutavad päikesekiirguse hooajalist ja piirkondlikku jaotust ning aitavad ajastada pikaajalisi jääajatsükleid.' },
        source: { sourceId: 'wikipedia:milankovitch-orbital-cycles', title: 'Milankovitch cycles', url: 'https://en.wikipedia.org/wiki/Milankovitch_cycles', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-28' },
      },
    ],
  },
] as const satisfies readonly PlayableCategory[];

export const SCIENCE_NATURE_CATEGORIES = validatePlayableCorpus(rawCategories, ASSIGNED_TARGETS.slice(0, rawCategories.length));

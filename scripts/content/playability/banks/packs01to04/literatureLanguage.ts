import { PLAYABLE_TARGETS } from '../../targets';
import type { PlayableCategory } from '../../types';
import { validatePlayableCorpus } from '../../validateBank';

const ASSIGNED_TARGETS = PLAYABLE_TARGETS.filter(({ batchId }) => batchId === '04-literature-language');

const rawCategories = [
  {
    categorySetId: 'built-in-literature-language-set-007', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'The Odyssey: The Long Way Home', et: '„Odüsseia“: pikk kodutee' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-007:aeolus-bag-of-winds', factKey: 'literature-language:aeolus-gives-odysseus-winds', tier: 1, subjectKey: 'character:aeolus',
        clue: { en: 'Which keeper of the winds gives Odysseus a leather bag containing every wind except the one that will carry him home?', et: 'Milline tuulte valitseja annab Odysseusele nahkkoti kõigi tuultega peale selle, mis viiks ta kodu poole?' }, response: { en: 'Aeolus', et: 'Aiolos' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Aeolus confines the contrary winds, but Odysseus’s crew opens the bag and blows the ship back off course.', et: 'Aiolos sulgeb vastutuuled kotti, kuid Odysseuse kaaslased avavad selle ja laev kandub taas kursilt kõrvale.' },
        source: { sourceId: 'wikipedia:aeolus-odyssey-winds', title: 'Aeolus (son of Hippotes)', url: 'https://en.wikipedia.org/wiki/Aeolus_(son_of_Hippotes)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-007:nausicaa-finds-odysseus', factKey: 'literature-language:nausicaa-finds-shipwrecked-odysseus', tier: 2, subjectKey: 'character:nausicaa',
        clue: { en: 'Which Phaeacian princess finds the shipwrecked Odysseus after Athena sends her to wash clothes by the shore?', et: 'Milline faiaakide printsess leiab merehädalise Odüsseuse pärast seda, kui Athena saadab ta randa pesu pesema?' }, response: { en: 'Nausicaa', et: 'Nausikaa' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Nausicaa gives the stranger clothing and directions to the palace of her parents, Alcinous and Arete.', et: 'Nausikaa annab võõrale riided ning juhatab ta oma vanemate Alkinoose ja Arete paleesse.' },
        source: { sourceId: 'wikipedia:nausicaa-odyssey', title: 'Nausicaa', url: 'https://en.wikipedia.org/wiki/Nausicaa', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-007:eumaeus-loyal-swineherd', factKey: 'literature-language:eumaeus-shelters-disguised-odysseus', tier: 3, subjectKey: 'character:eumaeus',
        clue: { en: 'What loyal swineherd shelters Odysseus without recognizing his disguised master and later helps him defeat the suitors?', et: 'Milline ustav seakarjus võõrustab Odüsseust, tundmata maskeeritud isandat ära, ning aitab hiljem kosilased võita?' }, response: { en: 'Eumaeus', et: 'Eumaios' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Eumaeus remains faithful during Odysseus’s absence and joins him and Telemachus in the final fight.', et: 'Eumaios jääb Odüsseuse äraolekul truuks ning võitleb lõpus tema ja Telemachose kõrval.' },
        source: { sourceId: 'wikipedia:eumaeus-loyal-swineherd', title: 'Eumaeus', url: 'https://en.wikipedia.org/wiki/Eumaeus', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-007:laestrygonians-destroy-fleet', factKey: 'literature-language:laestrygonians-destroy-eleven-ships', tier: 4, subjectKey: 'people:laestrygonians',
        clue: { en: 'Which race of cannibal giants destroys every ship in Odysseus’s fleet except his own after trapping the vessels in a harbour?', et: 'Milline inimsööjatest hiiglaste rahvas hävitab sadamasse lõksu jäänud Odüsseuse laevastiku kõik laevad peale tema enda oma?' }, response: { en: 'the Laestrygonians', et: 'laistrügoonid' }, acceptedVariants: { en: ['Laestrygonians'], et: ['lestrügoonid'] },
        explanation: { en: 'The Laestrygonians hurl rocks from the cliffs and spear the trapped crews, leaving only Odysseus’s ship to escape.', et: 'Laistrügoonid loobivad kaljudelt kive ja tapavad lõksu jäänud meeskonnad; pääseb vaid Odüsseuse laev.' },
        source: { sourceId: 'wikipedia:laestrygonians-destroy-fleet', title: 'Laestrygonians', url: 'https://en.wikipedia.org/wiki/Laestrygonians', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-007:argus-recognises-master', factKey: 'literature-language:argus-recognises-odysseus-before-death', tier: 5, subjectKey: 'animal:argus',
        clue: { en: 'What neglected old dog recognizes Odysseus beneath his beggar disguise, wags his tail, and dies after seeing his master once more?', et: 'Milline hooletusse jäetud vana koer tunneb kerjuseks maskeeritud Odüsseuse ära, liputab saba ja sureb pärast isanda taasnägemist?' }, response: { en: 'Argus', et: 'Argos' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Argus alone immediately recognizes the returned hero, making their brief reunion a symbol of enduring loyalty.', et: 'Argos tunneb naasnud kangelase kohe ära ning nende lühikesest taaskohtumisest saab kestva truuduse sümbol.' },
        source: { sourceId: 'wikipedia:argus-odysseus-dog', title: 'Argos (dog)', url: 'https://en.wikipedia.org/wiki/Argos_(dog)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-008', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Backstage in Shakespeare’s Theatre', et: 'Shakespeare’i teatri kulisside taga' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-008:blank-verse-unrhymed-meter', factKey: 'literature-language:blank-verse-unrhymed-iambic-pentameter', tier: 1, subjectKey: 'verse:blank-verse',
        clue: { en: 'Much of Shakespeare’s drama uses unrhymed iambic pentameter. What verse form does that combination define?', et: 'Suur osa Shakespeare’i näidenditest on kirjutatud riimimata jambilises pentameetris. Kuidas seda värsivormi nimetatakse?' }, response: { en: 'blank verse', et: 'blankvärss' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Blank verse keeps a regular metre without end rhyme, allowing speech to sound elevated yet flexible.', et: 'Blankvärss säilitab korrapärase meetrumi ilma lõppriimita, mistõttu kõne saab olla ülev, kuid paindlik.' },
        source: { sourceId: 'wikipedia:blank-verse-shakespeare', title: 'Blank verse', url: 'https://en.wikipedia.org/wiki/Blank_verse', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-008:soliloquy-character-alone', factKey: 'literature-language:soliloquy-reveals-inner-thoughts', tier: 2, subjectKey: 'speech:soliloquy',
        clue: { en: 'What dramatic speech lets a character voice private thoughts while alone or disregarding other people onstage?', et: 'Kuidas nimetatakse näidendis kõnet, millega tegelane üksi olles või teisi laval eirates oma sisemisi mõtteid avaldab?' }, response: { en: 'soliloquy', et: 'sisekõne' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'A soliloquy makes the character’s inner reasoning audible to the audience rather than to another character.', et: 'Sisekõne teeb tegelase sisemise arutluse kuuldavaks publikule, mitte teisele tegelasele.' },
        source: { sourceId: 'wikipedia:soliloquy-inner-thoughts', title: 'Soliloquy', url: 'https://en.wikipedia.org/wiki/Soliloquy', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-008:aside-unheard-onstage', factKey: 'literature-language:aside-heard-by-audience-not-characters', tier: 3, subjectKey: 'speech:aside',
        clue: { en: 'What brief theatrical remark is understood to be heard by the audience but not by the other characters onstage?', et: 'Kuidas nimetatakse lühikest lavarepliiki, mida kokkuleppe järgi kuuleb publik, kuid teised laval olevad tegelased mitte?' }, response: { en: 'an aside', et: 'kõrvalrepliik' }, acceptedVariants: { en: ['aside'], et: ['repliik kõrvale'] },
        explanation: { en: 'An aside creates confidential contact with the audience without stopping the surrounding scene.', et: 'Kõrvalrepliik loob publikuga usaldusliku kontakti, katkestamata ümbritsevat stseeni.' },
        source: { sourceId: 'wikipedia:aside-theatre-audience', title: 'Aside', url: 'https://en.wikipedia.org/wiki/Aside', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-008:groundlings-standing-yard', factKey: 'literature-language:groundlings-stood-in-theatre-yard', tier: 4, subjectKey: 'audience:groundlings',
        clue: { en: 'What nickname was given to spectators who paid the cheapest price and stood in the open yard around an Elizabethan theatre’s stage?', et: 'Millise hüüdnime said vaatajad, kes maksid odavaima pileti eest ja seisid Elizabethi-aegse teatri lava ümber lagedas õues?' }, response: { en: 'groundlings', et: 'groundling’id' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Groundlings occupied the yard below the galleries and watched performances while standing close to the stage.', et: 'Groundling’id seisid galeriide all õues ning jälgisid etendust lava vahetus läheduses.' },
        source: { sourceId: 'wikipedia:groundling-theatre-yard', title: 'Groundling', url: 'https://en.wikipedia.org/wiki/Groundling', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-008:tiring-house-dressing-area', factKey: 'literature-language:tiring-house-behind-stage', tier: 5, subjectKey: 'space:tiring-house',
        clue: { en: 'What name did English Renaissance theatres give the structure behind the stage where actors dressed and waited to enter?', et: 'Kuidas nimetati Inglise renessansiteatris lava taga asuvat hooneosa, kus näitlejad riietusid ja lavaleminekut ootasid?' }, response: { en: 'the tiring house', et: 'tiring house' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The term comes from “attiring”: this backstage building held costumes, entrances, and working space for performers.', et: 'Nimetus tuleneb riietumisest: selles lavataguses hooneosas paiknesid kostüümid, sissepääsud ja näitlejate tööruumid.' },
        source: { sourceId: 'wikipedia:globe-theatre-tiring-house', title: 'Globe Theatre', url: 'https://en.wikipedia.org/wiki/Globe_Theatre', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-009', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'How Gothic Fiction Unsettles You', et: 'Kuidas gooti kirjandus kõhedust tekitab' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-009:epistolary-story-documents', factKey: 'literature-language:epistolary-novel-told-through-documents', tier: 1, subjectKey: 'device:epistolary-novel',
        clue: { en: 'Dracula builds its story from journals, letters, telegrams, and newspaper reports. What kind of novel uses documents in this way?', et: '„Dracula“ loob loo päevikute, kirjade, telegrammide ja ajaleheartiklite kaudu. Kuidas nimetatakse sellisel viisil dokumentidest koosnevat romaani?' }, response: { en: 'an epistolary novel', et: 'kiriromaan' }, acceptedVariants: { en: ['epistolary fiction'], et: ['epistolaarromaan'] },
        explanation: { en: 'Epistolary fiction presents the narrative as records made by its characters, often multiplying viewpoints and uncertainty.', et: 'Kiriromaan esitab loo tegelaste koostatud ülestähendustena, luues sageli mitu vaatepunkti ja ebakindlust.' },
        source: { sourceId: 'wikipedia:epistolary-novel-documents', title: 'Epistolary novel', url: 'https://en.wikipedia.org/wiki/Epistolary_novel', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-009:frame-story-nested-tale', factKey: 'literature-language:frame-story-encloses-another-narrative', tier: 2, subjectKey: 'device:frame-story',
        clue: { en: 'Frankenstein reaches the reader through Walton’s letters, which enclose Victor’s account and the creature’s account within it. What narrative structure is this?', et: '„Frankenstein“ jõuab lugejani Waltoni kirjade kaudu, mille sees on Victori jutustus ja omakorda olendi jutustus. Kuidas sellist ülesehitust nimetatakse?' }, response: { en: 'a frame story', et: 'raamjutustus' }, acceptedVariants: { en: ['frame narrative'], et: ['raamlugu'] },
        explanation: { en: 'A frame story surrounds one or more embedded narratives with an outer narrative situation.', et: 'Raamjutustus ümbritseb ühe või mitu sisemist lugu välise jutustamisolukorraga.' },
        source: { sourceId: 'wikipedia:frame-story-nested-narrative', title: 'Frame story', url: 'https://en.wikipedia.org/wiki/Frame_story', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-009:unreliable-narrator-doubt', factKey: 'literature-language:unreliable-narrator-undermines-own-account', tier: 3, subjectKey: 'narrator:unreliable',
        clue: { en: 'A storyteller’s contradictions, limited knowledge, or self-deception give readers reason to doubt the account being told. What kind of narrator is this?', et: 'Jutustaja vastuolud, piiratud teadmised või enesepettus annavad lugejale põhjuse tema kirjelduses kahelda. Millise jutustajaga on tegu?' }, response: { en: 'an unreliable narrator', et: 'ebausaldusväärne jutustaja' }, acceptedVariants: { en: ['unreliable narrator'], et: ['mitteusaldusväärne jutustaja'] },
        explanation: { en: 'The gap between the narrator’s version and what readers infer becomes a central source of tension and interpretation.', et: 'Pinge ja tõlgendusvõimalused tekivad jutustaja versiooni ning lugeja järelduste vahelisest lõhest.' },
        source: { sourceId: 'wikipedia:unreliable-narrator-doubt', title: 'Unreliable narrator', url: 'https://en.wikipedia.org/wiki/Unreliable_narrator', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-009:doppelganger-double', factKey: 'literature-language:doppelganger-uncanny-double', tier: 4, subjectKey: 'motif:doppelganger',
        clue: { en: 'What German-derived term names a disturbing double or look-alike whose appearance may threaten a character’s identity?', et: 'Milline saksa päritolu termin tähistab kõhedust tekitavat teisikut, kelle ilmumine võib tegelase identiteeti ohustada?' }, response: { en: 'a doppelgänger', et: 'doppelgänger' }, acceptedVariants: { en: ['doppelganger'], et: ['doppelganger'] },
        explanation: { en: 'Gothic and psychological fiction use the double to externalize divided identity, guilt, or a repressed self.', et: 'Gooti ja psühholoogiline kirjandus kasutab teisikut lõhenenud identiteedi, süütunde või allasurutud mina nähtavaks tegemiseks.' },
        source: { sourceId: 'wikipedia:doppelganger-literary-double', title: 'Doppelgänger', url: 'https://en.wikipedia.org/wiki/Doppelg%C3%A4nger', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-009:uncanny-familiar-strange', factKey: 'literature-language:uncanny-makes-familiar-strangely-frightening', tier: 5, subjectKey: 'effect:uncanny',
        clue: { en: 'Freud used what term for the disturbing effect produced when something once familiar returns in a strangely alien or threatening form?', et: 'Millise terminiga kirjeldas Freud häirivat mõju, mis tekib siis, kui miski kunagi tuttav naaseb kummaliselt võõra või ähvardavana?' }, response: { en: 'the uncanny', et: 'das Unheimliche' }, acceptedVariants: { en: ['das Unheimliche'], et: ['õõvastav võõristus'] },
        explanation: { en: 'The uncanny troubles the boundary between familiar and foreign, making dolls, doubles, repetitions, or homes feel unsafe.', et: 'See mõiste hägustab tuttava ja võõra piiri ning võib muuta nukud, teisikud, kordused või kodu ähvardavaks.' },
        source: { sourceId: 'wikipedia:uncanny-familiar-strange', title: 'Uncanny', url: 'https://en.wikipedia.org/wiki/Uncanny', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-010', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Novels That Break the Usual Shape', et: 'Romaanid, mis murravad vormireegleid' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-010:cloud-atlas-nested-palindrome', factKey: 'literature-language:cloud-atlas-six-stories-mirrored-order', tier: 1, subjectKey: 'work:cloud-atlas-novel',
        clue: { en: 'Which David Mitchell novel nests six linked stories in a mirror pattern, breaking off the first five and completing them in reverse order?', et: 'Millises David Mitchelli romaanis paiknevad kuus omavahel seotud lugu peegelstruktuuris, nii et esimese viie loo algustele järgnevad nende lõpud vastupidises järjekorras?' }, response: { en: 'Cloud Atlas', et: '„Pilveatlas“' }, acceptedVariants: { en: ['Pilveatlas'], et: ['Cloud Atlas', 'Pilveatlas'] },
        explanation: { en: 'Mitchell arranges the narratives concentrically: five stop at a turning point, the central story is complete, and the interrupted stories then close in reverse order.', et: 'Mitchell paigutab lood kontsentriliselt: viis katkeb pöördepunktis, keskne lugu esitatakse tervikuna ning katkestatud lood lõpetatakse vastupidises järjekorras.' },
        source: { sourceId: 'wikipedia:cloud-atlas-novel-nested-structure', title: 'Cloud Atlas (novel)', url: 'https://en.wikipedia.org/wiki/Cloud_Atlas_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-010:house-of-leaves-typographic-labyrinth', factKey: 'literature-language:house-of-leaves-layout-mirrors-impossible-house', tier: 2, subjectKey: 'work:house-of-leaves',
        clue: { en: 'Which Mark Z. Danielewski novel uses dense footnotes, rotated or nearly empty pages, and changing typography while recounting a film about a house larger inside than outside?', et: 'Milline Mark Z. Danielewski romaan kasutab tihedaid joonealuseid märkusi, pööratud või peaaegu tühje lehekülgi ja muutuvat tüpograafiat, jutustades filmist, mis käsitleb seest suuremat maja?' }, response: { en: 'House of Leaves', et: 'House of Leaves' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The page layout becomes part of the labyrinth: text contracts, expands, turns, and fragments as the explorers move through the impossible house.', et: 'Lehekülje kujundus muutub labürindi osaks: tekst tõmbub kokku, paisub, pöördub ja killustub sedamööda, kuidas tegelased võimatus majas liiguvad.' },
        source: { sourceId: 'wikipedia:house-of-leaves-typographic-layout', title: 'House of Leaves', url: 'https://en.wikipedia.org/wiki/House_of_Leaves', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-010:if-on-winters-night-ten-openings', factKey: 'literature-language:if-on-winters-night-reader-ten-interrupted-novels', tier: 3, subjectKey: 'work:if-on-a-winters-night-a-traveler',
        clue: { en: 'Which Italo Calvino novel addresses “you” as a reader whose effort to continue one book leads into the opening chapters of ten different novels?', et: 'Milline Italo Calvino romaan pöördub „sinu“ kui lugeja poole, kelle katse üht raamatut jätkata viib kümne eri romaani alguspeatükkideni?' }, response: { en: 'If on a winter’s night a traveler', et: '„Kui rändur talvisel ööl“' }, acceptedVariants: { en: ["If on a winter's night a traveler"], et: ['Kui rändur talvisel ööl'] },
        explanation: { en: 'Alternating chapters follow the Reader and the Other Reader, while each even-numbered chapter begins a new novel that breaks off before its resolution.', et: 'Vahelduvad peatükid jälgivad Lugejat ja Teist Lugejat, iga paarisarvuline peatükk aga alustab uut romaani, mis katkeb enne lahendust.' },
        source: { sourceId: 'wikipedia:if-on-winters-night-reader-ten-novels', title: 'If on a winter’s night a traveler', url: 'https://en.wikipedia.org/wiki/If_on_a_winter%27s_night_a_traveler', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-010:pale-fire-poem-commentary', factKey: 'literature-language:pale-fire-poem-and-kinbote-commentary', tier: 4, subjectKey: 'work:pale-fire',
        clue: { en: 'Which Vladimir Nabokov novel places a 999-line poem by the fictional John Shade beside Charles Kinbote’s commentary, which tries to turn the poem into Kinbote’s own royal saga?', et: 'Milline Vladimir Nabokovi romaan asetab väljamõeldud John Shade’i 999-realise luuletuse kõrvale Charles Kinbote’i kommentaarid, millega Kinbote püüab muuta luuletuse omaenda kuninglikuks looks?' }, response: { en: 'Pale Fire', et: 'Pale Fire' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The novel’s foreword, poem, commentary, and index force readers to reconstruct the conflict between Shade’s work and Kinbote’s intrusive interpretation.', et: 'Romaani eessõna, luuletus, kommentaarid ja register sunnivad lugejat taastama vastuolu Shade’i teose ning Kinbote’i pealetükkiva tõlgenduse vahel.' },
        source: { sourceId: 'wikipedia:pale-fire-poem-commentary-structure', title: 'Pale Fire', url: 'https://en.wikipedia.org/wiki/Pale_Fire', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-010:hopscotch-two-reading-orders', factKey: 'literature-language:hopscotch-conventional-and-table-reading-orders', tier: 5, subjectKey: 'work:hopscotch-cortazar',
        clue: { en: 'Which Julio Cortázar novel offers one reading that stops after chapter 56 and another that sends the reader hopping among all 155 chapters according to a table?', et: 'Milline Julio Cortázari romaan pakub ühe lugemisviisi, mis lõpeb 56. peatüki järel, ning teise, mis suunab lugeja tabeli järgi hüplema kõigi 155 peatüki vahel?' }, response: { en: 'Hopscotch', et: '„Keksumäng“' }, acceptedVariants: { en: ['Keksumäng'], et: ['Hopscotch', 'Keksumäng'] },
        explanation: { en: 'Cortázar’s table of instructions creates an alternative sequence that mixes the main narrative with the book’s “expendable” chapters.', et: 'Cortázari juhiste tabel loob alternatiivse järjestuse, mis põimib põhijutustuse raamatu „üleliigsete“ peatükkidega.' },
        source: { sourceId: 'wikipedia:hopscotch-novel-reading-orders', title: 'Hopscotch (Cortázar novel)', url: 'https://en.wikipedia.org/wiki/Hopscotch_(Cort%C3%A1zar_novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-012', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Who Is Telling This Story?', et: 'Kes seda lugu jutustab?' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-012:holden-caulfield-catcher-rye', factKey: 'literature-language:holden-caulfield-narrates-catcher-rye-manhattan', tier: 1, subjectKey: 'narrator:holden-caulfield',
        clue: { en: 'Which expelled Pencey Prep student narrates The Catcher in the Rye while wandering Manhattan and dismissing many people as “phonies”?', et: 'Milline Pencey Prepi koolist välja heidetud õpilane jutustab romaanis „Kuristik rukkis“ oma rännakutest Manhattanil ning nimetab paljusid inimesi võltsideks?' }, response: { en: 'Holden Caulfield', et: 'Holden Caulfield' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Holden recounts the days after his expulsion in a defensive, conversational voice that exposes both his judgment of others and his own grief.', et: 'Holden jutustab väljaviskamisele järgnenud päevadest kaitsvas ja vestluslikus toonis, mis paljastab nii tema hinnangud teistele kui ka tema enda leina.' },
        source: { sourceId: 'wikipedia:holden-caulfield-catcher-rye-narrator', title: 'Holden Caulfield', url: 'https://en.wikipedia.org/wiki/Holden_Caulfield', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-012:scout-narrates-mockingbird', factKey: 'literature-language:scout-childhood-nickname-narrator', tier: 2, subjectKey: 'narrator:scout-finch',
        clue: { en: 'What childhood nickname does To Kill a Mockingbird’s narrator Jean Louise use while recalling her father Atticus and the trial of Tom Robinson?', et: 'Millist lapsepõlvehüüdnime kasutab „Tappa laulurästast“ jutustaja Jean Louise, meenutades oma isa Atticust ja Tom Robinsoni kohtuprotsessi?' }, response: { en: 'Scout', et: 'Scout' }, acceptedVariants: { en: ['Scout Finch'], et: ['Scout Finch'] },
        explanation: { en: 'The adult Jean Louise Finch narrates events largely through the perspective of her younger self, Scout.', et: 'Täiskasvanud Jean Louise Finch jutustab sündmustest suuresti oma noorema mina Scouti vaatepunktist.' },
        source: { sourceId: 'wikipedia:scout-finch-narrator', title: 'Scout Finch', url: 'https://en.wikipedia.org/wiki/Scout_Finch', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-012:nick-carraway-narrates-gatsby', factKey: 'literature-language:nick-carraway-narrates-great-gatsby', tier: 3, subjectKey: 'narrator:nick-carraway',
        clue: { en: 'Which bond salesman rents a modest Long Island house beside Gatsby’s mansion and narrates the millionaire’s rise and fall?', et: 'Milline võlakirjamüüja üürib Long Islandil tagasihoidliku maja Gatsby häärberi kõrval ning jutustab miljonäri tõusust ja langusest?' }, response: { en: 'Nick Carraway', et: 'Nick Carraway' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Nick is both Gatsby’s neighbour and Daisy’s cousin, placing him inside the relationships whose collapse he records.', et: 'Nick on nii Gatsby naaber kui ka Daisy nõbu, mistõttu ta asub otse nende suhete keskel, mille lagunemist ta kirjeldab.' },
        source: { sourceId: 'wikipedia:nick-carraway-gatsby-narrator', title: 'Nick Carraway', url: 'https://en.wikipedia.org/wiki/Nick_Carraway', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-012:saleem-sinai-midnights-children', factKey: 'literature-language:saleem-sinai-narrates-midnights-children', tier: 4, subjectKey: 'narrator:saleem-sinai',
        clue: { en: 'Which telepathic narrator of Midnight’s Children is born at the moment India gains independence and discovers others born in the same first hour?', et: 'Milline „Kesköö laste“ telepaatiline jutustaja sünnib India iseseisvumise ööl ning avastab teised samal esimesel tunnil sündinud lapsed?' }, response: { en: 'Saleem Sinai', et: 'Saleem Sinai' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Saleem ties the story of his body and family to the history of independent India while addressing his account to Padma.', et: 'Saleem seob oma keha ja perekonna loo iseseisva India ajalooga ning jutustab seda Padmale.' },
        source: { sourceId: 'wikipedia:saleem-sinai-midnights-children', title: 'Midnight’s Children', url: 'https://en.wikipedia.org/wiki/Midnight%27s_Children', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-012:stevens-remains-of-the-day', factKey: 'literature-language:stevens-narrates-remains-of-the-day', tier: 5, subjectKey: 'narrator:stevens',
        clue: { en: 'What surname belongs to the English butler who narrates The Remains of the Day while taking a road trip to visit former housekeeper Miss Kenton?', et: 'Mis perekonnanime kannab inglise ülemteener, kes jutustab „Päeva riismed“ ning sõidab autoga külla endisele majapidajannale miss Kentonile?' }, response: { en: 'Stevens', et: 'Stevens' }, acceptedVariants: { en: ['Mr Stevens'], et: ['härra Stevens'] },
        explanation: { en: 'Stevens’s carefully controlled recollections gradually expose the personal cost of his devotion to service and dignity.', et: 'Stevensi vaoshoitud mälestused paljastavad järk-järgult, millist isiklikku hinda nõudsid temalt teenimisele ja väärikusele pühendumine.' },
        source: { sourceId: 'wikipedia:stevens-remains-of-the-day-narrator', title: 'The Remains of the Day', url: 'https://en.wikipedia.org/wiki/The_Remains_of_the_Day', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-034', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Literary Journeys to the Underworld', et: 'Kirjanduslikud rännakud allilma' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-034:psyche-brings-proserpina-beauty', factKey: 'literature-language:psyche-descends-for-proserpina-beauty', tier: 1, subjectKey: 'traveler:psyche',
        clue: { en: 'In Apuleius’s tale, which heroine must descend to the underworld and bring Venus a box containing a portion of Proserpina’s beauty?', et: 'Milline Apuleiuse loo kangelanna peab laskuma allilma ja tooma Venusele karbi, milles on osa Proserpina ilust?' }, response: { en: 'Psyche', et: 'Psyche' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The underworld errand is the last of Venus’s impossible tasks for Psyche before divine help leads to her reunion with Cupid.', et: 'Allilmas käimine on viimane Venuse võimatutest ülesannetest Psychele, enne kui jumalik abi viib ta taas kokku Cupidoga.' },
        source: { sourceId: 'wikipedia:cupid-psyche-underworld-task', title: 'Cupid and Psyche', url: 'https://en.wikipedia.org/wiki/Cupid_and_Psyche', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-034:cumaean-sibyl-guides-aeneas', factKey: 'literature-language:cumaean-sibyl-guides-aeneas-underworld', tier: 2, subjectKey: 'guide:cumaean-sibyl',
        clue: { en: 'Which prophetess tells Aeneas to obtain the golden bough and then escorts him among the dead in Book VI of the Aeneid?', et: 'Milline naisprohvet käsib Aeneasel hankida kuldse oksa ja saadab teda seejärel „Aeneise“ kuuendas laulus surnute seas?' }, response: { en: 'the Cumaean Sibyl', et: 'Cumae sibüll' }, acceptedVariants: { en: ['Cumaean Sibyl'], et: ['Küme sibüll'] },
        explanation: { en: 'The Sibyl serves as Aeneas’s authorized guide after the golden bough opens the way into the realm below.', et: 'Sibüllist saab Aenease volitatud teejuht pärast seda, kui kuldne oks avab pääsu allilma.' },
        source: { sourceId: 'wikipedia:cumaean-sibyl-aeneid', title: 'Cumaean Sibyl', url: 'https://en.wikipedia.org/wiki/Cumaean_Sibyl', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-034:izanagi-yomi', factKey: 'literature-language:izanagi-flees-izanami-in-yomi', tier: 3, subjectKey: 'traveller:izanagi',
        clue: { en: 'Which Japanese creator deity enters Yomi to retrieve Izanami but flees after seeing that her body has begun to decay?', et: 'Milline Jaapani loojajumal laskub Yomisse Izanamit tagasi tooma, kuid põgeneb, kui näeb, et tema keha on hakanud lagunema?' }, response: { en: 'Izanagi', et: 'Izanagi' }, acceptedVariants: { en: ['Izanagi-no-Mikoto'], et: ['Izanagi-no-Mikoto'] },
        explanation: { en: 'Izanagi seals the entrance to Yomi after his failed rescue and then purifies himself from contact with death.', et: 'Izanagi sulgeb pärast ebaõnnestunud päästmist Yomi sissepääsu ning puhastab end kokkupuutest surmaga.' },
        source: { sourceId: 'wikipedia:izanagi-journey-yomi', title: 'Izanagi', url: 'https://en.wikipedia.org/wiki/Izanagi', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-034:inanna-seven-gates', factKey: 'literature-language:inanna-stripped-at-seven-underworld-gates', tier: 4, subjectKey: 'traveller:inanna',
        clue: { en: 'Which Sumerian goddess passes through seven gates, surrendering an item of clothing or power at each, during her descent to her sister Ereshkigal’s realm?', et: 'Milline Sumeri jumalanna läbib seitse väravat ja loovutab igas neist rõivaeseme või võimutunnuse, laskudes oma õe Ereškigali valdusse?' }, response: { en: 'Inanna', et: 'Inanna' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Inanna arrives stripped of her powers, is killed, and can return only after a substitute is provided.', et: 'Inanna jõuab pärale võimutunnustest ilmajäetuna, tapetakse ning saab naasta alles pärast asendaja leidmist.' },
        source: { sourceId: 'wikipedia:inanna-descent-seven-gates', title: 'Descent of Inanna into the Underworld', url: 'https://en.wikipedia.org/wiki/Descent_of_Inanna_into_the_Underworld', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-034:katabasis-descent-term', factKey: 'literature-language:katabasis-narrative-descent-to-underworld', tier: 5, subjectKey: 'journey:katabasis',
        clue: { en: 'What Greek-derived literary term names a hero’s descent into the underworld, as undertaken by Odysseus, Aeneas, and Dante?', et: 'Milline kreeka päritolu kirjandustermin tähistab kangelase laskumist allilma, nagu seda teevad Odysseus, Aeneas ja Dante?' }, response: { en: 'katabasis', et: 'katabaas' }, acceptedVariants: { en: ['catabasis'], et: ['katabasis'] },
        explanation: { en: 'A katabasis is literally a going down and often becomes a journey toward knowledge, transformation, or return.', et: 'Katabaas tähendab sõna-sõnalt allaminekut ning kujuneb sageli teadmise, muutumise või naasmise teekonnaks.' },
        source: { sourceId: 'wikipedia:katabasis-underworld-journey', title: 'Katabasis', url: 'https://en.wikipedia.org/wiki/Katabasis', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-037', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Poems Built by the Numbers', et: 'Arvude järgi ehitatud luuletused' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-037:villanelle-refrains', factKey: 'literature-language:villanelle-nineteen-lines-two-refrains', tier: 1, subjectKey: 'form:villanelle',
        clue: { en: 'Dylan Thomas’s “Do not go gentle into that good night” uses nineteen lines, five tercets, a quatrain, and two alternating refrains. What form is it?', et: 'Dylan Thomase „Do not go gentle into that good night“ koosneb 19 reast, viiest tertsetist, nelikust ja kahest vahelduvast refräänist. Mis vorm see on?' }, response: { en: 'a villanelle', et: 'villanell' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'A villanelle repeats its first and third lines in a fixed pattern before bringing both together at the close.', et: 'Villanell kordab esimest ja kolmandat rida kindla skeemi järgi ning ühendab need lõpus.' },
        source: { sourceId: 'wikipedia:villanelle-refrain-form', title: 'Villanelle', url: 'https://en.wikipedia.org/wiki/Villanelle', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-037:terza-rima-chain-rhyme', factKey: 'literature-language:terza-rima-aba-bcb-chain', tier: 2, subjectKey: 'form:terza-rima',
        clue: { en: 'Dante’s Divine Comedy links three-line stanzas with the interlocking rhyme scheme aba bcb cdc. What Italian form is this?', et: 'Dante „Jumalik komöödia“ seob kolmerealised stroofid läbipõimunud riimiskeemiga aba bcb cdc. Mis itaalia vorm see on?' }, response: { en: 'terza rima', et: 'terza rima' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'In terza rima, the middle rhyme of one tercet supplies the outer rhyme of the next, producing a continuous chain.', et: 'Terza rima puhul saab ühe tertseti keskmisest riimist järgmise välimine riim, nii et moodustub katkematu ahel.' },
        source: { sourceId: 'wikipedia:terza-rima-chain-rhyme', title: 'Terza rima', url: 'https://en.wikipedia.org/wiki/Terza_rima', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-037:pantoum-interlocking-lines', factKey: 'literature-language:pantoum-reuses-second-fourth-lines', tier: 3, subjectKey: 'form:pantoum',
        clue: { en: 'What Malay-derived form makes the second and fourth lines of each quatrain become the first and third lines of the next?', et: 'Milline malai päritolu luulevorm teeb iga neliku teisest ja neljandast reast järgmise neliku esimese ja kolmanda rea?' }, response: { en: 'a pantoum', et: 'pantum' }, acceptedVariants: { en: ['pantoum'], et: ['pantoum'] },
        explanation: { en: 'The pantoum’s interlocking repetitions let the same lines gather new meanings as their surroundings change.', et: 'Pantumi läbipõimunud kordused lasevad samadel ridadel uues ümbruses uusi tähendusi koguda.' },
        source: { sourceId: 'wikipedia:pantoum-interlocking-lines', title: 'Pantoum', url: 'https://en.wikipedia.org/wiki/Pantoum', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-037:sestina-end-words', factKey: 'literature-language:sestina-rotates-six-end-words', tier: 4, subjectKey: 'form:sestina',
        clue: { en: 'Which form rotates the same six end-words through six six-line stanzas and then gathers them into a three-line conclusion?', et: 'Milline luulevorm pöörab samu kuut lõpusõna läbi kuue kuuerealise stroofi ja koondab need seejärel kolmerealisse lõppu?' }, response: { en: 'a sestina', et: 'sestiin' }, acceptedVariants: { en: ['sestina'], et: ['sestina'] },
        explanation: { en: 'A sestina substitutes a prescribed permutation of end-words for rhyme and finishes with a short envoi.', et: 'Sestiin asendab riimi etteantud lõpusõnade permutatsiooniga ning lõpeb lühikese envoi’ga.' },
        source: { sourceId: 'wikipedia:sestina-six-end-words', title: 'Sestina', url: 'https://en.wikipedia.org/wiki/Sestina', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-037:ottava-rima-ababcc', factKey: 'literature-language:ottava-rima-abababcc-stanza', tier: 5, subjectKey: 'form:ottava-rima',
        clue: { en: 'Byron’s Don Juan uses eight-line stanzas of iambic pentameter rhyming abababcc. What Italian stanza form is this?', et: 'Byroni „Don Juan“ kasutab kaheksarealisi jambilise pentameetri stroofe riimiskeemiga abababcc. Mis itaalia stroofivorm see on?' }, response: { en: 'ottava rima', et: 'ottava rima' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Ottava rima’s final couplet can deliver a pointed turn or comic deflation after three alternating rhymes.', et: 'Ottava rima lõppriimiline paar võib kolme vahelduva riimi järel tuua terava pöörde või koomilise maanduse.' },
        source: { sourceId: 'wikipedia:ottava-rima-stanza', title: 'Ottava rima', url: 'https://en.wikipedia.org/wiki/Ottava_rima', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-051', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Translators Who Opened New Worlds', et: 'Tõlkijad, kes avasid uusi maailmu' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-051:jerome-vulgate', factKey: 'literature-language:jerome-translated-latin-vulgate', tier: 1, subjectKey: 'translator:jerome',
        clue: { en: 'Which saint produced the Latin Bible translation that became known as the Vulgate and is traditionally shown working beside a lion?', et: 'Milline pühak koostas Vulgata nime all tuntuks saanud ladinakeelse piiblitõlke ja keda kujutatakse traditsiooniliselt lõvi kõrval töötamas?' }, response: { en: 'Saint Jerome', et: 'püha Hieronymus' }, acceptedVariants: { en: ['Jerome'], et: ['Hieronymus'] },
        explanation: { en: 'Jerome revised earlier Latin texts and translated much of the Old Testament from Hebrew.', et: 'Hieronymus parandas varasemaid ladinakeelseid tekste ja tõlkis suure osa Vanast Testamendist heebrea keelest.' },
        source: { sourceId: 'wikipedia:jerome-vulgate-translator', title: 'Jerome', url: 'https://en.wikipedia.org/wiki/Jerome', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-051:fitzgerald-rubaiyat', factKey: 'literature-language:fitzgerald-rendered-rubaiyat-of-omar-khayyam', tier: 2, subjectKey: 'translator:edward-fitzgerald',
        clue: { en: 'Whose freely adapted English Rubáiyát turned Omar Khayyam into a Victorian-era literary sensation?', et: 'Kelle vabalt mugandatud ingliskeelne „Rubáiyát“ tegi Omar Khayyámi viktoriaanlikul ajastul kirjanduslikuks sensatsiooniks?' }, response: { en: 'Edward FitzGerald', et: 'Edward FitzGerald' }, acceptedVariants: { en: ['FitzGerald'], et: ['FitzGerald'] },
        explanation: { en: 'FitzGerald reshaped and combined Persian quatrains into an English sequence that became far more famous than its first edition suggested.', et: 'FitzGerald kujundas ja ühendas pärsia nelikvärsse ingliskeelseks tsükliks, mis sai palju kuulsamaks, kui esmatrükk ennustas.' },
        source: { sourceId: 'wikipedia:edward-fitzgerald-rubaiyat', title: 'Edward FitzGerald', url: 'https://en.wikipedia.org/wiki/Edward_FitzGerald_(poet)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-051:garnett-russian-classics', factKey: 'literature-language:constance-garnett-translated-russian-classics', tier: 3, subjectKey: 'translator:constance-garnett',
        clue: { en: 'Which prolific English translator introduced generations of readers to Tolstoy, Dostoevsky, Chekhov, and Turgenev?', et: 'Milline viljakas inglise tõlkija tutvustas lugejapõlvkondadele Tolstoid, Dostojevskit, Tšehhovit ja Turgenevit?' }, response: { en: 'Constance Garnett', et: 'Constance Garnett' }, acceptedVariants: { en: ['Garnett'], et: ['Garnett'] },
        explanation: { en: 'Garnett’s many translations made Russian fiction broadly available in English despite later debate about her style and omissions.', et: 'Garnetti arvukad tõlked tegid vene proosa inglise keeles laialt kättesaadavaks, ehkki hiljem on vaieldud tema stiili ja väljajätete üle.' },
        source: { sourceId: 'wikipedia:constance-garnett-russian-translations', title: 'Constance Garnett', url: 'https://en.wikipedia.org/wiki/Constance_Garnett', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-051:arthur-waley-chinese-japanese', factKey: 'literature-language:arthur-waley-translated-tale-of-genji', tier: 4, subjectKey: 'translator:arthur-waley',
        clue: { en: 'Which British scholar translated The Tale of Genji and also published influential English versions of classical Chinese poetry?', et: 'Milline Briti õpetlane tõlkis inglise keelde „Genji loo“ ning avaldas ka mõjukaid klassikalise hiina luule tõlkeid?' }, response: { en: 'Arthur Waley', et: 'Arthur Waley' }, acceptedVariants: { en: ['Waley'], et: ['Waley'] },
        explanation: { en: 'Waley learned classical Chinese and Japanese largely outside academia and brought both literary traditions to a wide English readership.', et: 'Waley õppis klassikalist hiina ja jaapani keelt suuresti väljaspool ülikooli ning tõi mõlema keele kirjanduse laia ingliskeelse lugejaskonnani.' },
        source: { sourceId: 'wikipedia:arthur-waley-genji', title: 'Arthur Waley', url: 'https://en.wikipedia.org/wiki/Arthur_Waley', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-051:rabassa-hopscotch-solitude', factKey: 'literature-language:gregory-rabassa-translated-hopscotch-one-hundred-years', tier: 5, subjectKey: 'translator:gregory-rabassa',
        clue: { en: 'Which translator carried both Julio Cortázar’s Hopscotch and Gabriel García Márquez’s One Hundred Years of Solitude into English?', et: 'Milline tõlkija vahendas inglise keelde nii Julio Cortázari „Keksumängu“ kui ka Gabriel García Márqueze „Sada aastat üksildust“?' }, response: { en: 'Gregory Rabassa', et: 'Gregory Rabassa' }, acceptedVariants: { en: ['Rabassa'], et: ['Rabassa'] },
        explanation: { en: 'Rabassa became a defining English-language voice for the Latin American Boom and translated the Márquez novel without first reading it in full.', et: 'Rabassast kujunes Ladina-Ameerika buumi määrav ingliskeelne hääl ning ta tõlkis Márqueze romaani seda eelnevalt tervikuna läbi lugemata.' },
        source: { sourceId: 'wikipedia:gregory-rabassa-translator', title: 'Gregory Rabassa', url: 'https://en.wikipedia.org/wiki/Gregory_Rabassa', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-068', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Authors Draw Their Own Maps', et: 'Kirjanike väljamõeldud maakaardid' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-068:swift-lilliput-island-kingdom', factKey: 'literature-language:swift-maps-lilliput-tiny-islanders', tier: 1, subjectKey: 'place:lilliput',
        clue: { en: 'What island kingdom in Gulliver’s Travels is inhabited by people about six inches tall, making the shipwrecked Gulliver a giant among them?', et: 'Millist „Gulliveri reiside“ saareriiki asustavad umbes kuue tolli pikkused inimesed, nii et laevahukust pääsenud Gulliver on nende seas hiiglane?' }, response: { en: 'Lilliput', et: 'Lilliput' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Swift gives Lilliput its own capital, court, rival factions, and conflict with neighbouring Blefuscu, making the tiny realm a map-sized political satire.', et: 'Swift annab Lilliputile oma pealinna, õukonna, rivaalitsevad rühmitused ja konflikti naaberriigi Blefuscuga, muutes tillukese kuningriigi poliitiliseks satiiriks.' },
        source: { sourceId: 'wikipedia:lilliput-blefuscu-gulliver', title: 'Lilliput and Blefuscu', url: 'https://en.wikipedia.org/wiki/Lilliput_and_Blefuscu', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-068:ankh-morpork-discworld', factKey: 'literature-language:ankh-morpork-discworld-city', tier: 2, subjectKey: 'place:ankh-morpork',
        clue: { en: 'What unruly twin city on the River Ankh serves as the largest metropolis in Terry Pratchett’s Discworld novels?', et: 'Milline Ankh’i jõe ääres asuv ohjeldamatu kaksiklinn on Terry Pratchetti Kettamaailma-romaanide suurim metropol?' }, response: { en: 'Ankh-Morpork', et: 'Ankh-Morpork' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Guilds, civic institutions, and a famously pragmatic ruler make Ankh-Morpork the political and comic hub of Discworld.', et: 'Gildid, linnaasutused ja kuulsalt pragmaatiline valitseja teevad Ankh-Morporkist Kettamaailma poliitilise ja koomilise keskuse.' },
        source: { sourceId: 'wikipedia:ankh-morpork-discworld-city', title: 'Ankh-Morpork', url: 'https://en.wikipedia.org/wiki/Ankh-Morpork', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-068:yoknapatawpha-county-faulkner', factKey: 'literature-language:faulkner-sets-novels-yoknapatawpha-county', tier: 3, subjectKey: 'place:yoknapatawpha-county',
        clue: { en: 'What fictional Mississippi county links William Faulkner’s The Sound and the Fury, Absalom, Absalom!, and many of his other works?', et: 'Milline väljamõeldud Mississippi maakond ühendab William Faulkneri romaane „Hälin ja raev“, „Absalom, Absalom!“ ning paljusid teisi tema teoseid?' }, response: { en: 'Yoknapatawpha County', et: 'Yoknapatawpha maakond' }, acceptedVariants: { en: ['Yoknapatawpha'], et: ['Yoknapatawpha'] },
        explanation: { en: 'Faulkner repeatedly returned to the county’s families and history, modelling its geography on Mississippi’s Lafayette County.', et: 'Faulkner pöördus korduvalt selle maakonna perekondade ja ajaloo juurde ning kujundas geograafia Mississippi Lafayette’i maakonna järgi.' },
        source: { sourceId: 'wikipedia:yoknapatawpha-county-faulkner', title: 'Yoknapatawpha County', url: 'https://en.wikipedia.org/wiki/Yoknapatawpha_County', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-068:ruritania-prisoner-of-zenda', factKey: 'literature-language:ruritania-fictional-kingdom-prisoner-zenda', tier: 4, subjectKey: 'place:ruritania',
        clue: { en: 'What fictional Central European kingdom created for The Prisoner of Zenda became a model for the romance of court intrigue in an invented country?', et: 'Milline „Zenda vangi“ jaoks loodud väljamõeldud Kesk-Euroopa kuningriik sai õukonnaintriigidega kujuteldava riigi seiklusromaani eeskujuks?' }, response: { en: 'Ruritania', et: 'Ruritaania' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Anthony Hope’s kingdom became so influential that “Ruritanian” can describe later stories set in similar imaginary monarchies.', et: 'Anthony Hope’i kuningriik osutus nii mõjukaks, et „ruritaanlikuks“ nimetatakse ka hilisemaid lugusid samalaadsetest kujuteldavatest monarhiatest.' },
        source: { sourceId: 'wikipedia:ruritania-prisoner-zenda', title: 'Ruritania', url: 'https://en.wikipedia.org/wiki/Ruritania', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-068:gormenghast-castle', factKey: 'literature-language:titus-groan-heir-to-gormenghast', tier: 5, subjectKey: 'place:gormenghast',
        clue: { en: 'Titus Groan is born as the seventy-seventh Earl and heir to what immense, decaying castle ruled by elaborate ritual in Mervyn Peake’s novels?', et: 'Titus Groan sünnib Mervyn Peake’i romaanides seitsmekümne seitsmenda krahvi ja millise hiiglasliku, laguneva ning rituaalidest valitsetud lossi pärijana?' }, response: { en: 'Gormenghast', et: 'Gormenghast' }, acceptedVariants: { en: ['Gormenghast Castle'], et: ['Gormenghasti loss'] },
        explanation: { en: 'The castle is effectively a central character: its endless buildings and ceremonies shape every part of Titus’s inherited life.', et: 'Loss toimib peaaegu keskse tegelasena: selle lõputud hooned ja tseremooniad kujundavad Tituse päritud elu iga osa.' },
        source: { sourceId: 'wikipedia:gormenghast-castle', title: 'Gormenghast (series)', url: 'https://en.wikipedia.org/wiki/Gormenghast_(series)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-070', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Loanwords Reveal Their Routes', et: 'Laensõnad paljastavad oma teekonna' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-070:quarantine-forty-days', factKey: 'literature-language:quarantine-from-italian-quarantena', tier: 1, subjectKey: 'word:quarantine',
        clue: { en: 'English “quarantine” descends through French from what Italian term for a forty-day period of isolation?', et: 'Inglise quarantine pärineb prantsuse keele kaudu millisest itaalia sõnast, mis tähistas neljakümnepäevast eraldamisperioodi?' }, response: { en: 'quarantena', et: 'quarantena' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Italian quarantena and French quarantaine both refer to a period of forty days, the duration used in the historical health measure.', et: 'Itaalia quarantena ja prantsuse quarantaine tähistavad mõlemad neljakümnepäevast ajavahemikku, mida kasutati ajaloolise tervishoiumeetme kestusena.' },
        source: { sourceId: 'wikipedia:quarantine-italian-quarantena', title: 'Quarantine', url: 'https://en.wikipedia.org/wiki/Quarantine#Etymology_and_terminology', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-070:bungalow-gujarati-bangalo', factKey: 'literature-language:bungalow-from-gujarati-bangalo', tier: 2, subjectKey: 'word:bungalow',
        clue: { en: 'English “bungalow” travelled through colonial India from the Gujarati bangalo, an adjective meaning what?', et: 'Inglise bungalow jõudis keelde koloniaal-Indiast gudžarati omadussõna bangalo kaudu. Mida see omadussõna tähendab?' }, response: { en: 'Bengali', et: 'bengali' }, acceptedVariants: { en: ['of Bengal'], et: ['Bengali päritolu'] },
        explanation: { en: 'The word originally described a house in the Bengal style before becoming a general name for a low house.', et: 'Sõna kirjeldas algul Bengali stiilis maja, enne kui sellest sai madala maja üldnimetus.' },
        source: { sourceId: 'wikipedia:bungalow-bengal-etymology', title: 'Bungalow', url: 'https://en.wikipedia.org/wiki/Bungalow#Etymology', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-070:tycoon-japanese-taikun', factKey: 'literature-language:tycoon-from-japanese-taikun-great-lord', tier: 3, subjectKey: 'word:tycoon',
        clue: { en: 'English “tycoon” comes from Japanese taikun, a title once used by foreigners for the shogun. What does that title literally mean?', et: 'Inglise tycoon pärineb jaapani tiitlist taikun, mida välismaalased kasutasid kunagi šoguni kohta. Mida see tiitel sõna-sõnalt tähendab?' }, response: { en: 'great lord', et: 'suur isand' }, acceptedVariants: { en: ['great prince'], et: ['suur vürst'] },
        explanation: { en: 'The honorific passed into English and broadened from a powerful ruler to a powerful business magnate.', et: 'Aunimetus jõudis inglise keelde ning selle tähendus laienes võimsalt valitsejalt mõjuvõimsale ärimagnaadile.' },
        source: { sourceId: 'wikipedia:tycoon-japanese-taikun', title: 'Tycoon', url: 'https://en.wikipedia.org/wiki/Tycoon', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-070:shampoo-hindi-champo', factKey: 'literature-language:shampoo-from-hindi-champo', tier: 4, subjectKey: 'word:shampoo',
        clue: { en: 'English “shampoo” comes from what Hindi imperative meaning “press” or “massage”?', et: 'Inglise shampoo pärineb millisest hindi käskivast vormist, mis tähendab „vajuta“ või „masseeri“?' }, response: { en: 'chāmpo', et: 'chāmpo' }, acceptedVariants: { en: ['champo'], et: ['champo'] },
        explanation: { en: 'The borrowed command first referred to massage and only later narrowed toward washing the hair and the product used for it.', et: 'Laenatud käsk tähistas esmalt masseerimist ning kitsenes alles hiljem juuste pesemise ja selleks kasutatava aine tähendusse.' },
        source: { sourceId: 'wikipedia:shampoo-hindi-champo', title: 'Shampoo', url: 'https://en.wikipedia.org/wiki/Shampoo#Indian_subcontinent', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-070:berserk-old-norse-berserkr', factKey: 'literature-language:berserk-from-old-norse-berserkr', tier: 5, subjectKey: 'word:berserk',
        clue: { en: 'The English adjective “berserk” comes from what Old Norse noun for a warrior famed for fighting in a furious trance?', et: 'Inglise omadussõna berserk pärineb millisest vanapõhja nimisõnast raevukas võitlustuhinas sõdalase kohta?' }, response: { en: 'berserkr', et: 'berserkr' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Old Norse berserkr named one of the legendary warriors whose battle frenzy gave the modern word its sense.', et: 'Vanapõhja berserkr tähistas legendaarset sõdalast, kelle võitlusraev andis tänapäeva sõnale selle tähenduse.' },
        source: { sourceId: 'wikipedia:berserker-word-origin', title: 'Berserker', url: 'https://en.wikipedia.org/wiki/Berserker#Etymology', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-073', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Books That Exist Inside Books', et: 'Raamatud, mis elavad teiste raamatute sees' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-073:tales-of-beedle-bard', factKey: 'literature-language:beedle-bard-contains-three-brothers', tier: 1, subjectKey: 'fictional-book:beedle-bard',
        clue: { en: 'What wizarding story collection inherited by Hermione contains “The Tale of the Three Brothers,” the key to understanding the Deathly Hallows?', et: 'Milline Hermionele pärandatud võlurite muinasjutukogu sisaldab „Lugu kolmest vennast“, mis aitab mõista surma vägiseid?' }, response: { en: 'The Tales of Beedle the Bard', et: '„Lugulaulud Beedle Bardilt“' }, acceptedVariants: { en: ['Tales of Beedle the Bard'], et: ['„Beedle Bardi lood“'] },
        explanation: { en: 'Dumbledore leaves the book to Hermione, and its story about three magical gifts reveals the Hallows’ shared legend.', et: 'Dumbledore jätab raamatu Hermionele ning selle lugu kolmest võluannist paljastab vägiste ühise pärimuse.' },
        source: { sourceId: 'wikipedia:tales-of-beedle-bard', title: 'The Tales of Beedle the Bard', url: 'https://en.wikipedia.org/wiki/The_Tales_of_Beedle_the_Bard', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-073:necronomicon-lovecraft', factKey: 'literature-language:necronomicon-lovecraft-fictional-grimoire', tier: 2, subjectKey: 'fictional-book:necronomicon',
        clue: { en: 'What forbidden grimoire invented by H. P. Lovecraft is attributed to the “Mad Arab” Abdul Alhazred and repeatedly consulted at terrible cost?', et: 'Millise H. P. Lovecrafti väljamõeldud keelatud nõiaraamatu autoriks peetakse „hullu araablast“ Abdul Alhazredi ning selle uurimine nõuab lugudes ränka hinda?' }, response: { en: 'the Necronomicon', et: '„Necronomicon“' }, acceptedVariants: { en: ['Necronomicon'], et: ['Necronomicon'] },
        explanation: { en: 'Lovecraft scattered references to the book across stories, giving his invented mythology the appearance of documentary depth.', et: 'Lovecraft puistas viiteid raamatule eri jutustustesse, andes väljamõeldud mütoloogiale näilise dokumentaalse sügavuse.' },
        source: { sourceId: 'wikipedia:necronomicon-lovecraft-grimoire', title: 'Necronomicon', url: 'https://en.wikipedia.org/wiki/Necronomicon', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-073:red-book-westmarch', factKey: 'literature-language:red-book-westmarch-source-of-lord-of-rings', tier: 3, subjectKey: 'fictional-book:red-book-westmarch',
        clue: { en: 'Tolkien presents The Hobbit and The Lord of the Rings as translations from what manuscript begun by Bilbo and continued by Frodo and Sam?', et: 'Tolkien esitab „Kääbiku“ ja „Sõrmuste isanda“ tõlgetena millisest käsikirjast, mida alustas Bilbo ning jätkasid Frodo ja Sam?' }, response: { en: 'the Red Book of Westmarch', et: 'Lääneraja punane raamat' }, acceptedVariants: { en: ['Red Book of Westmarch'], et: ['Westmarchi punane raamat'] },
        explanation: { en: 'The imagined manuscript gives Tolkien’s legendarium a layered history in which hobbits preserve and transmit the account.', et: 'Kujuteldav käsikiri annab Tolkieni legendimaailmale mitmekihilise ajaloo, kus kääbikud talletavad sündmused ja annavad jutustuse edasi.' },
        source: { sourceId: 'wikipedia:red-book-westmarch', title: 'Red Book of Westmarch', url: 'https://en.wikipedia.org/wiki/Red_Book_of_Westmarch', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-073:grasshopper-lies-heavy', factKey: 'literature-language:grasshopper-lies-heavy-axis-loses-war', tier: 4, subjectKey: 'fictional-book:grasshopper-lies-heavy',
        clue: { en: 'In The Man in the High Castle, what banned novel imagines an alternate world in which the Axis powers lost the Second World War?', et: 'Milline keelatud romaan kujutab „Mehes kõrges lossis“ alternatiivmaailma, kus teljeriigid kaotasid Teise maailmasõja?' }, response: { en: 'The Grasshopper Lies Heavy', et: '„Rohutirts on raske“' }, acceptedVariants: { en: ['Grasshopper Lies Heavy'], et: ['„The Grasshopper Lies Heavy“'] },
        explanation: { en: 'Hawthorne Abendsen’s novel within the novel offers the occupied characters a competing history, though it does not exactly match ours.', et: 'Hawthorne Abendseni romaan romaanis pakub okupeeritud maailma tegelastele teistsuguse ajaloo, mis siiski ei lange päriselt kokku meie omaga.' },
        source: { sourceId: 'wikipedia:grasshopper-lies-heavy', title: 'The Grasshopper Lies Heavy', url: 'https://en.wikipedia.org/wiki/The_Grasshopper_Lies_Heavy', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-073:encyclopedia-galactica', factKey: 'literature-language:encyclopedia-galactica-rival-guide', tier: 5, subjectKey: 'fictional-book:encyclopedia-galactica',
        clue: { en: 'What sober reference work is repeatedly contrasted with the cheaper and more popular Hitchhiker’s Guide in Douglas Adams’s comic universe?', et: 'Millist tõsimeelset teatmeteost vastandatakse Douglas Adamsi koomilises universumis korduvalt odavamale ja populaarsemale „Pöidlaküüdi reisijuhile“?' }, response: { en: 'the Encyclopedia Galactica', et: '„Encyclopedia Galactica“' }, acceptedVariants: { en: ['Encyclopaedia Galactica'], et: ['„Galaktika entsüklopeedia“'] },
        explanation: { en: 'Adams uses the grander encyclopedia as a foil for the Guide’s portability, sales, and cheerfully questionable accuracy.', et: 'Adams kasutab väärikamat entsüklopeediat vastandina reisijuhi kaasaskantavusele, müügiedule ja rõõmsalt kaheldavale täpsusele.' },
        source: { sourceId: 'wikipedia:encyclopedia-galactica-adams', title: 'Encyclopedia Galactica', url: 'https://en.wikipedia.org/wiki/Encyclopedia_Galactica', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-074', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Classics Retold from the Margins', et: 'Klassika ümberjutustused kõrvalpilgust' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-074:wide-sargasso-sea-antoinette', factKey: 'literature-language:wide-sargasso-sea-reimagines-bertha-mason', tier: 1, subjectKey: 'work:wide-sargasso-sea',
        clue: { en: 'Which Jean Rhys novel imagines the Caribbean youth of Antoinette Cosway, the woman later known as Bertha Mason in Jane Eyre?', et: 'Milline Jean Rhysi romaan kujutab Antoinette Cosway Kariibi mere noorust enne seda, kui temast saab „Jane Eyre’i“ Bertha Mason?' }, response: { en: 'Wide Sargasso Sea', et: '„Lai Sargasso meri“' }, acceptedVariants: { en: ['The Wide Sargasso Sea', 'Lai Sargasso meri'], et: ['„Wide Sargasso Sea“'] },
        explanation: { en: 'Rhys gives Rochester’s first wife a history and voice of her own, turning a figure from the edge of Jane Eyre into the centre of the story.', et: 'Rhys annab Rochesteri esimesele naisele oma ajaloo ja hääle ning tõstab „Jane Eyre’i“ kõrvaltegelase loo keskmesse.' },
        source: { sourceId: 'wikipedia:wide-sargasso-sea-antoinette', title: 'Wide Sargasso Sea', url: 'https://en.wikipedia.org/wiki/Wide_Sargasso_Sea', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-074:grendel-monster-narrator', factKey: 'literature-language:grendel-retells-beowulf-from-monster-view', tier: 2, subjectKey: 'work:grendel-novel',
        clue: { en: 'Which John Gardner novel retells part of Beowulf through the lonely monster’s own philosophical voice?', et: 'Milline John Gardneri romaan jutustab osa „Beowulfist“ ümber üksildase koletise enda filosoofilise hääle kaudu?' }, response: { en: 'Grendel', et: '„Grendel“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Gardner makes Grendel the narrator, recasting the epic conflict as the monster’s search for meaning before Beowulf arrives.', et: 'Gardner teeb Grendelist jutustaja ning kujutab eepilist konflikti koletise tähenduseotsinguna enne Beowulfi saabumist.' },
        source: { sourceId: 'wikipedia:grendel-novel-narrator', title: 'Grendel (novel)', url: 'https://en.wikipedia.org/wiki/Grendel_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-074:penelopiad-maids-chorus', factKey: 'literature-language:penelopiad-penelope-maids-retell-odyssey', tier: 3, subjectKey: 'work:the-penelopiad',
        clue: { en: 'Which Margaret Atwood work lets Penelope recount her marriage to Odysseus while the twelve hanged maids interrupt as a chorus?', et: 'Millises Margaret Atwoodi teoses jutustab Penelope oma abielust Odysseusega, samal ajal kui kaksteist ülespoodud teenijannat koorina vahele astuvad?' }, response: { en: 'The Penelopiad', et: '„Penelopeia“' }, acceptedVariants: { en: ['Penelopiad', 'Penelopeia'], et: ['„The Penelopiad“'] },
        explanation: { en: 'The novella revisits the Odyssey from the afterlife, questioning both Odysseus’s legend and the maids’ punishment.', et: 'Lühiromaan vaatab „Odüsseiale“ tagasi teispoolsusest ning seab küsimärgi alla nii Odysseuse legendi kui ka teenijannade karistuse.' },
        source: { sourceId: 'wikipedia:penelopiad-maids-chorus', title: 'The Penelopiad', url: 'https://en.wikipedia.org/wiki/The_Penelopiad', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-074:thousand-acres-king-lear', factKey: 'literature-language:thousand-acres-recasts-king-lear-iowa', tier: 4, subjectKey: 'work:a-thousand-acres',
        clue: { en: 'Which Jane Smiley novel turns King Lear into an Iowa farmer who divides his land among three daughters, with Ginny telling the story?', et: 'Milline Jane Smiley romaan muudab kuningas Leari Iowa farmeriks, kes jagab maa kolme tütre vahel, ning laseb loo jutustada Ginnyl?' }, response: { en: 'A Thousand Acres', et: '„A Thousand Acres“' }, acceptedVariants: { en: ['Thousand Acres'], et: ['„Thousand Acres“'] },
        explanation: { en: 'Smiley relocates Shakespeare’s family tragedy to a modern farm and shifts sympathy toward the eldest daughter’s perspective.', et: 'Smiley paigutab Shakespeare’i peretragöödia tänapäeva farmi ning nihutab vaatepunkti ja kaastunde vanima tütre poole.' },
        source: { sourceId: 'wikipedia:thousand-acres-king-lear', title: 'A Thousand Acres', url: 'https://en.wikipedia.org/wiki/A_Thousand_Acres', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-074:hag-seed-prison-tempest', factKey: 'literature-language:hag-seed-reworks-tempest-in-prison', tier: 5, subjectKey: 'work:hag-seed',
        clue: { en: 'Which Margaret Atwood novel reworks The Tempest through Felix, a deposed theatre director who stages Shakespeare’s play with prison inmates?', et: 'Milline Margaret Atwoodi romaan loob „Tormi“ ümber Felixi kaudu, kes pärast teatrijuhi kohalt tõrjumist lavastab Shakespeare’i näidendi vangidega?' }, response: { en: 'Hag-Seed', et: '„Hag-Seed“' }, acceptedVariants: { en: ['Hag Seed'], et: ['„Hag Seed“'] },
        explanation: { en: 'Felix uses the prison production to pursue revenge, echoing Prospero while directing his own version of the play.', et: 'Felix kasutab vanglalavastust kättemaksuks ning kordab Prosperot, juhtides samal ajal omaenda versiooni näidendist.' },
        source: { sourceId: 'wikipedia:hag-seed-prison-tempest', title: 'Hag-Seed', url: 'https://en.wikipedia.org/wiki/Hag-Seed', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-076', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Books, Scholars, and Hidden Texts', et: 'Raamatud, uurijad ja peidetud tekstid' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-076:name-rose-library-murders', factKey: 'literature-language:name-rose-monk-library-mystery', tier: 1, subjectKey: 'work:the-name-of-the-rose',
        clue: { en: 'Which Umberto Eco novel sends the Franciscan William of Baskerville into a medieval Italian monastery to investigate deaths linked to its labyrinthine library?', et: 'Millises Umberto Eco romaanis uurib frantsiskaan William Baskerville’ist keskaegses Itaalia kloostris surmajuhtumeid, mis on seotud labürintliku raamatukoguga?' }, response: { en: 'The Name of the Rose', et: '„Roosi nimi“' }, acceptedVariants: { en: ['Name of the Rose', 'Roosi nimi'], et: ['„The Name of the Rose“'] },
        explanation: { en: 'William’s inquiry joins a murder mystery to debates about knowledge, laughter, and the control of books.', et: 'Williami uurimine seob mõrvamüsteeriumi vaidlustega teadmiste, naeru ja raamatute üle valitsemise teemal.' },
        source: { sourceId: 'wikipedia:name-rose-library-murders', title: 'The Name of the Rose', url: 'https://en.wikipedia.org/wiki/The_Name_of_the_Rose', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-076:shadow-wind-forgotten-book', factKey: 'literature-language:shadow-wind-daniel-carax-book', tier: 2, subjectKey: 'work:the-shadow-of-the-wind',
        clue: { en: 'Which Carlos Ruiz Zafón novel begins when young Daniel Sempere chooses a Julián Carax book in Barcelona’s Cemetery of Forgotten Books?', et: 'Milline Carlos Ruiz Zafóni romaan algab sellega, et noor Daniel Sempere valib Barcelona Unustatud Raamatute Surnuaial Julián Caraxi teose?' }, response: { en: 'The Shadow of the Wind', et: '„Tuule vari“' }, acceptedVariants: { en: ['Shadow of the Wind', 'Tuule vari'], et: ['„The Shadow of the Wind“'] },
        explanation: { en: 'Daniel’s attempt to learn about Carax draws him into a mystery involving someone who is destroying every surviving copy of the author’s books.', et: 'Caraxi loo uurimine viib Danieli mõistatuseni, kus keegi hävitab süstemaatiliselt kirjaniku teoste säilinud eksemplare.' },
        source: { sourceId: 'wikipedia:shadow-wind-forgotten-book', title: 'The Shadow of the Wind', url: 'https://en.wikipedia.org/wiki/The_Shadow_of_the_Wind', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-076:possession-victorian-letters', factKey: 'literature-language:possession-scholars-discover-poets-romance', tier: 3, subjectKey: 'work:possession-byatt',
        clue: { en: 'Which A. S. Byatt novel follows scholars Roland Michell and Maud Bailey as hidden letters reveal a secret romance between two invented Victorian poets?', et: 'Millises A. S. Byatti romaanis avastavad uurijad Roland Michell ja Maud Bailey peidetud kirjade kaudu kahe väljamõeldud viktoriaanliku luuletaja salaarmastuse?' }, response: { en: 'Possession', et: '„Possession“' }, acceptedVariants: { en: ['Possession: A Romance'], et: ['„Possession: A Romance“'] },
        explanation: { en: 'The modern investigation alternates with poems, diaries, and letters attributed to the fictional poets Randolph Ash and Christabel LaMotte.', et: 'Tänapäevane uurimine vaheldub väljamõeldud luuletajatele Randolph Ashile ja Christabel LaMotte’ile omistatud luuletuste, päevikute ja kirjadega.' },
        source: { sourceId: 'wikipedia:possession-victorian-letters', title: 'Possession (Byatt novel)', url: 'https://en.wikipedia.org/wiki/Possession_(Byatt_novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-076:historian-archives-dracula', factKey: 'literature-language:historian-letters-archives-vlad-dracula', tier: 4, subjectKey: 'work:the-historian',
        clue: { en: 'Which Elizabeth Kostova novel turns old letters, archives, and libraries into a hunt for the historical Vlad the Impaler and the possible survival of Dracula?', et: 'Milline Elizabeth Kostova romaan muudab vanad kirjad, arhiivid ja raamatukogud jahiks ajaloolisele Vlad Teibasseajajale ning võib-olla ellu jäänud Draculale?' }, response: { en: 'The Historian', et: '„Ajaloolane“' }, acceptedVariants: { en: ['Historian', 'Ajaloolane'], et: ['„The Historian“'] },
        explanation: { en: 'Nested accounts follow generations of researchers across Europe as scholarship becomes a dangerous confrontation with the Dracula legend.', et: 'Mitmekihiline jutustus jälgib eri põlvkondade uurijaid üle Euroopa, kuni teadustööst saab ohtlik vastasseis Dracula legendiga.' },
        source: { sourceId: 'wikipedia:historian-archives-dracula', title: 'The Historian', url: 'https://en.wikipedia.org/wiki/The_Historian', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-076:people-book-haggadah-clues', factKey: 'literature-language:people-book-conservator-sarajevo-haggadah', tier: 5, subjectKey: 'work:people-of-the-book',
        clue: { en: 'Which Geraldine Brooks novel has conservator Hanna Heath use a butterfly wing, wine stains, and other traces to reconstruct the Sarajevo Haggadah’s travels?', et: 'Millises Geraldine Brooksi romaanis kasutab konservaator Hanna Heath liblikatiiba, veiniplekke ja muid jälgi, et taastada Sarajevo hagada teekond?' }, response: { en: 'People of the Book', et: '„People of the Book“' }, acceptedVariants: { en: ['The People of the Book'], et: ['„The People of the Book“'] },
        explanation: { en: 'Each physical clue opens a story from the illuminated manuscript’s imagined passage through persecution, exile, and rescue.', et: 'Iga füüsiline jälg avab loo illustreeritud käsikirja kujuteldavast teekonnast läbi tagakiusamise, pagenduse ja pääsemise.' },
        source: { sourceId: 'wikipedia:people-book-haggadah-clues', title: 'People of the Book (novel)', url: 'https://en.wikipedia.org/wiki/People_of_the_Book_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-078', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Great Works Their Authors Never Finished', et: 'Suurteosed, mis jäid autoril lõpetamata' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-078:edwin-drood-unsolved', factKey: 'literature-language:edwin-drood-dickens-died-before-solution', tier: 1, subjectKey: 'work:mystery-of-edwin-drood',
        clue: { en: 'Which mystery about a missing young man was left without Dickens’s solution when the author died after publishing only half of it?', et: 'Milline kadunud noormehe mõistatus jäi Dickensi lahenduseta, sest autor suri pärast ligikaudu poole romaani avaldamist?' }, response: { en: 'The Mystery of Edwin Drood', et: '„The Mystery of Edwin Drood“' }, acceptedVariants: { en: ['Mystery of Edwin Drood', 'Edwin Drood'], et: ['„Edwin Drood“'] },
        explanation: { en: 'Dickens died while the serial was in progress, leaving Edwin’s fate and the intended culprit open to debate.', et: 'Dickens suri järjejutu ilmumise ajal, mistõttu Edwini saatus ja kavandatud süüdlane jäid vaidlusaluseks.' },
        source: { sourceId: 'wikipedia:edwin-drood-unfinished-mystery', title: 'The Mystery of Edwin Drood', url: 'https://en.wikipedia.org/wiki/The_Mystery_of_Edwin_Drood', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-078:sanditon-seaside-fragment', factKey: 'literature-language:sanditon-austen-unfinished-resort', tier: 2, subjectKey: 'work:sanditon',
        clue: { en: 'Which Jane Austen fragment brings Charlotte Heywood to an ambitious seaside resort before the manuscript breaks off partway through its twelfth chapter?', et: 'Milline Jane Austeni katkend viib Charlotte Heywoodi arenevasse merekuurorti, kuid katkeb kaheteistkümnenda peatüki keskel?' }, response: { en: 'Sanditon', et: '„Sanditon“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Austen stopped work as her health declined, leaving the resort satire and Charlotte’s story incomplete.', et: 'Austen katkestas halveneva tervise tõttu töö ning kuurordisatiir ja Charlotte’i lugu jäid lõpetamata.' },
        source: { sourceId: 'wikipedia:sanditon-seaside-fragment', title: 'Sanditon', url: 'https://en.wikipedia.org/wiki/Sanditon', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-078:svejk-unfinished-war-journey', factKey: 'literature-language:svejk-hasek-died-before-completing-novel', tier: 3, subjectKey: 'work:good-soldier-svejk',
        clue: { en: 'Which Jaroslav Hašek satire follows a cheerfully obstructive Czech soldier toward the First World War front but ends because its author died mid-series?', et: 'Milline Jaroslav Hašeki satiir saadab rõõmsalt tõrkuva tšehhi sõduri Esimese maailmasõja rindele, kuid katkeb autori surma tõttu?' }, response: { en: 'The Good Soldier Švejk', et: '„Vahva sõdur Švejk“' }, acceptedVariants: { en: ['The Good Soldier Schweik', 'Good Soldier Švejk', 'Vahva sõdur Švejk'], et: ['„The Good Soldier Švejk“', '„The Good Soldier Schweik“'] },
        explanation: { en: 'Hašek completed only part of his planned comic sequence, so Švejk never reaches a conventional conclusion.', et: 'Hašek jõudis kavandatud koomilisest romaanisarjast valmis vaid osa ning Švejki lugu ei saa tavapärast lõppu.' },
        source: { sourceId: 'wikipedia:svejk-unfinished-war-journey', title: 'The Good Soldier Švejk', url: 'https://en.wikipedia.org/wiki/The_Good_Soldier_%C5%A0vejk', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-078:dead-souls-unfinished-design', factKey: 'literature-language:dead-souls-survives-as-incomplete-gogol-project', tier: 4, subjectKey: 'work:dead-souls',
        clue: { en: 'Which Gogol work follows Chichikov buying the names of dead serfs and survives as only the incomplete beginning of a much larger design?', et: 'Millises Gogoli teoses ostab Tšitšikov surnud pärisorjade nimesid ning millest on säilinud vaid suurema kavandi lõpetamata algus?' }, response: { en: 'Dead Souls', et: '„Surnud hinged“' }, acceptedVariants: { en: ['Surnud hinged'], et: ['„Dead Souls“'] },
        explanation: { en: 'Gogol envisioned further parts but destroyed much of the continuation, leaving the satirical project unfinished.', et: 'Gogol kavandas järgmisi osi, kuid hävitas suure osa jätkust, nii et satiiriline suurprojekt jäi lõpetamata.' },
        source: { sourceId: 'wikipedia:dead-souls-unfinished-design', title: 'Dead Souls', url: 'https://en.wikipedia.org/wiki/Dead_Souls', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-078:original-laura-index-cards', factKey: 'literature-language:original-laura-nabokov-index-card-fragments', tier: 5, subjectKey: 'work:the-original-of-laura',
        clue: { en: 'Which Vladimir Nabokov project survived as a set of index cards that he asked to have destroyed, but which his son later published in facsimile form?', et: 'Milline Vladimir Nabokovi teos säilis registrikaartide kogumina, mille autor palus hävitada, kuid mille poeg hiljem faksiimilekujul avaldas?' }, response: { en: 'The Original of Laura', et: '„The Original of Laura“' }, acceptedVariants: { en: ['Original of Laura'], et: ['„Original of Laura“'] },
        explanation: { en: 'The published volume preserves Nabokov’s movable cards and fragments rather than presenting a completed novel.', et: 'Avaldatud köide säilitab Nabokovi ümbertõstetavad kaardid ja katkendid, mitte valmis romaani.' },
        source: { sourceId: 'wikipedia:original-laura-index-cards', title: 'The Original of Laura', url: 'https://en.wikipedia.org/wiki/The_Original_of_Laura', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-079', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Theatre Turns the Mirror on Itself', et: 'Teater vaatab iseendale otsa' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-079:noises-off-nothing-on', factKey: 'literature-language:noises-off-shows-farce-front-and-backstage', tier: 1, subjectKey: 'work:noises-off',
        clue: { en: 'Which Michael Frayn comedy shows a disastrous touring production of the fictional farce Nothing On first from the audience side and then from backstage?', et: 'Milline Michael Frayni komöödia näitab väljamõeldud farsi „Nothing On“ katastroofilist ringreisi esmalt publiku poolt ja seejärel lava tagant?' }, response: { en: 'Noises Off', et: '„Noises Off“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The revolving set exposes how the actors’ quarrels and missed cues turn the play within the play into chaos.', et: 'Pöördlava paljastab, kuidas näitlejate tülid ja eksitud märguanded muudavad näidendi näidendis täielikuks kaoseks.' },
        source: { sourceId: 'wikipedia:noises-off-nothing-on', title: 'Noises Off', url: 'https://en.wikipedia.org/wiki/Noises_Off', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-079:six-characters-interrupt-rehearsal', factKey: 'literature-language:six-characters-seek-author-at-rehearsal', tier: 2, subjectKey: 'work:six-characters-search-author',
        clue: { en: 'Which Pirandello play begins when six unfinished characters interrupt a theatre rehearsal and demand that their story be performed?', et: 'Milline Pirandello näidend algab sellega, et kuus lõpetamata tegelast katkestavad teatriproovi ja nõuavad oma loo lavastamist?' }, response: { en: 'Six Characters in Search of an Author', et: '„Kuus tegelast autorit otsimas“' }, acceptedVariants: { en: ['Kuus tegelast autorit otsimas'], et: ['„Six Characters in Search of an Author“'] },
        explanation: { en: 'The characters insist that their drama is more real than the actors’ imitation, blurring rehearsal, performance, and reality.', et: 'Tegelased väidavad, et nende draama on näitlejate jäljendusest tõelisem, ning hägustavad proovi, etenduse ja tegelikkuse piiri.' },
        source: { sourceId: 'wikipedia:six-characters-interrupt-rehearsal', title: 'Six Characters in Search of an Author', url: 'https://en.wikipedia.org/wiki/Six_Characters_in_Search_of_an_Author', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-079:real-inspector-hound-critics', factKey: 'literature-language:real-inspector-hound-critics-enter-mystery', tier: 3, subjectKey: 'work:the-real-inspector-hound',
        clue: { en: 'Which Tom Stoppard comedy has theatre critics Moon and Birdboot comment on a country-house mystery until they are pulled into its action?', et: 'Millises Tom Stoppardi komöödias arvustavad teatrikriitikud Moon ja Birdboot maamõisa mõrvalugu, kuni satuvad ise selle tegevusse?' }, response: { en: 'The Real Inspector Hound', et: '„The Real Inspector Hound“' }, acceptedVariants: { en: ['Real Inspector Hound'], et: ['„Real Inspector Hound“'] },
        explanation: { en: 'Stoppard parodies both formula mysteries and reviewing as the observers become characters in the play they are watching.', et: 'Stoppard parodeerib nii vormellikke mõrvalugusid kui ka kriitikat, sest vaatlejatest saavad vaadatava näidendi tegelased.' },
        source: { sourceId: 'wikipedia:real-inspector-hound-critics', title: 'The Real Inspector Hound', url: 'https://en.wikipedia.org/wiki/The_Real_Inspector_Hound', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-079:dresser-norman-sir-lear', factKey: 'literature-language:dresser-norman-prepares-sir-for-lear', tier: 4, subjectKey: 'work:the-dresser-play',
        clue: { en: 'Which Ronald Harwood play follows Norman struggling backstage to prepare an exhausted actor known as “Sir” for another performance of King Lear?', et: 'Milline Ronald Harwoodi näidend jälgib lavatagust Normanit, kes püüab kurnatud „Siri“ järjekordseks kuningas Leari etenduseks valmis seada?' }, response: { en: 'The Dresser', et: '„The Dresser“' }, acceptedVariants: { en: ['Dresser'], et: ['„Dresser“'] },
        explanation: { en: 'The wartime theatre company depends on the intimate, unequal bond between the aging actor-manager and the dresser who sustains him.', et: 'Sõjaaegne teatritrupp sõltub vananeva näitleja-juhi ja teda toetava riietaja lähedasest, kuid ebavõrdsest suhtest.' },
        source: { sourceId: 'wikipedia:dresser-norman-sir-lear', title: 'The Dresser', url: 'https://en.wikipedia.org/wiki/The_Dresser', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-079:rosencrantz-guildenstern-hamlet-wings', factKey: 'literature-language:rosencrantz-guildenstern-centres-hamlet-minor-figures', tier: 5, subjectKey: 'work:rosencrantz-guildenstern-dead',
        clue: { en: 'Which Stoppard play keeps two minor figures from Hamlet waiting in the wings, flipping coins and trying to understand a plot whose ending is already fixed?', et: 'Milline Stoppardi näidend jätab kaks „Hamleti“ kõrvaltegelast kulissidesse ootama, münte viskama ja püüdma mõista süžeed, mille lõpp on juba määratud?' }, response: { en: 'Rosencrantz and Guildenstern Are Dead', et: '„Rosencrantz ja Guildenstern on surnud“' }, acceptedVariants: { en: ['Rosencrantz ja Guildenstern on surnud'], et: ['„Rosencrantz and Guildenstern Are Dead“'] },
        explanation: { en: 'Rosencrantz and Guildenstern move between Shakespeare’s familiar scenes and an absurdist uncertainty they cannot escape.', et: 'Rosencrantz ja Guildenstern liiguvad Shakespeare’i tuttavate stseenide ning absurdistliku ebakindluse vahel, millest nad pääseda ei saa.' },
        source: { sourceId: 'wikipedia:rosencrantz-guildenstern-hamlet-wings', title: 'Rosencrantz and Guildenstern Are Dead', url: 'https://en.wikipedia.org/wiki/Rosencrantz_and_Guildenstern_Are_Dead', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-083', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Words That Escaped Their Books', et: 'Raamatutest ellu läinud sõnad' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-083:catch-22-no-win-rule', factKey: 'literature-language:catch-22-heller-contradictory-airman-rule', tier: 1, subjectKey: 'phrase:catch-22',
        clue: { en: 'What term for a no-win situation comes from Joseph Heller’s rule that an airman asking to avoid dangerous missions proves he is sane enough to keep flying?', et: 'Milline väljapääsmatut olukorda tähistav väljend pärineb Joseph Helleri reeglist, mille järgi tõestab ohtlikest lendudest vabastamist paluv lendur, et on lendamiseks piisavalt terve mõistusega?' }, response: { en: 'a catch-22', et: 'nokk kinni, saba lahti olukord' }, acceptedVariants: { en: ['catch-22', 'Catch-22', 'nokk kinni, saba lahti olukord'], et: ['catch-22', 'Catch-22'] },
        explanation: { en: 'The fictional regulation traps Heller’s airmen in circular logic, and its name became shorthand for any self-contradictory bind.', et: 'Väljamõeldud määrus sulgeb Helleri lendurid ringloogikasse ning selle nimest sai iseenesega vastuolus oleva ummiku üldnimetus.' },
        source: { sourceId: 'wikipedia:catch-22-no-win-rule', title: 'Catch-22 (logic)', url: 'https://en.wikipedia.org/wiki/Catch-22_(logic)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-083:utopia-more-no-place', factKey: 'literature-language:utopia-more-coined-island-name', tier: 2, subjectKey: 'word:utopia',
        clue: { en: 'Which word for an ideal society comes from Thomas More’s invented island name, built as a Greek pun on “no place”?', et: 'Milline ideaalühiskonda tähistav sõna pärineb Thomas More’i väljamõeldud saare nimest, mis mängib kreeka väljendiga „ei mingi koht“?' }, response: { en: 'utopia', et: 'utoopia' }, acceptedVariants: { en: ['utoopia'], et: ['utopia'] },
        explanation: { en: 'More’s book made Utopia the name of an imagined commonwealth, and the word became a general term for an ideal but unreal society.', et: 'More’i teoses oli Utoopia kujuteldava riigi nimi ning sõnast sai üldnimetus ideaalsele, kuid tegelikkuses olematule ühiskonnale.' },
        source: { sourceId: 'wikipedia:utopia-more-no-place', title: 'Utopia (book)', url: 'https://en.wikipedia.org/wiki/Utopia_(book)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-083:pandemonium-milton-capital', factKey: 'literature-language:pandemonium-milton-capital-of-hell', tier: 3, subjectKey: 'word:pandemonium',
        clue: { en: 'What word for noisy chaos began as Milton’s name for the capital of Hell where the demons gather in Paradise Lost?', et: 'Milline lärmakat kaost tähistav sõna oli algselt Miltoni nimi põrgu pealinnale, kus „Kaotatud paradiisi“ deemonid kogunevad?' }, response: { en: 'pandemonium', et: 'pandemoonium' }, acceptedVariants: { en: ['Pandæmonium', 'pandemoonium'], et: ['pandemonium', 'Pandæmonium'] },
        explanation: { en: 'Milton formed Pandæmonium as the demons’ assembly place; the name later broadened to any scene of uproar and disorder.', et: 'Milton lõi Pandæmoniumi deemonite kogunemispaigaks; hiljem laienes nimi igasuguse möllu ja korratuse tähiseks.' },
        source: { sourceId: 'wikipedia:pandemonium-milton-capital', title: 'Pandæmonium (Paradise Lost)', url: 'https://en.wikipedia.org/wiki/Pand%C3%A6monium_(Paradise_Lost)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-083:yahoo-gulliver-brutish', factKey: 'literature-language:yahoo-from-gulliver-brutish-humanoids', tier: 4, subjectKey: 'word:yahoo',
        clue: { en: 'What insult for a coarse person began as Swift’s name for the filthy, brutish humanoids ruled by rational horses in Gulliver’s Travels?', et: 'Milline tahumatu inimese kohta käiv sõimunimi oli Swiftil algselt räpaste ja jõhkrate inimesesarnaste olendite nimi, keda valitsesid „Gulliveri reisides“ mõistusega hobused?' }, response: { en: 'yahoo', et: 'yahoo' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Swift’s Yahoos embody degraded human appetites, and their name entered English for a loutish or uncivilized person.', et: 'Swifti yahood kehastavad mandunud inimlikke ihasid ning nende nimi hakkas inglise keeles tähistama matslikku või tsiviliseerimata inimest.' },
        source: { sourceId: 'wikipedia:yahoo-gulliver-brutish', title: 'Yahoo (Gulliver’s Travels)', url: 'https://en.wikipedia.org/wiki/Yahoo_(Gulliver%27s_Travels)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-083:chortle-jabberwocky-blend', factKey: 'literature-language:chortle-coined-jabberwocky-chuckle-snort', tier: 5, subjectKey: 'word:chortle',
        clue: { en: 'Which word for a gleeful laugh did Lewis Carroll coin in “Jabberwocky” by blending “chuckle” and “snort”?', et: 'Millise rõõmsa naeru sõna lõi Lewis Carroll „Jabberwockys“, sulatades kokku inglise sõnad chuckle ja snort?' }, response: { en: 'chortle', et: 'chortle' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Carroll’s portmanteau outgrew the poem and became an ordinary English verb and noun for a delighted laugh.', et: 'Carrolli kohversõna väljus luuletusest ning sai inglise keeles tavaliseks rõõmsa naeru tegusõnaks ja nimisõnaks.' },
        source: { sourceId: 'wikipedia:chortle-jabberwocky-blend', title: 'Chortle', url: 'https://en.wikipedia.org/wiki/Chortle', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-097', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Nordic Lives Under Pressure', et: 'Põhjamaade elud surve all' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-097:unknown-soldier-continuation-war', factKey: 'literature-language:unknown-soldier-machine-gun-company-war', tier: 1, subjectKey: 'work:the-unknown-soldier-novel',
        clue: { en: 'Which Väinö Linna novel follows an ordinary Finnish machine-gun company through the Continuation War, replacing heroic distance with soldiers’ varied voices?', et: 'Milline Väinö Linna romaan jälgib Soome kuulipildujakompaniid läbi Jätkusõja ning asendab kangelasliku distantsi sõdurite eri häältega?' }, response: { en: 'The Unknown Soldier', et: '„Tundmatu sõdur“' }, acceptedVariants: { en: ['Unknown Soldier', 'Tundmatu sõdur', 'Tuntematon sotilas'], et: ['„The Unknown Soldier“', '„Tuntematon sotilas“'] },
        explanation: { en: 'Linna’s ensemble of conscripts presents the war from the ranks and became a central work of Finnish post-war literature.', et: 'Linna ajateenijatest koosnev tegelaskond näitab sõda reameeste vaatepunktist ning romaanist sai Soome sõjajärgse kirjanduse keskne teos.' },
        source: { sourceId: 'wikipedia:unknown-soldier-continuation-war', title: 'The Unknown Soldier (novel)', url: 'https://en.wikipedia.org/wiki/The_Unknown_Soldier_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-097:summer-book-sophia-grandmother', factKey: 'literature-language:summer-book-sophia-grandmother-island', tier: 2, subjectKey: 'work:the-summer-book',
        clue: { en: 'Which Tove Jansson novel builds brief, unsentimental episodes around young Sophia and her grandmother sharing a small island in the Gulf of Finland?', et: 'Milline Tove Janssoni romaan loob lühikesed ja sentimentaalsust vältivad lood noore Sophia ning tema vanaema ühisest suvest Soome lahe väikesaarel?' }, response: { en: 'The Summer Book', et: '„Suveraamat“' }, acceptedVariants: { en: ['Summer Book', 'Suveraamat'], et: ['„The Summer Book“', '„Sommarboken“'] },
        explanation: { en: 'The island conversations let childhood curiosity and old age meet against weather, sea, and the family’s quiet grief.', et: 'Saarevestlustes kohtuvad lapse uudishimu ja vanadus ilma, mere ning perekonna vaikse leina taustal.' },
        source: { sourceId: 'wikipedia:summer-book-sophia-grandmother', title: 'The Summer Book', url: 'https://en.wikipedia.org/wiki/The_Summer_Book', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-097:kristin-lavransdatter-medieval-life', factKey: 'literature-language:kristin-lavransdatter-medieval-norway-trilogy', tier: 3, subjectKey: 'work:kristin-lavransdatter',
        clue: { en: 'Which Sigrid Undset trilogy follows one woman from rebellious youth through marriage and motherhood in fourteenth-century Norway?', et: 'Milline Sigrid Undseti triloogia jälgib ühe naise teekonda mässumeelsest noorusest abielu ja emaduseni 14. sajandi Norras?' }, response: { en: 'Kristin Lavransdatter', et: '„Kristin Lavransdatter“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Kristin’s choices, faith, and bond with Erlend unfold across The Wreath, The Wife, and The Cross.', et: 'Kristini valikud, usk ja suhe Erlendiga arenevad triloogia osades „Pärg“, „Naine“ ja „Rist“.' },
        source: { sourceId: 'wikipedia:kristin-lavransdatter-medieval-life', title: 'Kristin Lavransdatter', url: 'https://en.wikipedia.org/wiki/Kristin_Lavransdatter', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-097:growth-soil-isak-homestead', factKey: 'literature-language:growth-soil-isak-builds-norwegian-homestead', tier: 4, subjectKey: 'work:growth-of-the-soil',
        clue: { en: 'Which Knut Hamsun novel begins with Isak clearing remote Norwegian land and building the farm Sellanraa almost from nothing?', et: 'Milline Knut Hamsuni romaan algab sellega, et Isak harib kauget Norra maad ja rajab peaaegu tühjalt kohalt Sellanraa talu?' }, response: { en: 'Growth of the Soil', et: '„Maa õnnistus“' }, acceptedVariants: { en: ['Maa õnnistus'], et: ['„Growth of the Soil“', '„Markens grøde“'] },
        explanation: { en: 'Isak’s homestead anchors a novel about labour, settlement, family, and the pressure of modern change.', et: 'Isaki talu on töö, asustamise, perekonna ja moodsa muutuse survega tegeleva romaani kese.' },
        source: { sourceId: 'wikipedia:growth-soil-isak-homestead', title: 'Growth of the Soil', url: 'https://en.wikipedia.org/wiki/Growth_of_the_Soil', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-097:independent-people-bjartur-debt', factKey: 'literature-language:independent-people-bjartur-farm-independence', tier: 5, subjectKey: 'work:independent-people',
        clue: { en: 'Which Halldór Laxness novel tests the proud sheep farmer Bjartur’s dream of absolute independence against debt, harsh land, and his family’s needs?', et: 'Milline Halldór Laxnessi romaan paneb uhke lambakasvataja Bjarturi täieliku iseseisvuse unistuse vastamisi võla, karmi maa ja perekonna vajadustega?' }, response: { en: 'Independent People', et: '„Iseseisvad inimesed“' }, acceptedVariants: { en: ['Sjálfstætt fólk', 'Iseseisvad inimesed'], et: ['„Independent People“', '„Sjálfstætt fólk“'] },
        explanation: { en: 'Bjartur’s refusal to depend on others gives him dignity but also drives the losses at the heart of the Icelandic novel.', et: 'Bjarturi keeldumine teistest sõltuda annab talle väärikuse, kuid põhjustab ka Islandi romaani keskmes olevad kaotused.' },
        source: { sourceId: 'wikipedia:independent-people-bjartur-debt', title: 'Independent People', url: 'https://en.wikipedia.org/wiki/Independent_People', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-013', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'medium',
    name: { en: 'Lives Rebuilt in Memoir', et: 'Mälestustes taastatud elud' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-013:anne-frank-diary-annex', factKey: 'literature-language:diary-young-girl-anne-frank-annex', tier: 1, subjectKey: 'work:diary-of-a-young-girl',
        clue: { en: 'Which book preserves Anne Frank’s diary from the Amsterdam hiding place she called the Secret Annex?', et: 'Milline raamat talletab Anne Franki päeviku Amsterdami peidupaigast, mida ta nimetas tagumiseks majaks?' }, response: { en: 'The Diary of a Young Girl', et: '„Anne Franki päevik“' }, acceptedVariants: { en: ['Anne Frank: The Diary of a Young Girl', 'Anne Franki päevik'], et: ['„The Diary of a Young Girl“', '„Anne Frank: The Diary of a Young Girl“'] },
        explanation: { en: 'Frank wrote while hiding with her family during the Nazi occupation; her father Otto later prepared the diary for publication.', et: 'Frank kirjutas päevikut koos perega natside okupatsiooni eest varjudes; tema isa Otto aitas selle hiljem avaldada.' },
        source: { sourceId: 'wikipedia:anne-frank-diary-annex', title: 'The Diary of a Young Girl', url: 'https://en.wikipedia.org/wiki/The_Diary_of_a_Young_Girl', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-013:angelas-ashes-limerick-childhood', factKey: 'literature-language:angelas-ashes-mccourt-limerick-childhood', tier: 2, subjectKey: 'work:angelas-ashes',
        clue: { en: 'Which Frank McCourt memoir recounts a poor childhood in Limerick with his mother Angela and an unreliable alcoholic father?', et: 'Milline Frank McCourti mälestusteraamat jutustab vaesest lapsepõlvest Limerickis koos ema Angela ja ebakindla alkohoolikust isaga?' }, response: { en: 'Angela’s Ashes', et: '„Angela tuhk“' }, acceptedVariants: { en: ['Angelas Ashes', 'Angela tuhk'], et: ['„Angela’s Ashes“', '„Angelas Ashes“'] },
        explanation: { en: 'McCourt balances hardship with a child’s eye and dark humour as the family struggles in Ireland.', et: 'McCourt ühendab raskused lapse pilgu ja tumeda huumoriga, kirjeldades pere võitlust Iirimaal.' },
        source: { sourceId: 'wikipedia:angelas-ashes-limerick-childhood', title: 'Angela’s Ashes', url: 'https://en.wikipedia.org/wiki/Angela%27s_Ashes', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-013:caged-bird-angelou-coming-age', factKey: 'literature-language:caged-bird-angelou-childhood-memoir', tier: 3, subjectKey: 'work:i-know-why-caged-bird-sings',
        clue: { en: 'Which Maya Angelou memoir follows her childhood in Stamps, Arkansas, and her growth toward a voice able to resist racism and silence?', et: 'Milline Maya Angelou mälestusteraamat jälgib tema lapsepõlve Arkansase osariigis Stampsis ning oma hääle leidmist rassismi ja vaikimise vastu?' }, response: { en: 'I Know Why the Caged Bird Sings', et: '„Ma tean, miks puurilind laulab“' }, acceptedVariants: { en: ['Ma tean, miks puurilind laulab'], et: ['„I Know Why the Caged Bird Sings“'] },
        explanation: { en: 'Angelou’s first autobiography traces how literature, community, and self-respect help her confront childhood oppression.', et: 'Angelou esimene autobiograafia näitab, kuidas kirjandus, kogukond ja eneseväärikus aitavad tal lapsepõlve rõhumisele vastu seista.' },
        source: { sourceId: 'wikipedia:caged-bird-angelou-coming-age', title: 'I Know Why the Caged Bird Sings', url: 'https://en.wikipedia.org/wiki/I_Know_Why_the_Caged_Bird_Sings', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-013:educated-westover-school', factKey: 'literature-language:educated-westover-self-education-idaho', tier: 4, subjectKey: 'work:educated-memoir',
        clue: { en: 'Which Tara Westover memoir follows a girl raised in an isolated Idaho survivalist family who enters a classroom for the first time at seventeen?', et: 'Milline Tara Westoveri mälestusteraamat jälgib Idaho eraldatud ellujääjate peres kasvanud tüdrukut, kes astub esimest korda klassiruumi seitsmeteistkümneaastaselt?' }, response: { en: 'Educated', et: '„Haritud“' }, acceptedVariants: { en: ['Haritud'], et: ['„Educated“'] },
        explanation: { en: 'Westover describes using study to widen her world, eventually reaching university while reassessing the family history she had been taught.', et: 'Westover kirjeldab, kuidas õppimine avardas tema maailma ja viis ülikooli, sundides samal ajal ümber hindama perekonnalt saadud arusaamu.' },
        source: { sourceId: 'wikipedia:educated-westover-school', title: 'Educated (book)', url: 'https://en.wikipedia.org/wiki/Educated_(book)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-013:when-breath-kalanithi', factKey: 'literature-language:when-breath-kalanithi-surgeon-cancer', tier: 5, subjectKey: 'work:when-breath-becomes-air',
        clue: { en: 'Which memoir by neurosurgeon Paul Kalanithi asks what makes life meaningful after he is diagnosed with terminal lung cancer?', et: 'Millises neurokirurg Paul Kalanithi mälestusteraamatus küsib autor elu tähenduse järele pärast ravimatu kopsuvähi diagnoosi?' }, response: { en: 'When Breath Becomes Air', et: '„Kui hingusest saab õhk“' }, acceptedVariants: { en: ['Kui hingusest saab õhk'], et: ['„When Breath Becomes Air“'] },
        explanation: { en: 'Kalanithi writes from both sides of medicine, moving from treating patients to facing mortality as a patient himself.', et: 'Kalanithi kirjutab meditsiini mõlemalt poolelt, liikudes patsientide ravimisest ise patsiendina surelikkusega silmitsi seismiseni.' },
        source: { sourceId: 'wikipedia:when-breath-kalanithi', title: 'When Breath Becomes Air', url: 'https://en.wikipedia.org/wiki/When_Breath_Becomes_Air', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-015', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'medium',
    name: { en: 'Poems Carried into Public Memory', et: 'Ühismällu jõudnud luuletused' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-015:o-captain-lincoln-elegy', factKey: 'literature-language:o-captain-whitman-lincoln-elegy', tier: 1, subjectKey: 'work:o-captain-my-captain',
        clue: { en: 'Which Walt Whitman poem mourns Abraham Lincoln by addressing the dead president as a captain whose ship has reached port?', et: 'Milline Walt Whitmani luuletus leinab Abraham Lincolni, pöördudes surnud presidendi kui kapteni poole, kelle laev on jõudnud sadamasse?' }, response: { en: 'O Captain! My Captain!', et: '„Oo, kapten! Mu kapten!“' }, acceptedVariants: { en: ['O Captain, My Captain', 'Oo, kapten! Mu kapten!'], et: ['„O Captain! My Captain!“', '„O Captain, My Captain“'] },
        explanation: { en: 'Whitman turns the end of the Civil War into a victorious voyage overshadowed by the captain’s death.', et: 'Whitman muudab kodusõja lõpu võidukaks merereisiks, mida varjutab kapteni surm.' },
        source: { sourceId: 'wikipedia:o-captain-lincoln-elegy', title: 'O Captain! My Captain!', url: 'https://en.wikipedia.org/wiki/O_Captain!_My_Captain!', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-015:new-colossus-statue-liberty', factKey: 'literature-language:new-colossus-statue-liberty-pedestal', tier: 2, subjectKey: 'work:the-new-colossus',
        clue: { en: 'Which Emma Lazarus sonnet calls the Statue of Liberty the “Mother of Exiles” and welcomes the homeless and tempest-tossed?', et: 'Milline Emma Lazaruse sonett nimetab Vabadussammast „pagulaste emaks“ ning tervitab kodutuid ja tormist räsituid?' }, response: { en: 'The New Colossus', et: '„Uus koloss“' }, acceptedVariants: { en: ['New Colossus', 'Uus koloss'], et: ['„The New Colossus“'] },
        explanation: { en: 'Lines from the poem were mounted inside the statue’s pedestal and helped define the monument as a symbol of welcome.', et: 'Luuletuse read paigutati monumendi aluse sisemusse ning need aitasid kujundada Vabadussambast vastuvõtu sümboli.' },
        source: { sourceId: 'wikipedia:new-colossus-statue-liberty', title: 'The New Colossus', url: 'https://en.wikipedia.org/wiki/The_New_Colossus', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-015:flanders-fields-poppies', factKey: 'literature-language:flanders-fields-mccrae-poppies-remembrance', tier: 3, subjectKey: 'work:in-flanders-fields',
        clue: { en: 'Which First World War poem by John McCrae opens with poppies growing between soldiers’ graves and helped make the flower a remembrance symbol?', et: 'Milline John McCrae Esimese maailmasõja luuletus algab sõdurite haudade vahel kasvavate moonidega ning aitas muuta lille mälestussümboliks?' }, response: { en: 'In Flanders Fields', et: '„Flandria väljadel“' }, acceptedVariants: { en: ['Flandria väljadel'], et: ['„In Flanders Fields“'] },
        explanation: { en: 'McCrae gives the fallen soldiers a collective voice from the fields where the living are urged to continue their cause.', et: 'McCrae annab langenud sõduritele ühise hääle väljadel, kust elavaid kutsutakse nende võitlust jätkama.' },
        source: { sourceId: 'wikipedia:flanders-fields-poppies', title: 'In Flanders Fields', url: 'https://en.wikipedia.org/wiki/In_Flanders_Fields', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-015:if-kipling-advice', factKey: 'literature-language:if-kipling-stoic-advice-son', tier: 4, subjectKey: 'work:if-kipling',
        clue: { en: 'Which Rudyard Kipling poem gives a son a sequence of calm tests—keeping his head, trusting himself, and meeting triumph and disaster alike?', et: 'Milline Rudyard Kiplingi luuletus annab pojale rea meelerahu proovilepanevaid nõuandeid: säilitada pea, usaldada ennast ning kohelda võitu ja kaotust võrdselt?' }, response: { en: 'If—', et: '„Kui…“' }, acceptedVariants: { en: ['If', 'Kui…', 'Kui...'], et: ['„If—“', '„If“'] },
        explanation: { en: 'The poem frames maturity as self-command under pressure and ends by promising that these qualities make the listener a man.', et: 'Luuletus kujutab küpsust enesevalitsusena surve all ning lõpeb lubadusega, et need omadused teevad kuulajast mehe.' },
        source: { sourceId: 'wikipedia:if-kipling-advice', title: 'If—', url: 'https://en.wikipedia.org/wiki/If%E2%80%94', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-015:dulce-gas-attack', factKey: 'literature-language:dulce-et-decorum-est-gas-attack', tier: 5, subjectKey: 'work:dulce-et-decorum-est',
        clue: { en: 'Which Wilfred Owen poem depicts an exhausted march and a gas attack before rejecting the old claim that it is sweet and fitting to die for one’s country?', et: 'Milline Wilfred Oweni luuletus kujutab kurnatud marssi ja gaasirünnakut ning lükkab seejärel tagasi vana väite, et kodumaa eest on magus ja auväärne surra?' }, response: { en: 'Dulce et Decorum est', et: '„Dulce et Decorum est“' }, acceptedVariants: { en: ['Dulce et Decorum Est'], et: ['„Dulce et Decorum Est“'] },
        explanation: { en: 'Owen uses a soldier’s choking death to expose the patriotic Latin motto as “the old Lie.”', et: 'Owen kasutab lämbuva sõduri surma, et paljastada isamaaline ladinakeelne maksiim „vana valena“.' },
        source: { sourceId: 'wikipedia:dulce-gas-attack', title: 'Dulce et Decorum est', url: 'https://en.wikipedia.org/wiki/Dulce_et_Decorum_est', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-017', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'medium',
    name: { en: 'Children Find a Door to Another World', et: 'Lapsed leiavad ukse teise maailma' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-017:coraline-small-door', factKey: 'literature-language:coraline-door-other-mother-buttons', tier: 1, subjectKey: 'work:coraline',
        clue: { en: 'Which Neil Gaiman novel sends a girl through a small door to an “other mother” who wants to sew buttons over her eyes?', et: 'Millises Neil Gaimani romaanis läheb tüdruk läbi väikese ukse „teise ema“ juurde, kes tahab talle silmade asemele nööbid õmmelda?' }, response: { en: 'Coraline', et: '„Coraline“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Coraline discovers that the tempting copy of her home is a trap and must rescue both her parents and other imprisoned children.', et: 'Coraline avastab, et ahvatlev kodu koopia on lõks, ning peab päästma nii oma vanemad kui ka teised vangistatud lapsed.' },
        source: { sourceId: 'wikipedia:coraline-small-door', title: 'Coraline', url: 'https://en.wikipedia.org/wiki/Coraline', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-017:wrinkle-time-tesseract', factKey: 'literature-language:wrinkle-time-meg-tesseract-rescue', tier: 2, subjectKey: 'work:a-wrinkle-in-time',
        clue: { en: 'Which Madeleine L’Engle novel has Meg Murry, Charles Wallace, and Calvin travel by tesseract to rescue Meg’s father from the mind-controlling IT?', et: 'Millises Madeleine L’Engle’i romaanis rändavad Meg Murry, Charles Wallace ja Calvin tesserakti abil, et päästa Megi isa mõtteid valitseva IT käest?' }, response: { en: 'A Wrinkle in Time', et: '„Ajalõhe“' }, acceptedVariants: { en: ['Wrinkle in Time', 'Ajalõhe'], et: ['„A Wrinkle in Time“'] },
        explanation: { en: 'The children cross space with Mrs Whatsit, Mrs Who, and Mrs Which to confront enforced sameness on Camazotz.', et: 'Lapsed liiguvad proua Whatsiti, proua Who ja proua Whichi abiga läbi ruumi, et astuda Camazotzil vastu sunnitud ühetaolisusele.' },
        source: { sourceId: 'wikipedia:wrinkle-time-tesseract', title: 'A Wrinkle in Time', url: 'https://en.wikipedia.org/wiki/A_Wrinkle_in_Time', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-017:phantom-tollbooth-milo', factKey: 'literature-language:phantom-tollbooth-milo-kingdom-wisdom', tier: 3, subjectKey: 'work:the-phantom-tollbooth',
        clue: { en: 'Which Norton Juster book has bored Milo drive a toy car through a mysterious tollbooth into the Kingdom of Wisdom?', et: 'Millises Norton Justeri raamatus sõidab tüdinud Milo mänguautoga läbi salapärase teemaksuputka Tarkuse Kuningriiki?' }, response: { en: 'The Phantom Tollbooth', et: '„The Phantom Tollbooth“' }, acceptedVariants: { en: ['Phantom Tollbooth'], et: ['„Phantom Tollbooth“'] },
        explanation: { en: 'Milo’s journey through wordplay and number puzzles leads him to rescue the princesses Rhyme and Reason.', et: 'Sõnamängude ja arvumõistatuste kaudu kulgev teekond viib Milo printsesside Rhyme’i ja Reasoni päästmiseni.' },
        source: { sourceId: 'wikipedia:phantom-tollbooth-milo', title: 'The Phantom Tollbooth', url: 'https://en.wikipedia.org/wiki/The_Phantom_Tollbooth', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-017:inkheart-read-characters-out', factKey: 'literature-language:inkheart-mo-reads-characters-from-books', tier: 4, subjectKey: 'work:inkheart',
        clue: { en: 'Which Cornelia Funke novel reveals that Meggie’s father Mo can read characters out of books, including the villain Capricorn?', et: 'Millises Cornelia Funke romaanis selgub, et Meggie isa Mo suudab tegelasi raamatutest välja lugeda, nende seas kurikael Capricornit?' }, response: { en: 'Inkheart', et: '„Tindisüda“' }, acceptedVariants: { en: ['Tindisüda'], et: ['„Inkheart“'] },
        explanation: { en: 'Mo’s gift exchanges people between fiction and reality, and the family must face the characters he accidentally released.', et: 'Mo anne vahetab inimesi väljamõeldise ja tegelikkuse vahel ning pere peab silmitsi seisma tegelastega, kelle ta kogemata vabastas.' },
        source: { sourceId: 'wikipedia:inkheart-read-characters-out', title: 'Inkheart', url: 'https://en.wikipedia.org/wiki/Inkheart', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-017:dark-is-rising-six-signs', factKey: 'literature-language:dark-is-rising-will-stanton-six-signs', tier: 5, subjectKey: 'work:the-dark-is-rising',
        clue: { en: 'Which Susan Cooper novel reveals on Will Stanton’s eleventh birthday that he is one of the Old Ones and must gather six Signs against the Dark?', et: 'Millises Susan Cooperi romaanis selgub Will Stantoni üheteistkümnendal sünnipäeval, et ta kuulub Vanade hulka ning peab Pimeduse vastu koguma kuus Märki?' }, response: { en: 'The Dark Is Rising', et: '„The Dark Is Rising“' }, acceptedVariants: { en: ['Dark Is Rising'], et: ['„Dark Is Rising“'] },
        explanation: { en: 'Will’s familiar English countryside opens into an ancient struggle between the Light and the Dark.', et: 'Willi tuttav Inglise maastik avaneb Valguse ja Pimeduse iidsesse võitlusse.' },
        source: { sourceId: 'wikipedia:dark-is-rising-six-signs', title: 'The Dark Is Rising', url: 'https://en.wikipedia.org/wiki/The_Dark_Is_Rising', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-038', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'medium',
    name: { en: 'Classic Comedies on Stage', et: 'Klassikalised lavakomöödiad' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-038:earnest-double-identities', factKey: 'literature-language:earnest-jack-algernon-invent-identities', tier: 1, subjectKey: 'work:importance-of-being-earnest',
        clue: { en: 'Which Oscar Wilde comedy has both Jack Worthing and Algernon Moncrieff invent false identities while Gwendolen and Cecily insist on loving a man named Ernest?', et: 'Millises Oscar Wilde’i komöödias loovad nii Jack Worthing kui ka Algernon Moncrieff endale valeidentiteedi, samal ajal kui Gwendolen ja Cecily tahavad armastada Ernesti-nimelist meest?' }, response: { en: 'The Importance of Being Earnest', et: '„Tähtis on olla tõsine“' }, acceptedVariants: { en: ['Importance of Being Earnest', 'Tähtis on olla tõsine'], et: ['„The Importance of Being Earnest“'] },
        explanation: { en: 'Wilde’s title pun and the heroes’ invented lives drive a satire of courtship, respectability, and social convention.', et: 'Wilde’i pealkirjasõnamäng ja kangelaste väljamõeldud elud käivitavad kosimist, kombekust ja seltskonnareegleid pilava satiiri.' },
        source: { sourceId: 'wikipedia:earnest-double-identities', title: 'The Importance of Being Earnest', url: 'https://en.wikipedia.org/wiki/The_Importance_of_Being_Earnest', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-038:pygmalion-eliza-speech', factKey: 'literature-language:pygmalion-higgins-trains-eliza-speech', tier: 2, subjectKey: 'work:pygmalion-play',
        clue: { en: 'Which George Bernard Shaw play has phonetics professor Henry Higgins train flower seller Eliza Doolittle to speak like a duchess?', et: 'Millises George Bernard Shaw’ näidendis õpetab foneetikaprofessor Henry Higgins lillemüüja Eliza Doolittle’i hertsoginna kombel kõnelema?' }, response: { en: 'Pygmalion', et: '„Pygmalion“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Eliza’s transformation exposes how accent and manners act as gates to class, while she demands control over her own future.', et: 'Eliza muutumine näitab, kuidas aktsent ja kombed valvavad klassipiire, ent ta nõuab õigust oma tulevikku ise juhtida.' },
        source: { sourceId: 'wikipedia:pygmalion-eliza-speech', title: 'Pygmalion (play)', url: 'https://en.wikipedia.org/wiki/Pygmalion_(play)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-038:government-inspector-mistaken-khlestakov', factKey: 'literature-language:government-inspector-town-mistakes-khlestakov', tier: 3, subjectKey: 'work:the-government-inspector',
        clue: { en: 'Which Gogol comedy erupts when corrupt provincial officials mistake the penniless traveller Khlestakov for an undercover state inspector?', et: 'Milline Gogoli komöödia puhkeb kaoseks, kui korrumpeerunud provintsilinna ametnikud peavad pennitut rändurit Hlestakovi salajaseks riigirevidendiks?' }, response: { en: 'The Government Inspector', et: '„Revident“' }, acceptedVariants: { en: ['The Inspector General', 'Government Inspector', 'Revident'], et: ['„The Government Inspector“', '„The Inspector General“'] },
        explanation: { en: 'Khlestakov accepts bribes and admiration while the frightened officials expose their own dishonesty.', et: 'Hlestakov võtab vastu altkäemakse ja imetlust, samal ajal kui hirmunud ametnikud paljastavad ise oma ebaaususe.' },
        source: { sourceId: 'wikipedia:government-inspector-mistaken-khlestakov', title: 'The Government Inspector', url: 'https://en.wikipedia.org/wiki/The_Government_Inspector', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-038:imaginary-invalid-argan-doctors', factKey: 'literature-language:imaginary-invalid-argan-hypochondriac', tier: 4, subjectKey: 'work:the-imaginary-invalid',
        clue: { en: 'Which Molière comedy centres on the hypochondriac Argan, who wants his daughter to marry a doctor so medical care will stay in the family?', et: 'Millise Molière’i komöödia keskmes on hüpohondrik Argan, kes tahab tütre arstile mehele panna, et arstiabi jääks perekonda?' }, response: { en: 'The Imaginary Invalid', et: '„Ebahaige“' }, acceptedVariants: { en: ['Imaginary Invalid', 'Ebahaige'], et: ['„The Imaginary Invalid“'] },
        explanation: { en: 'The play mocks credulous patients and pompous medicine as Argan’s household stages schemes to cure him of manipulation rather than disease.', et: 'Näidend pilkab kergeusklikke patsiente ja upsakat arstiteadust, samal ajal kui Argani pere püüab ravida teda pigem mõjutatavusest kui haigusest.' },
        source: { sourceId: 'wikipedia:imaginary-invalid-argan-doctors', title: 'The Imaginary Invalid', url: 'https://en.wikipedia.org/wiki/The_Imaginary_Invalid', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-038:servant-two-masters-truffaldino', factKey: 'literature-language:servant-two-masters-truffaldino-double-service', tier: 5, subjectKey: 'work:servant-of-two-masters',
        clue: { en: 'Which Carlo Goldoni comedy follows the hungry servant Truffaldino as he secretly works for two masters and scrambles to keep their letters and meals apart?', et: 'Millises Carlo Goldoni komöödias teenib näljane Truffaldino salaja kaht isandat ning püüab nende kirju ja eineid mitte segamini ajada?' }, response: { en: 'The Servant of Two Masters', et: '„Kahe isanda teener“' }, acceptedVariants: { en: ['A Servant of Two Masters', 'Servant of Two Masters', 'Kahe isanda teener'], et: ['„The Servant of Two Masters“', '„A Servant of Two Masters“'] },
        explanation: { en: 'Truffaldino’s attempt to double his wages and food multiplies disguises, crossed messages, and physical comedy.', et: 'Truffaldino soov kahekordistada palka ja toitu tekitab aina uusi maskeeringuid, valesse kohta jõudvaid sõnumeid ja füüsilist koomikat.' },
        source: { sourceId: 'wikipedia:servant-two-masters-truffaldino', title: 'The Servant of Two Masters', url: 'https://en.wikipedia.org/wiki/The_Servant_of_Two_Masters', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-039', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'medium',
    name: { en: 'Journeys That Became Bestsellers', et: 'Menukiteks saanud rännakud' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-039:into-wild-mccandless-alaska', factKey: 'literature-language:into-wild-krakauer-mccandless-alaska', tier: 1, subjectKey: 'work:into-the-wild-book',
        clue: { en: 'Which Jon Krakauer book reconstructs Christopher McCandless’s decision to leave conventional life and travel into the Alaskan wilderness?', et: 'Milline Jon Krakaueri raamat taastab Christopher McCandlessi otsuse hüljata tavapärane elu ja rännata Alaska metsikusse loodusse?' }, response: { en: 'Into the Wild', et: '„Into the Wild“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Krakauer follows McCandless’s route and the ideals behind it while investigating how the journey ended in an abandoned bus.', et: 'Krakauer jälgib McCandlessi teekonda ja selle ideaale ning uurib, kuidas rännak mahajäetud bussis lõppes.' },
        source: { sourceId: 'wikipedia:into-wild-mccandless-alaska', title: 'Into the Wild (book)', url: 'https://en.wikipedia.org/wiki/Into_the_Wild_(book)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-039:wild-strayed-pacific-crest', factKey: 'literature-language:wild-strayed-pacific-crest-trail', tier: 2, subjectKey: 'work:wild-strayed-memoir',
        clue: { en: 'Which Cheryl Strayed memoir follows her solo hike along the Pacific Crest Trail as she tries to rebuild her life after her mother’s death?', et: 'Milline Cheryl Strayedi mälestusteraamat jälgib tema üksinda läbitud Pacific Crest Traili matka, millega ta püüab pärast ema surma oma elu uuesti üles ehitada?' }, response: { en: 'Wild', et: '„Metsik“' }, acceptedVariants: { en: ['Wild: From Lost to Found on the Pacific Crest Trail', 'Metsik'], et: ['„Wild“', '„Wild: From Lost to Found on the Pacific Crest Trail“'] },
        explanation: { en: 'Strayed begins with little long-distance hiking experience, and the difficult trail becomes a structure for grief and recovery.', et: 'Strayed alustab vähese pikamaamatka kogemusega ning raskest rajast saab leina ja taastumise kandekonstruktsioon.' },
        source: { sourceId: 'wikipedia:wild-strayed-pacific-crest', title: 'Wild: From Lost to Found on the Pacific Crest Trail', url: 'https://en.wikipedia.org/wiki/Wild:_From_Lost_to_Found_on_the_Pacific_Crest_Trail', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-039:walk-woods-appalachian-trail', factKey: 'literature-language:walk-woods-bryson-katz-appalachian-trail', tier: 3, subjectKey: 'work:a-walk-in-the-woods',
        clue: { en: 'Which Bill Bryson book pairs him with his old friend Stephen Katz for an attempt to hike the Appalachian Trail?', et: 'Millises Bill Brysoni raamatus asub ta koos vana sõbra Stephen Katziga Appalachi matkarada läbima?' }, response: { en: 'A Walk in the Woods', et: '„A Walk in the Woods“' }, acceptedVariants: { en: ['Walk in the Woods'], et: ['„Walk in the Woods“'] },
        explanation: { en: 'Bryson mixes the mismatched pair’s mishaps with natural history and criticism of how the long trail is managed.', et: 'Bryson ühendab ebasobiva matkapaari äpardused loodusloo ning pika raja haldamise kriitikaga.' },
        source: { sourceId: 'wikipedia:walk-woods-appalachian-trail', title: 'A Walk in the Woods (book)', url: 'https://en.wikipedia.org/wiki/A_Walk_in_the_Woods_(book)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-039:motorcycle-diaries-south-america', factKey: 'literature-language:motorcycle-diaries-guevara-granado-south-america', tier: 4, subjectKey: 'work:the-motorcycle-diaries-book',
        clue: { en: 'Which travel book grew from the South American journey made by the young Ernesto Guevara and Alberto Granado, initially on a motorcycle called La Poderosa?', et: 'Milline reisiraamat kasvas välja noore Ernesto Guevara ja Alberto Granado Lõuna-Ameerika teekonnast, mis algas La Poderosa nimelise mootorrattaga?' }, response: { en: 'The Motorcycle Diaries', et: '„Mootorrattapäevikud“' }, acceptedVariants: { en: ['Motorcycle Diaries', 'Mootorrattapäevikud'], et: ['„The Motorcycle Diaries“'] },
        explanation: { en: 'Guevara’s notes combine youthful adventure with encounters that sharpened his awareness of poverty and inequality.', et: 'Guevara märkmed ühendavad noorusliku seikluse kohtumistega, mis teravdasid tema teadlikkust vaesusest ja ebavõrdsusest.' },
        source: { sourceId: 'wikipedia:motorcycle-diaries-south-america', title: 'The Motorcycle Diaries (book)', url: 'https://en.wikipedia.org/wiki/The_Motorcycle_Diaries_(book)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-039:travels-charley-rocinante', factKey: 'literature-language:travels-charley-steinbeck-road-trip', tier: 5, subjectKey: 'work:travels-with-charley',
        clue: { en: 'Which John Steinbeck book recounts a road trip around the United States with his poodle in a camper named Rocinante?', et: 'Milline John Steinbecki raamat jutustab autoreisist läbi Ameerika Ühendriikide koos puudliga matkaautos nimega Rocinante?' }, response: { en: 'Travels with Charley', et: '„Teekond Charleyga“' }, acceptedVariants: { en: ['Travels with Charley: In Search of America', 'Teekond Charleyga'], et: ['„Travels with Charley“', '„Travels with Charley: In Search of America“'] },
        explanation: { en: 'Steinbeck presents the journey as a renewed encounter with his country, with Charley serving as companion and social bridge.', et: 'Steinbeck kujutab teekonda uue kohtumisena oma kodumaaga, Charley on talle nii kaaslane kui ka sild teiste inimesteni.' },
        source: { sourceId: 'wikipedia:travels-charley-rocinante', title: 'Travels with Charley', url: 'https://en.wikipedia.org/wiki/Travels_with_Charley', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-040', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'medium',
    name: { en: 'Novels Check In to a Hotel', et: 'Romaanid registreeruvad hotelli' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-040:maid-molly-regency-grand', factKey: 'literature-language:maid-molly-gray-hotel-murder', tier: 1, subjectKey: 'work:the-maid-novel',
        clue: { en: 'Which Nita Prose novel follows meticulous Molly Gray after she finds a wealthy guest dead in his room at the Regency Grand Hotel?', et: 'Millises Nita Prose’i romaanis leiab piinlikult korralik Molly Gray Regency Grandi hotellitoast jõuka külalise surnukeha?' }, response: { en: 'The Maid', et: '„Toateenija“' }, acceptedVariants: { en: ['Toateenija'], et: ['„The Maid“'] },
        explanation: { en: 'Molly’s difficulty reading social cues makes her both a suspect and an unusually observant investigator.', et: 'Mollyl on raske sotsiaalseid vihjeid mõista, mistõttu saab temast korraga nii kahtlusalune kui ka erakordselt tähelepanelik uurija.' },
        source: { sourceId: 'wikipedia:maid-molly-regency-grand', title: 'The Maid (novel)', url: 'https://en.wikipedia.org/wiki/The_Maid_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-040:gentleman-moscow-metropol', factKey: 'literature-language:gentleman-moscow-rostov-metropol-house-arrest', tier: 2, subjectKey: 'work:a-gentleman-in-moscow',
        clue: { en: 'Which Amor Towles novel sentences Count Alexander Rostov to lifelong house arrest inside Moscow’s Hotel Metropol?', et: 'Millises Amor Towlesi romaanis määratakse krahv Aleksandr Rostov eluaegse koduaresti Moskva hotellis Metropol?' }, response: { en: 'A Gentleman in Moscow', et: '„Härrasmees Moskvas“' }, acceptedVariants: { en: ['Gentleman in Moscow', 'Härrasmees Moskvas'], et: ['„A Gentleman in Moscow“'] },
        explanation: { en: 'Confined to the hotel after the Russian Revolution, Rostov builds a rich life through its staff, guests, and hidden corners.', et: 'Pärast Vene revolutsiooni hotelli suletud Rostov loob selle töötajate, külaliste ja peidetud paikade kaudu sisuka elu.' },
        source: { sourceId: 'wikipedia:gentleman-moscow-metropol', title: 'A Gentleman in Moscow', url: 'https://en.wikipedia.org/wiki/A_Gentleman_in_Moscow', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-040:hotel-du-lac-edith-hope', factKey: 'literature-language:hotel-du-lac-edith-hope-swiss-exile', tier: 3, subjectKey: 'work:hotel-du-lac',
        clue: { en: 'Which Anita Brookner novel sends romance writer Edith Hope to a quiet Swiss hotel after her friends decide she needs time away from London?', et: 'Millises Anita Brookneri romaanis saadavad sõbrad armastusromaanide autori Edith Hope’i vaiksesse Šveitsi hotelli Londonist eemal järele mõtlema?' }, response: { en: 'Hotel du Lac', et: '„Hotel du Lac“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Edith observes the other guests while deciding whether to accept a respectable but loveless future.', et: 'Edith jälgib teisi külalisi ja otsustab, kas leppida korraliku, ent armastuseta tulevikuga.' },
        source: { sourceId: 'wikipedia:hotel-du-lac-edith-hope', title: 'Hotel du Lac', url: 'https://en.wikipedia.org/wiki/Hotel_du_Lac', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-040:grand-hotel-berlin-guests', factKey: 'literature-language:grand-hotel-vicki-baum-berlin-guests', tier: 4, subjectKey: 'work:grand-hotel-novel',
        clue: { en: 'Which Vicki Baum novel brings a fading ballerina, a charming thief, and other strangers together beneath the same luxurious Berlin roof?', et: 'Millises Vicki Baumi romaanis satuvad hääbuv baleriin, sarmikas varas ja teised võõrad sama luksusliku Berliini katuse alla?' }, response: { en: 'Grand Hotel', et: '„Grand Hotel“' }, acceptedVariants: { en: ['Menschen im Hotel'], et: ['„Menschen im Hotel“'] },
        explanation: { en: 'The hotel’s revolving population lets Baum cross several lives in a portrait of Weimar-era Berlin.', et: 'Hotelli vahelduv külaliskond võimaldab Baumil põimida mitu elukäiku Weimari-aegse Berliini portreeks.' },
        source: { sourceId: 'wikipedia:grand-hotel-berlin-guests', title: 'Grand Hotel (novel)', url: 'https://en.wikipedia.org/wiki/Grand_Hotel_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-040:hotel-new-hampshire-berry-family', factKey: 'literature-language:hotel-new-hampshire-berry-family-hotels', tier: 5, subjectKey: 'work:the-hotel-new-hampshire',
        clue: { en: 'Which John Irving novel follows the eccentric Berry family as they run hotels in New England and Vienna?', et: 'Milline John Irvingi romaan jälgib ekstsentrilist Berryde perekonda, kes peab hotelle Uus-Inglismaal ja Viinis?' }, response: { en: 'The Hotel New Hampshire', et: '„Hotell New Hampshire“' }, acceptedVariants: { en: ['Hotel New Hampshire', 'Hotell New Hampshire'], et: ['„The Hotel New Hampshire“'] },
        explanation: { en: 'The family repeatedly rebuilds its idea of home amid accidents, loss, theatrical schemes, and improbable hotel ventures.', et: 'Perekond ehitab õnnetuste, kaotuste, teatriplaanide ja ebatõenäoliste hotelliettevõtmiste keskel ikka uuesti üles oma kodutunnet.' },
        source: { sourceId: 'wikipedia:hotel-new-hampshire-berry-family', title: 'The Hotel New Hampshire', url: 'https://en.wikipedia.org/wiki/The_Hotel_New_Hampshire', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-041', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'medium',
    name: { en: 'A Whole Novel in One Day', et: 'Terve romaan ühe päevaga' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-041:mrs-dalloway-party-septimus', factKey: 'literature-language:mrs-dalloway-london-day-party-septimus', tier: 1, subjectKey: 'work:mrs-dalloway',
        clue: { en: 'Which Virginia Woolf novel follows Clarissa preparing a London party while the shell-shocked Septimus struggles elsewhere in the city on the same day?', et: 'Milline Virginia Woolfi romaan jälgib Clarissat Londonis peoks valmistumas, samal ajal kui sõjatraumaga Septimus peab mujal linnas oma võitlust?' }, response: { en: 'Mrs Dalloway', et: '„Proua Dalloway“' }, acceptedVariants: { en: ['Proua Dalloway'], et: ['„Mrs Dalloway“'] },
        explanation: { en: 'The novel moves through memories and private thoughts while Big Ben’s chimes mark the passing of a single June day.', et: 'Romaan liigub mälestustes ja sisemõtetes, samal ajal kui Big Beni kellalöögid märgivad ühe juunipäeva kulgu.' },
        source: { sourceId: 'wikipedia:mrs-dalloway-party-septimus', title: 'Mrs Dalloway', url: 'https://en.wikipedia.org/wiki/Mrs_Dalloway', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-041:hours-three-women-dalloway', factKey: 'literature-language:hours-three-women-mrs-dalloway-days', tier: 2, subjectKey: 'work:the-hours-novel',
        clue: { en: 'Which Michael Cunningham novel links one day in the lives of Virginia Woolf, Laura Brown, and Clarissa Vaughan through Mrs Dalloway?', et: 'Milline Michael Cunninghami romaan seob „Proua Dalloway“ kaudu ühe päeva Virginia Woolfi, Laura Browni ja Clarissa Vaughani elus?' }, response: { en: 'The Hours', et: '„Tunnid“' }, acceptedVariants: { en: ['Tunnid'], et: ['„The Hours“'] },
        explanation: { en: 'The three narratives echo one another across different decades through reading, writing, and living Woolf’s novel.', et: 'Kolm eri kümnenditel kulgevat lugu kajavad üksteises vastu Woolfi romaani kirjutamise, lugemise ja läbielamise kaudu.' },
        source: { sourceId: 'wikipedia:hours-three-women-dalloway', title: 'The Hours (novel)', url: 'https://en.wikipedia.org/wiki/The_Hours_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-041:ivan-denisovich-camp-day', factKey: 'literature-language:ivan-denisovich-single-day-gulag', tier: 3, subjectKey: 'work:one-day-ivan-denisovich',
        clue: { en: 'Which Aleksandr Solzhenitsyn novel records prisoner Shukhov’s routine from reveille to lights-out in a Soviet labour camp?', et: 'Milline Aleksandr Solženitsõni romaan jäädvustab vang Šuhhovi argipäeva äratusest öörahuni Nõukogude töölaagris?' }, response: { en: 'One Day in the Life of Ivan Denisovich', et: '„Üks päev Ivan Denissovitši elus“' }, acceptedVariants: { en: ['One Day in Ivan Denisovich’s Life', 'Üks päev Ivan Denissovitši elus'], et: ['„One Day in the Life of Ivan Denisovich“'] },
        explanation: { en: 'Small victories over cold, hunger, and camp rules make one ordinary day reveal the wider Gulag system.', et: 'Väikesed võidud külma, nälja ja laagri korra üle lasevad ühel tavalisel päeval avada kogu Gulagi süsteemi.' },
        source: { sourceId: 'wikipedia:ivan-denisovich-camp-day', title: 'One Day in the Life of Ivan Denisovich', url: 'https://en.wikipedia.org/wiki/One_Day_in_the_Life_of_Ivan_Denisovich', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-041:saturday-perowne-london', factKey: 'literature-language:saturday-perowne-london-protest-day', tier: 4, subjectKey: 'work:saturday-mcewan',
        clue: { en: 'Which Ian McEwan novel follows neurosurgeon Henry Perowne through a London day shaped by an anti-war march and a threatening encounter?', et: 'Milline Ian McEwani romaan jälgib neurokirurg Henry Perowne’i läbi Londoni päeva, mida kujundavad sõjavastane meeleavaldus ja ähvardav kohtumine?' }, response: { en: 'Saturday', et: '„Laupäev“' }, acceptedVariants: { en: ['Laupäev'], et: ['„Saturday“'] },
        explanation: { en: 'A minor traffic confrontation intrudes on Perowne’s privileged family life and returns with dangerous consequences that evening.', et: 'Väike liiklustüli tungib Perowne’i privilegeeritud pereellu ning naaseb õhtul ohtlike tagajärgedega.' },
        source: { sourceId: 'wikipedia:saturday-perowne-london', title: 'Saturday (novel)', url: 'https://en.wikipedia.org/wiki/Saturday_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-041:under-volcano-consul-day-dead', factKey: 'literature-language:under-volcano-consul-cuervanaca-day-dead', tier: 5, subjectKey: 'work:under-the-volcano',
        clue: { en: 'Which Malcolm Lowry novel follows the alcoholic former consul Geoffrey Firmin through the Day of the Dead in the Mexican town of Quauhnahuac?', et: 'Milline Malcolm Lowry romaan jälgib alkoholisõltlasest endist konsulit Geoffrey Firminit surnutepäeval Mehhiko linnas Quauhnahuacis?' }, response: { en: 'Under the Volcano', et: '„Vulkaani all“' }, acceptedVariants: { en: ['Vulkaani all'], et: ['„Under the Volcano“'] },
        explanation: { en: 'Firmin’s estranged wife returns hoping for reconciliation, but his self-destruction carries the day toward tragedy.', et: 'Firmini võõrdunud abikaasa naaseb leppimise lootuses, kuid mehe enesehävitus viib päeva tragöödia poole.' },
        source: { sourceId: 'wikipedia:under-volcano-consul-day-dead', title: 'Under the Volcano', url: 'https://en.wikipedia.org/wiki/Under_the_Volcano', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-042', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'medium',
    name: { en: 'Letters Carry the Whole Story', et: 'Kirjad kannavad kogu lugu' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-042:perks-charlie-letters', factKey: 'literature-language:perks-wallflower-charlie-anonymous-letters', tier: 1, subjectKey: 'work:perks-being-wallflower',
        clue: { en: 'Which Stephen Chbosky novel has Charlie address anonymous letters to a “friend” as he starts high school and finds a new circle?', et: 'Millises Stephen Chbosky romaanis saadab Charlie keskkooli alustades anonüümseid kirju „sõbrale“ ja leiab uue seltskonna?' }, response: { en: 'The Perks of Being a Wallflower', et: '„Müürililleks olemise iseärasused“' }, acceptedVariants: { en: ['Perks of Being a Wallflower', 'Müürililleks olemise iseärasused'], et: ['„The Perks of Being a Wallflower“'] },
        explanation: { en: 'Charlie’s dated letters reveal friendship, first love, trauma, and his gradual move from observing life to participating in it.', et: 'Charlie dateeritud kirjad avavad sõpruse, esimese armastuse ja trauma ning tema aeglase liikumise elu vaatlemisest selles osalemiseni.' },
        source: { sourceId: 'wikipedia:perks-charlie-letters', title: 'The Perks of Being a Wallflower', url: 'https://en.wikipedia.org/wiki/The_Perks_of_Being_a_Wallflower', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-042:84-charing-cross-hanff-doel', factKey: 'literature-language:84-charing-cross-hanff-doel-correspondence', tier: 2, subjectKey: 'work:84-charing-cross-road',
        clue: { en: 'Which Helene Hanff book grew from her transatlantic correspondence with bookseller Frank Doel at Marks & Co. in London?', et: 'Milline Helene Hanffi raamat kasvas välja tema Atlandi-ülesest kirjavahetusest Londoni Marks & Co. raamatukaupmehe Frank Doeliga?' }, response: { en: '84, Charing Cross Road', et: '„84, Charing Cross Road“' }, acceptedVariants: { en: ['84 Charing Cross Road'], et: ['„84 Charing Cross Road“'] },
        explanation: { en: 'Requests for rare books develop into a warm friendship between Hanff, the shop staff, and their families.', et: 'Haruldaste raamatute tellimustest kasvab soe sõprus Hanffi, poe töötajate ja nende perekondade vahel.' },
        source: { sourceId: 'wikipedia:84-charing-cross-hanff-doel', title: '84, Charing Cross Road', url: 'https://en.wikipedia.org/wiki/84,_Charing_Cross_Road', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-042:guernsey-society-letters', factKey: 'literature-language:guernsey-society-juliet-islanders-letters', tier: 3, subjectKey: 'work:guernsey-literary-potato-peel',
        clue: { en: 'Which novel begins when writer Juliet Ashton receives a letter from a Guernsey islander who found her name inside a used book?', et: 'Milline romaan algab sellega, et kirjanik Juliet Ashton saab kirja Guernsey saare elanikult, kes leidis kasutatud raamatust tema nime?' }, response: { en: 'The Guernsey Literary and Potato Peel Pie Society', et: '„Guernsey kirjandus- ja kartulikoorepiruka selts“' }, acceptedVariants: { en: ['Guernsey Literary and Potato Peel Pie Society', 'Guernsey kirjandus- ja kartulikoorepiruka selts'], et: ['„The Guernsey Literary and Potato Peel Pie Society“'] },
        explanation: { en: 'Letters introduce Juliet to a book club invented as an alibi during the German occupation of the island.', et: 'Kirjad tutvustavad Julietile raamatuklubi, mis mõeldi välja alibina saare Saksa okupatsiooni ajal.' },
        source: { sourceId: 'wikipedia:guernsey-society-letters', title: 'The Guernsey Literary and Potato Peel Pie Society', url: 'https://en.wikipedia.org/wiki/The_Guernsey_Literary_and_Potato_Peel_Pie_Society', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-042:screwtape-wormwood-letters', factKey: 'literature-language:screwtape-senior-demon-wormwood-letters', tier: 4, subjectKey: 'work:the-screwtape-letters',
        clue: { en: 'Which C. S. Lewis book consists of a senior demon’s advice to his nephew Wormwood on tempting a human called the Patient?', et: 'Milline C. S. Lewise raamat koosneb vanema deemoni nõuannetest vennapoeg Koirohile, kuidas kiusata Patsienti-nimelist inimest?' }, response: { en: 'The Screwtape Letters', et: '„Pahareti kirjapaun“' }, acceptedVariants: { en: ['Screwtape Letters', 'Pahareti kirjapaun'], et: ['„The Screwtape Letters“'] },
        explanation: { en: 'The inverted correspondence satirizes ordinary vanity, distraction, and self-deception from the tempters’ viewpoint.', et: 'Pööratud vaatenurgaga kirjavahetus pilab kiusajate pilgu läbi igapäevast edevust, hajameelsust ja enesepettust.' },
        source: { sourceId: 'wikipedia:screwtape-wormwood-letters', title: 'The Screwtape Letters', url: 'https://en.wikipedia.org/wiki/The_Screwtape_Letters', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-042:daddy-long-legs-judy-letters', factKey: 'literature-language:daddy-long-legs-judy-benefactor-letters', tier: 5, subjectKey: 'work:daddy-long-legs-novel',
        clue: { en: 'Which Jean Webster novel has orphan Judy Abbott write monthly letters to the anonymous benefactor who pays for her college education?', et: 'Millises Jean Websteri romaanis kirjutab orb Judy Abbott iga kuu kirju anonüümsele heategijale, kes maksab tema kolledžiõpingute eest?' }, response: { en: 'Daddy-Long-Legs', et: '„Pikkjalg-isa“' }, acceptedVariants: { en: ['Daddy Long-Legs', 'Pikkjalg-isa'], et: ['„Daddy-Long-Legs“', '„Daddy Long-Legs“', '„Pikakoivaline isa“'] },
        explanation: { en: 'Judy gives the unseen trustee a nickname from his elongated shadow, and her letters trace her growing independence.', et: 'Judy annab nägemata usaldusisikule tema pika varju järgi hüüdnime ning kirjad jälgivad neiu kasvavat iseseisvust.' },
        source: { sourceId: 'wikipedia:daddy-long-legs-judy-letters', title: 'Daddy-Long-Legs (novel)', url: 'https://en.wikipedia.org/wiki/Daddy-Long-Legs_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-043', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'medium',
    name: { en: 'Houses That Keep a Secret', et: 'Majad, mis varjavad saladust' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-043:rebecca-manderley-first-wife', factKey: 'literature-language:rebecca-manderley-unnamed-narrator-first-wife', tier: 1, subjectKey: 'work:rebecca-novel',
        clue: { en: 'Which Daphne du Maurier novel brings an unnamed young bride to Manderley, where the memory of Maxim’s first wife dominates the house?', et: 'Millises Daphne du Maurier’ romaanis saabub nimetu noor pruut Manderleysse, kus kogu maja valitseb Maximi esimese naise mälestus?' }, response: { en: 'Rebecca', et: '„Rebecca“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Housekeeper Mrs Danvers preserves Rebecca’s presence until the secrets of her death overturn the narrator’s marriage.', et: 'Majapidajanna proua Danvers hoiab Rebecca kohalolu elavana, kuni tema surma saladused jutustaja abielu pea peale pööravad.' },
        source: { sourceId: 'wikipedia:rebecca-manderley-first-wife', title: 'Rebecca (novel)', url: 'https://en.wikipedia.org/wiki/Rebecca_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-043:hill-house-eleanor-montague', factKey: 'literature-language:hill-house-eleanor-montague-supernatural-study', tier: 2, subjectKey: 'work:haunting-hill-house',
        clue: { en: 'Which Shirley Jackson novel has Dr Montague invite Eleanor and others to a mansion with a history of violent deaths to study possible supernatural activity?', et: 'Millises Shirley Jacksoni romaanis kutsub doktor Montague Eleanori ja teised vägivaldsete surmade ajalooga häärberisse võimalikku üleloomulikku tegevust uurima?' }, response: { en: 'The Haunting of Hill House', et: '„Hill House’i kummitus“' }, acceptedVariants: { en: ['Haunting of Hill House', 'Hill House’i kummitus'], et: ['„The Haunting of Hill House“'] },
        explanation: { en: 'The house’s strange architecture and ambiguous phenomena become inseparable from Eleanor’s growing sense that she belongs there.', et: 'Maja kummaline arhitektuur ja ebamäärased nähtused põimuvad Eleanori kasvava tundega, et just sinna ta kuulubki.' },
        source: { sourceId: 'wikipedia:hill-house-eleanor-montague', title: 'The Haunting of Hill House', url: 'https://en.wikipedia.org/wiki/The_Haunting_of_Hill_House', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-043:turn-screw-bly-governess', factKey: 'literature-language:turn-screw-governess-bly-apparitions', tier: 3, subjectKey: 'work:the-turn-of-the-screw',
        clue: { en: 'Which Henry James novella sends an inexperienced governess to Bly, where she believes the children are threatened by the apparitions of former servants?', et: 'Millises Henry Jamesi lühiromaanis läheb kogenematu guvernant Bly mõisa ja usub, et endiste teenijate vaimud ohustavad lapsi?' }, response: { en: 'The Turn of the Screw', et: '„Kruvi keere“' }, acceptedVariants: { en: ['Turn of the Screw', 'Kruvi keere'], et: ['„The Turn of the Screw“'] },
        explanation: { en: 'James leaves readers unsure whether Bly is haunted or the governess has catastrophically misread what she sees.', et: 'James jätab lahtiseks, kas Blyd kummitatakse või tõlgendab guvernant nähtut hukatuslikult valesti.' },
        source: { sourceId: 'wikipedia:turn-screw-bly-governess', title: 'The Turn of the Screw', url: 'https://en.wikipedia.org/wiki/The_Turn_of_the_Screw', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-043:seven-gables-pyncheon-curse', factKey: 'literature-language:seven-gables-pyncheon-house-curse', tier: 4, subjectKey: 'work:house-seven-gables',
        clue: { en: 'Which Nathaniel Hawthorne novel places the Pyncheon family in an old New England mansion burdened by a curse and a disputed inheritance?', et: 'Millises Nathaniel Hawthorne’i romaanis elab Pyncheonide perekond vanas Uus-Inglismaa häärberis, mida painavad needus ja vaidlusalune pärandus?' }, response: { en: 'The House of the Seven Gables', et: '„Seitsmeviilumaja“' }, acceptedVariants: { en: ['House of the Seven Gables', 'Seitsmeviilumaja'], et: ['„The House of the Seven Gables“', '„House of the Seven Gables“'] },
        explanation: { en: 'The decaying house embodies the damage caused by ancestral greed until a new generation can leave it behind.', et: 'Lagunev maja kehastab esivanemate ahnuse tekitatud kahju, kuni uus põlvkond saab selle seljataha jätta.' },
        source: { sourceId: 'wikipedia:seven-gables-pyncheon-curse', title: 'The House of the Seven Gables', url: 'https://en.wikipedia.org/wiki/The_House_of_the_Seven_Gables', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-043:always-castle-blackwood-poisoning', factKey: 'literature-language:always-castle-merricat-constance-poisoning', tier: 5, subjectKey: 'work:we-have-always-lived-castle',
        clue: { en: 'Which Shirley Jackson novel keeps Merricat and Constance Blackwood isolated at home after arsenic in the sugar bowl killed most of their family?', et: 'Millises Shirley Jacksoni romaanis elavad Merricat ja Constance Blackwood teistest eraldatuna pärast seda, kui suhkrutoosi pandud arseen tappis suurema osa nende perest?' }, response: { en: 'We Have Always Lived in the Castle', et: '„Me oleme alati lossis elanud“' }, acceptedVariants: { en: ['Me oleme alati lossis elanud'], et: ['„We Have Always Lived in the Castle“'] },
        explanation: { en: 'The sisters’ guarded routine collapses when cousin Charles arrives seeking control of the household and its money.', et: 'Õdede kaitstud elukorraldus variseb kokku, kui nõbu Charles saabub majapidamist ja selle raha enda kontrolli alla võtma.' },
        source: { sourceId: 'wikipedia:always-castle-blackwood-poisoning', title: 'We Have Always Lived in the Castle', url: 'https://en.wikipedia.org/wiki/We_Have_Always_Lived_in_the_Castle', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-044', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'medium',
    name: { en: 'Reality Turns Magical in These Novels', et: 'Neis romaanides muutub tegelikkus maagiliseks' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-044:master-margarita-devil-moscow', factKey: 'literature-language:master-margarita-devil-soviet-moscow', tier: 1, subjectKey: 'work:master-and-margarita',
        clue: { en: 'Which Mikhail Bulgakov novel sends the Devil and his bizarre entourage into Soviet Moscow while telling the story of a persecuted writer?', et: 'Millises Mihhail Bulgakovi romaanis saabuvad Kurat ja tema veider kaaskond Nõukogude Moskvasse, samal ajal kui jutustatakse tagakiusatud kirjaniku lugu?' }, response: { en: 'The Master and Margarita', et: '„Meister ja Margarita“' }, acceptedVariants: { en: ['Master and Margarita', 'Meister ja Margarita'], et: ['„The Master and Margarita“'] },
        explanation: { en: 'Satire, romance, and a novel about Pontius Pilate cross as Woland’s supernatural visit exposes hypocrisy and fear.', et: 'Satiir, armastuslugu ja romaan Pontius Pilatusest ristuvad, kui Wolandi üleloomulik külaskäik paljastab silmakirjalikkuse ja hirmu.' },
        source: { sourceId: 'wikipedia:master-margarita-devil-moscow', title: 'The Master and Margarita', url: 'https://en.wikipedia.org/wiki/The_Master_and_Margarita', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-044:water-chocolate-tita-emotions', factKey: 'literature-language:water-chocolate-tita-food-emotions', tier: 2, subjectKey: 'work:like-water-for-chocolate',
        clue: { en: 'Which Laura Esquivel novel lets Tita’s emotions pass into the food she cooks, affecting everyone who eats it?', et: 'Millises Laura Esquiveli romaanis kanduvad Tita tunded tema valmistatud toitu ja mõjutavad kõiki sööjaid?' }, response: { en: 'Like Water for Chocolate', et: '„Nagu vesi šokolaadile“' }, acceptedVariants: { en: ['Nagu vesi šokolaadile'], et: ['„Like Water for Chocolate“'] },
        explanation: { en: 'Recipes structure the story as family tradition bars Tita from marrying Pedro and turns cooking into emotional expression.', et: 'Retseptid liigendavad lugu, milles perekonnatraditsioon keelab Tital Pedroga abielluda ja muudab kokkamise tunnete väljenduseks.' },
        source: { sourceId: 'wikipedia:water-chocolate-tita-emotions', title: 'Like Water for Chocolate (novel)', url: 'https://en.wikipedia.org/wiki/Like_Water_for_Chocolate_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-044:house-spirits-clara-trueba', factKey: 'literature-language:house-spirits-clara-trueba-family', tier: 3, subjectKey: 'work:the-house-of-the-spirits',
        clue: { en: 'Which Isabel Allende novel follows the Trueba family through political upheaval while clairvoyant Clara speaks with spirits?', et: 'Milline Isabel Allende romaan jälgib Truebade perekonda läbi poliitiliste vapustuste, samal ajal kui selgeltnägija Clara suhtleb vaimudega?' }, response: { en: 'The House of the Spirits', et: '„Vaimude maja“' }, acceptedVariants: { en: ['House of the Spirits', 'Vaimude maja'], et: ['„The House of the Spirits“'] },
        explanation: { en: 'Several generations combine private memory, supernatural events, and the violent transformation of an unnamed Latin American country.', et: 'Mitme põlvkonna loos põimuvad isiklik mälu, üleloomulikud sündmused ja nimetu Ladina-Ameerika riigi vägivaldne muutumine.' },
        source: { sourceId: 'wikipedia:house-spirits-clara-trueba', title: 'The House of the Spirits', url: 'https://en.wikipedia.org/wiki/The_House_of_the_Spirits', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-044:beloved-sethe-124-haunting', factKey: 'literature-language:beloved-sethe-124-dead-daughter-haunting', tier: 4, subjectKey: 'work:beloved-novel',
        clue: { en: 'Which Toni Morrison novel has formerly enslaved Sethe’s Cincinnati home at 124 haunted by the daughter she killed rather than let slavery reclaim?', et: 'Millises Toni Morrisoni romaanis kummitab endise orja Sethe Cincinnati maja number 124 tütar, kelle ta tappis, et orjus last tagasi ei saaks?' }, response: { en: 'Beloved', et: '„Armas“' }, acceptedVariants: { en: ['Armas'], et: ['„Beloved“'] },
        explanation: { en: 'The haunting gives physical form to memories that Sethe, Denver, and their community have struggled to face.', et: 'Kummitus annab kehalise kuju mälestustele, millega Sethe, Denver ja nende kogukond on püüdnud toime tulla.' },
        source: { sourceId: 'wikipedia:beloved-sethe-124-haunting', title: 'Beloved (novel)', url: 'https://en.wikipedia.org/wiki/Beloved_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-044:kafka-shore-tamura-nakata', factKey: 'literature-language:kafka-shore-tamura-nakata-parallel-stories', tier: 5, subjectKey: 'work:kafka-on-the-shore',
        clue: { en: 'Which Haruki Murakami novel links runaway Kafka Tamura with the elderly Nakata, who can speak to cats, in parallel journeys across Japan?', et: 'Milline Haruki Murakami romaan seob kodust põgenenud Kafka Tamura eaka Nakataga, kes oskab kassidega rääkida, nende paralleelsetel rännakutel läbi Jaapani?' }, response: { en: 'Kafka on the Shore', et: '„Kafka mererannas“' }, acceptedVariants: { en: ['Kafka mererannas'], et: ['„Kafka on the Shore“'] },
        explanation: { en: 'Dreams, prophecy, music, and opened entrances blur the boundary between the two travellers’ realities.', et: 'Unenäod, ettekuulutus, muusika ja avatud sissepääsud hägustavad kahe ränduri tegelikkuse piiri.' },
        source: { sourceId: 'wikipedia:kafka-shore-tamura-nakata', title: 'Kafka on the Shore', url: 'https://en.wikipedia.org/wiki/Kafka_on_the_Shore', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-045', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'medium',
    name: { en: 'Climbing the Social Ladder', et: 'Tõus ühiskonnaredelil' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-045:great-expectations-pip-gentleman', factKey: 'literature-language:great-expectations-pip-unknown-benefactor', tier: 1, subjectKey: 'work:great-expectations',
        clue: { en: 'Which Charles Dickens novel gives orphan Pip an unknown benefactor and the chance to become a gentleman in London?', et: 'Millises Charles Dickensi romaanis saab orb Pip tundmatult heategijalt võimaluse minna Londonisse härrasmeheks saama?' }, response: { en: 'Great Expectations', et: '„Suured lootused“' }, acceptedVariants: { en: ['Suured lootused'], et: ['„Great Expectations“'] },
        explanation: { en: 'Pip assumes Miss Havisham funded his rise, but learning the benefactor’s identity forces him to rethink loyalty and worth.', et: 'Pip arvab, et tema tõusu rahastab miss Havisham, kuid heategija isik sunnib teda lojaalsust ja inimväärtust ümber hindama.' },
        source: { sourceId: 'wikipedia:great-expectations-pip-gentleman', title: 'Great Expectations', url: 'https://en.wikipedia.org/wiki/Great_Expectations', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-045:vanity-fair-becky-sharp', factKey: 'literature-language:vanity-fair-becky-sharp-social-ascent', tier: 2, subjectKey: 'work:vanity-fair-novel',
        clue: { en: 'Which William Makepeace Thackeray novel follows clever Becky Sharp as she uses charm, marriage, and deception to enter fashionable society?', et: 'Milline William Makepeace Thackeray romaan jälgib nutikat Becky Sharpi, kes kasutab sarmikust, abielu ja pettust moeseltskonda pääsemiseks?' }, response: { en: 'Vanity Fair', et: '„Edevuse laat“' }, acceptedVariants: { en: ['Edevuse laat'], et: ['„Vanity Fair“'] },
        explanation: { en: 'Becky’s ambition crosses the Napoleonic era and contrasts with Amelia Sedley’s more conventional path.', et: 'Becky ambitsioon viib ta läbi Napoleoni ajastu ning vastandub Amelia Sedley tavapärasemale eluteele.' },
        source: { sourceId: 'wikipedia:vanity-fair-becky-sharp', title: 'Vanity Fair (novel)', url: 'https://en.wikipedia.org/wiki/Vanity_Fair_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-045:red-black-julien-sorel', factKey: 'literature-language:red-black-julien-sorel-class-ambition', tier: 3, subjectKey: 'work:the-red-and-the-black',
        clue: { en: 'Which Stendhal novel follows ambitious Julien Sorel from a provincial sawmill family into wealthy households and the church?', et: 'Milline Stendhali romaan jälgib auahnet Julien Soreli teekonda provintsi saeveskiperekonnast jõukatesse majapidamistesse ja kirikusse?' }, response: { en: 'The Red and the Black', et: '„Punane ja must“' }, acceptedVariants: { en: ['Red and the Black', 'Punane ja must'], et: ['„The Red and the Black“'] },
        explanation: { en: 'Julien’s admiration for Napoleon clashes with the limited routes to advancement in Restoration France.', et: 'Julieni imetlus Napoleoni vastu põrkub restaureeritud monarhia aegse Prantsusmaa piiratud tõusuvõimalustega.' },
        source: { sourceId: 'wikipedia:red-black-julien-sorel', title: 'The Red and the Black', url: 'https://en.wikipedia.org/wiki/The_Red_and_the_Black', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-045:bel-ami-duroy-journalism', factKey: 'literature-language:bel-ami-georges-duroy-paris-rise', tier: 4, subjectKey: 'work:bel-ami',
        clue: { en: 'Which Guy de Maupassant novel has former soldier Georges Duroy exploit journalism and influential relationships to rise through Paris society?', et: 'Millises Guy de Maupassanti romaanis kasutab endine sõdur Georges Duroy ajakirjandust ja mõjukaid suhteid, et Pariisi seltskonnas tõusta?' }, response: { en: 'Bel-Ami', et: '„Bel-Ami“' }, acceptedVariants: { en: ['Bel Ami'], et: ['„Bel Ami“'] },
        explanation: { en: 'Duroy’s nickname becomes the title of a cynical ascent powered by other people’s writing, money, and connections.', et: 'Duroy hüüdnimest saab küünilise tõusuloo pealkiri; tema edu kannavad teiste kirjutised, raha ja sidemed.' },
        source: { sourceId: 'wikipedia:bel-ami-duroy-journalism', title: 'Bel-Ami', url: 'https://en.wikipedia.org/wiki/Bel-Ami', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-045:custom-country-undine-spragg', factKey: 'literature-language:custom-country-undine-spragg-marriages', tier: 5, subjectKey: 'work:the-custom-of-the-country',
        clue: { en: 'Which Edith Wharton novel follows Undine Spragg from Midwestern new money through a series of marriages pursued for wealth and status?', et: 'Milline Edith Whartoni romaan jälgib Kesk-Lääne uusrikkast Undine Spraggi läbi mitme abielu, mida ta taotleb raha ja staatuse nimel?' }, response: { en: 'The Custom of the Country', et: '„The Custom of the Country“' }, acceptedVariants: { en: ['Custom of the Country'], et: ['„Custom of the Country“'] },
        explanation: { en: 'Undine treats American and European social worlds as markets, always discovering another luxury beyond the one she gains.', et: 'Undine kohtleb Ameerika ja Euroopa seltskondi turuna ning leiab iga saavutatud luksuse tagant alati järgmise.' },
        source: { sourceId: 'wikipedia:custom-country-undine-spragg', title: 'The Custom of the Country', url: 'https://en.wikipedia.org/wiki/The_Custom_of_the_Country', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-046', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'medium',
    name: { en: 'Nordic Detectives Open the Case', et: 'Põhjamaade uurijad avavad juhtumi' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-046:dragon-tattoo-harriet-vanger', factKey: 'literature-language:dragon-tattoo-blomkvist-salander-vanger', tier: 1, subjectKey: 'work:girl-dragon-tattoo',
        clue: { en: 'Which Stieg Larsson novel pairs journalist Mikael Blomkvist with hacker Lisbeth Salander to investigate Harriet Vanger’s disappearance?', et: 'Milline Stieg Larssoni romaan viib ajakirjanik Mikael Blomkvisti ja häkker Lisbeth Salanderi uurima Harriet Vangeri kadumist?' }, response: { en: 'The Girl with the Dragon Tattoo', et: '„Lohetätoveeringuga tüdruk“' }, acceptedVariants: { en: ['Girl with the Dragon Tattoo', 'Lohetätoveeringuga tüdruk'], et: ['„The Girl with the Dragon Tattoo“'] },
        explanation: { en: 'The cold case draws the pair into the secrets and violence hidden inside the wealthy Vanger family.', et: 'Lahendamata juhtum viib paari jõuka Vangeri perekonna varjatud saladuste ja vägivalla juurde.' },
        source: { sourceId: 'wikipedia:dragon-tattoo-harriet-vanger', title: 'The Girl with the Dragon Tattoo', url: 'https://en.wikipedia.org/wiki/The_Girl_with_the_Dragon_Tattoo', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-046:snowman-harry-hole', factKey: 'literature-language:snowman-harry-hole-serial-killer', tier: 2, subjectKey: 'work:the-snowman-nesbo',
        clue: { en: 'Which Jo Nesbø novel has Oslo detective Harry Hole pursue a serial killer whose recurring crime-scene signature is a childlike winter figure built outdoors?', et: 'Millises Jo Nesbø romaanis jälitab Oslo uurija Harry Hole sarimõrvarit, kelle korduvaks allkirjaks kuriteopaikadel on õue ehitatud lapsemeelne talvekuju?' }, response: { en: 'The Snowman', et: '„Lumememm“' }, acceptedVariants: { en: ['Snowman', 'Lumememm'], et: ['„The Snowman“'] },
        explanation: { en: 'Missing women and the recurring winter figure lead Hole toward a pattern concealed across years.', et: 'Kadunud naised ja korduv talvine kuju juhivad Hole’i aastate taha peidetud mustrini.' },
        source: { sourceId: 'wikipedia:snowman-harry-hole', title: 'The Snowman (Nesbø novel)', url: 'https://en.wikipedia.org/wiki/The_Snowman_(Nesb%C3%B8_novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-046:jar-city-erlendur-genetics', factKey: 'literature-language:jar-city-erlendur-murder-genetic-disease', tier: 3, subjectKey: 'work:jar-city-novel',
        clue: { en: 'Which Arnaldur Indriðason novel has Reykjavík detective Erlendur connect an old man’s murder to a child’s grave and an inherited disease?', et: 'Millises Arnaldur Indriðasoni romaanis seob Reykjavíki uurija Erlendur vana mehe mõrva lapse haua ja päriliku haigusega?' }, response: { en: 'Jar City', et: '„Jar City“' }, acceptedVariants: { en: ['Tainted Blood', 'Mýrin'], et: ['„Tainted Blood“', '„Mýrin“'] },
        explanation: { en: 'The investigation uses Iceland’s close family histories to expose violence whose consequences crossed generations.', et: 'Uurimine kasutab Islandi tihedalt põimunud perekonnalugusid, et paljastada vägivald, mille tagajärjed kandusid üle põlvkondade.' },
        source: { sourceId: 'wikipedia:jar-city-erlendur-genetics', title: 'Jar City', url: 'https://en.wikipedia.org/wiki/Jar_City', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-046:faceless-killers-wallander', factKey: 'literature-language:faceless-killers-wallander-farm-couple', tier: 4, subjectKey: 'work:faceless-killers',
        clue: { en: 'Which Henning Mankell novel begins Kurt Wallander’s series with the brutal attack on an elderly farm couple and rising xenophobic tension?', et: 'Milline Henning Mankelli romaan alustab Kurt Wallanderi sarja eaka talupaariga toime pandud jõhkra rünnaku ja kasvava ksenofoobse pingega?' }, response: { en: 'Faceless Killers', et: '„Näota tapjad“' }, acceptedVariants: { en: ['Näota tapjad'], et: ['„Faceless Killers“'] },
        explanation: { en: 'A dying victim’s disputed final word turns the murder inquiry into a test of both evidence and public prejudice.', et: 'Sureva ohvri vaieldav viimane sõna muudab mõrvajuurdluse nii tõendite kui ka avalike eelarvamuste proovikiviks.' },
        source: { sourceId: 'wikipedia:faceless-killers-wallander', title: 'Faceless Killers', url: 'https://en.wikipedia.org/wiki/Faceless_Killers', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-046:keeper-lost-causes-department-q', factKey: 'literature-language:keeper-lost-causes-carl-morck-merete', tier: 5, subjectKey: 'work:keeper-of-lost-causes',
        clue: { en: 'Which Jussi Adler-Olsen novel gives Copenhagen detective Carl Mørck’s new Department Q the cold case of vanished politician Merete Lynggaard?', et: 'Millises Jussi Adler-Olseni romaanis saab Kopenhaageni uurija Carl Mørcki uus Q-osakond lahendamata juhtumiks poliitik Merete Lynggaardi kadumise?' }, response: { en: 'The Keeper of Lost Causes', et: '„Naine puuris“' }, acceptedVariants: { en: ['Keeper of Lost Causes', 'Mercy', 'Naine puuris'], et: ['„The Keeper of Lost Causes“', '„Mercy“'] },
        explanation: { en: 'Mørck and his assistant Assad reopen the disappearance and discover that Merete’s ordeal may not be over.', et: 'Mørck ja tema abiline Assad avavad kadumisloo uuesti ning avastavad, et Merete katsumus ei pruugi olla lõppenud.' },
        source: { sourceId: 'wikipedia:keeper-lost-causes-department-q', title: 'The Keeper of Lost Causes', url: 'https://en.wikipedia.org/wiki/The_Keeper_of_Lost_Causes', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-047', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'medium',
    name: { en: 'Books Board a Train', et: 'Raamatud astuvad rongile' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-047:polar-express-north-pole', factKey: 'literature-language:polar-express-boy-north-pole-bell', tier: 1, subjectKey: 'work:the-polar-express',
        clue: { en: 'Which Chris Van Allsburg picture book takes a doubting boy by magical train to the North Pole, where he asks Santa for a sleigh bell?', et: 'Millises Chris Van Allsburgi pildiraamatus sõidab kahtlev poiss võlurongiga põhjapoolusele ja palub jõuluvanalt saanikelgukella?' }, response: { en: 'The Polar Express', et: '„Polaarekspress“' }, acceptedVariants: { en: ['Polar Express', 'Polaarekspress'], et: ['„The Polar Express“'] },
        explanation: { en: 'Only those who still believe can hear the bell, making the train journey a test of wonder as well as distance.', et: 'Kellukest kuulevad vaid need, kes veel usuvad, nii et rongisõit paneb proovile nii imestamisvõime kui ka vahemaa.' },
        source: { sourceId: 'wikipedia:polar-express-north-pole', title: 'The Polar Express', url: 'https://en.wikipedia.org/wiki/The_Polar_Express', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-047:railway-children-father', factKey: 'literature-language:railway-children-family-father-disappears', tier: 2, subjectKey: 'work:the-railway-children',
        clue: { en: 'Which E. Nesbit novel moves Bobbie, Peter, and Phyllis to a cottage beside a railway after their father suddenly disappears?', et: 'Millises E. Nesbiti romaanis kolivad Bobbie, Peter ja Phyllis pärast isa ootamatut kadumist raudteeäärsesse suvilasse?' }, response: { en: 'The Railway Children', et: '„Raudteelapsed“' }, acceptedVariants: { en: ['Railway Children', 'Raudteelapsed'], et: ['„The Railway Children“'] },
        explanation: { en: 'The children befriend railway workers and passengers, perform rescues, and gradually uncover what happened to their father.', et: 'Lapsed sõbrunevad raudteelaste ja reisijatega, osalevad päästmistes ning saavad aegamisi teada, mis isaga juhtus.' },
        source: { sourceId: 'wikipedia:railway-children-father', title: 'The Railway Children', url: 'https://en.wikipedia.org/wiki/The_Railway_Children', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-047:strangers-train-exchange-murders', factKey: 'literature-language:strangers-train-bruno-guy-murder-swap', tier: 3, subjectKey: 'work:strangers-on-a-train-novel',
        clue: { en: 'Which Patricia Highsmith novel begins when Bruno proposes to architect Guy that two strangers exchange murders and remove each other’s motive?', et: 'Milline Patricia Highsmithi romaan algab sellega, et Bruno teeb arhitekt Guyle ettepaneku vahetada mõrvad, et kummalgi poleks motiivi?' }, response: { en: 'Strangers on a Train', et: '„Võõrad rongis“' }, acceptedVariants: { en: ['Võõrad rongis'], et: ['„Strangers on a Train“'] },
        explanation: { en: 'Guy dismisses the plan, but Bruno treats the conversation as an agreement and binds their lives together.', et: 'Guy ei võta plaani tõsiselt, kuid Bruno peab vestlust kokkuleppeks ja seob nende elud omavahel.' },
        source: { sourceId: 'wikipedia:strangers-train-exchange-murders', title: 'Strangers on a Train (novel)', url: 'https://en.wikipedia.org/wiki/Strangers_on_a_Train_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-047:snowpiercer-last-train', factKey: 'literature-language:snowpiercer-graphic-novel-frozen-earth-train', tier: 4, subjectKey: 'work:le-transperceneige',
        clue: { en: 'Which French graphic novel, adapted internationally under an English title, confines the last human survivors to a class-divided train circling a frozen Earth?', et: 'Milline prantsuse graafiline romaan, mida tuntakse rahvusvaheliselt ingliskeelse pealkirja all, paigutab viimased inimesed klassideks jagatud rongi külmunud Maal?' }, response: { en: 'Snowpiercer', et: '„Lumemurdja“' }, acceptedVariants: { en: ['Le Transperceneige', 'Lumemurdja'], et: ['„Snowpiercer“', '„Le Transperceneige“'] },
        explanation: { en: 'Movement from the oppressed rear cars toward the engine turns the train into a compact model of social inequality.', et: 'Liikumine rõhutud tagavagunitest veduri poole muudab rongi ühiskondliku ebavõrdsuse tihendatud mudeliks.' },
        source: { sourceId: 'wikipedia:snowpiercer-last-train', title: 'Le Transperceneige', url: 'https://en.wikipedia.org/wiki/Le_Transperceneige', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-047:moscow-petushki-venya-train', factKey: 'literature-language:moscow-petushki-venya-suburban-train', tier: 5, subjectKey: 'work:moscow-petushki',
        clue: { en: 'Which Venedikt Erofeev work follows Venya on a suburban train from Moscow toward Petushki through philosophical digressions and elaborate drink recipes?', et: 'Milline Venedikt Jerofejevi teos jälgib Venjat linnalähirongis Moskvast Petuški poole läbi filosoofiliste kõrvalepõigete ja keerukate joogiretseptide?' }, response: { en: 'Moscow-Petushki', et: '„Moskva-Petuški“' }, acceptedVariants: { en: ['Moscow to the End of the Line', 'Moskva-Petuški'], et: ['„Moscow-Petushki“', '„Moscow to the End of the Line“'] },
        explanation: { en: 'Venya hopes to reach his partner and child, but the comic, alcohol-soaked journey bends into a dark circular ending.', et: 'Venja loodab jõuda elukaaslase ja lapseni, kuid koomiline alkoholist läbi imbunud teekond paindub süngeks ringikujuliseks lõpuks.' },
        source: { sourceId: 'wikipedia:moscow-petushki-venya-train', title: 'Moscow-Petushki', url: 'https://en.wikipedia.org/wiki/Moscow-Petushki', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-048', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'medium',
    name: { en: 'Languages Make a Comeback', et: 'Keeled teevad tagasituleku' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-048:hebrew-spoken-revival', factKey: 'literature-language:hebrew-revival-everyday-spoken-language', tier: 1, subjectKey: 'language:modern-hebrew',
        clue: { en: 'Which ancient language of Jewish scripture was revived for everyday speech and became a principal language of modern Israel?', et: 'Milline juudi pühakirja muistne keel taaselustati igapäevase kõnekeelena ja sai üheks tänapäeva Iisraeli põhikeeleks?' }, response: { en: 'Hebrew', et: 'heebrea keel' }, acceptedVariants: { en: ['Modern Hebrew'], et: ['uusheebrea keel', 'ivriit'] },
        explanation: { en: 'The modern revival expanded Hebrew for home, school, administration, and new technology after centuries of mainly liturgical and literary use.', et: 'Taaselustamise käigus laiendati sajandeid peamiselt usu- ja kirjakeelena kasutatud heebrea keelt kodu, kooli, halduse ning uue tehnika tarbeks.' },
        source: { sourceId: 'wikipedia:hebrew-spoken-revival', title: 'Revival of the Hebrew language', url: 'https://en.wikipedia.org/wiki/Revival_of_the_Hebrew_language', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-048:cornish-kernewek-revival', factKey: 'literature-language:cornish-kernewek-celtic-revival', tier: 2, subjectKey: 'language:cornish',
        clue: { en: 'Which Celtic language is again taught and spoken in Cornwall after losing its traditional community of native speakers?', et: 'Millist keldi keelt õpetatakse ja räägitakse Cornwallis taas pärast traditsioonilise emakeelse kogukonna kadumist?' }, response: { en: 'Cornish', et: 'korni keel' }, acceptedVariants: { en: ['Kernewek', 'Cornish language'], et: ['Kernewek'] },
        explanation: { en: 'Revivalists used surviving literature, dictionaries, and related Celtic languages to return Cornish to public and family life.', et: 'Taaselustajad kasutasid säilinud kirjandust, sõnaraamatuid ja sugulaskeeli, et tuua korni keel tagasi avalikku ja pereellu.' },
        source: { sourceId: 'wikipedia:cornish-kernewek-revival', title: 'Cornish language', url: 'https://en.wikipedia.org/wiki/Cornish_language', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-048:manx-isle-man-schools', factKey: 'literature-language:manx-isle-man-revival-school', tier: 3, subjectKey: 'language:manx',
        clue: { en: 'Which Gaelic language of the Isle of Man gained new speakers through recordings, community teaching, and an immersion primary school?', et: 'Milline Mani saare gaeli keel sai uusi kõnelejaid tänu helisalvestistele, kogukonnaõppele ja keelekümblusega algkoolile?' }, response: { en: 'Manx', et: 'mänksi keel' }, acceptedVariants: { en: ['Manx Gaelic', 'Gaelg'], et: ['mani keel', 'Gaelg'] },
        explanation: { en: 'Recordings of the last traditional speakers helped later learners rebuild pronunciation and pass Manx to children.', et: 'Viimaste traditsiooniliste kõnelejate salvestised aitasid hilisematel õppijatel taastada hääldust ja anda mänksi keelt lastele edasi.' },
        source: { sourceId: 'wikipedia:manx-isle-man-schools', title: 'Manx language', url: 'https://en.wikipedia.org/wiki/Manx_language', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-048:hawaiian-immersion-schools', factKey: 'literature-language:hawaiian-language-immersion-revival', tier: 4, subjectKey: 'language:hawaiian',
        clue: { en: 'Which Polynesian language of the United States’ island state rebounded through local-language preschools and immersion schools after English displaced it from most classrooms?', et: 'Milline USA saar-osariigi polüneesia keel hakkas taastuma kohalike lasteaedade ja keelekümbluskoolide kaudu pärast seda, kui inglise keel oli selle enamikust klassiruumidest välja tõrjunud?' }, response: { en: 'Hawaiian', et: 'havai keel' }, acceptedVariants: { en: ['Hawaiian language', 'ʻŌlelo Hawaiʻi'], et: ['ʻŌlelo Hawaiʻi'] },
        explanation: { en: 'Families and educators created a path from early childhood through university in Hawaiian, producing new generations of speakers.', et: 'Pered ja õpetajad lõid havaikeelse õpitee varasest lapsepõlvest ülikoolini ning kasvatasid uusi kõnelejate põlvkondi.' },
        source: { sourceId: 'wikipedia:hawaiian-immersion-schools', title: 'Hawaiian language', url: 'https://en.wikipedia.org/wiki/Hawaiian_language', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-048:wampanoag-language-reclamation', factKey: 'literature-language:wampanoag-language-reclamation-documents', tier: 5, subjectKey: 'language:wampanoag-massachusett',
        clue: { en: 'Which Indigenous language of New England was reclaimed from documents including a colonial Bible, creating new speakers after generations without native speakers?', et: 'Milline Uus-Inglismaa põlisrahva keel taastati muu hulgas koloniaalaegse piibli põhjal, nii et pärast emakeelsete kõnelejateta põlvkondi tekkisid uued kõnelejad?' }, response: { en: 'Wampanoag', et: 'vampanoagi keel' }, acceptedVariants: { en: ['Wôpanâak', 'Massachusett', 'Wampanoag language'], et: ['wampanoagi keel', 'wôpanâaki keel', 'massatšuuseti keel'] },
        explanation: { en: 'The Wôpanâak Language Reclamation Project combined community knowledge with extensive written records to restore teaching and home use.', et: 'Wôpanâaki keele taastamise projekt ühendas kogukonna teadmised mahuka kirjaliku pärandiga, et taastada keele õpetamine ja kodune kasutus.' },
        source: { sourceId: 'wikipedia:wampanoag-language-reclamation', title: 'Massachusett language', url: 'https://en.wikipedia.org/wiki/Massachusett_language', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-049', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'medium',
    name: { en: 'Migration Reshapes a Family Story', et: 'Ränne kujundab pereloo ümber' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-049:namesake-gogol-ganguly', factKey: 'literature-language:namesake-gogol-ganguly-indian-american', tier: 1, subjectKey: 'work:the-namesake',
        clue: { en: 'Which Jhumpa Lahiri novel follows Gogol Ganguli as he grows up between his Bengali parents’ traditions and life in the United States?', et: 'Milline Jhumpa Lahiri romaan jälgib Gogol Gangulit, kes kasvab bengali vanemate traditsioonide ja Ameerika Ühendriikide elu vahel?' }, response: { en: 'The Namesake', et: '„Nimekaim“' }, acceptedVariants: { en: ['Namesake', 'Nimekaim'], et: ['„The Namesake“'] },
        explanation: { en: 'Gogol’s unusual name ties family memory to his struggle over belonging, independence, and inheritance.', et: 'Gogoli ebatavaline nimi seob perekonnamälu tema võitlusega kuuluvuse, iseseisvuse ja pärandi üle.' },
        source: { sourceId: 'wikipedia:namesake-gogol-ganguly', title: 'The Namesake', url: 'https://en.wikipedia.org/wiki/The_Namesake_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-049:americanah-ifemelu-blog', factKey: 'literature-language:americanah-ifemelu-nigeria-us-blog', tier: 2, subjectKey: 'work:americanah',
        clue: { en: 'Which Chimamanda Ngozi Adichie novel follows Ifemelu from Nigeria to the United States, where she writes a successful blog about race?', et: 'Milline Chimamanda Ngozi Adichie romaan jälgib Ifemelu teekonda Nigeeriast Ameerika Ühendriikidesse, kus ta kirjutab menukat blogi rassist?' }, response: { en: 'Americanah', et: '„Americanah“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Ifemelu’s eventual return to Nigeria reframes both her American experience and her unfinished relationship with Obinze.', et: 'Ifemelu naasmine Nigeeriasse asetab uude valgusse nii tema Ameerika-kogemuse kui ka pooleli jäänud suhte Obinzega.' },
        source: { sourceId: 'wikipedia:americanah-ifemelu-blog', title: 'Americanah', url: 'https://en.wikipedia.org/wiki/Americanah', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-049:exit-west-magical-doors', factKey: 'literature-language:exit-west-saeed-nadia-magical-doors', tier: 3, subjectKey: 'work:exit-west',
        clue: { en: 'Which Mohsin Hamid novel lets Saeed and Nadia escape a city at war through mysterious doors that instantly carry refugees across borders?', et: 'Millises Mohsin Hamidi romaanis põgenevad Saeed ja Nadia sõjast haaratud linnast salapäraste uste kaudu, mis viivad pagulased hetkega üle riigipiiride?' }, response: { en: 'Exit West', et: '„Exit West“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Removing the physical journey focuses the novel on how displacement transforms love, cities, and ideas of home.', et: 'Füüsilise teekonna vahelejätmine suunab tähelepanu sellele, kuidas ümberasumine muudab armastust, linnu ja kodutunnet.' },
        source: { sourceId: 'wikipedia:exit-west-magical-doors', title: 'Exit West', url: 'https://en.wikipedia.org/wiki/Exit_West', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-049:brick-lane-nazneen-london', factKey: 'literature-language:brick-lane-nazneen-bangladesh-london', tier: 4, subjectKey: 'work:brick-lane-novel',
        clue: { en: 'Which Monica Ali novel brings Nazneen from rural Bangladesh into an arranged marriage and a new life in London’s East End?', et: 'Milline Monica Ali romaan toob Nazneeni Bangladeshi maapiirkonnast korraldatud abielu kaudu uude ellu Londoni East Endis?' }, response: { en: 'Brick Lane', et: '„Brick Lane“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Nazneen’s growing independence unfolds alongside letters from her sister Hasina and change in the surrounding community.', et: 'Nazneeni kasvav iseseisvus avaneb koos õde Hasina kirjade ja ümbritseva kogukonna muutumisega.' },
        source: { sourceId: 'wikipedia:brick-lane-nazneen-london', title: 'Brick Lane (novel)', url: 'https://en.wikipedia.org/wiki/Brick_Lane_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-049:joy-luck-mothers-daughters', factKey: 'literature-language:joy-luck-club-chinese-mothers-american-daughters', tier: 5, subjectKey: 'work:the-joy-luck-club',
        clue: { en: 'Which Amy Tan novel links four Chinese immigrant mothers in San Francisco with the American-born daughters who inherit their stories?', et: 'Milline Amy Tani romaan seob San Franciscos neli Hiinast sisserännanud ema nende Ameerikas sündinud tütardega, kes pärivad emade lood?' }, response: { en: 'The Joy Luck Club', et: '„Õnnerõõmu klubi“' }, acceptedVariants: { en: ['Joy Luck Club', 'Õnnerõõmu klubi'], et: ['„The Joy Luck Club“'] },
        explanation: { en: 'Interlocking memories reveal how war, migration, expectation, and misunderstanding shape both generations.', et: 'Põimuvad mälestused näitavad, kuidas sõda, ränne, ootused ja vääritimõistmine kujundavad mõlemat põlvkonda.' },
        source: { sourceId: 'wikipedia:joy-luck-mothers-daughters', title: 'The Joy Luck Club (novel)', url: 'https://en.wikipedia.org/wiki/The_Joy_Luck_Club_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-050', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'medium',
    name: { en: 'People Hidden Inside Everyday Words', et: 'Igapäevasõnades peituvad inimesed' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-050:boycott-charles-irish-land', factKey: 'literature-language:boycott-charles-boycott-social-isolation', tier: 1, subjectKey: 'word:boycott',
        clue: { en: 'Which verb meaning organized refusal comes from Irish tenants and neighbours socially isolating a County Mayo land agent?', et: 'Milline organiseeritud keeldumist tähendav sõna pärineb sellest, et Iiri rentnikud ja naabrid tõrjusid ühe Mayo krahvkonna maahalduri kogukonnast välja?' }, response: { en: 'boycott', et: 'boikott' }, acceptedVariants: { en: ['to boycott'], et: ['boikoteerima'] },
        explanation: { en: 'The widely reported campaign against Boycott turned his surname into an international word for collective non-cooperation.', et: 'Laialt kajastatud kampaania Boycotti vastu muutis tema perekonnanime rahvusvaheliseks sõnaks, mis tähistab ühist koostööst keeldumist.' },
        source: { sourceId: 'wikipedia:boycott-charles-irish-land', title: 'Boycott', url: 'https://en.wikipedia.org/wiki/Boycott', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-050:silhouette-etienne-profile', factKey: 'literature-language:silhouette-etienne-cheap-profile-portrait', tier: 2, subjectKey: 'word:silhouette',
        clue: { en: 'Which word for a dark outline recalls an austere French finance minister named Étienne and the fashion for inexpensive profile portraits?', et: 'Milline tumedat kontuuri tähistav sõna meenutab ranget Prantsuse rahandusministrit nimega Étienne ja odavate profiilportreede moodi?' }, response: { en: 'silhouette', et: 'siluett' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Silhouette’s name became associated with things done cheaply and then with simple cut-paper profile likenesses.', et: 'Silhouette’i nime hakati seostama odavalt tehtud asjadega ning seejärel lihtsate väljalõigatud profiilportreedega.' },
        source: { sourceId: 'wikipedia:silhouette-etienne-profile', title: 'Silhouette', url: 'https://en.wikipedia.org/wiki/Silhouette', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-050:mesmerism-animal-magnetism', factKey: 'literature-language:mesmerism-franz-mesmer-animal-magnetism', tier: 3, subjectKey: 'word:mesmerism',
        clue: { en: 'Which word for hypnotic fascination comes from Franz Mesmer, who claimed that an invisible “animal magnetism” could affect health?', et: 'Milline hüpnootilist lummust tähistav sõna pärineb Franz Mesmerilt, kes väitis, et nähtamatu „loomne magnetism“ võib tervist mõjutada?' }, response: { en: 'mesmerism', et: 'mesmerism' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Mesmer’s disputed treatments faded, but his name survived in words for trance-like influence and fascination.', et: 'Mesmeri vaidlustatud ravivõtted hääbusid, kuid tema nimi jäi elama transilaadset mõju ja lummust tähistavates sõnades.' },
        source: { sourceId: 'wikipedia:mesmerism-animal-magnetism', title: 'Franz Mesmer', url: 'https://en.wikipedia.org/wiki/Franz_Mesmer', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-050:maverick-unbranded-cattle', factKey: 'literature-language:maverick-samuel-unbranded-cattle', tier: 4, subjectKey: 'word:maverick',
        clue: { en: 'Which word for an independent-minded person comes from a Texas rancher named Samuel and the unbranded cattle associated with him?', et: 'Milline sõltumatult mõtlevat inimest tähistav sõna pärineb Texase karjakasvatajalt nimega Samuel ja temaga seostatud märgistamata veistelt?' }, response: { en: 'maverick', et: 'maverick' }, acceptedVariants: { en: ['a maverick'], et: ['maverik'] },
        explanation: { en: 'An unbranded range animal became a “maverick,” and the word later broadened to someone who refuses group discipline.', et: 'Märgistamata kariloomast sai „maverick“ ning hiljem laienes sõna inimesele, kes ei allu rühma distsipliinile.' },
        source: { sourceId: 'wikipedia:maverick-unbranded-cattle', title: 'Maverick (animal)', url: 'https://en.wikipedia.org/wiki/Maverick_(animal)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-050:cardigan-earl-crimea', factKey: 'literature-language:cardigan-earl-knitted-jacket', tier: 5, subjectKey: 'word:cardigan',
        clue: { en: 'Which knitted jacket takes its name from James Brudenell, the Earl who led the Charge of the Light Brigade in the Crimean War?', et: 'Milline kootud jakk on saanud nime James Brudenellilt, krahvilt, kes juhtis Krimmi sõjas kergeratsaväebrigaadi rünnakut?' }, response: { en: 'cardigan', et: 'kardigan' }, acceptedVariants: { en: ['a cardigan', 'cardigan sweater'], et: ['kardigan-jakk'] },
        explanation: { en: 'The garment was named after the Earl of Cardigan, though later fashion shaped the familiar open-front sweater.', et: 'Rõivaese sai nime Cardigani krahvi järgi, kuigi tuttava eest lahtise kampsuni kuju kujundas hilisem mood.' },
        source: { sourceId: 'wikipedia:cardigan-earl-crimea', title: 'Cardigan (sweater)', url: 'https://en.wikipedia.org/wiki/Cardigan_(sweater)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-018', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Novel Titles Borrowed from Earlier Writing', et: 'Varasemast kirjandusest laenatud romaanipealkirjad' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-018:of-mice-men-burns-title', factKey: 'literature-language:of-mice-men-title-from-burns-poem', tier: 1, subjectKey: 'work:of-mice-and-men',
        clue: { en: 'Which Steinbeck novella about ranch workers George and Lennie takes its title from Robert Burns’s warning that carefully made plans often fail?', et: 'Milline Steinbecki lühiromaan rantšotöölistest George’ist ja Lennie’st sai pealkirja Robert Burnsi hoiatusest, et hoolega tehtud plaanid võivad nurjuda?' }, response: { en: 'Of Mice and Men', et: '„Hiirtest ja inimestest“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Burns’s poem “To a Mouse” supplied the phrase that links fragile hopes with George and Lennie’s doomed dream.', et: 'Burnsi luuletus „To a Mouse“ andis fraasi, mis seob haprad lootused George’i ja Lennie’i nurjuva unistusega.' },
        source: { sourceId: 'wikipedia:of-mice-men-burns-title', title: 'Of Mice and Men', url: 'https://en.wikipedia.org/wiki/Of_Mice_and_Men', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-018:tender-night-keats-title', factKey: 'literature-language:tender-night-title-from-keats-ode', tier: 2, subjectKey: 'work:tender-is-the-night',
        clue: { en: 'Which Fitzgerald novel about psychiatrist Dick Diver and his wealthy wife Nicole on the French Riviera draws its title from a John Keats ode?', et: 'Milline Fitzgeraldi romaan psühhiaater Dick Diverist ja tema jõukast abikaasast Nicole’ist Prantsuse Rivieral sai pealkirja John Keatsi oodist?' }, response: { en: 'Tender Is the Night', et: '„Sume on öö“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Fitzgerald borrowed the title from “Ode to a Nightingale” for his story of glamour, illness, and a marriage coming apart.', et: 'Fitzgerald laenas pealkirja „Oodist ööbikule“ loole glamuurist, haigusest ja lagunevast abielust.' },
        source: { sourceId: 'wikipedia:tender-night-keats-title', title: 'Tender Is the Night', url: 'https://en.wikipedia.org/wiki/Tender_Is_the_Night', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-018:passage-india-whitman-title', factKey: 'literature-language:passage-india-title-from-whitman-poem', tier: 3, subjectKey: 'work:a-passage-to-india',
        clue: { en: 'Which E. M. Forster novel about Dr Aziz and the Marabar Caves takes its title from Walt Whitman’s poem celebrating new links between continents?', et: 'Milline E. M. Forsteri romaan doktor Azizist ja Marabari koobastest sai pealkirja Walt Whitmani luuletusest, mis ülistab uusi ühendusi maailmajagude vahel?' }, response: { en: 'A Passage to India', et: '„Teekond Indiasse“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Whitman’s poem connects exploration and spiritual unity; Forster turns the borrowed phrase toward the tensions of British rule.', et: 'Whitmani luuletus seob maadeavastuse vaimse ühtsusega; Forster suunab laenatud fraasi Briti võimu pingetele.' },
        source: { sourceId: 'wikipedia:passage-india-whitman-title', title: 'A Passage to India', url: 'https://en.wikipedia.org/wiki/A_Passage_to_India', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-018:bell-tolls-donne-title', factKey: 'literature-language:bell-tolls-title-from-donne-meditation', tier: 4, subjectKey: 'work:for-whom-the-bell-tolls',
        clue: { en: 'Which Hemingway novel follows American volunteer Robert Jordan during the Spanish Civil War and borrows its title from John Donne’s meditation on a funeral bell and human solidarity?', et: 'Milline Hemingway romaan jälgib Hispaania kodusõjas Ameerika vabatahtlikku Robert Jordanit ning laenab pealkirja John Donne’i mõtisklusest matusekella ja inimeste ühtekuuluvuse üle?' }, response: { en: 'For Whom the Bell Tolls', et: '„Kellele lüüakse hingekella“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Donne argues that every death diminishes all humanity, an idea Hemingway placed before his wartime story as an epigraph.', et: 'Donne väidab, et iga surm vähendab kogu inimkonda; Hemingway asetas selle mõtte sõjaromaani ette epigraafiks.' },
        source: { sourceId: 'wikipedia:bell-tolls-donne-title', title: 'For Whom the Bell Tolls', url: 'https://en.wikipedia.org/wiki/For_Whom_the_Bell_Tolls', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-018:no-country-yeats-title', factKey: 'literature-language:no-country-title-from-yeats-poem', tier: 5, subjectKey: 'work:no-country-for-old-men',
        clue: { en: 'Which Cormac McCarthy novel about Llewelyn Moss, Anton Chigurh, and a failed drug deal takes its title from the opening of Yeats’s “Sailing to Byzantium”?', et: 'Milline Cormac McCarthy romaan Llewelyn Mossist, Anton Chigurhist ja nurjunud uimastitehingust sai pealkirja Yeatsi luuletuse „Sailing to Byzantium“ algusest?' }, response: { en: 'No Country for Old Men', et: '„No Country for Old Men“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Yeats contrasts youth with aging wisdom; McCarthy uses the borrowed line for Sheriff Bell’s sense that violence has outrun him.', et: 'Yeats vastandab nooruse vanaduse tarkusele; McCarthy seob laenatud rea šerif Belli tundega, et vägivald on temast ette jõudnud.' },
        source: { sourceId: 'wikipedia:no-country-yeats-title', title: 'No Country for Old Men (novel)', url: 'https://en.wikipedia.org/wiki/No_Country_for_Old_Men_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-019', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Poems Look at Works of Art', et: 'Luuletused vaatavad kunstiteoseid' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-019:grecian-urn-keats-images', factKey: 'literature-language:grecian-urn-keats-addresses-painted-scenes', tier: 1, subjectKey: 'work:ode-on-a-grecian-urn',
        clue: { en: 'Which Keats ode addresses an ancient vessel whose frozen musicians, lovers, and sacrificial procession can never complete their actions?', et: 'Milline Keatsi ood pöördub antiikse anuma poole, mille tardunud pillimehed, armastajad ja ohvrirongkäik ei saa oma tegevust kunagi lõpule viia?' }, response: { en: 'Ode on a Grecian Urn', et: '„Ode on a Grecian Urn“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Keats reads the pictured scenes as permanently unfinished, using the silent object to test ideas of beauty, time, and truth.', et: 'Keats näeb kujutatud stseene igavesti lõpetamata ning proovib vaikiva eseme kaudu ilu, aja ja tõe ideid.' },
        source: { sourceId: 'wikipedia:grecian-urn-keats-images', title: 'Ode on a Grecian Urn', url: 'https://en.wikipedia.org/wiki/Ode_on_a_Grecian_Urn', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-019:musee-beaux-arts-icarus', factKey: 'literature-language:musee-beaux-arts-bruegel-icarus-suffering', tier: 2, subjectKey: 'work:musee-des-beaux-arts-poem',
        clue: { en: 'Which W. H. Auden poem reflects on ordinary life continuing beside suffering after the poet studied Bruegel paintings, especially the scene where Icarus falls almost unnoticed?', et: 'Milline W. H. Audeni luuletus mõtiskleb Bruegeli maalide, eriti peaaegu märkamatult langeva Ikarose stseeni põhjal selle üle, kuidas argielu kannatuse kõrval jätkub?' }, response: { en: 'Musée des Beaux Arts', et: '„Musée des Beaux Arts“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Auden contrasts catastrophe with a ploughman, a ship, and other figures who continue their routines.', et: 'Auden vastandab katastroofi kündja, laeva ja teiste tegelastega, kes jätkavad oma igapäevaseid toiminguid.' },
        source: { sourceId: 'wikipedia:musee-beaux-arts-icarus', title: 'Musée des Beaux Arts (poem)', url: 'https://en.wikipedia.org/wiki/Mus%C3%A9e_des_Beaux_Arts_(poem)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-019:blue-guitar-stevens-picasso', factKey: 'literature-language:blue-guitar-stevens-inspired-by-picasso', tier: 3, subjectKey: 'work:the-man-with-the-blue-guitar',
        clue: { en: 'Which long poem by Wallace Stevens, inspired by Picasso’s painting The Old Guitarist, has a musician debate how art transforms reality?', et: 'Milline Wallace Stevensi pikk luuletus, mille ajendiks oli Picasso maal „Vana kitarrist“, laseb muusikul arutleda selle üle, kuidas kunst tegelikkust muudab?' }, response: { en: 'The Man with the Blue Guitar', et: '„The Man with the Blue Guitar“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The guitarist’s altered instrument becomes Stevens’s image for the artist reshaping rather than merely copying the world.', et: 'Kitarristi muudetud pillist saab Stevensil kujund kunstnikule, kes maailma pelga kopeerimise asemel ümber vormib.' },
        source: { sourceId: 'wikipedia:blue-guitar-stevens-picasso', title: 'The Man with the Blue Guitar', url: 'https://en.wikipedia.org/wiki/The_Man_with_the_Blue_Guitar', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-019:convex-mirror-ashbery-parmigianino', factKey: 'literature-language:convex-mirror-ashbery-studies-parmigianino-self-portrait', tier: 4, subjectKey: 'work:self-portrait-in-a-convex-mirror-poem',
        clue: { en: 'Which John Ashbery poem studies Parmigianino’s painted reflection, with the artist’s enlarged hand curving toward the viewer?', et: 'Milline John Ashbery luuletus uurib Parmigianino maalitud peegelpilti, kus kunstniku suurendatud käsi kaardub vaataja poole?' }, response: { en: 'Self-Portrait in a Convex Mirror', et: '„Self-Portrait in a Convex Mirror“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Ashbery uses the distorted self-image to question how faithfully art, memory, and language can hold a person.', et: 'Ashbery kasutab moonutatud enesekujutist, et küsida, kui truult suudavad kunst, mälu ja keel inimest talletada.' },
        source: { sourceId: 'wikipedia:convex-mirror-ashbery-parmigianino', title: 'Self-Portrait in a Convex Mirror', url: 'https://en.wikipedia.org/wiki/Self-Portrait_in_a_Convex_Mirror_(poetry_collection)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-019:shield-achilles-auden-modern-scene', factKey: 'literature-language:shield-achilles-auden-reimagines-homeric-art', tier: 5, subjectKey: 'work:the-shield-of-achilles-poem',
        clue: { en: 'Which W. H. Auden poem has Thetis expect heroic cities on her son’s new armor, only to see Hephaestus depict a bleak modern world of camps, crowds, and executions?', et: 'Millises W. H. Audeni luuletuses ootab Thetis poja uuele turvisele kangelaslikke linnu, kuid Hephaistos kujutab hoopis sünget nüüdisaegset maailma laagrite, rahvahulkade ja hukkamistega?' }, response: { en: 'The Shield of Achilles', et: '„The Shield of Achilles“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Auden replaces the rich civic scenes on Homer’s shield with images of mass violence and indifference.', et: 'Auden asendab Homerose kilbi rikkalikud linnastseenid massivägivalla ja ükskõiksuse kujutistega.' },
        source: { sourceId: 'wikipedia:shield-achilles-auden-modern-scene', title: 'The Shield of Achilles', url: 'https://en.wikipedia.org/wiki/The_Shield_of_Achilles', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-020', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'The Harlem Renaissance on the Page', et: 'Harlemi renessanss raamatulehel' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-020:blacker-berry-emma-lou', factKey: 'literature-language:blacker-berry-emma-lou-colorism', tier: 1, subjectKey: 'work:the-blacker-the-berry-novel',
        clue: { en: 'Which Wallace Thurman novel follows dark-skinned Emma Lou Morgan from Idaho to college and Harlem as she confronts colorism?', et: 'Milline Wallace Thurmani romaan jälgib tumedanahalise Emma Lou Morgani teekonda Idahost kolledžisse ja Harlemisse, kus ta puutub kokku nahavärvipõhise eelarvamusega?' }, response: { en: 'The Blacker the Berry', et: '„The Blacker the Berry“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Published in 1929, the novel examines discrimination within Black communities as Emma Lou struggles to accept her complexion.', et: '1929. aastal ilmunud romaan uurib mustanahaliste kogukondade sisest diskrimineerimist, kui Emma Lou püüab oma nahavärviga leppida.' },
        source: { sourceId: 'wikipedia:blacker-berry-emma-lou', title: 'The Blacker the Berry (novel)', url: 'https://en.wikipedia.org/wiki/The_Blacker_the_Berry_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-020:weary-blues-hughes-collection', factKey: 'literature-language:weary-blues-hughes-first-poetry-collection', tier: 2, subjectKey: 'work:the-weary-blues',
        clue: { en: 'Which debut poetry collection by Langston Hughes shares its name with a poem about a piano player whose performance brings jazz rhythm onto the page?', et: 'Milline Langston Hughesi debüütluulekogu kannab sama nime luuletusega pianistist, kelle esitus toob džässirütmi trükilehele?' }, response: { en: 'The Weary Blues', et: '„The Weary Blues“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The title poem fuses vernacular speech, musical repetition, and the sound of a late-night performance.', et: 'Nimiluuletus ühendab rahvaliku kõne, muusikalise korduse ja hilisõhtuse esituse kõla.' },
        source: { sourceId: 'wikipedia:weary-blues-hughes-collection', title: 'The Weary Blues', url: 'https://en.wikipedia.org/wiki/The_Weary_Blues', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-020:black-no-more-procedure', factKey: 'literature-language:black-no-more-max-disher-procedure', tier: 3, subjectKey: 'work:black-no-more',
        clue: { en: 'Which George S. Schuyler satire has Max Disher undergo a procedure that makes Black skin white, after which he assumes the name Matthew Fisher?', et: 'Millises George S. Schuyleri satiiris läbib Max Disher protseduuri, mis muudab musta naha valgeks, ning võtab seejärel nimeks Matthew Fisher?' }, response: { en: 'Black No More', et: '„Black No More“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The 1931 novel uses its fantastic treatment to expose the economic and political machinery built around racial categories.', et: '1931. aasta romaan kasutab fantastilist ravivõtet, et paljastada rassikategooriate ümber ehitatud majanduslik ja poliitiline masinavärk.' },
        source: { sourceId: 'wikipedia:black-no-more-procedure', title: 'Black No More', url: 'https://en.wikipedia.org/wiki/Black_No_More', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-020:home-harlem-jake-brown', factKey: 'literature-language:home-harlem-jake-brown-returns', tier: 4, subjectKey: 'work:home-to-harlem',
        clue: { en: 'Which Claude McKay novel follows Jake Brown, a Black soldier who deserts during World War I and returns to the nightlife and working life of uptown Manhattan?', et: 'Milline Claude McKay romaan jälgib Jake Browni, mustanahalist sõdurit, kes deserteerib Esimese maailmasõja ajal ja naaseb Manhattani põhjaosa öö- ning tööellu?' }, response: { en: 'Home to Harlem', et: '„Home to Harlem“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Jake’s search for belonging moves through clubs, rail work, friendship, and romance in the neighborhood’s changing culture.', et: 'Jake’i kuuluvusotsing liigub klubide, raudteetöö, sõpruse ja armastuse kaudu muutuvas linnakultuuris.' },
        source: { sourceId: 'wikipedia:home-harlem-jake-brown', title: 'Home to Harlem', url: 'https://en.wikipedia.org/wiki/Home_to_Harlem', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-020:quicksand-helga-crane', factKey: 'literature-language:quicksand-helga-crane-identity-search', tier: 5, subjectKey: 'work:quicksand-nella-larsen',
        clue: { en: 'Which Nella Larsen novel sends mixed-race teacher Helga Crane from a Southern school to Chicago, Harlem, and Copenhagen in an elusive search for belonging?', et: 'Milline Nella Larseni romaan viib segapäritolu õpetaja Helga Crane’i lõunapoolsest koolist Chicagosse, Harlemisse ja Kopenhaagenisse raskesti tabatavat kuuluvust otsima?' }, response: { en: 'Quicksand', et: '„Quicksand“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Each new community promises Helga freedom but imposes another set of racial, social, or gender expectations.', et: 'Iga uus kogukond lubab Helgale vabadust, kuid seab talle uued rassilised, ühiskondlikud või soolised ootused.' },
        source: { sourceId: 'wikipedia:quicksand-helga-crane', title: 'Quicksand (Larsen novel)', url: 'https://en.wikipedia.org/wiki/Quicksand_(Larsen_novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-025', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Authors Who Changed Writing Languages', et: 'Kirjanikud, kes vahetasid kirjutamiskeelt' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-025:conrad-polish-to-english', factKey: 'literature-language:conrad-mastered-english-after-polish-french', tier: 1, subjectKey: 'person:joseph-conrad',
        clue: { en: 'Which Polish-born author of Heart of Darkness became an English prose master even though he did not speak the language fluently until his twenties?', et: 'Milline Poolas sündinud „Pimeduse südame“ autor sai inglise proosa meistriks, kuigi ei rääkinud seda keelt soravalt enne kahekümnendaid eluaastaid?' }, response: { en: 'Joseph Conrad', et: 'Joseph Conrad' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Born Józef Teodor Konrad Korzeniowski, he grew up with Polish and French before building his literary career in English.', et: 'Józef Teodor Konrad Korzeniowski kasvas poola ja prantsuse keelega ning kujundas hiljem oma kirjanduskarjääri inglise keeles.' },
        source: { sourceId: 'wikipedia:conrad-polish-to-english', title: 'Joseph Conrad', url: 'https://en.wikipedia.org/wiki/Joseph_Conrad', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-025:beckett-english-french', factKey: 'literature-language:beckett-wrote-and-self-translated-english-french', tier: 2, subjectKey: 'person:samuel-beckett',
        clue: { en: 'Which Irish playwright wrote major works in both English and French, composing Waiting for Godot in French before translating it himself?', et: 'Milline iiri näitekirjanik kirjutas tähtteoseid nii inglise kui ka prantsuse keeles ning lõi „Godot’d oodates“ esmalt prantsuse keeles ja tõlkis selle ise?' }, response: { en: 'Samuel Beckett', et: 'Samuel Beckett' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Working in a second language helped him pursue the spare style that became central to his drama and prose.', et: 'Teises keeles töötamine aitas tal kujundada nappi stiili, millest sai tema draama ja proosa keskne tunnus.' },
        source: { sourceId: 'wikipedia:beckett-english-french', title: 'Samuel Beckett', url: 'https://en.wikipedia.org/wiki/Samuel_Beckett', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-025:kristof-hungarian-french', factKey: 'literature-language:kristof-hungarian-writer-in-french', tier: 3, subjectKey: 'person:agota-kristof',
        clue: { en: 'Which Hungarian-born writer lived in Switzerland and wrote in French, including Le Grand Cahier, translated into English as The Notebook?', et: 'Milline Ungaris sündinud kirjanik elas Šveitsis ja kirjutas prantsuse keeles, sealhulgas teose „Le Grand Cahier“, mis ilmus inglise keeles pealkirjaga „The Notebook“?' }, response: { en: 'Ágota Kristóf', et: 'Ágota Kristóf' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'After leaving Hungary, Kristóf built a Francophone career whose first novel began The Notebook Trilogy.', et: 'Pärast Ungarist lahkumist rajas Kristóf prantsuskeelse kirjanikukarjääri, mille esimene romaan alustas „The Notebook Trilogy“ triloogiat.' },
        source: { sourceId: 'wikipedia:kristof-hungarian-french', title: 'Ágota Kristóf', url: 'https://en.wikipedia.org/wiki/%C3%81gota_Krist%C3%B3f', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-025:kundera-czech-french', factKey: 'literature-language:kundera-switched-czech-to-french-novels', tier: 4, subjectKey: 'person:milan-kundera',
        clue: { en: 'Which Czech-born author of The Unbearable Lightness of Being settled in France and later wrote novels such as Slowness directly in French?', et: 'Milline Tšehhis sündinud „Olemise talumatu kerguse“ autor asus elama Prantsusmaale ning kirjutas hiljem näiteks romaani „Slowness“ otse prantsuse keeles?' }, response: { en: 'Milan Kundera', et: 'Milan Kundera' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'His career spans Czech-language novels from before exile and a later group composed in French.', et: 'Tema looming hõlmab enne pagulust kirjutatud tšehhikeelseid romaane ning hilisemat prantsuskeelset teosterühma.' },
        source: { sourceId: 'wikipedia:kundera-czech-french', title: 'Milan Kundera', url: 'https://en.wikipedia.org/wiki/Milan_Kundera', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-025:tawada-japanese-german', factKey: 'literature-language:tawada-writes-japanese-and-german', tier: 5, subjectKey: 'person:yoko-tawada',
        clue: { en: 'Which Japanese-born author writes in both Japanese and German and created the novel translated as Memoirs of a Polar Bear?', et: 'Milline Jaapanis sündinud autor kirjutab nii jaapani kui ka saksa keeles ning lõi romaani, mis ilmus inglise keeles pealkirjaga „Memoirs of a Polar Bear“?' }, response: { en: 'Yoko Tawada', et: 'Yoko Tawada' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Tawada makes movement between Japanese and German a central part of her multilingual literary practice.', et: 'Tawada on muutnud jaapani ja saksa keele vahel liikumise oma mitmekeelse kirjanduspraktika keskseks osaks.' },
        source: { sourceId: 'wikipedia:tawada-japanese-german', title: 'Yoko Tawada', url: 'https://en.wikipedia.org/wiki/Yoko_Tawada', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-052', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Novel Titles with Biblical Roots', et: 'Piiblist võrsunud romaanipealkirjad' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-052:east-eden-genesis-title', factKey: 'literature-language:east-eden-title-cain-exile-genesis', tier: 1, subjectKey: 'work:east-of-eden',
        clue: { en: 'Which Steinbeck family saga about the Trasks and Hamiltons takes its title from the direction of Cain’s exile in Genesis?', et: 'Milline Steinbecki perekonnasaaga Traskidest ja Hamiltonidest sai pealkirja suunast, kuhu Kain Esimeses Moosese raamatus pagendati?' }, response: { en: 'East of Eden', et: '„Hommiku pool Eedenit“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The Cain and Abel story echoes through the Trask brothers, while the Hebrew word timshel frames the possibility of moral choice.', et: 'Kaini ja Aabeli lugu kajab Traski vendade loos, heebrea sõna timshel aga raamib moraalse valiku võimalust.' },
        source: { sourceId: 'wikipedia:east-eden-genesis-title', title: 'East of Eden (novel)', url: 'https://en.wikipedia.org/wiki/East_of_Eden_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-052:house-mirth-ecclesiastes-title', factKey: 'literature-language:house-mirth-title-from-ecclesiastes', tier: 2, subjectKey: 'work:the-house-of-mirth',
        clue: { en: 'Which Edith Wharton novel about Lily Bart takes its title from Ecclesiastes’ contrast between the place of mourning and the place of pleasure?', et: 'Milline Edith Whartoni romaan Lily Bartist sai pealkirja Koguja raamatu vastandusest leinapaiga ja lõbupaiga vahel?' }, response: { en: 'The House of Mirth', et: '„The House of Mirth“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The biblical contrast becomes ironic as Lily’s pursuit of security in fashionable society leads toward isolation and ruin.', et: 'Piibellik vastandus muutub irooniliseks, sest Lily turvalisuseotsing kõrgseltskonnas viib eraldatuse ja hävinguni.' },
        source: { sourceId: 'wikipedia:house-mirth-ecclesiastes-title', title: 'The House of Mirth', url: 'https://en.wikipedia.org/wiki/The_House_of_Mirth', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-052:sun-rises-ecclesiastes-title', factKey: 'literature-language:sun-rises-title-from-ecclesiastes', tier: 3, subjectKey: 'work:the-sun-also-rises',
        clue: { en: 'Which Hemingway novel follows Jake Barnes and Lady Brett Ashley from Paris to Pamplona under a title drawn from Ecclesiastes’ cycle of generations and nature?', et: 'Milline Hemingway romaan jälgib Jake Barnesi ja leedi Brett Ashleyt Pariisist Pamplonasse ning kannab Koguja raamatu põlvkondade ja looduse ringkäigust pärit pealkirja?' }, response: { en: 'The Sun Also Rises', et: '„Ja päike tõuseb“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The Ecclesiastes epigraph sets enduring natural cycles against the disoriented postwar generation in the novel.', et: 'Koguja raamatu epigraaf vastandab kestvad loodusringid romaani sõjajärgse põlvkonna sihitusele.' },
        source: { sourceId: 'wikipedia:sun-rises-ecclesiastes-title', title: 'The Sun Also Rises', url: 'https://en.wikipedia.org/wiki/The_Sun_Also_Rises', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-052:go-tell-spiritual-title', factKey: 'literature-language:go-tell-mountain-title-from-spiritual', tier: 4, subjectKey: 'work:go-tell-it-on-the-mountain',
        clue: { en: 'Which James Baldwin novel about teenager John Grimes and a Harlem storefront church takes its title from an African American spiritual about proclaiming the Nativity?', et: 'Milline James Baldwini romaan teismelisest John Grimesist ja Harlemi väikesest kirikust sai pealkirja afroameerika spirituaalist, mis kuulutab Kristuse sündi?' }, response: { en: 'Go Tell It on the Mountain', et: '„Go Tell It on the Mountain“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The spiritual’s call to testify fits a novel built around conversion, family memory, and the language of the Black church.', et: 'Spirituaali üleskutse tunnistada sobib romaaniga, mille keskmes on pöördumine, peremälu ja mustanahalise kiriku keel.' },
        source: { sourceId: 'wikipedia:go-tell-spiritual-title', title: 'Go Tell It on the Mountain (novel)', url: 'https://en.wikipedia.org/wiki/Go_Tell_It_on_the_Mountain_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-052:power-glory-prayer-title', factKey: 'literature-language:power-glory-title-from-lords-prayer-doxology', tier: 5, subjectKey: 'work:the-power-and-the-glory',
        clue: { en: 'Which Graham Greene novel about a fugitive priest in anti-clerical Mexico takes its title from the doxology traditionally added to the Lord’s Prayer?', et: 'Milline Graham Greene’i romaan kirikuvastases Mehhikos põgenevast preestrist sai pealkirja meieisapalvele tavapäraselt lisatud doksoloogiast?' }, response: { en: 'The Power and the Glory', et: '„Vägi ja au“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The prayer’s triumphant words stand in tension with the flawed priest’s fear, weakness, and stubborn sense of duty.', et: 'Palve võidukad sõnad on pinges puuduliku preestri hirmu, nõrkuse ja visa kohusetundega.' },
        source: { sourceId: 'wikipedia:power-glory-prayer-title', title: 'The Power and the Glory', url: 'https://en.wikipedia.org/wiki/The_Power_and_the_Glory', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-053', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Books That Obey a Letter Rule', et: 'Raamatud, mis järgivad tähereeglit' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-053:a-void-perec-no-e', factKey: 'literature-language:a-void-perec-lipogram-without-e', tier: 1, subjectKey: 'work:a-void',
        clue: { en: 'Which Georges Perec mystery avoids the most common letter in French throughout its original text, while its disappearance also haunts the plot?', et: 'Milline Georges Pereci mõistatusromaan väldib kogu prantsuskeelses algtekstis selle keele kõige tavalisemat tähte ning teeb puudumisest ka süžee motiivi?' }, response: { en: 'A Void', et: '„A Void“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Perec wrote the novel without the letter e; Gilbert Adair’s English translation preserves the same constraint.', et: 'Perec kirjutas romaani ilma e-täheta ning Gilbert Adairi ingliskeelne tõlge säilitab sama piirangu.' },
        source: { sourceId: 'wikipedia:a-void-perec-no-e', title: 'A Void', url: 'https://en.wikipedia.org/wiki/A_Void', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-053:gadsby-wright-no-e', factKey: 'literature-language:gadsby-wright-fifty-thousand-words-without-e', tier: 2, subjectKey: 'work:gadsby-ernest-wright',
        clue: { en: 'Which Ernest Vincent Wright novel about revitalizing the fictional city of Branton Hills runs for more than 50,000 words without using the letter e?', et: 'Milline Ernest Vincent Wrighti romaan väljamõeldud Branton Hillsi linna elavdamisest kestab üle 50 000 sõna, kasutamata kordagi e-tähte?' }, response: { en: 'Gadsby', et: '„Gadsby“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Wright reportedly disabled the typewriter key to maintain the book-length lipogram.', et: 'Väidetavalt blokeeris Wright kirjutusmasinal vastava klahvi, et romaanipikkust lipogrammi järjekindlalt hoida.' },
        source: { sourceId: 'wikipedia:gadsby-wright-no-e', title: 'Gadsby (novel)', url: 'https://en.wikipedia.org/wiki/Gadsby_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-053:ella-minnow-pea-falling-letters', factKey: 'literature-language:ella-minnow-pea-bans-fallen-statue-letters', tier: 3, subjectKey: 'work:ella-minnow-pea',
        clue: { en: 'Which Mark Dunn novel is set on Nollop, where each letter that falls from a pangram statue is banned from speech and writing?', et: 'Milline Mark Dunni romaan toimub Nollopi saarel, kus pangrammiga ausambalt langenud tähed keelatakse ükshaaval kõnes ja kirjas?' }, response: { en: 'Ella Minnow Pea', et: '„Ella Minnow Pea“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The epistolary novel visibly loses letters as its characters resist an increasingly absurd language law.', et: 'Kiriromaan kaotab nähtavalt tähti, kui tegelased hakkavad üha absurdsemale keeleseadusele vastu.' },
        source: { sourceId: 'wikipedia:ella-minnow-pea-falling-letters', title: 'Ella Minnow Pea', url: 'https://en.wikipedia.org/wiki/Ella_Minnow_Pea', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-053:eunoia-single-vowel-chapters', factKey: 'literature-language:eunoia-each-chapter-one-vowel', tier: 4, subjectKey: 'work:eunoia-christian-bok',
        clue: { en: 'Which Christian Bök poetry book gives each main chapter permission to use only one of the five vowel letters?', et: 'Milline Christian Böki luuleraamat lubab igas põhipeatükis kasutada vaid üht viiest täishäälikutähest?' }, response: { en: 'Eunoia', et: '„Eunoia“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'One chapter admits only a, another only e, and so on, while still building grammatically varied sentences.', et: 'Üks peatükk lubab ainult a-d, järgmine ainult e-d ja nii edasi, moodustades siiski grammatiliselt vaheldusrikkaid lauseid.' },
        source: { sourceId: 'wikipedia:eunoia-single-vowel-chapters', title: 'Eunoia (book)', url: 'https://en.wikipedia.org/wiki/Eunoia_(book)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-053:alphabetical-africa-expanding-letters', factKey: 'literature-language:alphabetical-africa-chapters-expand-and-contract-alphabet', tier: 5, subjectKey: 'work:alphabetical-africa',
        clue: { en: 'Which Walter Abish novel begins with words starting only with A, admits B in its next chapter, and expands through the alphabet before reversing the process?', et: 'Milline Walter Abishi romaan algab ainult a-ga algavate sõnadega, lubab järgmises peatükis juurde b ning avardab tähestikku enne protsessi tagasipööramist?' }, response: { en: 'Alphabetical Africa', et: '„Alphabetical Africa“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The permitted initial letters grow chapter by chapter to Z, then contract again, making structure part of the adventure.', et: 'Lubatud algustähtede hulk kasvab peatükkhaaval z-ni ja kahaneb seejärel taas, muutes struktuuri seikluse osaks.' },
        source: { sourceId: 'wikipedia:alphabetical-africa-expanding-letters', title: 'Alphabetical Africa', url: 'https://en.wikipedia.org/wiki/Alphabetical_Africa', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-071', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Absent Characters Who Shape the Story', et: 'Puuduvad tegelased, kes kujundavad loo' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-071:godot-never-arrives', factKey: 'literature-language:godot-awaited-by-vladimir-estragon-never-arrives', tier: 1, subjectKey: 'character:godot',
        clue: { en: 'Whom do Beckett’s Vladimir and Estragon wait for through two acts, receiving only messages that he will come another day?', et: 'Keda ootavad Becketti Vladimir ja Estragon kaks vaatust, saades vaid teateid, et ta tuleb mõnel teisel päeval?' }, response: { en: 'Godot', et: 'Godot' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The promised visitor never appears, turning the act of waiting itself into the play’s central event.', et: 'Lubatud külaline ei ilmu kunagi ning ootamisest endast saab näidendi keskne sündmus.' },
        source: { sourceId: 'wikipedia:godot-never-arrives', title: 'Waiting for Godot', url: 'https://en.wikipedia.org/wiki/Waiting_for_Godot', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-071:rosaline-before-juliet', factKey: 'literature-language:rosaline-unseen-romeo-love-before-juliet', tier: 2, subjectKey: 'character:rosaline',
        clue: { en: 'What unseen woman is Romeo mourning at the start of Shakespeare’s tragedy before he meets Juliet at the Capulet feast?', et: 'Millist lavale ilmumatut naist leinab Romeo Shakespeare’i tragöödia alguses enne Julia kohtamist Capulettide peol?' }, response: { en: 'Rosaline', et: 'Rosaline' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Romeo’s unreturned devotion to Rosaline vanishes almost immediately when he sees Juliet.', et: 'Romeo vastuseta kiindumus Rosaline’i kaob peaaegu kohe, kui ta näeb Juliat.' },
        source: { sourceId: 'wikipedia:rosaline-before-juliet', title: 'Rosaline', url: 'https://en.wikipedia.org/wiki/Rosaline', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-071:wingfield-portrait-absence', factKey: 'literature-language:mr-wingfield-absent-father-glass-menagerie', tier: 3, subjectKey: 'character:mr-wingfield',
        clue: { en: 'Which absent father in The Glass Menagerie has abandoned Amanda, Tom, and Laura, yet remains visible in a smiling portrait on the wall?', et: 'Milline eemalviibiv isa on „Klaasist loomaaia“ Amandast, Tomist ja Laurast lahkunud, kuid püsib seinal naerataval portreel nähtavana?' }, response: { en: 'Mr Wingfield', et: 'härra Wingfield' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'His escape burdens Tom with supporting the family and makes the portrait a constant reminder of departure.', et: 'Tema lahkumine jätab pere ülalpidamise Tomi õlule ning muudab portree pidevaks põgenemise meeldetuletuseks.' },
        source: { sourceId: 'wikipedia:wingfield-portrait-absence', title: 'The Glass Menagerie', url: 'https://en.wikipedia.org/wiki/The_Glass_Menagerie', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-071:captain-alving-ghosts-legacy', factKey: 'literature-language:captain-alving-dead-husband-shapes-ghosts', tier: 4, subjectKey: 'character:captain-alving',
        clue: { en: 'Which late husband in Ibsen’s Ghosts is publicly honored with an orphanage while his concealed affairs and illness haunt his widow and son?', et: 'Millist Ibseni „Kummituste“ surnud abikaasat austatakse avalikult lastekoduga, kuigi tema varjatud kõrvalsuhted ja haigus kummitavad leske ning poega?' }, response: { en: 'Captain Alving', et: 'kapten Alving' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Mrs Alving’s effort to preserve his respectable image cannot prevent the consequences of his life from returning.', et: 'Proua Alvingi püüd säilitada mehe laitmatut mainet ei takista tema elu tagajärgede naasmist.' },
        source: { sourceId: 'wikipedia:captain-alving-ghosts-legacy', title: 'Ghosts (play)', url: 'https://en.wikipedia.org/wiki/Ghosts_(play)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-071:dulcinea-idealized-aldonza', factKey: 'literature-language:dulcinea-name-for-unseen-aldonza-don-quixote', tier: 5, subjectKey: 'character:dulcinea',
        clue: { en: 'What courtly name does Don Quixote give the peasant woman Aldonza Lorenzo when he imagines her as the noble lady inspiring his quests?', et: 'Millise õukondliku nime annab don Quijote talunaisele Aldonza Lorenzole, kui kujutleb teda oma rännakuid inspireeriva aadlidaamina?' }, response: { en: 'Dulcinea', et: 'Dulcinea' }, acceptedVariants: { en: ['Dulcinea del Toboso'], et: ['Dulcinea del Toboso'] },
        explanation: { en: 'Aldonza never knowingly plays the role; the exalted lady exists mainly inside the knight’s imagination.', et: 'Aldonza ei täida seda rolli teadlikult; ülistatud daam eksisteerib peamiselt rüütli kujutluses.' },
        source: { sourceId: 'wikipedia:dulcinea-idealized-aldonza', title: 'Dulcinea', url: 'https://en.wikipedia.org/wiki/Dulcinea', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-075', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Campus Novels Enrol for Class', et: 'Ülikooliromaanid astuvad loengusse' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-075:secret-history-hampden-classics', factKey: 'literature-language:secret-history-hampden-classics-bunny-murder', tier: 1, subjectKey: 'work:the-secret-history',
        clue: { en: 'Which Donna Tartt novel has Richard Papen join an elite Classics circle at Hampden College and reveal from the outset that the group killed Bunny Corcoran?', et: 'Millises Donna Tartti romaanis liitub Richard Papen Hampdeni kolledži elitaarse antiigiringiga ning avaldab kohe alguses, et rühm tappis Bunny Corcorani?' }, response: { en: 'The Secret History', et: '„The Secret History“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The inverted mystery asks why the students committed the murder and how shared guilt breaks their closed circle.', et: 'Pööratud mõistatus küsib, miks tudengid mõrva sooritasid ja kuidas ühine süü nende suletud ringi lõhub.' },
        source: { sourceId: 'wikipedia:secret-history-hampden-classics', title: 'The Secret History', url: 'https://en.wikipedia.org/wiki/The_Secret_History', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-075:lucky-jim-dixon-lecturer', factKey: 'literature-language:lucky-jim-dixon-provincial-university', tier: 2, subjectKey: 'work:lucky-jim',
        clue: { en: 'Which Kingsley Amis comedy follows reluctant medieval-history lecturer Jim Dixon as he survives academic pretension at a provincial English university?', et: 'Milline Kingsley Amise komöödia jälgib tõrksat keskajaloo õppejõudu Jim Dixonit, kes püüab Inglismaa provintsiülikoolis akadeemilise eneseupitamise keskel toime tulla?' }, response: { en: 'Lucky Jim', et: '„Lucky Jim“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Dixon’s bad lectures, worse hangover, and rebellion against Professor Welch made the novel a defining campus satire.', et: 'Dixoni kehvad loengud, veel hullem pohmell ja mäss professor Welchi vastu tegid romaanist ülikoolisatiiri klassiku.' },
        source: { sourceId: 'wikipedia:lucky-jim-dixon-lecturer', title: 'Lucky Jim', url: 'https://en.wikipedia.org/wiki/Lucky_Jim', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-075:pnin-waindell-professor', factKey: 'literature-language:pnin-russian-professor-waindell', tier: 3, subjectKey: 'work:pnin',
        clue: { en: 'Which Nabokov novel follows the kind, exiled Russian professor Timofey at fictional Waindell College, where language and custom repeatedly trip him up?', et: 'Milline Nabokovi romaan jälgib heasüdamlikku vene pagulasprofessorit Timofeyd väljamõeldud Waindelli kolledžis, kus keel ja kombed talle alatasa raskusi valmistavad?' }, response: { en: 'Pnin', et: '„Pnin“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Comic misunderstandings surround a lonely scholar whose dignity gradually exceeds the narrator’s mockery.', et: 'Koomilised arusaamatused ümbritsevad üksildast õpetlast, kelle väärikus kasvab lõpuks jutustaja pilkest suuremaks.' },
        source: { sourceId: 'wikipedia:pnin-waindell-professor', title: 'Pnin', url: 'https://en.wikipedia.org/wiki/Pnin', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-075:stoner-farmer-literature', factKey: 'literature-language:stoner-farm-student-becomes-literature-professor', tier: 4, subjectKey: 'work:stoner-john-williams',
        clue: { en: 'Which John Williams novel follows a Missouri farm son named William who arrives to study agriculture but discovers literature and spends his career teaching it?', et: 'Milline John Williamsi romaan jälgib Missouri talupoega Williamit, kes tuleb õppima põllumajandust, avastab kirjanduse ning pühendab selle õpetamisele kogu karjääri?' }, response: { en: 'Stoner', et: '„Stoner“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The quiet academic life contains disappointed love, departmental conflict, and a lasting devotion to books.', et: 'Vaikne akadeemiline elu sisaldab pettunud armastust, osakonnakonflikte ja püsivat pühendumist raamatutele.' },
        source: { sourceId: 'wikipedia:stoner-farmer-literature', title: 'Stoner (novel)', url: 'https://en.wikipedia.org/wiki/Stoner_(novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-075:disgrace-lurie-professor-farm', factKey: 'literature-language:disgrace-david-lurie-loses-post-visits-farm', tier: 5, subjectKey: 'work:disgrace-coetzee',
        clue: { en: 'Which J. M. Coetzee novel sends dismissed Cape Town professor David Lurie to his daughter Lucy’s farm, where both confront violence and a changing South Africa?', et: 'Milline J. M. Coetzee romaan saadab vallandatud Kaplinna professori David Lurie tema tütre Lucy tallu, kus mõlemad seisavad silmitsi vägivalla ja muutuva Lõuna-Aafrikaga?' }, response: { en: 'Disgrace', et: '„Disgrace“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Lurie loses his university position after misconduct, but retreat offers no escape from questions of power and responsibility.', et: 'Lurie kaotab vääritu käitumise tõttu ülikoolikoha, kuid eemaldumine ei paku pääsu võimu ja vastutuse küsimustest.' },
        source: { sourceId: 'wikipedia:disgrace-lurie-professor-farm', title: 'Disgrace', url: 'https://en.wikipedia.org/wiki/Disgrace', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-084', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Languages Someone Deliberately Invented', et: 'Keeled, mille keegi teadlikult lõi' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-084:esperanto-zamenhof-international', factKey: 'literature-language:esperanto-zamenhof-international-language', tier: 1, subjectKey: 'language:esperanto',
        clue: { en: 'Which planned international language was introduced by L. L. Zamenhof in 1887 under a pen name meaning “one who hopes”?', et: 'Millise kavandatud rahvusvahelise keele tutvustas L. L. Zamenhof 1887. aastal varjunime all, mis tähendab „lootjat“?' }, response: { en: 'Esperanto', et: 'esperanto' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Zamenhof designed a regular grammar and international vocabulary to make the language comparatively easy to learn.', et: 'Zamenhof kujundas korrapärase grammatika ja rahvusvahelise sõnavara, et keelt oleks suhteliselt lihtne õppida.' },
        source: { sourceId: 'wikipedia:esperanto-zamenhof-international', title: 'Esperanto', url: 'https://en.wikipedia.org/wiki/Esperanto', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-084:klingon-okrant-star-trek', factKey: 'literature-language:klingon-created-by-marc-okrant-star-trek', tier: 2, subjectKey: 'language:klingon',
        clue: { en: 'Which deliberately harsh-sounding language did linguist Marc Okrand develop for an alien warrior culture in Star Trek?', et: 'Millise teadlikult karmi kõlaga keele arendas lingvist Marc Okrand „Star Treki“ tulnukatest sõdalasrahvale?' }, response: { en: 'Klingon', et: 'klingoni keel' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Okrand expanded a few earlier film sounds into a grammar and vocabulary that fans could actually learn and use.', et: 'Okrand arendas mõnest varasemast filmihelindist grammatika ja sõnavara, mida huvilised said päriselt õppida ja kasutada.' },
        source: { sourceId: 'wikipedia:klingon-okrant-star-trek', title: 'Klingon language', url: 'https://en.wikipedia.org/wiki/Klingon_language', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-084:dothraki-peterson-horse-lords', factKey: 'literature-language:dothraki-developed-by-david-peterson-game-thrones', tier: 3, subjectKey: 'language:dothraki',
        clue: { en: 'Which language did David J. Peterson develop for the nomadic horse lords encountered by Daenerys in Game of Thrones?', et: 'Millise keele arendas David J. Peterson rändavatest ratsaisandatest rahvale, kellega Daenerys „Troonide mängus“ kohtub?' }, response: { en: 'Dothraki', et: 'dothraki keel' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Peterson expanded the words in George R. R. Martin’s books into a full language for television dialogue.', et: 'Peterson arendas George R. R. Martini raamatutes leidunud sõnad televisioonidialoogi jaoks terviklikuks keeleks.' },
        source: { sourceId: 'wikipedia:dothraki-peterson-horse-lords', title: 'Dothraki language', url: 'https://en.wikipedia.org/wiki/Dothraki_language', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-084:toki-pona-sonja-lang-minimal', factKey: 'literature-language:toki-pona-sonja-lang-minimalist-language', tier: 4, subjectKey: 'language:toki-pona',
        clue: { en: 'Which minimalist constructed language by Sonja Lang uses a very small core vocabulary and encourages speakers to break complex ideas into simple parts?', et: 'Milline Sonja Langi minimalistlik tehiskeel kasutab väga väikest põhisõnavara ning suunab kõnelejaid keerukaid mõtteid lihtsateks osadeks jagama?' }, response: { en: 'Toki Pona', et: 'toki pona' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Its limited roots make context and creative combinations essential rather than assigning a separate word to every concept.', et: 'Piiratud tüvede hulk muudab konteksti ja loomingulised ühendid hädavajalikuks, selle asemel et anda igale mõistele eraldi sõna.' },
        source: { sourceId: 'wikipedia:toki-pona-sonja-lang-minimal', title: 'Toki Pona', url: 'https://en.wikipedia.org/wiki/Toki_Pona', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-084:volapuk-schleyer-international', factKey: 'literature-language:volapuk-schleyer-international-language', tier: 5, subjectKey: 'language:volapuk',
        clue: { en: 'Which international auxiliary language did German priest Johann Martin Schleyer create in 1879, before Esperanto appeared?', et: 'Millise rahvusvahelise abikeele lõi saksa preester Johann Martin Schleyer 1879. aastal, enne esperanto ilmumist?' }, response: { en: 'Volapük', et: 'volapüki keel' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Schleyer’s constructed language developed an international movement and held conventions during the 1880s.', et: 'Schleyeri tehiskeele ümber tekkis rahvusvaheline liikumine, mis pidas 1880. aastatel ka kongresse.' },
        source: { sourceId: 'wikipedia:volapuk-schleyer-international', title: 'Volapük', url: 'https://en.wikipedia.org/wiki/Volap%C3%BCk', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-085', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Impossible Crimes Behind Locked Doors', et: 'Võimatud kuriteod lukustatud uste taga' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-085:rue-morgue-orangutan', factKey: 'literature-language:rue-morgue-dupin-orangutan-locked-room', tier: 1, subjectKey: 'work:the-murders-in-the-rue-morgue',
        clue: { en: 'Which Poe story has C. Auguste Dupin solve the brutal deaths of two women in a sealed Paris room by identifying an escaped orangutan?', et: 'Millises Poe jutustuses lahendab C. Auguste Dupin kahe naise jõhkra surma suletud Pariisi toas, tuvastades põgenenud orangutani?' }, response: { en: 'The Murders in the Rue Morgue', et: '„The Murders in the Rue Morgue“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Conflicting witness accounts of an inhuman voice help Dupin see that the killer was not a conventional suspect.', et: 'Tunnistajate vastuolulised kirjeldused ebainimlikust häälest aitavad Dupinil mõista, et tapja polnud tavaline kahtlusalune.' },
        source: { sourceId: 'wikipedia:rue-morgue-orangutan', title: 'The Murders in the Rue Morgue', url: 'https://en.wikipedia.org/wiki/The_Murders_in_the_Rue_Morgue', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-085:yellow-room-rouletabille', factKey: 'literature-language:yellow-room-rouletabille-locked-bedroom-attack', tier: 2, subjectKey: 'work:the-mystery-of-the-yellow-room',
        clue: { en: 'Which Gaston Leroux novel sends young reporter Joseph Rouletabille to explain how Mathilde Stangerson was attacked inside a locked bedroom?', et: 'Millises Gaston Leroux’ romaanis peab noor reporter Joseph Rouletabille selgitama, kuidas Mathilde Stangersoni rünnati lukustatud magamistoas?' }, response: { en: 'The Mystery of the Yellow Room', et: '„The Mystery of the Yellow Room“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Rouletabille reconstructs both timing and identity to show why the apparently sealed scene misled investigators.', et: 'Rouletabille taastab nii sündmuste ajastuse kui ka isiku, näidates, miks näiliselt suletud sündmuspaik uurijaid eksitas.' },
        source: { sourceId: 'wikipedia:yellow-room-rouletabille', title: 'The Mystery of the Yellow Room', url: 'https://en.wikipedia.org/wiki/The_Mystery_of_the_Yellow_Room', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-085:hollow-man-dr-fell', factKey: 'literature-language:hollow-man-dr-fell-two-impossible-murders', tier: 3, subjectKey: 'work:the-hollow-man-carr',
        clue: { en: 'Which John Dickson Carr novel gives Dr Gideon Fell two impossible murders—one in a watched room and one in a snow-covered street without footprints?', et: 'Milline John Dickson Carri romaan annab doktor Gideon Fellile lahendada kaks võimatut mõrva: ühe valvatud toas ja teise lumisel tänaval ilma jalajälgedeta?' }, response: { en: 'The Hollow Man', et: '„The Hollow Man“' }, acceptedVariants: { en: ['The Three Coffins'], et: ['„The Three Coffins“'] },
        explanation: { en: 'The novel pauses for Fell’s celebrated discussion of the main ways locked-room illusions can be constructed.', et: 'Romaan peatub Felli kuulsaks saanud aruteluks peamistest viisidest, kuidas lukustatud toa illusiooni luua.' },
        source: { sourceId: 'wikipedia:hollow-man-dr-fell', title: 'The Hollow Man (Carr novel)', url: 'https://en.wikipedia.org/wiki/The_Hollow_Man_(Carr_novel)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-085:honjin-kindaichi-snow', factKey: 'literature-language:honjin-murders-kindaichi-wedding-snow-locked-room', tier: 4, subjectKey: 'work:the-honjin-murders',
        clue: { en: 'Which Seishi Yokomizo novel introduces detective Kosuke Kindaichi with newlyweds found dead after a scream, a koto sound, and a night of snow showing no intruder’s tracks?', et: 'Milline Seishi Yokomizo romaan tutvustab detektiiv Kosuke Kindaichit juhtumiga, kus noorpaar leitakse pärast karjet ja koto heli surnuna ning öine lumi ei näita sissetungija jälgi?' }, response: { en: 'The Honjin Murders', et: '„The Honjin Murders“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'A bloodied sword and untouched snow turn the wedding-night deaths into a Japanese locked-room classic.', et: 'Verine mõõk ja puutumatu lumi muudavad pulmaöö surmad Jaapani lukustatud toa mõistatuse klassikaks.' },
        source: { sourceId: 'wikipedia:honjin-kindaichi-snow', title: 'The Honjin Murders', url: 'https://en.wikipedia.org/wiki/The_Honjin_Murders', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-085:tokyo-zodiac-locked-studio', factKey: 'literature-language:tokyo-zodiac-astrologer-locked-studio-plan', tier: 5, subjectKey: 'work:the-tokyo-zodiac-murders',
        clue: { en: 'Which Sōji Shimada novel begins with an astrologer killed in a locked studio after leaving a grotesque plan, then asks investigators decades later to connect several women’s deaths?', et: 'Milline Sōji Shimada romaan algab lukustatud ateljees tapetud astroloogi groteskse kavandiga ning laseb uurijatel aastakümneid hiljem siduda mitme naise surmad?' }, response: { en: 'The Tokyo Zodiac Murders', et: '„The Tokyo Zodiac Murders“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The elaborate cold case pairs an apparently impossible first murder with a trail of bodies arranged around astrological ideas.', et: 'Keerukas lahendamata juhtum ühendab näiliselt võimatu esimese mõrva astroloogiliste ideede järgi korraldatud laipade ahelaga.' },
        source: { sourceId: 'wikipedia:tokyo-zodiac-locked-studio', title: 'The Tokyo Zodiac Murders', url: 'https://en.wikipedia.org/wiki/The_Tokyo_Zodiac_Murders', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-086', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Epidemics Transform the Novel', et: 'Epideemia muudab romaanimaailma' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-086:station-eleven-traveling-symphony', factKey: 'literature-language:station-eleven-georgia-flu-traveling-symphony', tier: 1, subjectKey: 'work:station-eleven',
        clue: { en: 'Which Emily St. John Mandel novel links actor Arthur Leander’s final performance with the Traveling Symphony after the Georgia Flu devastates civilization?', et: 'Milline Emily St. John Mandeli romaan seob näitleja Arthur Leanderi viimase etenduse Rändava Sümfoonia teekonnaga pärast Georgia gripi laastamist?' }, response: { en: 'Station Eleven', et: '„Jaam Üksteist“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The troupe performs Shakespeare around the Great Lakes, insisting that survival requires more than staying alive.', et: 'Trupp esitab Suure järvistu ümbruses Shakespeare’i, kinnitades, et ellujäämine tähendab enamat kui lihtsalt eluspüsimist.' },
        source: { sourceId: 'wikipedia:station-eleven-traveling-symphony', title: 'Station Eleven', url: 'https://en.wikipedia.org/wiki/Station_Eleven', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-086:oryx-crake-jimmy-pandemic', factKey: 'literature-language:oryx-crake-jimmy-engineered-pandemic', tier: 2, subjectKey: 'work:oryx-and-crake',
        clue: { en: 'Which Margaret Atwood novel leaves Jimmy among genetically altered humanoids after his scientist friend engineers a global pandemic?', et: 'Milline Margaret Atwoodi romaan jätab Jimmy geneetiliselt muudetud inimolendite sekka pärast seda, kui tema teadlasest sõber vallandab üleilmse pandeemia?' }, response: { en: 'Oryx and Crake', et: '„Orüks ja Ruik“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Jimmy reconstructs the friendship and corporate biotechnology that ended the old world.', et: 'Jimmy taastab mälus sõpruse ja korporatiivse biotehnoloogia loo, mis lõpetas vana maailma.' },
        source: { sourceId: 'wikipedia:oryx-crake-jimmy-pandemic', title: 'Oryx and Crake', url: 'https://en.wikipedia.org/wiki/Oryx_and_Crake', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-086:last-man-lionel-verney', factKey: 'literature-language:last-man-lionel-verney-global-disease', tier: 3, subjectKey: 'work:the-last-man-mary-shelley',
        clue: { en: 'Which Mary Shelley novel imagines Lionel Verney surviving a worldwide disease in a future Europe emptied of humanity?', et: 'Milline Mary Shelley romaan kujutab Lionel Verneyd üleilmse haiguse järel ellu jäämas tuleviku-Euroopas, kust inimkond on kadunud?' }, response: { en: 'The Last Man', et: '„The Last Man“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The early apocalyptic novel turns political hopes and intimate friendships into a long retreat before an unstoppable pandemic.', et: 'Varajane apokalüptiline romaan muudab poliitilised lootused ja lähedased sõprussuhted pikaks taganemiseks peatamatu pandeemia ees.' },
        source: { sourceId: 'wikipedia:last-man-lionel-verney', title: 'The Last Man', url: 'https://en.wikipedia.org/wiki/The_Last_Man', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-086:dog-stars-hig-airport', factKey: 'literature-language:dog-stars-hig-post-pandemic-airport', tier: 4, subjectKey: 'work:the-dog-stars',
        clue: { en: 'Which Peter Heller novel has Hig live with his dog Jasper and the armed Bangley at a Colorado airport after an influenza pandemic?', et: 'Millises Peter Helleri romaanis elab Hig pärast gripipandeemiat Colorado lennuväljal koos koer Jasperi ja relvastatud Bangleyga?' }, response: { en: 'The Dog Stars', et: '„The Dog Stars“' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Hig patrols by aircraft until a radio transmission draws him beyond the settlement’s defensive perimeter.', et: 'Hig teeb lennukiga patrull-lende, kuni raadiosõnum meelitab ta asula kaitsepiirist kaugemale.' },
        source: { sourceId: 'wikipedia:dog-stars-hig-airport', title: 'The Dog Stars', url: 'https://en.wikipedia.org/wiki/The_Dog_Stars', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-086:death-grass-virus', factKey: 'literature-language:death-grass-virus-destroys-crops', tier: 5, subjectKey: 'work:the-death-of-grass',
        clue: { en: 'Which John Christopher novel follows engineer John Custance through a collapsing England after a virus destroys grasses, including rice and wheat?', et: 'Milline John Christopheri romaan jälgib insener John Custance’i läbi kokkuvariseva Inglismaa pärast seda, kui viirus hävitab kõrrelised, sealhulgas riisi ja nisu?' }, response: { en: 'The Death of Grass', et: '„The Death of Grass“' }, acceptedVariants: { en: ['No Blade of Grass'], et: ['„No Blade of Grass“'] },
        explanation: { en: 'Crop failure drives famine and anarchy while Custance’s group heads north in search of a defensible refuge.', et: 'Saagi hävimine toob nälja ja anarhia, samal ajal kui Custance’i rühm suundub põhja kaitstavat pelgupaika otsima.' },
        source: { sourceId: 'wikipedia:death-grass-virus', title: 'The Death of Grass', url: 'https://en.wikipedia.org/wiki/The_Death_of_Grass', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
] as const satisfies readonly PlayableCategory[];

export const LITERATURE_LANGUAGE_CATEGORIES = validatePlayableCorpus(
  rawCategories,
  ASSIGNED_TARGETS.slice(0, rawCategories.length),
);

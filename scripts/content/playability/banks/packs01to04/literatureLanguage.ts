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
] as const satisfies readonly PlayableCategory[];

export const LITERATURE_LANGUAGE_CATEGORIES = validatePlayableCorpus(
  rawCategories,
  ASSIGNED_TARGETS.slice(0, rawCategories.length),
);

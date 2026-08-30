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
    name: { en: 'The Writers Behind the Pen Names', et: 'Kirjanikud varjunimede taga' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-010:o-henry-william-sydney-porter', factKey: 'literature-language:o-henry-pen-name-of-william-sydney-porter', tier: 1, subjectKey: 'author:william-sydney-porter',
        clue: { en: 'The author of “The Gift of the Magi” signed his short stories O. Henry. What was his real name?', et: 'Jutustuse „Maagide kingitus“ autor avaldas oma lood O. Henry nime all. Mis oli tema pärisnimi?' }, response: { en: 'William Sydney Porter', et: 'William Sydney Porter' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Porter adopted O. Henry as his best-known pen name while writing the twist-ending stories that made him famous.', et: 'Porter võttis O. Henry oma tuntuimaks varjunimeks, kirjutades ootamatu lõpplahendusega jutustusi, mis ta kuulsaks tegid.' },
        source: { sourceId: 'wikipedia:o-henry-william-sydney-porter', title: 'O. Henry', url: 'https://en.wikipedia.org/wiki/O._Henry', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-010:dr-seuss-theodor-geisel', factKey: 'literature-language:dr-seuss-pen-name-of-theodor-geisel', tier: 2, subjectKey: 'author:theodor-seuss-geisel',
        clue: { en: 'The Cat in the Hat and Green Eggs and Ham appeared under the name Dr. Seuss. What was their author’s real name?', et: '„Kass kübaras“ ja „Rohelised munad ja sink“ ilmusid Dr. Seussi nime all. Mis oli nende autori pärisnimi?' }, response: { en: 'Theodor Seuss Geisel', et: 'Theodor Seuss Geisel' }, acceptedVariants: { en: ['Theodor Geisel'], et: ['Theodor Geisel'] },
        explanation: { en: 'Geisel used Dr. Seuss for most of the imaginative children’s books that established his worldwide reputation.', et: 'Geisel kasutas enamiku oma fantaasiarikaste lasteraamatute juures nime Dr. Seuss ning saavutas nendega ülemaailmse tuntuse.' },
        source: { sourceId: 'wikipedia:dr-seuss-theodor-geisel', title: 'Dr. Seuss', url: 'https://en.wikipedia.org/wiki/Dr._Seuss', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-010:voltaire-francois-marie-arouet', factKey: 'literature-language:voltaire-pen-name-of-francois-marie-arouet', tier: 3, subjectKey: 'author:francois-marie-arouet',
        clue: { en: 'The French satirist who wrote Candide became famous as Voltaire. Under what name was he born?', et: '„Candide’i“ kirjutanud Prantsuse satiirik sai kuulsaks Voltaire’ina. Millise nime all ta sündis?' }, response: { en: 'François-Marie Arouet', et: 'François-Marie Arouet' }, acceptedVariants: { en: ['Francois-Marie Arouet'], et: ['Francois-Marie Arouet'] },
        explanation: { en: 'Arouet began using Voltaire as a young writer, and the adopted name became inseparable from his Enlightenment works.', et: 'Arouet hakkas noore kirjanikuna kasutama nime Voltaire, mis muutus tema valgustusajastu loomingust lahutamatuks.' },
        source: { sourceId: 'wikipedia:voltaire-francois-marie-arouet', title: 'Voltaire', url: 'https://en.wikipedia.org/wiki/Voltaire', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-010:moliere-jean-baptiste-poquelin', factKey: 'literature-language:moliere-stage-name-of-jean-baptiste-poquelin', tier: 4, subjectKey: 'author:jean-baptiste-poquelin',
        clue: { en: 'The playwright of Tartuffe and The Misanthrope used Molière as his stage name. What was his birth name?', et: '„Tartuffe’i“ ja „Misantroobi“ autor kasutas lavanime Molière. Mis oli tema sünninimi?' }, response: { en: 'Jean-Baptiste Poquelin', et: 'Jean-Baptiste Poquelin' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Poquelin adopted Molière after joining the theatre, and that name came to represent French classical comedy.', et: 'Poquelin võttis teatriga liitudes nime Molière, millest sai Prantsuse klassikalise komöödia sümbol.' },
        source: { sourceId: 'wikipedia:moliere-jean-baptiste-poquelin', title: 'Molière', url: 'https://en.wikipedia.org/wiki/Moli%C3%A8re', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-010:saki-hector-hugh-munro', factKey: 'literature-language:saki-pen-name-of-hector-hugh-munro', tier: 5, subjectKey: 'author:hector-hugh-munro',
        clue: { en: 'The sharp-edged stories “The Open Window” and “Sredni Vashtar” were published under the name Saki. What was the writer’s real name?', et: 'Terava huumoriga jutustused „Avatud aken“ ja „Sredni Vaštar“ ilmusid Saki nime all. Mis oli kirjaniku pärisnimi?' }, response: { en: 'Hector Hugh Munro', et: 'Hector Hugh Munro' }, acceptedVariants: { en: ['H. H. Munro'], et: ['H. H. Munro'] },
        explanation: { en: 'Munro used Saki for the short fiction whose elegant surfaces conceal cruelty, mischief, and sudden reversals.', et: 'Munro kasutas nime Saki jutustustes, mille elegantse pinna all peituvad julmus, riuklikkus ja ootamatud pöörded.' },
        source: { sourceId: 'wikipedia:saki-hector-hugh-munro', title: 'Saki', url: 'https://en.wikipedia.org/wiki/Saki', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-012', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Who Is Telling This Story?', et: 'Kes seda lugu jutustab?' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-012:ishmael-narrates-moby-dick', factKey: 'literature-language:ishmael-narrates-moby-dick-voyage', tier: 1, subjectKey: 'narrator:ishmael',
        clue: { en: 'Which sailor narrates Moby-Dick after joining Captain Ahab’s voyage aboard the Pequod?', et: 'Milline meremees jutustab „Moby Dicki“ loo pärast kapten Ahabi laevaga Pequod teele asumist?' }, response: { en: 'Ishmael', et: 'Ismael' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Ishmael survives the Pequod’s destruction and becomes the witness who can tell Ahab’s story.', et: 'Ismael elab Pequodi hukkumise üle ning temast saab tunnistaja, kes võib Ahabi loo edasi jutustada.' },
        source: { sourceId: 'wikipedia:ishmael-moby-dick-narrator', title: 'Ishmael (Moby-Dick)', url: 'https://en.wikipedia.org/wiki/Ishmael_(Moby-Dick)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
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
        key: 'playable-literature-language:built-in-literature-language-set-034:virgil-guides-dante', factKey: 'literature-language:virgil-guides-dante-through-hell-and-purgatory', tier: 1, subjectKey: 'guide:virgil',
        clue: { en: 'Which Roman poet guides Dante through Hell and most of Purgatory in the Divine Comedy?', et: 'Milline Rooma luuletaja juhib Dantet „Jumalikus komöödias“ läbi põrgu ja suurema osa puhastustulest?' }, response: { en: 'Virgil', et: 'Vergilius' }, acceptedVariants: { en: ['Vergil'], et: ['Publius Vergilius Maro'] },
        explanation: { en: 'Dante makes the author of the Aeneid a figure of human reason who can lead him only as far as the earthly paradise.', et: 'Dante teeb „Aeneise“ autorist inimliku mõistuse kehastuse, kes saab teda juhtida vaid maise paradiisini.' },
        source: { sourceId: 'wikipedia:virgil-dante-guide', title: 'Virgil in the Divine Comedy', url: 'https://en.wikipedia.org/wiki/Virgil#Dante%27s_Divine_Comedy', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
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
        key: 'playable-literature-language:built-in-literature-language-set-068:hardys-wessex', factKey: 'literature-language:hardy-fictionalizes-wessex', tier: 1, subjectKey: 'place:wessex',
        clue: { en: 'What name did Thomas Hardy give the partly fictionalized southwest English region shared by Tess of the d’Urbervilles and The Mayor of Casterbridge?', et: 'Millise nime andis Thomas Hardy osaliselt väljamõeldud Edela-Inglismaa piirkonnale, kus toimuvad „Tess d’Urberville’ide suguvõsast“ ja „Casterbridge’i linnapea“?' }, response: { en: 'Wessex', et: 'Wessex' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Hardy adapted the old regional name Wessex for a connected literary landscape built from real and invented places.', et: 'Hardy kohandas vana piirkonnanime Wessex omavahel seotud kirjandusmaastikuks, kus põimuvad tegelikud ja väljamõeldud paigad.' },
        source: { sourceId: 'wikipedia:thomas-hardy-wessex', title: 'Thomas Hardy’s Wessex', url: 'https://en.wikipedia.org/wiki/Thomas_Hardy%27s_Wessex', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
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
] as const satisfies readonly PlayableCategory[];

export const LITERATURE_LANGUAGE_CATEGORIES = validatePlayableCorpus(
  rawCategories,
  ASSIGNED_TARGETS.slice(0, rawCategories.length),
);

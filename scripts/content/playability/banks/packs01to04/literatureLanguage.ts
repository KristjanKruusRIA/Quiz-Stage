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
    name: { en: 'Rhetoric with a Twist', et: 'Kõnekujundid, mis pööravad mõtte uueks' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-010:anaphora-repeated-openings', factKey: 'literature-language:anaphora-repeats-successive-openings', tier: 1, subjectKey: 'device:anaphora',
        clue: { en: '“We shall fight on the beaches, we shall fight on the landing grounds” repeats the same words at the start of successive clauses. What device is this?', et: 'Fraas „me võitleme randadel, me võitleme maandumispaikades“ kordab samu sõnu järjestikuste osalausete alguses. Mis võte see on?' }, response: { en: 'anaphora', et: 'anafoor' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Anaphora creates rhythm and emphasis by returning to the same opening expression in consecutive units.', et: 'Anafoor loob rütmi ja rõhu, tuues sama algusväljendi järjestikustes üksustes tagasi.' },
        source: { sourceId: 'wikipedia:anaphora-rhetoric-openings', title: 'Anaphora (rhetoric)', url: 'https://en.wikipedia.org/wiki/Anaphora_(rhetoric)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-010:chiasmus-reversed-structure', factKey: 'literature-language:chiasmus-reverses-parallel-elements', tier: 2, subjectKey: 'device:chiasmus',
        clue: { en: '“Ask not what your country can do for you—ask what you can do for your country” reverses parallel elements into an ABBA pattern. What device is this?', et: 'Lause „ära küsi, mida su riik saab teha sinu heaks, vaid mida sina saad teha oma riigi heaks“ pöörab paralleelsed osad ABBA-mustrisse. Mis võte see on?' }, response: { en: 'chiasmus', et: 'kiasm' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Chiasmus crosses the order of corresponding words or ideas, often making a contrast compact and memorable.', et: 'Kiasm ristab vastavate sõnade või mõtete järjekorra, muutes vastanduse tihedaks ja meeldejäävaks.' },
        source: { sourceId: 'wikipedia:chiasmus-reversed-structure', title: 'Chiasmus', url: 'https://en.wikipedia.org/wiki/Chiasmus', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-010:litotes-negated-opposite', factKey: 'literature-language:litotes-affirms-by-negating-opposite', tier: 3, subjectKey: 'device:litotes',
        clue: { en: 'Calling an excellent performance “not bad” affirms a quality by denying its opposite. What figure of speech does this?', et: 'Suurepärase esituse nimetamine „mitte halvaks“ jaatab omadust selle vastandit eitades. Milline kõnekujund seda teeb?' }, response: { en: 'litotes', et: 'litootes' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Litotes is a restrained form of understatement that expresses a positive idea through negation.', et: 'Litootes on vaoshoitud vähendus, mis väljendab jaatavat mõtet eituse kaudu.' },
        source: { sourceId: 'wikipedia:litotes-negated-opposite', title: 'Litotes', url: 'https://en.wikipedia.org/wiki/Litotes', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-010:zeugma-one-word-two-senses', factKey: 'literature-language:zeugma-governs-two-phrases-differently', tier: 4, subjectKey: 'device:zeugma',
        clue: { en: 'In “she broke his car and his heart,” one verb governs two objects in different senses. What rhetorical device creates the effect?', et: 'Lauses „ta kaotas võtmed ja kannatuse“ laiendab üks tegusõna kahte sihitist eri tähenduses. Milline retooriline võte selle efekti loob?' }, response: { en: 'zeugma', et: 'zeugma' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Zeugma makes a single word do double grammatical duty, often shifting unexpectedly from literal to figurative meaning.', et: 'Zeugma paneb ühe sõna täitma kaht grammatilist ülesannet ning liigub sageli ootamatult otsesest tähendusest kujundlikku.' },
        source: { sourceId: 'wikipedia:zeugma-two-senses', title: 'Zeugma and syllepsis', url: 'https://en.wikipedia.org/wiki/Zeugma_and_syllepsis', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-010:aposiopesis-breaking-off', factKey: 'literature-language:aposiopesis-deliberately-breaks-off-speech', tier: 5, subjectKey: 'device:aposiopesis',
        clue: { en: 'A speaker stops mid-sentence—“If you do that again, I swear I’ll—”—leaving emotion or threat to complete the thought. What device is this?', et: 'Kõneleja katkestab lause pooleli — „Kui sa seda veel kord teed, siis ma…“ — ning jätab emotsiooni või ähvarduse mõtet lõpetama. Mis võte see on?' }, response: { en: 'aposiopesis', et: 'aposiopesis' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Aposiopesis is a deliberate breaking off that lets silence imply what the speaker cannot or will not say.', et: 'Aposiopesis on tahtlik kõnekatkestus, mille puhul vaikus vihjab sellele, mida kõneleja ei suuda või ei taha öelda.' },
        source: { sourceId: 'wikipedia:aposiopesis-breaking-off', title: 'Aposiopesis', url: 'https://en.wikipedia.org/wiki/Aposiopesis', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-012', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'When Speech Sounds Wander', et: 'Kui kõnehelid rändama lähevad' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-012:great-vowel-shift-english', factKey: 'literature-language:great-vowel-shift-changed-english-long-vowels', tier: 1, subjectKey: 'change:great-vowel-shift',
        clue: { en: 'What major historical change raised and diphthongized English long vowels, helping create the mismatch between modern spelling and pronunciation?', et: 'Milline suur ajalooline muutus tõstis ja diftongistas inglise keele pikki vokaale ning aitas tekitada tänapäevase kirjapildi ja häälduse lahknevuse?' }, response: { en: 'the Great Vowel Shift', et: 'suur vokaalinihe' }, acceptedVariants: { en: ['Great Vowel Shift'], et: ['inglise keele suur vokaalinihe'] },
        explanation: { en: 'The change transformed Middle English long vowels while much spelling was becoming standardized.', et: 'Muutus kujundas ümber keskinglise pikad vokaalid ajal, mil kirjapilt hakkas kinnistuma.' },
        source: { sourceId: 'wikipedia:great-vowel-shift-english', title: 'Great Vowel Shift', url: 'https://en.wikipedia.org/wiki/Great_Vowel_Shift', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-012:grimms-law-germanic-consonants', factKey: 'literature-language:grimms-law-systematic-germanic-consonant-shift', tier: 2, subjectKey: 'law:grimms-law',
        clue: { en: 'The correspondence between Latin pater and English father illustrates what law describing a systematic consonant shift into Proto-Germanic?', et: 'Ladina pater’i ja inglise father’i vastavus illustreerib millist seadust, mis kirjeldab süstemaatilist konsonandinihet alggermaani keelde?' }, response: { en: 'Grimm’s law', et: 'Grimmi seadus' }, acceptedVariants: { en: ['Grimm law'], et: ['Grimmi häälikuseadus'] },
        explanation: { en: 'Grimm’s law relates Indo-European stops to their regularly shifted Germanic descendants, such as p becoming f.', et: 'Grimmi seadus seob indoeuroopa sulghäälikud nende korrapäraselt nihkunud germaani järglastega, näiteks p muutumise f-iks.' },
        source: { sourceId: 'wikipedia:grimms-law-consonant-shift', title: 'Grimm’s law', url: 'https://en.wikipedia.org/wiki/Grimm%27s_law', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-012:metathesis-sound-order', factKey: 'literature-language:metathesis-reorders-sounds', tier: 3, subjectKey: 'change:metathesis',
        clue: { en: 'The historical reversal that helped turn Old English brid into modern bird is an example of what process that swaps the order of sounds?', et: 'Vanainglise brid’i kujunemine tänapäeva bird’iks toimus helide järjekorra vahetumise kaudu. Kuidas seda protsessi nimetatakse?' }, response: { en: 'metathesis', et: 'metatees' }, acceptedVariants: { en: ['sound metathesis'], et: ['häälikute metatees'] },
        explanation: { en: 'Metathesis changes a word by transposing sounds or syllables rather than simply adding or deleting them.', et: 'Metatees muudab sõna häälikute või silpide ümberpaigutamise, mitte pelgalt lisamise või kustutamise kaudu.' },
        source: { sourceId: 'wikipedia:metathesis-linguistics-sound-order', title: 'Metathesis (linguistics)', url: 'https://en.wikipedia.org/wiki/Metathesis_(linguistics)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-012:germanic-umlaut-vowel-assimilation', factKey: 'literature-language:germanic-umlaut-fronts-vowel-before-i', tier: 4, subjectKey: 'change:germanic-umlaut',
        clue: { en: 'The vowel contrast between English foot and feet descends from what Germanic process in which a following i or j altered an earlier vowel?', et: 'Inglise foot’i ja feet’i vokaalierinevus pärineb millisest germaani protsessist, kus järgnev i või j muutis eelnevat vokaali?' }, response: { en: 'Germanic umlaut', et: 'germaani umlaut' }, acceptedVariants: { en: ['i-mutation'], et: ['i-mutatsioon'] },
        explanation: { en: 'Germanic umlaut made a stressed vowel more like a high front sound in the next syllable, even after that trigger disappeared.', et: 'Germaani umlaut muutis rõhulise vokaali järgmise silbi kõrge eesvokaali sarnasemaks ka siis, kui muutuse käivitaja hiljem kadus.' },
        source: { sourceId: 'wikipedia:germanic-umlaut-vowel-change', title: 'Germanic umlaut', url: 'https://en.wikipedia.org/wiki/Germanic_umlaut', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-012:rhotacism-s-to-r', factKey: 'literature-language:rhotacism-changes-sound-to-r', tier: 5, subjectKey: 'change:rhotacism',
        clue: { en: 'Latin flos has the genitive floris because an earlier s between vowels changed to r. What sound change is named for this movement toward an r-sound?', et: 'Ladina flos’i omastav floris tekkis, sest varasem vokaalidevaheline s muutus r-iks. Kuidas nimetatakse sellist r-hääliku suunas toimuvat muutust?' }, response: { en: 'rhotacism', et: 'rotatsism' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Rhotacism is the historical change of another consonant, often s or z, into an r-like sound.', et: 'Rotatsism on ajalooline muutus, mille käigus mõni teine konsonant, sageli s või z, muutub r-laadseks häälikuks.' },
        source: { sourceId: 'wikipedia:rhotacism-sound-change', title: 'Rhotacism (sound change)', url: 'https://en.wikipedia.org/wiki/Rhotacism_(sound_change)', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
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
        clue: { en: 'Which British scholar made the first complete English translation of The Tale of Genji and also published influential versions of Chinese poetry?', et: 'Milline Briti õpetlane avaldas „Genji loo“ esimese täieliku ingliskeelse tõlke ning ka mõjukad hiina luule tõlked?' }, response: { en: 'Arthur Waley', et: 'Arthur Waley' }, acceptedVariants: { en: ['Waley'], et: ['Waley'] },
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
    name: { en: 'Writing Systems at Work', et: 'Kirjasüsteemid tööhoos' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-068:syllabary-one-symbol-syllable', factKey: 'literature-language:syllabary-symbol-represents-syllable', tier: 1, subjectKey: 'system:syllabary',
        clue: { en: 'Japanese kana use separate signs for units such as ka and no rather than for individual consonants and vowels. What type of script is this?', et: 'Jaapani kana kasutab eraldi märke üksustele nagu ka ja no, mitte üksikutele konsonantidele ja vokaalidele. Mis tüüpi kiri see on?' }, response: { en: 'a syllabary', et: 'silpkiri' }, acceptedVariants: { en: ['syllabic script'], et: ['süllaabikiri'] },
        explanation: { en: 'In a syllabary, each written sign normally represents a whole syllable or mora.', et: 'Silpkirjas tähistab iga kirjamärk tavaliselt tervet silpi või moorat.' },
        source: { sourceId: 'wikipedia:syllabary-symbol-syllable', title: 'Syllabary', url: 'https://en.wikipedia.org/wiki/Syllabary', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-068:abjad-mainly-consonants', factKey: 'literature-language:abjad-primarily-records-consonants', tier: 2, subjectKey: 'system:abjad',
        clue: { en: 'Arabic and Hebrew traditionally write consonants as the primary letters while often leaving short vowels unmarked. What type of writing system is this?', et: 'Araabia ja heebrea kirjas märgitakse põhiliste tähtedena konsonante, kuid lühikesed vokaalid jäetakse sageli kirjutamata. Mis tüüpi kirjasüsteem see on?' }, response: { en: 'an abjad', et: 'abjad' }, acceptedVariants: { en: ['consonantal alphabet'], et: ['konsonantkiri'] },
        explanation: { en: 'An abjad’s basic symbols represent consonants; optional marks may supply vowels when readers need them.', et: 'Abjadi põhimärgid tähistavad konsonante ning vajaduse korral saab vokaale lisamärkidega näidata.' },
        source: { sourceId: 'wikipedia:abjad-consonantal-writing', title: 'Abjad', url: 'https://en.wikipedia.org/wiki/Abjad', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-068:abugida-inherent-vowel', factKey: 'literature-language:abugida-consonant-has-inherent-vowel', tier: 3, subjectKey: 'system:abugida',
        clue: { en: 'In Devanagari, a consonant letter carries an inherent vowel that diacritics can change or cancel. What type of script uses this principle?', et: 'Devanagari kirjas sisaldab konsonandimärk vaikimisi vokaali, mida diakriitikutega muudetakse või tühistatakse. Mis tüüpi kiri seda põhimõtet kasutab?' }, response: { en: 'an abugida', et: 'abugida' }, acceptedVariants: { en: ['alphasyllabary'], et: ['alfasüllaabikiri'] },
        explanation: { en: 'An abugida organizes symbols around consonant–vowel units, modifying a base consonant to express different vowels.', et: 'Abugida korraldab märgid konsonandi-vokaali üksuste ümber ning muudab eri vokaalide väljendamiseks konsonandi põhimärki.' },
        source: { sourceId: 'wikipedia:abugida-inherent-vowel', title: 'Abugida', url: 'https://en.wikipedia.org/wiki/Abugida', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-068:boustrophedon-alternating-direction', factKey: 'literature-language:boustrophedon-alternates-line-direction', tier: 4, subjectKey: 'direction:boustrophedon',
        clue: { en: 'What writing direction alternates left-to-right and right-to-left on successive lines, its name comparing the motion to an ox turning while ploughing?', et: 'Kuidas nimetatakse kirjutussuunda, mis vahetab igal real vasakult paremale ja paremalt vasakule suunda ning mille nimi võrdleb liikumist kündva härja pöördega?' }, response: { en: 'boustrophedon', et: 'bustrofedon' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Some ancient Greek inscriptions use boustrophedon, sometimes reversing letter shapes along with the reading direction.', et: 'Mõned vanakreeka raidkirjad kasutavad bustrofedoni ning pööravad koos lugemissuunaga vahel ka tähtede kuju.' },
        source: { sourceId: 'wikipedia:boustrophedon-writing-direction', title: 'Boustrophedon', url: 'https://en.wikipedia.org/wiki/Boustrophedon', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-068:rebus-principle-sound', factKey: 'literature-language:rebus-principle-uses-picture-for-sound', tier: 5, subjectKey: 'principle:rebus',
        clue: { en: 'A picture of an eye can be used to write the sound “I,” ignoring the pictured object’s meaning. What principle lets scripts turn pictures into phonetic signs this way?', et: 'Silma pilt võib tähistada inglise häälikujada „I“, jättes kujutatud eseme tähenduse kõrvale. Milline põhimõte võimaldab kirjal pildist sel viisil häälikumärgi teha?' }, response: { en: 'the rebus principle', et: 'rebuspõhimõte' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'The rebus principle uses a sign for the sound of its name, a crucial step from pictorial meaning toward phonetic writing.', et: 'Rebuspõhimõte kasutab märki selle nimetuse kõla jaoks ning on oluline samm pildilisest tähendusest foneetilise kirja poole.' },
        source: { sourceId: 'wikipedia:rebus-principle-phonetic-writing', title: 'Rebus', url: 'https://en.wikipedia.org/wiki/Rebus#Rebus_principle', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
    ],
  },
  {
    categorySetId: 'built-in-literature-language-set-070', batchId: '04-literature-language', packId: 'built-in-literature-language', difficulty: 'hard',
    name: { en: 'Loanwords Reveal Their Routes', et: 'Laensõnad paljastavad oma teekonna' },
    questions: [
      {
        key: 'playable-literature-language:built-in-literature-language-set-070:quarantine-forty-days', factKey: 'literature-language:quarantine-from-italian-forty-days', tier: 1, subjectKey: 'word:quarantine',
        clue: { en: 'The word “quarantine” traces to what Italian phrase for the forty-day isolation once imposed on arriving ships?', et: 'Sõna quarantine pärineb millisest itaalia väljendist, mis tähistas saabuvatele laevadele kehtestatud neljakümnepäevast eraldamist?' }, response: { en: 'quaranta giorni', et: 'quaranta giorni' }, acceptedVariants: { en: [], et: [] },
        explanation: { en: 'Venetian practice extended an earlier thirty-day waiting period to forty days, giving the measure its lasting name.', et: 'Veneetsia tava pikendas varasema kolmekümnepäevase ooteaja neljakümne päevani ning andis meetmele püsiva nime.' },
        source: { sourceId: 'wikipedia:quarantine-forty-days-etymology', title: 'Quarantine', url: 'https://en.wikipedia.org/wiki/Quarantine#Etymology_and_terminology', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
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
        key: 'playable-literature-language:built-in-literature-language-set-073:red-book-westmarch', factKey: 'literature-language:red-book-westmarch-source-of-lord-of-rings', tier: 2, subjectKey: 'fictional-book:red-book-westmarch',
        clue: { en: 'Tolkien presents The Hobbit and The Lord of the Rings as translations from what manuscript begun by Bilbo and continued by Frodo and Sam?', et: 'Tolkien esitab „Kääbiku“ ja „Sõrmuste isanda“ tõlgetena millisest käsikirjast, mida alustas Bilbo ning jätkasid Frodo ja Sam?' }, response: { en: 'the Red Book of Westmarch', et: 'Lääneraja punane raamat' }, acceptedVariants: { en: ['Red Book of Westmarch'], et: ['Westmarchi punane raamat'] },
        explanation: { en: 'The imagined manuscript gives Tolkien’s legendarium a layered history in which hobbits preserve and transmit the account.', et: 'Kujuteldav käsikiri annab Tolkieni legendimaailmale mitmekihilise ajaloo, kus kääbikud sündmused talletavad ja edasi annavad.' },
        source: { sourceId: 'wikipedia:red-book-westmarch', title: 'Red Book of Westmarch', url: 'https://en.wikipedia.org/wiki/Red_Book_of_Westmarch', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
      },
      {
        key: 'playable-literature-language:built-in-literature-language-set-073:necronomicon-lovecraft', factKey: 'literature-language:necronomicon-lovecraft-fictional-grimoire', tier: 3, subjectKey: 'fictional-book:necronomicon',
        clue: { en: 'What forbidden grimoire invented by H. P. Lovecraft is attributed to the “Mad Arab” Abdul Alhazred and repeatedly consulted at terrible cost?', et: 'Millise H. P. Lovecrafti väljamõeldud keelatud nõiaraamatu autoriks peetakse „hullu araablast“ Abdul Alhazredi ning selle uurimine nõuab lugudes ränka hinda?' }, response: { en: 'the Necronomicon', et: '„Necronomicon“' }, acceptedVariants: { en: ['Necronomicon'], et: ['Necronomicon'] },
        explanation: { en: 'Lovecraft scattered references to the book across stories, giving his invented mythology the appearance of documentary depth.', et: 'Lovecraft puistas viiteid raamatule eri jutustustesse, andes väljamõeldud mütoloogiale näilise dokumentaalse sügavuse.' },
        source: { sourceId: 'wikipedia:necronomicon-lovecraft-grimoire', title: 'Necronomicon', url: 'https://en.wikipedia.org/wiki/Necronomicon', license: 'CC-BY-SA-4.0', retrievedAt: '2026-08-30' },
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

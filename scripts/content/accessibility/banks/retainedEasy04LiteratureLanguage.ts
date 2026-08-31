import { validateAccessibleCorpus } from '../validateBank';
import type { AccessibleCategory, AccessibleQuestion } from '../types';

type Fact = readonly [
  factKey: string,
  subjectKey: string,
  clueEn: string,
  clueEt: string,
  responseEn: string,
  responseEt: string,
  variantsEn: string,
  variantsEt: string,
  explanationEn: string,
  explanationEt: string,
  sourceTitle: string,
  sourcePath: string,
];

const TARGETS = [
  { categorySetId: 'built-in-literature-language-set-001', batchId: '04-literature-language' },
  { categorySetId: 'built-in-literature-language-set-002', batchId: '04-literature-language' },
  { categorySetId: 'built-in-literature-language-set-003', batchId: '04-literature-language' },
  { categorySetId: 'built-in-literature-language-set-004', batchId: '04-literature-language' },
  { categorySetId: 'built-in-literature-language-set-005', batchId: '04-literature-language' },
  { categorySetId: 'built-in-literature-language-set-006', batchId: '04-literature-language' },
  { categorySetId: 'built-in-literature-language-set-022', batchId: '04-literature-language' },
  { categorySetId: 'built-in-literature-language-set-032', batchId: '04-literature-language' },
] as const;

function variants(value: string): readonly string[] {
  return value.split('|').map((item) => item.trim()).filter(Boolean);
}

function buildQuestion(categorySetId: string, fact: Fact, tierIndex: number): AccessibleQuestion {
  const [
    factKey,
    subjectKey,
    clueEn,
    clueEt,
    responseEn,
    responseEt,
    variantsEn,
    variantsEt,
    explanationEn,
    explanationEt,
    sourceTitle,
    sourcePath,
  ] = fact;
  return {
    key: `retained-easy-04:${categorySetId}:${factKey}`,
    tier: (tierIndex + 1) as 1 | 2 | 3 | 4 | 5,
    subjectKey: `retained-easy-04:${subjectKey}`,
    clue: { en: clueEn, et: clueEt },
    response: { en: responseEn, et: responseEt },
    acceptedVariants: { en: variants(variantsEn), et: variants(variantsEt) },
    explanation: { en: explanationEn, et: explanationEt },
    source: {
      sourceId: `retained-easy-04:source:${sourcePath.toLocaleLowerCase('en')}`,
      title: sourceTitle,
      url: `https://en.wikipedia.org/wiki/${sourcePath}`,
      license: 'CC-BY-SA-4.0',
      retrievedAt: '2026-08-31',
    },
  };
}

function category(
  categorySetId: string,
  nameEn: string,
  nameEt: string,
  facts: readonly Fact[],
): AccessibleCategory {
  if (facts.length !== 5) throw new Error(`${categorySetId} must contain five facts`);
  return {
    categorySetId,
    batchId: '04-literature-language',
    name: { en: nameEn, et: nameEt },
    questions: facts.map((fact, index) => buildQuestion(categorySetId, fact, index)),
  };
}

const RAW_CATEGORIES = [
  category(
    'built-in-literature-language-set-001',
    'Childhood Adventures Everyone Meets',
    'Lapsepõlve seiklused, mida kõik kohtavad',
    [
      ['tom-sawyer-whitewashed-fence', 'character:tom-sawyer', 'Which mischievous Mississippi boy persuades other children to whitewash a fence for him?', 'Milline ulakas Mississippi-äärne poiss veenab teisi lapsi enda eest aeda valgeks värvima?', 'Tom Sawyer', 'Tom Sawyer', 'Tom|Thomas Sawyer', 'Tom|Thomas Sawyer', 'Tom turns his punishment into a privilege that other children want to try.', 'Tom muudab oma karistuse ihaldusväärseks tegevuseks, mida teised lapsed tahavad ise proovida.', 'Tom Sawyer', 'Tom_Sawyer'],
      ['dorothy-tornado-oz', 'character:dorothy-gale', 'Which Kansas girl is carried by a tornado to a land reached by a yellow brick road?', 'Millise Kansase tüdruku kannab tornaado maale, kus kulgeb kollastest tellistest tee?', 'Dorothy Gale', 'Dorothy Gale', 'Dorothy', 'Dorothy', 'Dorothy travels through Oz with companions she meets along the yellow brick road.', 'Dorothy rändab Ozi maal koos kaaslastega, keda ta kohtab kollastest tellistest teel.', 'Dorothy Gale', 'Dorothy_Gale'],
      ['heidi-alpine-grandfather', 'character:heidi', 'Which orphaned girl goes to live with her grandfather high in the Swiss Alps?', 'Milline orvuks jäänud tüdruk läheb elama oma vanaisa juurde kõrgele Šveitsi Alpidesse?', 'Heidi', 'Heidi', 'Heidi of the Alps', 'Alpide Heidi', 'Heidi finds a home with her grandfather in an Alpine mountain cabin.', 'Heidi leiab kodu oma vanaisa juures Alpides asuvas mägionnis.', 'Heidi', 'Heidi'],
      ['pinocchio-wooden-puppet', 'character:pinocchio', 'Which wooden puppet dreams of becoming a real boy and is famous for a growing nose?', 'Milline puunukk unistab päris poisiks saamisest ning on kuulus kasvava nina poolest?', 'Pinocchio', 'Pinocchio', 'Pinocchio the puppet', 'Pinocchio-nukk', 'Pinocchio is a wooden puppet whose nose grows when he tells lies.', 'Pinocchio on puunukk, kelle nina valetamise ajal pikemaks kasvab.', 'Pinocchio', 'Pinocchio'],
      ['mowgli-raised-wolves', 'character:mowgli', 'Which human child is raised by wolves in the Indian jungle?', 'Millise inimlapse kasvatavad India džunglis üles hundid?', 'Mowgli', 'Mowgli', 'Mowgli the man-cub', 'Mowgli|inimkutsikas Mowgli', 'Mowgli grows up among wolves and other jungle animals.', 'Mowgli kasvab üles huntide ja teiste džungliloomade keskel.', 'Mowgli', 'Mowgli'],
    ],
  ),
  category(
    'built-in-literature-language-set-002',
    'Storybook Travellers with Big Itineraries',
    'Juturaamatute rändurid suurtel teekondadel',
    [
      ['gulliver-lilliput', 'character:lemuel-gulliver', 'Which traveller wakes on an island where tiny people have tied him to the ground?', 'Milline rändur ärkab saarel, kus tillukesed inimesed on ta maa külge kinni sidunud?', 'Gulliver', 'Gulliver', 'Lemuel Gulliver', 'Lemuel Gulliver', 'Lemuel Gulliver reaches Lilliput on the first of his unusual voyages.', 'Lemuel Gulliver jõuab oma ebatavaliste reiside esimesel teekonnal Lilliputti.', 'Gulliver', 'Lemuel_Gulliver'],
      ['sinbad-seven-voyages', 'character:sinbad', 'Which sailor from Middle Eastern tales is famous for seven dangerous voyages?', 'Milline Lähis-Ida lugude meremees on kuulus seitsme ohtliku merereisi poolest?', 'Sinbad', 'Sindbad', 'Sinbad the Sailor', 'Meresõitja Sindbad|Sinbad', 'Sinbad survives monsters, shipwrecks, and other marvels across seven voyages.', 'Sindbad elab seitsmel merereisil üle koletisi, laevahukke ja muid imesid.', 'Sinbad the Sailor', 'Sinbad_the_Sailor'],
      ['captain-nemo-nautilus', 'character:captain-nemo', 'Which mysterious captain commands the submarine Nautilus in Twenty Thousand Leagues Under the Seas?', 'Milline salapärane kapten juhib romaanis „Kakskümmend tuhat ljööd vee all” allveelaeva Nautilus?', 'Captain Nemo', 'kapten Nemo', 'Nemo', 'Nemo', 'Captain Nemo travels beneath the oceans aboard his advanced submarine.', 'Kapten Nemo rändab oma täiustatud allveelaevaga maailmamerede all.', 'Captain Nemo', 'Captain_Nemo'],
      ['phileas-fogg-around-world', 'character:phileas-fogg', 'Which punctual gentleman wagers that he can travel around the world in eighty days?', 'Milline täpne härrasmees veab kihla, et suudab reisida ümber maailma kaheksakümne päevaga?', 'Phileas Fogg', 'Phileas Fogg', 'Mr Fogg|Fogg', 'härra Fogg|Fogg', 'Phileas Fogg sets out from London to win his famous travel wager.', 'Phileas Fogg asub Londonist teele, et võita oma kuulus reisikihlvedu.', 'Phileas Fogg', 'Phileas_Fogg'],
      ['munchausen-tall-tales', 'character:baron-munchausen', 'Which baron tells impossible travel stories, including riding on a cannonball?', 'Milline parun jutustab võimatuid reisilugusid, sealhulgas kahurikuulil ratsutamisest?', 'Baron Munchausen', 'parun Münchhausen', 'Munchausen|Baron Münchhausen', 'Münchhausen|parun Munchausen', 'The fictionalised baron became famous for comic and wildly exaggerated adventures.', 'Ilukirjanduslik parun sai kuulsaks koomiliste ja pööraselt liialdatud seiklustega.', 'Baron Munchausen', 'Baron_Munchausen'],
    ],
  ),
  category(
    'built-in-literature-language-set-003',
    'Impossible Places on the Map',
    'Võimatud paigad kaardil',
    [
      ['wonderland-rabbit-hole', 'place:wonderland', 'Which dreamlike realm does Alice enter after following a rabbit down a hole?', 'Millisesse unenäolisse maailma satub Alice pärast jänesele urgu järgnemist?', 'Wonderland', 'Imedemaa', 'Alice’s Wonderland', 'Alice Imedemaa|Wonderland', 'Wonderland is the strange realm of talking creatures and changing sizes visited by Alice.', 'Imedemaa on kummaline rääkivate olendite ja muutuvate suurustega maailm, mida Alice külastab.', 'Wonderland', 'Wonderland_(fictional_country)'],
      ['moominvalley-moomin-home', 'place:moominvalley', 'Which peaceful valley is home to the Moomin family and their friends?', 'Milline rahulik org on muumipere ja nende sõprade kodu?', 'Moominvalley', 'Muumiorg', 'Moomin Valley', 'Muumide org|Moominvalley', 'Moominvalley is the central home setting of Tove Jansson’s Moomin stories.', 'Muumiorg on Tove Janssoni muumilugude keskne kodupaik.', 'Moominvalley', 'Moominvalley'],
      ['neverland-second-star', 'place:neverland', 'Which island home of fairies, pirates, and the Lost Boys is reached by flying?', 'Millisele haldjate, piraatide ja Kadunud Poiste saarele jõutakse lennates?', 'Neverland', 'Eikunagimaa', 'Never Never Land', 'Ei-Kunagi-Maa|Neverland', 'Neverland is the distant island where Peter Pan and the Lost Boys live.', 'Eikunagimaa on kauge saar, kus elavad Peter Pan ja Kadunud Poisid.', 'Neverland', 'Neverland'],
      ['emerald-city-oz-capital', 'place:emerald-city', 'Which green capital must travellers reach to ask the Wizard of Oz for help?', 'Millisesse rohelisse pealinna peavad rändurid jõudma, et Ozi võlurilt abi paluda?', 'Emerald City', 'Smaragdlinn', 'the Emerald City', 'Emerald City|Smaragdilinn', 'The Emerald City is the capital of Oz and the home of its famous Wizard.', 'Smaragdlinn on Ozi pealinn ja kuulsa võluri elupaik.', 'Emerald City', 'Emerald_City'],
      ['atlantis-sunken-island', 'place:atlantis', 'Which legendary island civilisation was said by Plato to sink beneath the sea?', 'Milline legendaarne saaretsivilisatsioon vajus Platoni jutustuse järgi merepõhja?', 'Atlantis', 'Atlantis', 'the lost city of Atlantis', 'kadunud Atlantis|Atlantise saar', 'Plato described Atlantis as a powerful island that disappeared beneath the sea.', 'Platon kirjeldas Atlantist võimsa saareriigina, mis kadus mere alla.', 'Atlantis', 'Atlantis'],
    ],
  ),
  category(
    'built-in-literature-language-set-004',
    'Playful Patterns in Words',
    'Mängulised mustrid sõnades',
    [
      ['pun-double-meaning', 'language:pun', 'What kind of joke plays on two meanings or on similar-sounding words?', 'Kuidas nimetatakse nalja, mis mängib kahe tähenduse või sarnase kõlaga sõnadega?', 'Pun', 'sõnamäng', 'play on words|wordplay', 'kalambuur|sõnade mäng', 'A pun creates humour by exploiting multiple meanings or similar sounds.', 'Sõnamäng loob huumorit mitme tähenduse või sarnase kõla kasutamisega.', 'Pun', 'Pun'],
      ['tongue-twister-hard-repeat', 'language:tongue-twister', 'What is a phrase designed to be difficult to repeat quickly and clearly?', 'Kuidas nimetatakse fraasi, mida on raske kiiresti ja selgelt korrata?', 'Tongue-twister', 'keeleväänaja', 'tongue twister', 'keelemurdja|keeleharjutus', 'A tongue-twister arranges similar sounds into a deliberately difficult sequence.', 'Keeleväänaja paigutab sarnased häälikud tahtlikult raskesti hääldatavasse järjekorda.', 'Tongue-twister', 'Tongue-twister'],
      ['homophone-same-sound', 'language:homophone', 'What do we call words such as “sea” and “see” that sound alike but differ in meaning?', 'Kuidas nimetatakse sõnu, mis kõlavad ühtemoodi, kuid mille tähendus on erinev?', 'Homophones', 'homofonid', 'homophone', 'homofon', 'Homophones share a pronunciation even though their meanings or spellings differ.', 'Homofonid häälduvad ühtemoodi, kuigi nende tähendus või kirjapilt on erinev.', 'Homophone', 'Homophone'],
      ['anagram-rearranged-letters', 'language:anagram', 'What word puzzle rearranges all the letters of one expression to make another?', 'Milline sõnamõistatus paigutab ühe väljendi kõik tähed ümber, et saada teine väljend?', 'Anagram', 'anagramm', 'letter rearrangement', 'tähepaigutus', 'An anagram uses the same letters in a different order to form a new word or phrase.', 'Anagramm kasutab samu tähti teises järjekorras, et moodustada uus sõna või fraas.', 'Anagram', 'Anagram'],
      ['palindrome-both-directions', 'language:palindrome', 'What is a word such as “level” called when it reads the same forwards and backwards?', 'Kuidas nimetatakse sõna, näiteks „udu”, mis on mõlemas suunas lugedes sama?', 'Palindrome', 'palindroom', 'reversible word', 'võrdpöördne sõna', 'A palindrome has the same sequence of characters in both reading directions.', 'Palindroomis on tähemärkide järjestus mõlemas lugemissuunas sama.', 'Palindrome', 'Palindrome'],
    ],
  ),
  category(
    'built-in-literature-language-set-005',
    'Books Behind Famous Films',
    'Raamatud kuulsate filmide taga',
    [
      ['hobbit-bilbo-dwarves', 'work:the-hobbit', 'Which novel sends Bilbo Baggins from his comfortable home on a journey with thirteen dwarves?', 'Millises romaanis lahkub Bilbo Baggins oma mugavast kodust teekonnale koos kolmeteistkümne päkapikuga?', 'The Hobbit', '„Kääbik”', 'Hobbit', 'The Hobbit|Hobbit', 'The Hobbit follows Bilbo and a company of dwarves towards the Lonely Mountain.', '„Kääbik” jälgib Bilbot ja päkapike seltskonda teel Üksildase Mäe poole.', 'The Hobbit', 'The_Hobbit'],
      ['jurassic-park-cloned-dinosaurs', 'work:jurassic-park-novel', 'Which novel imagines a theme park populated by dinosaurs cloned from ancient DNA?', 'Milline romaan kujutab teemaparki, kus elavad iidsest DNA-st kloonitud dinosaurused?', 'Jurassic Park', '„Jurassic Park”', 'Michael Crichton’s Jurassic Park', 'Jurassic Park|Michael Crichtoni Jurassic Park', 'Michael Crichton’s novel places cloned dinosaurs in a supposedly controlled island park.', 'Michael Crichtoni romaan paigutab kloonitud dinosaurused näiliselt kontrollitud saareparki.', 'Jurassic Park', 'Jurassic_Park_(novel)'],
      ['life-of-pi-tiger-lifeboat', 'work:life-of-pi', 'Which novel strands a boy in a lifeboat with a Bengal tiger named Richard Parker?', 'Millises romaanis jääb poiss päästepaati koos Bengali tiigriga, kelle nimi on Richard Parker?', 'Life of Pi', '„Pii elu”', 'The Life of Pi', 'Life of Pi|Pii elu', 'Life of Pi recounts Pi Patel’s survival at sea with Richard Parker.', '„Pii elu” jutustab Pi Pateli ellujäämisest merel koos Richard Parkeriga.', 'Life of Pi', 'Life_of_Pi'],
      ['devil-wears-prada-fashion-assistant', 'work:devil-wears-prada-novel', 'Which novel follows a young assistant working for the fearsome fashion editor Miranda Priestly?', 'Milline romaan jälgib noort assistenti, kes töötab hirmuäratava moeajakirja peatoimetaja Miranda Priestly heaks?', 'The Devil Wears Prada', '„Saatan kannab Pradat”', 'Devil Wears Prada', 'The Devil Wears Prada|Saatan kannab Pradat', 'The novel follows Andrea Sachs through the pressures of a glamorous fashion workplace.', 'Romaan jälgib Andrea Sachsi läbi glamuurse moetöö pingete.', 'The Devil Wears Prada', 'The_Devil_Wears_Prada_(novel)'],
      ['princess-bride-westley-buttercup', 'work:princess-bride-novel', 'Which novel follows Westley’s return to rescue Buttercup from a forced royal marriage?', 'Milline romaan jutustab Westley tagasitulekust, et päästa Buttercup sunnitud kuninglikust abielust?', 'The Princess Bride', '„Printsessist pruut”', 'Princess Bride', 'The Princess Bride|Printsessist pruut', 'William Goldman’s novel combines romance, adventure, sword fights, and comic storytelling.', 'William Goldmani romaan ühendab romantika, seiklused, mõõgavõitlused ja koomilise jutustuse.', 'The Princess Bride', 'The_Princess_Bride_(novel)'],
    ],
  ),
  category(
    'built-in-literature-language-set-006',
    'Characters Between Hero and Horror',
    'Tegelased kangelase ja õuduse piiril',
    [
      ['robin-hood-robs-rich', 'character:robin-hood', 'Which outlaw of Sherwood Forest is famous for taking from the rich and giving to the poor?', 'Milline Sherwoodi metsa lindprii on kuulus selle poolest, et võtab rikastelt ja annab vaestele?', 'Robin Hood', 'Robin Hood', 'Robin of Sherwood', 'Sherwoodi Robin', 'Robin Hood is the legendary English outlaw associated with helping the poor.', 'Robin Hood on legendaarne Inglise lindprii, keda seostatakse vaeste aitamisega.', 'Robin Hood', 'Robin_Hood'],
      ['dracula-transylvanian-count', 'character:count-dracula', 'Which Transylvanian count travels to England and drinks blood?', 'Milline Transilvaania krahv reisib Inglismaale ja joob verd?', 'Count Dracula', 'krahv Dracula', 'Dracula|the Count', 'Dracula|krahv', 'Count Dracula is the vampire antagonist who leaves his Transylvanian castle for England.', 'Krahv Dracula on vampiirist vastane, kes lahkub oma Transilvaania lossist Inglismaale.', 'Count Dracula', 'Count_Dracula'],
      ['frankenstein-creature-created', 'character:frankensteins-monster', 'Which unnamed creature is assembled and brought to life by the scientist Victor Frankenstein?', 'Millise nimetu olendi paneb kokku ja äratab ellu teadlane Victor Frankenstein?', 'Frankenstein’s monster', 'Frankensteini koletis', 'Frankenstein’s creature|the Creature', 'Frankensteini olend|koletis', 'Victor Frankenstein creates a living being who is rejected and seeks understanding.', 'Victor Frankenstein loob elusolendi, kes tõrjutakse eemale ning otsib mõistmist.', 'Frankenstein’s monster', 'Frankenstein%27s_monster'],
      ['quasimodo-notre-dame-bells', 'character:quasimodo', 'Which bell-ringer lives in the towers of Notre-Dame in Victor Hugo’s novel?', 'Milline kellalööja elab Victor Hugo romaanis Notre-Dame’i torni võlvide all?', 'Quasimodo', 'Quasimodo', 'the Hunchback of Notre-Dame', 'Notre-Dame’i kellamees', 'Quasimodo is the isolated bell-ringer at the centre of The Hunchback of Notre-Dame.', 'Quasimodo on „Jumalaema kiriku kellamehe” keskne üksildane kellalööja.', 'Quasimodo', 'Quasimodo'],
      ['dorian-gray-portrait-ages', 'character:dorian-gray', 'Which young man remains outwardly youthful while his hidden portrait grows old and ugly?', 'Milline noormees jääb väliselt nooreks, samal ajal kui tema peidetud portree vananeb ja inetuks muutub?', 'Dorian Gray', 'Dorian Gray', 'Dorian', 'Dorian', 'Dorian Gray’s portrait bears the visible effects of age and wrongdoing in his place.', 'Dorian Gray portree kannab tema asemel vananemise ja halbade tegude nähtavaid jälgi.', 'Dorian Gray', 'Dorian_Gray_(character)'],
    ],
  ),
  category(
    'built-in-literature-language-set-022',
    'When Bookish Names Become Expressions',
    'Kui raamatunimedest saavad väljendid',
    [
      ['scrooge-miser', 'expression:scrooge', 'Which Christmas-story surname is used for a miserly person who hates spending money?', 'Millise jõululoo tegelase perekonnanime kasutatakse kitsi inimese kohta, kes vihkab raha kulutamist?', 'Scrooge', 'Scrooge', 'Ebenezer Scrooge', 'Ebenezer Scrooge|ihnuskoi', 'Scrooge’s name became a common label for an ungenerous miser.', 'Scrooge’i nimest sai levinud nimetus ihne ja heldusetu inimese kohta.', 'Ebenezer Scrooge', 'Ebenezer_Scrooge'],
      ['romeo-romantic-lover', 'expression:romeo', 'Which Shakespearean first name is sometimes used for a passionate male lover?', 'Millist Shakespeare’i tegelase eesnime kasutatakse vahel kirgliku meesarmastaja kohta?', 'Romeo', 'Romeo', 'a Romeo', 'Romeo-sugune armastaja', 'Romeo’s name became a familiar label for an ardent romantic lover.', 'Romeo nimest sai tuttav nimetus tulihingelise romantilise armastaja kohta.', 'Romeo', 'Romeo'],
      ['grinch-spoils-christmas', 'expression:grinch', 'Which Dr Seuss character’s name is used for someone who spoils other people’s Christmas fun?', 'Millise dr Seussi tegelase nimega kutsutakse inimest, kes rikub teiste jõulurõõmu?', 'The Grinch', 'Grinch', 'Grinch', 'Grinch|jõulurõõmu rikkuja', 'The Grinch’s attempt to steal Christmas made his name a word for a festive spoilsport.', 'Grinchi katse jõule varastada muutis tema nime jõulurõõmu rikkuja sünonüümiks.', 'The Grinch', 'Grinch'],
      ['jekyll-hyde-two-sides', 'expression:jekyll-and-hyde', 'Which pair of names describes someone who seems to have sharply contrasting good and bad sides?', 'Milline nimepaar kirjeldab inimest, kellel paistavad olevat järsult erinevad hea ja halb pool?', 'Jekyll and Hyde', 'Jekyll ja Hyde', 'Dr Jekyll and Mr Hyde|Jekyll-and-Hyde', 'dr Jekyll ja mr Hyde|Jekylli ja Hyde’i', 'Jekyll and Hyde became shorthand for a dramatic split between contrasting personalities.', 'Jekyll ja Hyde said kujundiks, mis tähistab vastandlike isiksusepoolte järsku vaheldumist.', 'Strange Case of Dr Jekyll and Mr Hyde', 'Strange_Case_of_Dr_Jekyll_and_Mr_Hyde'],
      ['catch-22-no-win-rule', 'expression:catch-22', 'What expression describes a no-win situation where the rule for solving a problem prevents the solution?', 'Milline väljend kirjeldab väljapääsmatut olukorda, kus probleemi lahendamise reegel ise takistab lahendust?', 'Catch-22', 'Catch-22', 'catch twenty-two|no-win situation', 'nokk-kinni-saba-lahti-olukord|väljapääsmatu olukord|surnud ring', 'Catch-22 names a circular rule that makes escape from a problem impossible.', 'Catch-22 tähistab ringreeglit, mis muudab probleemist pääsemise võimatuks.', 'Catch-22', 'Catch-22_(logic)'],
    ],
  ),
  category(
    'built-in-literature-language-set-032',
    'Famous Titles Across Languages',
    'Kuulsad pealkirjad eri keeltes',
    [
      ['pooh-hundred-acre-wood', 'work:winnie-the-pooh', 'Which honey-loving bear lives in the Hundred Acre Wood with Piglet and Tigger?', 'Milline mett armastav karu elab koos Notsu ja Tiigriga Saja Aakri Metsas?', 'Winnie-the-Pooh', 'Karupoeg Puhh', 'Winnie the Pooh|Pooh Bear', 'Winnie-the-Pooh|Winnie the Pooh|Puhh', 'Winnie-the-Pooh is the bear at the centre of the Hundred Acre Wood stories.', 'Karupoeg Puhh on Saja Aakri Metsa lugude keskne karutegelane.', 'Winnie-the-Pooh', 'Winnie-the-Pooh'],
      ['three-musketeers-french-title', 'work:three-musketeers', 'Which adventure novel about Athos, Porthos, Aramis, and d’Artagnan first appeared as “Les Trois Mousquetaires”?', 'Milline Athosest, Porthosest, Aramisest ja d’Artagnanist jutustav seiklusromaan ilmus algselt pealkirja „Les Trois Mousquetaires” all?', 'The Three Musketeers', '„Kolm musketäri”', 'Les Trois Mousquetaires|Three Musketeers', 'Les Trois Mousquetaires|The Three Musketeers|Kolm musketäri', 'Les Trois Mousquetaires is the original French title of The Three Musketeers.', '„Les Trois Mousquetaires” on „Kolme musketäri” prantsuskeelne algpealkiri.', 'The Three Musketeers', 'The_Three_Musketeers'],
      ['divine-comedy-italian-title', 'work:divine-comedy', 'Which poem about a journey through Hell, Purgatory, and Paradise is called “Divina Commedia” in Italian?', 'Millise põrgut, puhastustuld ja paradiisi läbiva teekonna poeemi itaaliakeelne pealkiri on „Divina Commedia”?', 'The Divine Comedy', '„Jumalik komöödia”', 'Divina Commedia|Divine Comedy', 'Divina Commedia|The Divine Comedy|Jumalik komöödia', 'Divina Commedia is the Italian title of Dante’s Divine Comedy.', '„Divina Commedia” on Dante „Jumaliku komöödia” itaaliakeelne pealkiri.', 'Divine Comedy', 'Divine_Comedy'],
      ['name-of-rose-italian-title', 'work:name-of-the-rose', 'Which monastery mystery featuring William of Baskerville has the Italian title “Il nome della rosa”?', 'Millise William Baskerville’iga kloostrimõistatuse itaaliakeelne pealkiri on „Il nome della rosa”?', 'The Name of the Rose', '„Roosi nimi”', 'Il nome della rosa|Name of the Rose', 'Il nome della rosa|The Name of the Rose|Roosi nimi', 'Il nome della rosa is the original Italian title of The Name of the Rose.', '„Il nome della rosa” on „Roosi nime” itaaliakeelne algpealkiri.', 'The Name of the Rose', 'The_Name_of_the_Rose'],
      ['solitude-spanish-title', 'work:one-hundred-years-solitude', 'Which novel about the Buendía family is titled “Cien años de soledad” in Spanish?', 'Millise Buendía perekonnast jutustava romaani hispaaniakeelne pealkiri on „Cien años de soledad”?', 'One Hundred Years of Solitude', '„Sada aastat üksildust”', 'Cien años de soledad|Hundred Years of Solitude', 'Cien años de soledad|One Hundred Years of Solitude|Sada aastat üksildust', 'Cien años de soledad is the original Spanish title of One Hundred Years of Solitude.', '„Cien años de soledad” on „Saja aasta üksilduse” hispaaniakeelne algpealkiri.', 'One Hundred Years of Solitude', 'One_Hundred_Years_of_Solitude'],
    ],
  ),
] as const satisfies readonly AccessibleCategory[];

export const RETAINED_EASY_04_LITERATURE_LANGUAGE_CATEGORIES = validateAccessibleCorpus(
  RAW_CATEGORIES,
  TARGETS,
);

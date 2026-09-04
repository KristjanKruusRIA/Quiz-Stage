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
  batchId: string;
  name: Readonly<{ en: string; et: string }>;
  facts: readonly Fact[];
}>;

const TARGETS = [
  { categorySetId: 'built-in-music-set-001', batchId: '06-music' },
  { categorySetId: 'built-in-music-set-002', batchId: '06-music' },
  { categorySetId: 'built-in-music-set-003', batchId: '06-music' },
  { categorySetId: 'built-in-music-set-004', batchId: '06-music' },
  { categorySetId: 'built-in-music-set-005', batchId: '06-music' },
  { categorySetId: 'built-in-music-set-006', batchId: '06-music' },
  { categorySetId: 'built-in-music-set-007', batchId: '06-music' },
  { categorySetId: 'built-in-music-set-008', batchId: '06-music' },
  { categorySetId: 'built-in-film-television-set-002', batchId: '07-film-television' },
  { categorySetId: 'built-in-film-television-set-003', batchId: '07-film-television' },
  { categorySetId: 'built-in-film-television-set-004', batchId: '07-film-television' },
  { categorySetId: 'built-in-film-television-set-011', batchId: '07-film-television' },
  { categorySetId: 'built-in-film-television-set-013', batchId: '07-film-television' },
  { categorySetId: 'built-in-film-television-set-014', batchId: '07-film-television' },
  { categorySetId: 'built-in-film-television-set-019', batchId: '07-film-television' },
  { categorySetId: 'built-in-film-television-set-020', batchId: '07-film-television' },
  { categorySetId: 'built-in-sports-games-set-001', batchId: '08-sports-games' },
  { categorySetId: 'built-in-sports-games-set-002', batchId: '08-sports-games' },
  { categorySetId: 'built-in-sports-games-set-003', batchId: '08-sports-games' },
  { categorySetId: 'built-in-sports-games-set-004', batchId: '08-sports-games' },
  { categorySetId: 'built-in-sports-games-set-005', batchId: '08-sports-games' },
  { categorySetId: 'built-in-sports-games-set-006', batchId: '08-sports-games' },
  { categorySetId: 'built-in-sports-games-set-007', batchId: '08-sports-games' },
  { categorySetId: 'built-in-sports-games-set-008', batchId: '08-sports-games' },
] as const;

const DRAFTS: readonly CategoryDraft[] = [
  {
    categorySetId: 'built-in-music-set-001',
    batchId: '06-music',
    name: { en: 'Music: How Concerts Work', et: 'Muusika: Kuidas kontserdid toimivad' },
    facts: [
      ['concert-encore', 'concert-encore', 'The audience keeps applauding after the planned final song. What may the performer return to play?', 'Publik aplodeerib pärast kavas olnud viimast lugu edasi. Mida võib esineja naastes veel mängida?', 'encore', 'lisalugu', 'An encore is an additional performance given after the scheduled programme has ended.', 'Lisalugu on pärast kavandatud programmi lõppu esitatav täiendav pala.', 'Encore', ['extra song'], ['lisanumber', 'encore']],
      ['concert-crowd-surfing', 'concert-crowd-surfing', 'What concert stunt carries a person above the audience on many raised hands?', 'Kuidas nimetatakse kontserditrikki, kus inimest kantakse publiku kohale tõstetud kätel?', 'crowd surfing', 'publiku kätel surfamine', 'During crowd surfing, audience members pass a person overhead from hand to hand.', 'Publiku kätel surfamisel annavad pealtvaatajad inimese pea kohal käest kätte edasi.', 'Crowd_surfing', ['crowdsurfing'], ['crowd surfing', 'kätesurf']],
      ['concert-soundcheck', 'concert-soundcheck', 'What pre-show rehearsal lets musicians and technicians balance microphones and speakers?', 'Milline kontserdieelne proov võimaldab muusikutel ja tehnikutel mikrofone ning kõlareid tasakaalustada?', 'soundcheck', 'heliproov', 'A soundcheck tests the venue sound system and adjusts levels before the audience arrives.', 'Heliproovis katsetatakse saali helisüsteemi ja seadistatakse helitasemed enne publiku saabumist.', 'Soundcheck', ['sound check'], ['soundcheck']],
      ['concert-set-list', 'concert-set-list', 'What written order tells a band which songs it plans to play that night?', 'Kuidas nimetatakse kirja pandud järjekorda, mis näitab bändile, milliseid lugusid sel õhtul esitada?', 'set list', 'lugude nimekiri', 'A set list records the planned running order of songs for a performance.', 'Lugude nimekiri paneb paika kontserdil esitatavate palade kavandatud järjekorra.', 'Set_list', ['setlist'], ['setlist', 'esinemiskava']],
      ['concert-supporting-act', 'concert-supporting-act', 'What performer appears before the main attraction to warm up the audience?', 'Kuidas nimetatakse esinejat, kes astub publiku soojendamiseks üles enne peaesinejat?', 'supporting act', 'soojendusesineja', 'A supporting act performs an earlier, usually shorter set before the headliner.', 'Soojendusesineja annab enne peaesinejat tavaliselt lühema kontserdi.', 'Opening_act', ['opening act', 'support act', 'opener'], ['eelartist', 'soojendusartist']],
    ],
  },
  {
    categorySetId: 'built-in-music-set-002',
    batchId: '06-music',
    name: { en: 'Music: Songs Heard Around the Stadium', et: 'Muusika: Staadionilt tuntud lood' },
    facts: [
      ['stadium-queen-we-will-rock-you', 'artist-queen-stadium', 'Which band recorded We Will Rock You, whose stomp-stomp-clap beat fills sports arenas?', 'Milline bänd salvestas spordiareenidel kõlava tramp-tramp-plaks-rütmiga loo „We Will Rock You“?', 'Queen', 'Queen', 'Queen released We Will Rock You on the 1977 album News of the World.', 'Queen avaldas loo „We Will Rock You“ 1977. aasta albumil „News of the World“.', 'We_Will_Rock_You'],
      ['stadium-neil-diamond-sweet-caroline', 'artist-neil-diamond-stadium', 'Whose recording of Sweet Caroline invites crowds to sing its famous “ba, ba, ba” response?', 'Kelle salvestatud „Sweet Caroline“ kutsub publikut kaasa laulma kuulsat „ba, ba, ba“ vastust?', 'Neil Diamond', 'Neil Diamond', 'Neil Diamond wrote and recorded Sweet Caroline, which became a crowd singalong at many sporting events.', 'Neil Diamond kirjutas ja salvestas loo „Sweet Caroline“, millest sai paljudel spordiüritustel ühislaul.', 'Sweet_Caroline'],
      ['stadium-liverpool-youll-never-walk-alone', 'club-liverpool-stadium-song', 'Supporters of which English football club are especially famous for singing You’ll Never Walk Alone?', 'Millise Inglise jalgpalliklubi poolehoidjad on eriti tuntud laulu „You’ll Never Walk Alone“ laulmise poolest?', 'Liverpool FC', 'Liverpool FC', 'Liverpool supporters adopted You’ll Never Walk Alone in the 1960s and still sing it before matches.', 'Liverpooli poolehoidjad võtsid laulu „You’ll Never Walk Alone“ omaks 1960. aastatel ja laulavad seda enne mänge siiani.', 'You%27ll_Never_Walk_Alone', ['Liverpool', 'Liverpool Football Club'], ['Liverpool', 'Liverpooli jalgpalliklubi']],
      ['stadium-white-stripes-seven-nation-army', 'artist-white-stripes-stadium', 'Which rock duo created the seven-note riff that crowds chant from Seven Nation Army?', 'Milline rokkduo lõi loo „Seven Nation Army“ seitsmenoodilise rifi, mida publik skandeerib?', 'the White Stripes', 'The White Stripes', 'The White Stripes released Seven Nation Army in 2003, and its riff became a worldwide sports chant.', 'The White Stripes avaldas „Seven Nation Army“ 2003. aastal ning selle rifist sai üleilmne spordiskandeering.', 'Seven_Nation_Army', ['White Stripes'], ['White Stripes']],
      ['stadium-gala-freed-from-desire', 'artist-gala-stadium', 'Which Italian singer recorded Freed from Desire, later adapted into the football chant “Will Grigg’s on Fire”?', 'Milline Itaalia lauljanna salvestas loo „Freed from Desire“, millest tehti hiljem jalgpalliskandeering „Will Grigg’s on Fire“?', 'Gala', 'Gala', 'Gala Rizzatto released Freed from Desire in 1996, and its melody later became a popular football chant.', 'Gala Rizzatto avaldas „Freed from Desire“ 1996. aastal ning selle meloodiast sai hiljem populaarne jalgpalliskandeering.', 'Freed_from_Desire', ['Gala Rizzatto'], ['Gala Rizzatto']],
    ],
  },
  {
    categorySetId: 'built-in-music-set-003',
    batchId: '06-music',
    name: { en: 'Music: Album Covers in the Cultural Memory', et: 'Muusika: Kultuurimällu jäänud albumikaaned' },
    facts: [
      ['cover-abbey-road-crossing', 'work-abbey-road-cover', 'Four Beatles walk across a zebra crossing on the cover of which album?', 'Millise albumi kaanel kõnnivad neli biitlit üle sebra?', 'Abbey Road', 'Abbey Road', 'The Beatles were photographed on the crossing outside their London studio for the Abbey Road cover.', 'The Beatles pildistati „Abbey Roadi“ kaane jaoks Londonis stuudio ees oleval sebral.', 'Abbey_Road', ['The Beatles: Abbey Road'], ['The Beatlesi Abbey Road']],
      ['cover-nirvana-baby', 'artist-nirvana-cover', 'Which band put a swimming baby chasing a dollar bill on the cover of Nevermind?', 'Milline bänd pani albumi „Nevermind“ kaanele dollarit taga ajava ujuva beebi?', 'Nirvana', 'Nirvana', 'Nirvana used the underwater baby photograph for the cover of its 1991 album Nevermind.', 'Nirvana kasutas veealuse beebi fotot oma 1991. aasta albumi „Nevermind“ kaanel.', 'Nevermind'],
      ['cover-bowie-aladdin-sane', 'artist-david-bowie-aladdin-sane-cover', 'Which musician appears with a red-and-blue lightning bolt across his face on the cover of Aladdin Sane?', 'Milline muusik on albumi „Aladdin Sane“ kaanel, näol punasinine välgunool?', 'David Bowie', 'David Bowie', 'Brian Duffy photographed David Bowie in the lightning-bolt makeup created for the Aladdin Sane cover.', 'Brian Duffy pildistas David Bowiet „Aladdin Sane’i“ kaane jaoks loodud välgunoolemeigiga.', 'Aladdin_Sane', ['Bowie'], ['Bowie']],
      ['cover-warhol-banana', 'artist-andy-warhol-banana-cover', 'Which pop artist designed the peelable banana cover for The Velvet Underground & Nico?', 'Milline popkunstnik kujundas albumile „The Velvet Underground & Nico“ kooritava banaaniga kaane?', 'Andy Warhol', 'Andy Warhol', 'Andy Warhol supplied the banana artwork and was credited as the album producer.', 'Andy Warhol lõi banaanikujunduse ja oli albumil märgitud produtsendina.', 'The_Velvet_Underground_%26_Nico', ['Warhol'], ['Warhol']],
      ['cover-unknown-pleasures-pulsar', 'work-unknown-pleasures-cover', 'Which Joy Division album has a black cover crossed by stacked white radio-wave lines from a pulsar?', 'Millise Joy Divisioni albumi mustal kaanel on pulsari raadiosignaalist pärit üksteise kohal valged jooned?', 'Unknown Pleasures', 'Unknown Pleasures', 'The Unknown Pleasures cover visualises radio pulses recorded from pulsar CP 1919.', '„Unknown Pleasuresi“ kaanel on kujutatud pulsari CP 1919 salvestatud raadioimpulsse.', 'Unknown_Pleasures'],
    ],
  },
  {
    categorySetId: 'built-in-music-set-004',
    batchId: '06-music',
    name: { en: 'Music: Instruments with an Unmistakable Look', et: 'Muusika: Eksimatu välimusega pillid' },
    facts: [
      ['instrument-saxophone', 'instrument-saxophone-look', 'Which curved metal wind instrument with a single-reed mouthpiece is strongly associated with jazz?', 'Milline kõver metallist puhkpill kasutab ühte lesthuulikut ja seostub eriti džässiga?', 'saxophone', 'saksofon', 'The saxophone has a conical metal body but produces sound with a single reed like a clarinet.', 'Saksofonil on kooniline metallkorpus, kuid heli tekitab klarneti moodi üksik lest.', 'Saxophone', ['sax'], ['saks']],
      ['instrument-bagpipes', 'instrument-bagpipes-look', 'Which instrument has an air bag under the player’s arm and several pipes rising from it?', 'Millisel pillil on mängija kaenla all õhukott, millest ulatub välja mitu toru?', 'bagpipes', 'torupill', 'Bagpipes feed stored air from a bag into a melody pipe and one or more drone pipes.', 'Torupill juhib kotis oleva õhu viisitorusse ja ühte või mitmesse burdoonitorusse.', 'Bagpipes', ['bagpipe'], ['torupillid']],
      ['instrument-kazoo', 'instrument-kazoo-look', 'Which small tube-shaped instrument changes a player’s humming into a buzzing sound?', 'Milline väike torukujuline pill muudab mängija ümisemise põrisevaks heliks?', 'kazoo', 'kazuu', 'A kazoo uses a vibrating membrane to colour the sound of a player humming into it.', 'Kazuu membraan võngub, kui mängija pilli sisse ümiseb, ning muudab heli kõla.', 'Kazoo', ['mirliton'], ['kazoo']],
      ['instrument-steelpan', 'instrument-steelpan-look', 'Which tuned metal instrument from Trinidad and Tobago is made from a concave steel surface?', 'Milline Trinidadist ja Tobagost pärit häälestatud metallpill on valmistatud nõgusast teraspinnast?', 'steelpan', 'steelpann', 'A steelpan has tuned note areas hammered into the surface of a steel drum.', 'Steelpannil on terastrumli pinnale vormitud häälestatud noodialad.', 'Steelpan', ['steel drum'], ['steelpan']],
      ['instrument-theremin', 'instrument-theremin-look', 'Which electronic instrument is played without touch by moving both hands near two antennas?', 'Millist elektroonilist pilli mängitakse puudutamata, liigutades käsi kahe antenni lähedal?', 'theremin', 'teremin', 'A theremin senses hand position around its antennas to control pitch and volume.', 'Teremin tajub käte asendit antennide ümber ning juhib selle järgi helikõrgust ja tugevust.', 'Theremin', ['thereminvox'], ['theremin']],
    ],
  },
  {
    categorySetId: 'built-in-music-set-005',
    batchId: '06-music',
    name: { en: 'Music: Sounds with a Place of Origin', et: 'Muusika: Paigaga seotud helid' },
    facts: [
      ['place-reggae-jamaica', 'genre-reggae-origin', 'Which offbeat popular-music style grew in Jamaica and was taken worldwide by artists such as Bob Marley?', 'Milline rõhutatud vasturütmiga levimuusikastiil kasvas välja Jamaical ja levis maailma muu hulgas Bob Marley kaudu?', 'reggae', 'reggae', 'Reggae developed in Jamaica in the late 1960s from ska, rocksteady, and other influences.', 'Reggae kujunes Jamaical 1960. aastate lõpus ska, rocksteady ja teiste mõjutuste põhjal.', 'Reggae'],
      ['place-tango-rio-de-la-plata', 'dance-tango-origin', 'Which partner dance grew around the Río de la Plata in Argentina and Uruguay?', 'Milline paaristants kasvas välja Argentina ja Uruguay vahelise Río de la Plata ümbruses?', 'tango', 'tango', 'Tango emerged in working-class districts around Buenos Aires and Montevideo.', 'Tango tekkis Buenos Airese ja Montevideo töölislinnaosades.', 'Tango'],
      ['place-mariachi-mexico', 'ensemble-mariachi-origin', 'What Mexican ensemble tradition features violins, trumpets, and guitar-family instruments in matching dress?', 'Milline Mehhiko ansamblitraditsioon ühendab viiulid, trompetid ja kitarrilaadsed pillid ning ühtse riietuse?', 'mariachi', 'mariachi', 'Modern mariachi groups combine strings and trumpets and are strongly associated with Mexican celebrations.', 'Tänapäeva mariachi-ansamblid ühendavad keelpille ja trompeteid ning kuuluvad tihedalt Mehhiko pidustuste juurde.', 'Mariachi'],
      ['place-fado-portugal', 'genre-fado-origin', 'Which Portuguese song tradition is known for expressive singing about longing and fate?', 'Milline Portugali laulutraditsioon on tuntud igatsusest ja saatusest rääkiva tundelise esituse poolest?', 'fado', 'fado', 'Fado became established in Lisbon and is commonly accompanied by Portuguese guitar.', 'Fado kinnistus Lissabonis ning seda saadab tavaliselt Portugali kitarr.', 'Fado'],
      ['place-calypso-trinidad', 'genre-calypso-origin', 'Which witty, topical song style developed in Trinidad and Tobago and spread internationally in the twentieth century?', 'Milline teravmeelne ja päevakajaline laulustiil kujunes Trinidadis ja Tobagos ning levis kahekümnendal sajandil maailma?', 'calypso', 'kalüpso', 'Calypso singers use memorable melodies and wordplay to comment on public events and society.', 'Kalüpsolauljad kommenteerivad meeldejäävate meloodiate ja sõnamänguga ühiskonda ning päevasündmusi.', 'Calypso_music', ['calypso music'], ['calypso']],
    ],
  },
  {
    categorySetId: 'built-in-music-set-006',
    batchId: '06-music',
    name: { en: 'Music: Paths to the Spotlight', et: 'Muusika: Teed rambivalgusse' },
    facts: [
      ['stage-beyonce-destinys-child', 'artist-beyonce-early-group', 'Before her solo career, Beyoncé sang in which group with hits such as Say My Name?', 'Millises hittidega „Say My Name“ tuntud ansamblis laulis Beyoncé enne soolokarjääri?', 'Destiny’s Child', 'Destiny’s Child', 'Beyoncé rose to fame as a member of Destiny’s Child before releasing solo albums.', 'Beyoncé sai tuntuks Destiny’s Childi liikmena enne sooloalbumite avaldamist.', 'Destiny%27s_Child', ["Destiny's Child"], ["Destiny's Child"]],
      ['stage-phil-collins-drummer', 'artist-phil-collins-drummer', 'Which Genesis drummer later became the band’s lead singer and a major solo star?', 'Millisest Genesise trummarist sai hiljem bändi laulja ja suur sooloartist?', 'Phil Collins', 'Phil Collins', 'Phil Collins joined Genesis as drummer and took over lead vocals after Peter Gabriel left.', 'Phil Collins liitus Genesisega trummarina ja võttis pärast Peter Gabrieli lahkumist üle laulja rolli.', 'Phil_Collins'],
      ['stage-lady-gaga-stefani', 'artist-lady-gaga-stage-name', 'Stefani Germanotta records pop music under which name?', 'Millise nime all salvestab Stefani Germanotta popmuusikat?', 'Lady Gaga', 'Lady Gaga', 'Stefani Joanne Angelina Germanotta adopted Lady Gaga as her professional name.', 'Stefani Joanne Angelina Germanotta võttis artistinimeks Lady Gaga.', 'Lady_Gaga'],
      ['stage-freddie-mercury-bulsara', 'artist-freddie-mercury-stage-name', 'Farrokh Bulsara became the lead singer of Queen under which name?', 'Millise nime all sai Farrokh Bulsarast Queeni laulja?', 'Freddie Mercury', 'Freddie Mercury', 'Farrokh Bulsara adopted the name Freddie Mercury while building his career with Queen.', 'Farrokh Bulsara võttis Queeniga karjääri alustades nimeks Freddie Mercury.', 'Freddie_Mercury', ['Mercury'], ['Mercury']],
      ['stage-elton-john-reginald-dwight', 'artist-elton-john-stage-name', 'Reginald Kenneth Dwight became famous under which stage name?', 'Millise lavanime all sai kuulsaks Reginald Kenneth Dwight?', 'Elton John', 'Elton John', 'The British singer and pianist legally changed his name to Elton Hercules John.', 'Briti laulja ja pianist muutis oma nime ametlikult Elton Hercules Johniks.', 'Elton_John'],
    ],
  },
  {
    categorySetId: 'built-in-music-set-007',
    batchId: '06-music',
    name: { en: 'Music: Classical Tunes Beyond the Concert Hall', et: 'Muusika: Klassikapalad väljaspool kontserdisaali' },
    facts: [
      ['classical-fur-elise-composer', 'composer-beethoven-fur-elise', 'Which composer wrote the piano favourite Für Elise?', 'Milline helilooja kirjutas populaarse klaveripala „Für Elise“?', 'Ludwig van Beethoven', 'Ludwig van Beethoven', 'Beethoven’s Bagatelle No. 25 in A minor is widely known by its dedication Für Elise.', 'Beethoveni bagatelli nr 25 a-mollis tuntakse laialt pühenduse „Für Elise“ järgi.', 'F%C3%BCr_Elise', ['Beethoven'], ['Beethoven']],
      ['classical-sugar-plum-nutcracker', 'work-nutcracker-sugar-plum', 'The Dance of the Sugar Plum Fairy comes from which Tchaikovsky ballet?', 'Millisest Tšaikovski balletist pärineb Suhkruhaldja tants?', 'The Nutcracker', 'Pähklipureja', 'Tchaikovsky included the Dance of the Sugar Plum Fairy in the second act of The Nutcracker.', 'Tšaikovski lisas Suhkruhaldja tantsu „Pähklipureja“ teise vaatusse.', 'The_Nutcracker', ['Nutcracker'], ['Pähklipureja ballett', 'The Nutcracker']],
      ['classical-bridal-chorus-wagner', 'composer-wagner-bridal-chorus', 'Who composed the Bridal Chorus commonly heard as “Here Comes the Bride”?', 'Kes kirjutas pulmatseremooniatelt tuntud pruudikoori „Here Comes the Bride“?', 'Richard Wagner', 'Richard Wagner', 'Wagner wrote the Bridal Chorus for his opera Lohengrin.', 'Wagner kirjutas pruudikoori ooperile „Lohengrin“.', 'Bridal_Chorus', ['Wagner'], ['Wagner']],
      ['classical-zarathustra-space-odyssey', 'work-also-sprach-zarathustra', 'Which Richard Strauss tone poem accompanies the famous sunrise in Stanley Kubrick’s space epic?', 'Milline Richard Straussi sümfooniline poeem saadab Stanley Kubricku kosmoseeepose kuulsat päikesetõusu?', 'Also sprach Zarathustra', 'Nõnda kõneles Zarathustra', 'Stanley Kubrick used the opening fanfare of Also sprach Zarathustra in 2001: A Space Odyssey.', 'Stanley Kubrick kasutas filmi „2001: Kosmoseodüsseia“ alguses teose „Nõnda kõneles Zarathustra“ fanfaari.', 'Also_sprach_Zarathustra', ['Thus Spoke Zarathustra'], ['Also sprach Zarathustra', 'Nii kõneles Zarathustra']],
      ['classical-o-fortuna-orff', 'composer-carl-orff-o-fortuna', 'Which composer wrote O Fortuna as the opening and closing movement of Carmina Burana?', 'Milline helilooja kirjutas „O Fortuna“ kantaadi „Carmina Burana“ ava- ja lõpupalaks?', 'Carl Orff', 'Carl Orff', 'Carl Orff set the medieval poem O Fortuna to music in his cantata Carmina Burana.', 'Carl Orff viis keskaegse luuletuse „O Fortuna“ muusikasse kantaadis „Carmina Burana“.', 'O_Fortuna', ['Orff'], ['Orff']],
    ],
  },
  {
    categorySetId: 'built-in-music-set-008',
    batchId: '06-music',
    name: { en: 'Music: Hits with a Hidden Connection', et: 'Muusika: Hittide varjatud seosed' },
    facts: [
      ['connection-abba-waterloo', 'event-waterloo-abba-song', 'Which battle gave its name to the song that won Eurovision for ABBA?', 'Milline lahing andis nime laulule, millega ABBA Eurovisiooni võitis?', 'the Battle of Waterloo', 'Waterloo lahing', 'ABBA’s song compares a romantic surrender with Napoleon’s defeat at Waterloo.', 'ABBA laul võrdleb romantilist alistumist Napoleoni kaotusega Waterloo lahingus.', 'Waterloo_(ABBA_song)', ['Waterloo'], ['Waterloo']],
      ['connection-queen-waynes-world', 'film-waynes-world-bohemian-rhapsody', 'Which comedy film sent its characters headbanging in a car to Queen’s Bohemian Rhapsody?', 'Millises komöödiafilmis kuulavad tegelased autos Queeni „Bohemian Rhapsodyt“ ja loobivad pead?', 'Wayne’s World', 'Wayne’i maailm', 'The car singalong in Wayne’s World helped return Bohemian Rhapsody to the charts.', 'Filmi „Wayne’i maailm“ autostseen aitas „Bohemian Rhapsody“ uuesti edetabelitesse.', 'Wayne%27s_World_(film)', ["Wayne's World"], ["Wayne's World"]],
      ['connection-smoke-on-water-band', 'artist-deep-purple-smoke-on-water', 'Which band turned a casino fire beside Lake Geneva into the song Smoke on the Water?', 'Milline bänd tegi Genfi järve ääres puhkenud kasiinopõlengust laulu „Smoke on the Water“?', 'Deep Purple', 'Deep Purple', 'Deep Purple wrote Smoke on the Water after seeing smoke spread over Lake Geneva from the Montreux Casino fire.', 'Deep Purple kirjutas „Smoke on the Wateri“ pärast seda, kui Montreux’ kasiino põlengu suits levis üle Genfi järve.', 'Smoke_on_the_Water'],
      ['connection-space-oddity-film', 'film-space-odyssey-bowie-title', 'Which science-fiction film inspired the title of David Bowie’s song Space Oddity?', 'Milline ulmefilm inspireeris David Bowie laulu „Space Oddity“ pealkirja?', '2001: A Space Odyssey', '2001: Kosmoseodüsseia', 'Bowie’s title was a play on 2001: A Space Odyssey, which he saw before writing the song.', 'Bowie pealkiri mängis filmi „2001: Kosmoseodüsseia“ nimega; ta nägi filmi enne laulu kirjutamist.', 'Space_Oddity', ['2001', 'A Space Odyssey'], ['2001', 'Kosmoseodüsseia']],
      ['connection-nokia-tune-tarrega', 'composer-francisco-tarrega-nokia-tune', 'The Nokia tune borrows a phrase from Gran Vals by which Spanish classical guitarist?', 'Nokia helin laenab fraasi millise Hispaania klassikalise kitarristi teosest „Gran Vals“?', 'Francisco Tárrega', 'Francisco Tárrega', 'The familiar Nokia tune comes from a phrase in Tárrega’s 1902 guitar piece Gran Vals.', 'Tuntud Nokia helin pärineb Tárrega 1902. aasta kitarripala „Gran Vals“ fraasist.', 'Nokia_tune', ['Tárrega', 'Francisco Tarrega'], ['Tárrega', 'Francisco Tarrega']],
    ],
  },
  {
    categorySetId: 'built-in-film-television-set-002',
    batchId: '07-film-television',
    name: { en: 'Film & Television: Objects with Starring Roles', et: 'Film ja televisioon: Esemed peaosas' },
    facts: [
      ['object-golden-ticket', 'object-golden-ticket-wonka', 'Which precious-looking ticket wins a child a tour of Willy Wonka’s chocolate factory?', 'Milline hinnalise välimusega pilet viib lapse Willy Wonka šokolaadivabriku ekskursioonile?', 'a Golden Ticket', 'kuldne pilet', 'Five Golden Tickets hidden in chocolate bars admit their finders to Wonka’s factory.', 'Viis šokolaaditahvlitesse peidetud kuldset piletit viivad leidjad Wonka vabrikusse.', 'Charlie_and_the_Chocolate_Factory', ['Golden Ticket'], ['kuldpilet']],
      ['object-sorting-hat', 'object-sorting-hat-harry-potter', 'Which talking piece of headwear assigns new Hogwarts pupils to their houses?', 'Milline rääkiv peakate jagab uued Sigatüüka õpilased kooli majadesse?', 'the Sorting Hat', 'sõõlamiskübar', 'The Sorting Hat examines each new pupil and announces the Hogwarts house they will join.', 'Sõõlamiskübar hindab iga uut õpilast ning kuulutab, millise Sigatüüka majaga ta liitub.', 'Magical_objects_in_Harry_Potter#Sorting_Hat', ['Sorting Hat'], ['Sõõlamiskübar']],
      ['object-aladdin-magic-carpet', 'object-magic-carpet-aladdin', 'Which flying object takes Aladdin and Jasmine on a journey above the city?', 'Milline lendav ese viib Aladdini ja Jasmine’i linna kohale sõitma?', 'the magic carpet', 'võluvaip', 'The magic carpet is a living flying companion that carries Aladdin and Jasmine through the sky.', 'Võluvaip on elav lendav kaaslane, kes kannab Aladdini ja Jasmine’i läbi taeva.', 'Aladdin_(1992_Disney_film)', ['magic carpet', 'Carpet'], ['lendav vaip', 'võluvaip']],
      ['object-matrix-red-pill', 'object-red-pill-matrix', 'Which pill does Neo choose when he decides to learn the truth about the Matrix?', 'Millise tableti valib Neo, kui otsustab Maatriksi kohta tõe teada saada?', 'the red pill', 'punane tablett', 'Morpheus offers Neo a red pill that reveals reality and a blue pill that would return him to ordinary life.', 'Morpheus pakub Neole punast tabletti, mis paljastab tegelikkuse, ja sinist, mis viiks ta tavaellu tagasi.', 'Red_pill_and_blue_pill', ['red pill'], ['punane pill']],
      ['object-rosebud-sled', 'object-rosebud-sled', 'In Citizen Kane, what kind of childhood object bears the name Rosebud?', 'Milline lapsepõlveese kannab filmis „Kodanik Kane“ nime Rosebud?', 'a sled', 'kelk', 'Rosebud is the name painted on Charles Foster Kane’s childhood sled.', 'Rosebud on Charles Foster Kane’i lapsepõlvekelgule maalitud nimi.', 'Citizen_Kane', ['sled', 'sledge'], ['lapsepõlvekelk']],
    ],
  },
  {
    categorySetId: 'built-in-film-television-set-003',
    batchId: '07-film-television',
    name: { en: 'Film & Television: Fictional Places You Can Picture', et: 'Film ja televisioon: Tuttavad väljamõeldud paigad' },
    facts: [
      ['place-hogwarts', 'place-hogwarts-screen', 'Which school does Harry Potter attend to learn magic?', 'Millises koolis õpib Harry Potter maagiat?', 'Hogwarts', 'Sigatüüka', 'Hogwarts School of Witchcraft and Wizardry trains young witches and wizards in the series.', 'Sigatüüka nõiduse ja võlukunsti kool õpetab sarjas noori nõidu ja võlureid.', 'Hogwarts', ['Hogwarts School of Witchcraft and Wizardry'], ['Hogwarts', 'Sigatüüka kool']],
      ['place-bikini-bottom', 'place-bikini-bottom-screen', 'What underwater town is home to SpongeBob SquarePants?', 'Millises veealuses linnas elab Käsna-Kalle Kantpüks?', 'Bikini Bottom', 'Bikiini põhi', 'SpongeBob works and lives in the fictional undersea city of Bikini Bottom.', 'Käsna-Kalle töötab ja elab väljamõeldud veealuses linnas Bikiini põhi.', 'Bikini_Bottom', ['Bikini Bottom town'], ['Bikini Bottom']],
      ['place-wakanda', 'place-wakanda-screen', 'Which hidden African kingdom is ruled by Black Panther?', 'Millist varjatud Aafrika kuningriiki valitseb Must Panter?', 'Wakanda', 'Wakanda', 'Wakanda is the technologically advanced homeland of Black Panther in Marvel stories.', 'Wakanda on Marveli lugudes Musta Pantri tehnoloogiliselt arenenud kodumaa.', 'Wakanda'],
      ['place-springfield-simpsons', 'place-springfield-simpsons', 'Which fictional town is home to the Simpson family?', 'Millises väljamõeldud linnas elab Simpsonite perekond?', 'Springfield', 'Springfield', 'The Simpsons live in Springfield, whose exact US state is deliberately left uncertain.', 'Simpsonid elavad Springfieldis, mille täpne USA osariik jäetakse meelega ebaselgeks.', 'Springfield_(The_Simpsons)'],
      ['place-mount-doom', 'place-mount-doom-screen', 'At which volcano must the One Ring be destroyed?', 'Millises vulkaanis tuleb Üks Sõrmus hävitada?', 'Mount Doom', 'Hukatuse mägi', 'The Ring can be unmade only in the fires of Mount Doom where it was forged.', 'Sõrmuse saab hävitada üksnes Hukatuse mäe tules, kus see sepistati.', 'Mount_Doom', ['Orodruin'], ['Mount Doom', 'Orodruin']],
    ],
  },
  {
    categorySetId: 'built-in-film-television-set-004',
    batchId: '07-film-television',
    name: { en: 'Film & Television: Animated Heroes and Helpers', et: 'Film ja televisioon: Animafilmide kangelased ja abilised' },
    facts: [
      ['animated-olaf', 'character-olaf-frozen', 'Which cheerful snowman dreams about summer in Frozen?', 'Milline rõõmsameelne lumememm unistab filmis „Lumekuninganna ja igavene talv“ suvest?', 'Olaf', 'Olaf', 'Elsa’s magic brings Olaf to life, and he joins Anna and Kristoff on their journey.', 'Elsa võlujõud äratab Olafi ellu ning lumememm ühineb Anna ja Kristoffi teekonnaga.', 'Olaf_(Frozen)'],
      ['animated-woody', 'character-woody-toy-story', 'Which cowboy doll leads the toys in Toy Story?', 'Milline kauboinukk juhib „Leluloo“ mänguasju?', 'Woody', 'Woody', 'Woody is Andy’s favourite toy and a natural leader among the bedroom toys.', 'Woody on Andy lemmikmänguasi ja magamistoa mänguasjade loomulik juht.', 'Woody_(Toy_Story)'],
      ['animated-dory', 'character-dory-finding-nemo', 'Which forgetful blue fish helps Marlin search for his son in Finding Nemo?', 'Milline hajameelne sinine kala aitab Marlinil filmis „Kalapoeg Nemo“ poega otsida?', 'Dory', 'Dory', 'Dory accompanies Marlin across the ocean despite her short-term memory loss.', 'Dory saadab Marlinit üle ookeani hoolimata oma lühimälu häirest.', 'Dory_(Finding_Nemo)'],
      ['animated-toothless', 'character-toothless-dragon', 'What is the name of Hiccup’s black dragon in How to Train Your Dragon?', 'Mis on Hiccupi musta draakoni nimi filmis „Kuidas taltsutada lohet“?', 'Toothless', 'Hambutu', 'Hiccup befriends the Night Fury dragon Toothless and learns to fly with him.', 'Hiccup sõbruneb Öise Raevu draakoni Hambutuga ning õpib temaga lendama.', 'Toothless_(How_to_Train_Your_Dragon)', ['Toothless the dragon'], ['Toothless']],
      ['animated-rafiki', 'character-rafiki-lion-king', 'Which wise mandrill presents the newborn Simba to the animals in The Lion King?', 'Milline tark mandrill esitleb „Lõvikuningas“ vastsündinud Simbat teistele loomadele?', 'Rafiki', 'Rafiki', 'Rafiki serves as a spiritual adviser and raises Simba at Pride Rock.', 'Rafiki on vaimne nõuandja ning tõstab Simba Uhkusekaljul kõrgele.', 'Rafiki'],
    ],
  },
  {
    categorySetId: 'built-in-film-television-set-011',
    batchId: '07-film-television',
    name: { en: 'Film & Television: How Movie Magic Is Made', et: 'Film ja televisioon: Kuidas sünnib filmimaagia' },
    facts: [
      ['movie-green-screen', 'technique-green-screen', 'What coloured backdrop lets filmmakers replace the background with another image?', 'Milline värviline taust võimaldab filmitegijatel asendada tausta teise pildiga?', 'green screen', 'roheline ekraan', 'Green-screen compositing removes a selected colour and combines the foreground with a new background.', 'Rohelise ekraani komposiit eemaldab valitud värvi ning ühendab esiplaani uue taustaga.', 'Chroma_key', ['chroma key', 'blue screen'], ['chroma key', 'sinine ekraan']],
      ['movie-clapperboard', 'object-clapperboard-film-set', 'What hinged slate is snapped at the start of a take to help match sound with picture?', 'Millist hingega tahvlit lüüakse kaadri alguses kokku, et heli ja pilt hiljem sünkroonida?', 'a clapperboard', 'võtteklapp', 'A clapperboard records scene and take information, while its sharp clap gives editors a synchronisation point.', 'Võtteklapile märgitakse stseeni ja duubli andmed ning klapi terav heli annab monteerijale sünkroonimispunkti.', 'Clapperboard', ['film slate', 'clapper'], ['klapp', 'filmiklapp']],
      ['movie-stop-motion', 'technique-stop-motion', 'What animation technique photographs a model, moves it slightly, and repeats the process frame by frame?', 'Milline animatsioonitehnika pildistab mudelit, liigutab seda veidi ja kordab protsessi kaaderhaaval?', 'stop motion', 'stoppkaaderanimatsioon', 'Stop motion creates movement from a sequence of photographs of physically adjusted objects.', 'Stoppkaaderanimatsioon loob liikumise füüsiliselt muudetud esemete fotode jadast.', 'Stop_motion', ['stop-motion animation'], ['stop motion']],
      ['movie-motion-capture', 'technique-motion-capture', 'What technique records a performer’s body movements to animate a digital character?', 'Milline tehnika salvestab näitleja kehaliigutused, et animeerida digitaalset tegelast?', 'motion capture', 'liikumise jäädvustamine', 'Motion-capture systems translate tracked performance data into movement for a computer-generated character.', 'Liikumise jäädvustamise süsteemid kannavad salvestatud näitlejatöö arvutitegelase liikumisse.', 'Motion_capture', ['performance capture', 'mocap'], ['motion capture', 'mocap']],
      ['movie-foley-artist', 'profession-foley-artist', 'Who records footsteps, rustling clothes, and other everyday noises for a film soundtrack?', 'Kes salvestab filmi heliriba jaoks samme, riiete sahinat ja muid igapäevahelisid?', 'Foley artist', 'Foley helikunstnik', 'Foley artists recreate synchronised everyday sound effects while watching the finished picture.', 'Foley helikunstnikud loovad valminud pilti vaadates sünkroonseid igapäevaseid heliefekte.', 'Foley_(filmmaking)', ['Foley performer'], ['Foley kunstnik']],
    ],
  },
  {
    categorySetId: 'built-in-film-television-set-013',
    batchId: '07-film-television',
    name: { en: 'Film & Television: Familiar TV Settings', et: 'Film ja televisioon: Telesarjade tuttavad tegevuspaigad' },
    facts: [
      ['tv-dunder-mifflin-office', 'work-office-dunder-mifflin', 'Which mockumentary comedy is set at the Dunder Mifflin paper company?', 'Milline mokumentaalkomöödia toimub paberifirmas Dunder Mifflin?', 'The Office', 'Kontor', 'The American version of The Office follows employees at Dunder Mifflin’s Scranton branch.', 'Sarja „Kontor“ Ameerika versioon jälgib Dunder Mifflini Scrantoni haru töötajaid.', 'The_Office_(American_TV_series)', ['Office'], ['The Office']],
      ['tv-stars-hollow-gilmore-girls', 'work-gilmore-girls-stars-hollow', 'Which series follows Lorelai and Rory in the small town of Stars Hollow?', 'Milline sari jälgib Lorelaid ja Roryt väikelinnas Stars Hollow?', 'Gilmore Girls', 'Gilmore’i tüdrukud', 'Gilmore Girls centres on a mother and daughter whose lives unfold in fictional Stars Hollow.', '„Gilmore’i tüdrukud“ keskendub emale ja tütrele, kelle elu kulgeb väljamõeldud Stars Hollow’s.', 'Gilmore_Girls', ['The Gilmore Girls'], ['Gilmore Girls']],
      ['tv-frasier-seattle-radio', 'work-frasier-seattle-radio', 'Which sitcom follows a psychiatrist who hosts a radio advice show in Seattle?', 'Milline komöödiasari jälgib Seattle’is raadio nõuandesaadet juhtivat psühhiaatrit?', 'Frasier', 'Frasier', 'Frasier Crane returns to Seattle and becomes the host of a call-in radio programme.', 'Frasier Crane naaseb Seattle’isse ning hakkab juhtima kuulajate kõnedega raadiosaadet.', 'Frasier'],
      ['tv-boston-bar-cheers', 'work-cheers-bar', 'Which sitcom takes place in a Boston bar where “everybody knows your name”?', 'Milline komöödiasari toimub Bostoni baaris, kus „kõik teavad su nime“?', 'Cheers', 'Cheers', 'Cheers centres on the staff and regular customers of its namesake Boston bar.', '„Cheers“ keskendub samanimelise Bostoni baari töötajatele ja püsiklientidele.', 'Cheers'],
      ['tv-sterling-cooper-mad-men', 'work-mad-men-agency', 'Which drama follows advertising executives at the New York agency Sterling Cooper?', 'Milline draamasari jälgib New Yorgi agentuuri Sterling Cooper reklaamijuhte?', 'Mad Men', 'Pöörased', 'Mad Men centres on Don Draper and colleagues at a changing Madison Avenue advertising agency.', '„Pöörased“ keskendub Don Draperile ja tema kolleegidele muutuvas Madison Avenue reklaamiagentuuris.', 'Mad_Men', ['Madmen'], ['Mad Men']],
    ],
  },
  {
    categorySetId: 'built-in-film-television-set-014',
    batchId: '07-film-television',
    name: { en: 'Film & Television: Competition Shows with a Twist', et: 'Film ja televisioon: Omapärased võistlussaated' },
    facts: [
      ['tv-dancing-with-stars', 'work-dancing-with-stars-format', 'Which US competition pairs celebrities with professional ballroom dancers?', 'Milline USA võistlussaade paneb kuulsused paari elukutseliste võistlustantsijatega?', 'Dancing with the Stars', 'Dancing with the Stars', 'Dancing with the Stars teams each celebrity with a professional dancer for judged live routines.', '„Dancing with the Stars“ seab iga kuulsuse paari elukutselise tantsijaga ning hindab nende etteasteid.', 'Dancing_with_the_Stars', ['DWTS'], ['Tantsud tähtedega']],
      ['tv-masked-singer', 'work-masked-singer-format', 'Which singing contest hides celebrity performers inside elaborate costumes?', 'Milline lauluvõistlus peidab kuulsad esinejad uhkete kostüümide sisse?', 'The Masked Singer', 'Maskis laulja', 'The Masked Singer asks a panel and audience to guess the celebrities singing behind masks.', '„Maskis laulja“ paneb žürii ja publiku arvama, millised kuulsused maskide taga laulavad.', 'Masked_Singer', ['Masked Singer'], ['The Masked Singer']],
      ['tv-ninja-warrior', 'work-ninja-warrior-format', 'Which obstacle-course competition grew from the Japanese programme Sasuke?', 'Milline takistusrajavõistlus kasvas välja Jaapani saatest „Sasuke“?', 'Ninja Warrior', 'Ninja Warrior', 'Ninja Warrior tests competitors on increasingly difficult obstacles adapted from the Japanese format Sasuke.', '„Ninja Warrior“ paneb võistlejad proovile üha raskematel takistustel ning põhineb Jaapani saatel „Sasuke“.', 'Sasuke_(TV_series)', ['American Ninja Warrior'], ['American Ninja Warrior']],
      ['tv-bake-off', 'work-great-british-bake-off-format', 'Which British competition judges amateur bakers in a large white tent?', 'Milline Briti võistlussaade hindab harrastuspagarite töid suures valges telgis?', 'The Great British Bake Off', 'The Great British Bake Off', 'The Great British Bake Off gives amateur bakers weekly technical and creative challenges.', '„The Great British Bake Off“ annab harrastuspagaritele igal nädalal tehnilisi ja loomingulisi ülesandeid.', 'The_Great_British_Bake_Off', ['Great British Bake Off', 'Bake Off', 'The Great British Baking Show'], ['Great British Bake Off', 'Bake Off']],
      ['tv-taskmaster', 'work-taskmaster-format', 'Which British comedy competition makes comedians complete strange tasks for points awarded by Greg Davies?', 'Milline Briti komöödiavõistlus paneb koomikud täitma veidraid ülesandeid, mille eest jagab punkte Greg Davies?', 'Taskmaster', 'Taskmaster', 'Taskmaster combines filmed challenges with studio judging by the programme’s Taskmaster.', '„Taskmaster“ ühendab filmitud ülesanded stuudiohindamisega, mida juhib saate Taskmaster.', 'Taskmaster_(TV_series)'],
    ],
  },
  {
    categorySetId: 'built-in-film-television-set-019',
    batchId: '07-film-television',
    name: { en: 'Film & Television: The Actors Behind the Characters', et: 'Film ja televisioon: Tegelaste taga olevad näitlejad' },
    facts: [
      ['actor-rowan-atkinson-bean', 'person-rowan-atkinson-bean', 'Who plays the almost wordless comic character Mr. Bean?', 'Kes mängib peaaegu sõnatut koomilist tegelast Mr. Beani?', 'Rowan Atkinson', 'Rowan Atkinson', 'Rowan Atkinson created and portrayed Mr. Bean on television and in feature films.', 'Rowan Atkinson lõi Mr. Beani tegelaskuju ning mängis teda televisioonis ja filmides.', 'Rowan_Atkinson', ['Atkinson'], ['Atkinson']],
      ['actor-johnny-depp-sparrow', 'person-johnny-depp-sparrow', 'Who plays Captain Jack Sparrow in Pirates of the Caribbean?', 'Kes mängib „Kariibi mere piraatides“ kapten Jack Sparrow’d?', 'Johnny Depp', 'Johnny Depp', 'Johnny Depp introduced Captain Jack Sparrow in The Curse of the Black Pearl.', 'Johnny Depp tõi kapten Jack Sparrow’ ekraanile filmis „Musta Pärli needus“.', 'Johnny_Depp', ['Depp'], ['Depp']],
      ['actor-emma-watson-hermione', 'person-emma-watson-hermione', 'Who plays Hermione Granger in the Harry Potter films?', 'Kes mängib Harry Potteri filmides Hermione Grangerit?', 'Emma Watson', 'Emma Watson', 'Emma Watson portrayed Hermione throughout the eight-film Harry Potter series.', 'Emma Watson mängis Hermionet kõigis kaheksas Harry Potteri filmis.', 'Emma_Watson', ['Watson'], ['Watson']],
      ['actor-hugh-jackman-wolverine', 'person-hugh-jackman-wolverine', 'Who played Wolverine in the original X-Men film trilogy?', 'Kes mängis Wolverine’i algupärases „X-Meni“ filmitriloogias?', 'Hugh Jackman', 'Hugh Jackman', 'Hugh Jackman began his long-running screen role as Wolverine in X-Men.', 'Hugh Jackman alustas oma pikaajalist Wolverine’i rolli filmis „X-Men“.', 'Hugh_Jackman', ['Jackman'], ['Jackman']],
      ['actor-phoebe-waller-bridge-fleabag', 'person-phoebe-waller-bridge-fleabag', 'Who created, wrote, and starred as the unnamed heroine of Fleabag?', 'Kes lõi ja kirjutas sarja „Fleabag“ ning mängis selle nimeta peategelast?', 'Phoebe Waller-Bridge', 'Phoebe Waller-Bridge', 'Phoebe Waller-Bridge adapted Fleabag from her stage monologue and played its central character.', 'Phoebe Waller-Bridge kohandas „Fleabagi“ oma lavamonoloogist ning mängis sarja keskset tegelast.', 'Phoebe_Waller-Bridge', ['Waller-Bridge', 'Phoebe Waller Bridge'], ['Waller-Bridge', 'Phoebe Waller Bridge']],
    ],
  },
  {
    categorySetId: 'built-in-film-television-set-020',
    batchId: '07-film-television',
    name: { en: 'Film & Television: Lines That Escaped the Screen', et: 'Film ja televisioon: Ekraanilt rahvasuhu jõudnud repliigid' },
    facts: [
      ['quote-force-star-wars', 'work-star-wars-force-quote', 'Which film saga gave popular culture the blessing “May the Force be with you”?', 'Millisest filmisaagast pärineb soov „Olgu jõud sinuga“?', 'Star Wars', 'Tähesõjad', 'Characters throughout Star Wars use the phrase to wish one another luck and spiritual strength.', '„Tähesõdade“ tegelased soovivad selle fraasiga üksteisele õnne ja vaimujõudu.', 'May_the_Force_be_with_you', ['the Star Wars saga'], ['Star Wars']],
      ['quote-ill-be-back-terminator', 'character-terminator-quote', 'Which cyborg says “I’ll be back” before returning to a police station?', 'Milline küborg ütleb enne politseijaoskonda naasmist „I’ll be back“?', 'the Terminator', 'Terminaator', 'Arnold Schwarzenegger’s cyborg delivers the line in the 1984 film The Terminator.', 'Arnold Schwarzeneggeri küborg lausub selle repliigi 1984. aasta filmis „Terminaator“.', 'I%27ll_be_back', ['Terminator', 'T-800'], ['the Terminator', 'T-800']],
      ['quote-why-so-serious-joker', 'character-joker-quote', 'Which villain repeatedly asks “Why so serious?” in The Dark Knight?', 'Milline kurikael küsib filmis „Pimeduse rüütel“ korduvalt „Why so serious?“?', 'the Joker', 'Jokker', 'Heath Ledger’s Joker uses the question while telling conflicting stories about his scars.', 'Heath Ledgeri Jokker kasutab seda küsimust oma armidest vastuolulisi lugusid jutustades.', 'Joker_(The_Dark_Knight)', ['Joker'], ['the Joker']],
      ['quote-nobody-puts-baby-corner', 'work-dirty-dancing-quote', 'Which dance film ends with the declaration “Nobody puts Baby in a corner”?', 'Milline tantsufilm lõpeb kuulsa lausega „Nobody puts Baby in a corner“?', 'Dirty Dancing', 'Räpane tants', 'Johnny says the line before bringing Baby onto the stage for the final dance.', 'Johnny ütleb selle lause enne, kui viib Baby lõputantsuks lavale.', 'Dirty_Dancing', ['Dirty Dancing film'], ['Dirty Dancing']],
      ['quote-cant-handle-truth', 'work-few-good-men-quote', 'Which courtroom drama contains Jack Nicholson’s outburst “You can’t handle the truth!”?', 'Millises kohtudraamas hüüab Jack Nicholson „You can’t handle the truth!“?', 'A Few Good Men', 'A Few Good Men', 'Colonel Jessup shouts the line during the climactic courtroom cross-examination.', 'Kolonel Jessup hüüab selle lause filmi haripunkti ristküsitluses.', 'A_Few_Good_Men', ['Few Good Men'], ['Few Good Men']],
    ],
  },
  {
    categorySetId: 'built-in-sports-games-set-001',
    batchId: '08-sports-games',
    name: { en: 'Sports & Games: One Move, One Score', et: 'Sport ja mängud: Üks liigutus, üks skoor' },
    facts: [
      ['score-football-goal', 'score-goal-football', 'What is scored when the whole ball crosses the line between the posts in football?', 'Mis saadakse jalgpallis siis, kui pall ületab täielikult postide vahelise joone?', 'a goal', 'värav', 'A football goal counts when the entire ball crosses the goal line within the frame.', 'Jalgpallis loetakse värav siis, kui kogu pall ületab väravaraami sees väravajoone.', 'Goal_(sports)', ['goal'], ['jalgpallivärav']],
      ['score-basketball-slam-dunk', 'move-slam-dunk', 'What powerful basketball shot drives the ball directly down through the hoop?', 'Milline jõuline korvpallivise surub palli ülalt otse läbi korvirõnga?', 'slam dunk', 'pealtpanek', 'A slam dunk is completed when a player jumps and forces the ball down through the basket.', 'Pealtpanekul hüppab mängija üles ning surub palli ülalt läbi korvi.', 'Slam_dunk', ['dunk'], ['dunk', 'pealtpanekuvise']],
      ['score-tennis-ace', 'move-tennis-ace', 'What is a legal tennis serve called when the receiver cannot touch it?', 'Kuidas nimetatakse määrustepärast tennisepallingut, mida vastuvõtja ei suuda puudutada?', 'an ace', 'äss', 'An ace is a serve that lands in the service box and is untouched by the receiver.', 'Äss on õigesse pallingukasti maanduv serv, mida vastuvõtja ei puuduta.', 'Ace_(tennis)', ['ace'], ['ässpalling']],
      ['score-baseball-home-run', 'move-baseball-home-run', 'What baseball hit lets the batter circle all the bases and score without being put out?', 'Milline pesapallilöök võimaldab lööjal läbida kõik pesad ja tuua punkti ilma auti minemata?', 'home run', 'kodujooks', 'A home run allows the batter to complete a circuit of the bases and score.', 'Kodujooks võimaldab lööjal läbida kõik pesad ning tuua meeskonnale punkti.', 'Home_run', ['homer'], ['home run']],
      ['score-rugby-try', 'move-rugby-try', 'What rugby score is made by grounding the ball in the opponents’ in-goal area?', 'Milline ragbipunkt saadakse palli maha surumisel vastase väravaalas?', 'a try', 'try', 'A try is awarded when an attacking player grounds the ball in the opponents’ in-goal area.', 'Try antakse siis, kui ründaja surub palli vastase väravaalas maha.', 'Try_(rugby)', ['try'], ['ragbi-try']],
    ],
  },
  {
    categorySetId: 'built-in-sports-games-set-002',
    batchId: '08-sports-games',
    name: { en: 'Sports & Games: Equipment in Action', et: 'Sport ja mängud: Varustus tegevuses' },
    facts: [
      ['equipment-goalkeeper-gloves', 'equipment-football-goalkeeper-gloves', 'What padded handwear helps a football goalkeeper grip and stop the ball?', 'Millised polsterdatud kindad aitavad jalgpalliväravavahil palli püüda ja tõrjuda?', 'goalkeeper gloves', 'väravavahikindad', 'Goalkeeper gloves add grip and cushioning when the keeper catches or punches the ball.', 'Väravavahikindad parandavad haaret ja pehmendavad lööki, kui väravavaht palli püüab või rusikaga tõrjub.', 'Goalkeeper_gloves', ['goalie gloves', 'keeper gloves'], ['väravavahi kindad']],
      ['equipment-starting-blocks', 'equipment-sprint-starting-blocks', 'What foot braces do sprinters push against at the start of a race?', 'Milliste jalatugede vastu suruvad sprinterid end jooksu stardis?', 'starting blocks', 'stardipakud', 'Starting blocks give sprinters firm angled surfaces from which to launch at the starting signal.', 'Stardipakud annavad sprinterile kindlad kaldpinnad, millelt stardimärguande ajal tõugata.', 'Starting_blocks', ['start blocks'], ['stardiplokid']],
      ['equipment-pommel-horse', 'equipment-pommel-horse', 'Which gymnastics apparatus has two handles on top of a padded body?', 'Millisel võimlemisriistal on polsterdatud kere peal kaks käepidet?', 'pommel horse', 'sanghobune', 'Gymnasts support and swing their bodies around the two pommels of the apparatus.', 'Võimlejad toetuvad sanghobuse kahele sangale ning teevad nende ümber hooglemisi.', 'Pommel_horse', ['side horse'], ['hooglemishobune']],
      ['equipment-scrum-cap', 'equipment-rugby-scrum-cap', 'What soft padded headgear may rugby players wear to protect their ears?', 'Millist pehmet polsterdatud peakatet võivad ragbimängijad kõrvade kaitsmiseks kanda?', 'scrum cap', 'ragbimüts', 'A scrum cap is lightweight protective headgear designed mainly to reduce cuts and abrasions.', 'Ragbimüts on kerge kaitsepeakate, mis aitab eelkõige vähendada lõike- ja marrastushaavu.', 'Scrum_cap', ['rugby headgear'], ['scrum cap', 'ragbipeakate']],
      ['equipment-epee', 'equipment-fencing-epee', 'Which fencing weapon has a large bell guard and allows touches anywhere on the body?', 'Millisel vehklemisrelval on suur kellakujuline käekaitse ning tabada võib kogu keha?', 'épée', 'epee', 'Épée uses the entire body as the valid target and scores with the point of the blade.', 'Epees on kogu keha lubatud märklauaks ning torge registreeritakse tera otsaga.', '%C3%89p%C3%A9e', ['epee'], ['épée']],
    ],
  },
  {
    categorySetId: 'built-in-sports-games-set-003',
    batchId: '08-sports-games',
    name: { en: 'Sports & Games: Traditions Fans Notice', et: 'Sport ja mängud: Tavad, mida fännid märkavad' },
    facts: [
      ['tradition-mexican-wave', 'tradition-stadium-mexican-wave', 'What crowd movement travels around a stadium as neighbouring sections stand and raise their arms?', 'Milline publikuliikumine liigub ümber staadioni, kui kõrvuti sektorid tõusevad ja käed üles tõstavad?', 'the Mexican wave', 'Mehhiko laine', 'In a stadium wave, spectators rise in sequence so a visible crest appears to travel through the crowd.', 'Staadionilaines tõusevad pealtvaatajad järjest, nii et nähtav lainehari liigub läbi publiku.', 'Wave_(audience)', ['the wave', 'stadium wave'], ['laine', 'staadionilaine']],
      ['tradition-all-blacks-haka', 'tradition-all-blacks-haka', 'What Māori challenge do New Zealand’s All Blacks perform before rugby matches?', 'Millist maoori tseremoniaalset esitust teevad Uus-Meremaa All Blacks enne ragbimänge?', 'the haka', 'haka', 'New Zealand rugby teams use haka to express identity and challenge their opponents before play.', 'Uus-Meremaa ragbimeeskonnad väljendavad hakaga oma identiteeti ja esitavad vastasele väljakutse.', 'Haka#New_Zealand_sports_teams', ['haka'], ['haka-tants']],
      ['tradition-wimbledon-strawberries', 'tradition-wimbledon-strawberries-cream', 'Which fruit is traditionally served with cream to spectators at Wimbledon?', 'Millist puuvilja pakutakse Wimbledoni pealtvaatajatele traditsiooniliselt koos koorega?', 'strawberries', 'maasikad', 'Strawberries and cream have long been a signature refreshment at the Wimbledon championships.', 'Maasikad koorega on olnud pikka aega Wimbledoni turniiri tunnusmaiustus.', 'The_Championships,_Wimbledon#Traditions', ['strawberries and cream'], ['maasikad koorega']],
      ['tradition-olympic-medal-bite', 'tradition-olympic-medal-biting-pose', 'What do many Olympic medallists pretend to do to their medals while posing for photographers?', 'Mida teesklevad paljud olümpiamedalistid oma medaliga fotograafidele poseerides?', 'bite them', 'medalit hammustada', 'The medal-biting pose is a modern photo tradition rather than a test of whether the medal is solid gold.', 'Medali hammustamine on tänapäevane fototava, mitte katse kontrollida, kas medal on puhtast kullast.', 'Olympic_medal', ['bite the medal', 'bite it'], ['hammustada', 'medalit näksata']],
      ['tradition-hockey-hat-trick', 'tradition-ice-hockey-hat-trick-hats', 'What do ice-hockey fans traditionally throw onto the rink after a player completes a hat-trick?', 'Mida viskavad jäähokifännid traditsiooniliselt jääle pärast mängija kübaratrikki?', 'hats', 'mütsid', 'Throwing hats onto the ice celebrates a player’s hat-trick of three goals.', 'Mütside jääle viskamisega tähistatakse mängija kolme väravaga kübaratrikki.', 'Hat-trick#Hockey', ['their hats'], ['oma mütsid']],
    ],
  },
  {
    categorySetId: 'built-in-sports-games-set-004',
    batchId: '08-sports-games',
    name: { en: 'Sports & Games: Champions by Their Trademark', et: 'Sport ja mängud: Meistrid tunnusmärgi järgi' },
    facts: [
      ['champion-jordan-airness', 'person-michael-jordan-airness', 'Which Chicago Bulls star was nicknamed His Airness for his spectacular leaps?', 'Millist Chicago Bullsi tähte kutsuti tema võimsate hüpete tõttu hüüdnimega His Airness?', 'Michael Jordan', 'Michael Jordan', 'Michael Jordan’s leaping ability and aerial style inspired the nickname His Airness.', 'Michael Jordani hüppevõime ja õhuline mängustiil tõid talle hüüdnime His Airness.', 'Michael_Jordan', ['Jordan'], ['Jordan']],
      ['champion-bolt-lightning-pose', 'person-usain-bolt-pose', 'Which sprinter celebrated victories with a diagonal “Lightning Bolt” pose?', 'Milline sprinter tähistas võite diagonaalse „välgunoole“ poosiga?', 'Usain Bolt', 'Usain Bolt', 'Usain Bolt’s outstretched victory pose became one of sport’s most recognisable celebrations.', 'Usain Bolti väljasirutatud kätega võidupoosist sai üks spordi tuntumaid tähistusi.', 'Usain_Bolt'],
      ['champion-nadal-king-clay', 'person-rafael-nadal-clay', 'Which tennis player is nicknamed the King of Clay for his record at the French Open?', 'Millist tennisisti kutsutakse tema French Openi edu tõttu saviliivakuningaks?', 'Rafael Nadal', 'Rafael Nadal', 'Rafael Nadal’s topspin-heavy game and movement produced exceptional results on clay courts.', 'Rafael Nadali tugeva vindiga mäng ja liikumine tõid talle saviliivaväljakutel erakordse edu.', 'Rafael_Nadal', ['Nadal'], ['Nadal']],
      ['champion-nurmi-flying-finn', 'person-paavo-nurmi-flying-finn', 'Which distance runner won nine Olympic gold medals and became known as the Flying Finn?', 'Milline pikamaajooksja võitis üheksa olümpiakulda ning sai tuntuks Lendava Soomlasena?', 'Paavo Nurmi', 'Paavo Nurmi', 'Paavo Nurmi dominated middle- and long-distance running during the 1920s.', 'Paavo Nurmi valitses 1920. aastatel kesk- ja pikamaajooksu.', 'Paavo_Nurmi', ['Nurmi'], ['Nurmi']],
      ['champion-comaneci-perfect-ten', 'person-nadia-comaneci-perfect-ten', 'Which Romanian gymnast received the first perfect score in Olympic gymnastics?', 'Milline Rumeenia võimleja sai olümpiavõimlemise ajaloo esimese täiusliku hinde?', 'Nadia Comăneci', 'Nadia Comăneci', 'Nadia Comăneci earned the first Olympic perfect score of 10.0 at the 1976 Montreal Games.', 'Nadia Comăneci teenis 1976. aasta Montreali mängudel olümpiaajaloo esimese täiusliku hinde 10,0.', 'Nadia_Com%C4%83neci', ['Nadia Comaneci', 'Comăneci', 'Comaneci'], ['Nadia Comaneci', 'Comăneci', 'Comaneci']],
    ],
  },
  {
    categorySetId: 'built-in-sports-games-set-005',
    batchId: '08-sports-games',
    name: { en: 'Sports & Games: Famous Sporting Homes', et: 'Sport ja mängud: Kuulsad spordikodud' },
    facts: [
      ['venue-wimbledon-grass', 'venue-wimbledon-grass', 'Which playing surface is used for the Wimbledon tennis championships?', 'Millisel väljakukattel peetakse Wimbledoni tenniseturniiri?', 'grass', 'muru', 'Wimbledon is the only Grand Slam tennis tournament still played on grass courts.', 'Wimbledon on ainus suure slämmi tenniseturniir, mida peetakse endiselt muruväljakutel.', 'The_Championships,_Wimbledon', ['grass court'], ['muruväljak']],
      ['venue-madison-square-garden-city', 'venue-madison-square-garden-city', 'In which city would you attend an event at Madison Square Garden?', 'Millises linnas saab külastada Madison Square Gardeni spordi- ja kontserdiareeni?', 'New York City', 'New York', 'Madison Square Garden stands above Pennsylvania Station in Manhattan, New York City.', 'Madison Square Garden asub New Yorgis Manhattanil Pennsylvania Stationi kohal.', 'Madison_Square_Garden', ['New York', 'NYC'], ['New York City', 'NYC']],
      ['venue-augusta-masters', 'venue-augusta-masters', 'Which major golf tournament is hosted each year at Augusta National?', 'Millist suurt golfiturniiri peetakse igal aastal Augusta Nationalis?', 'the Masters', 'Masters', 'Augusta National Golf Club has hosted the Masters Tournament since 1934.', 'Augusta National Golf Club on võõrustanud Mastersi turniiri alates 1934. aastast.', 'Masters_Tournament', ['Masters Tournament', 'the Masters Tournament'], ['Mastersi turniir', 'The Masters']],
      ['venue-silverstone-british-grand-prix', 'event-british-grand-prix-silverstone', 'Which Formula 1 Grand Prix is most closely associated with the Silverstone circuit?', 'Millise vormel 1 Grand Prix’ga seostub kõige tihedamalt Silverstone’i ringrada?', 'the British Grand Prix', 'Suurbritannia Grand Prix', 'Silverstone hosted the first Formula 1 World Championship race and remains the regular home of the British Grand Prix.', 'Silverstone võõrustas esimest vormel 1 maailmameistrivõistluste etappi ning on Suurbritannia Grand Prix’ tavapärane kodu.', 'British_Grand_Prix', ['British GP'], ['Briti Grand Prix', 'Suurbritannia GP']],
      ['venue-lords-cricket', 'sport-cricket-lords-ground', 'Which sport calls Lord’s ground in London its traditional home?', 'Milline spordiala peab Londoni Lord’si väljakut oma traditsiooniliseks koduks?', 'cricket', 'kriket', 'Lord’s Cricket Ground is owned by Marylebone Cricket Club and is widely called the Home of Cricket.', 'Marylebone Cricket Clubile kuuluvat Lord’si väljakut nimetatakse laialt kriketi koduks.', 'Lord%27s', ['the sport of cricket'], ['kriketimäng']],
    ],
  },
  {
    categorySetId: 'built-in-sports-games-set-006',
    batchId: '08-sports-games',
    name: { en: 'Sports & Games: Games for a Sunny Park', et: 'Sport ja mängud: Mängud päikeselises pargis' },
    facts: [
      ['park-flying-disc', 'game-flying-disc-catch', 'What flat plastic disc is thrown with a spinning motion between players?', 'Millist lamedat plastketast viskavad mängijad üksteisele pöörleva liigutusega?', 'a flying disc', 'lendav taldrik', 'A flying disc stays aloft through its spinning stability and aerodynamic shape.', 'Lendav taldrik püsib õhus tänu pöörlemisele ja aerodünaamilisele kujule.', 'Flying_disc', ['Frisbee', 'frisbee'], ['frisbi']],
      ['park-hopscotch', 'game-hopscotch-chalk-grid', 'Which playground game has players hop through numbered squares drawn on the ground?', 'Millises õuemängus hüpatakse läbi maapinnale joonistatud nummerdatud ruutude?', 'hopscotch', 'keks', 'Hopscotch players toss a marker and hop through a sequence of spaces, usually on one foot.', 'Keksus visatakse tähis ruudule ning hüpatakse väljade jada tavaliselt ühel jalal.', 'Hopscotch', ['hop-scotch'], ['keksumäng']],
      ['park-geocaching', 'game-geocaching-gps-containers', 'Which outdoor treasure hunt uses GPS coordinates to find hidden containers?', 'Milline õues toimuv aardejaht kasutab peidetud konteinerite leidmiseks GPS-koordinaate?', 'geocaching', 'geopeitus', 'Geocachers navigate to published coordinates, sign a log, and return the container to its hiding place.', 'Geopeituse mängijad liiguvad avaldatud koordinaatidele, kirjutavad logisse ja panevad konteineri peidukohta tagasi.', 'Geocaching', ['geo-caching'], ['geopeituse mäng']],
      ['park-petanque', 'game-petanque-metal-boules', 'Which French lawn game throws metal balls as close as possible to a small wooden target ball?', 'Millises Prantsuse murumängus visatakse metallkuule võimalikult väikese puidust märkekuuli lähedale?', 'pétanque', 'petank', 'Pétanque players stand in a circle and aim steel boules at a small target called the jack.', 'Petangimängijad seisavad ringis ning sihivad teraskuule väikese märkekuuli poole.', 'P%C3%A9tanque', ['petanque', 'boules'], ['pétanque']],
      ['park-kubb', 'game-kubb-wooden-king', 'Which Swedish lawn game throws wooden batons at blocks before players may topple the king?', 'Millises Rootsi murumängus visatakse puukurikaid klotside pihta ning alles lõpus tohib kukutada kuninga?', 'kubb', 'kubb', 'Kubb teams knock down their opponents’ wooden blocks and must topple the king last.', 'Kubbi meeskonnad kukutavad vastaste puuklotse ning peavad kuninga maha saama viimasena.', 'Kubb', ['Viking chess'], ['viikingimale']],
    ],
  },
  {
    categorySetId: 'built-in-sports-games-set-007',
    batchId: '08-sports-games',
    name: { en: 'Sports & Games: Around the Game Table', et: 'Sport ja mängud: Ümber mängulaua' },
    facts: [
      ['table-monopoly-jail-card', 'object-monopoly-jail-card', 'Which Monopoly card lets a player leave jail without paying or rolling doubles?', 'Milline Monopoly kaart lubab mängijal vanglast väljuda ilma maksmata või duublit veeretamata?', 'Get Out of Jail Free', 'Vabane vanglast tasuta', 'A Get Out of Jail Free card may be kept until used or traded to another player.', 'Kaarti „Vabane vanglast tasuta“ võib hoida kasutamiseni või teisele mängijale müüa.', 'Monopoly_(game)', ['Get Out of Jail Free card'], ['Vabane vanglast tasuta kaart']],
      ['table-uno-reverse-card', 'object-uno-reverse-card', 'Which UNO card changes play from clockwise to anticlockwise, or back again?', 'Milline UNO kaart muudab mängusuuna päripäevasest vastupäevaseks või vastupidi?', 'the Reverse card', 'suunavahetuskaart', 'Playing a Reverse card changes the direction in which turns pass around the table.', 'Suunavahetuskaart muudab suunda, milles mängukorrad laua ümber liiguvad.', 'Uno_(card_game)', ['Reverse', 'UNO Reverse card'], ['Reverse-kaart', 'suunamuutmise kaart']],
      ['table-scrabble-blank-tile', 'object-scrabble-blank-tile', 'Which Scrabble tile scores no points but may stand for any letter?', 'Milline Scrabble’i klots ei anna punkte, kuid võib asendada ükskõik millist tähte?', 'the blank tile', 'tühi klots', 'A blank Scrabble tile can represent any letter, but its own score remains zero.', 'Tühi Scrabble’i klots võib tähistada ükskõik millist tähte, kuid jääb ise null punkti väärt.', 'Scrabble', ['blank', 'wild tile'], ['tühiklots', 'jokerklots']],
      ['table-catan-desert', 'place-catan-desert-tile', 'Which Catan terrain produces no resource when its number is rolled?', 'Milline Catani maastik ei anna numbri veeretamisel ühtegi ressurssi?', 'the desert', 'kõrb', 'The desert hex has no production number and begins the game with the robber on it.', 'Kõrbe kuusnurgal pole tootmisnumbrit ning röövel alustab mängu sellel.', 'Catan', ['desert'], ['kõrbeala']],
      ['table-backgammon-points', 'work-backgammon-board', 'Which classic game is played with fifteen checkers per player on a board of twenty-four triangular points?', 'Millist klassikalist mängu mängitakse viieteistkümne nupuga mängija kohta kahekümne nelja kolmnurkse väljaga laual?', 'backgammon', 'triktrakk', 'Backgammon players move fifteen checkers around twenty-four points and bear them off the board.', 'Triktrakis liigutab kumbki mängija viisteist nuppu mööda kahtkümmend nelja kolmnurkset välja ja viib need lõpuks laualt välja.', 'Backgammon', ['backgammon game'], ['backgammon']],
    ],
  },
  {
    categorySetId: 'built-in-sports-games-set-008',
    batchId: '08-sports-games',
    name: { en: 'Sports & Games: Video-Game Icons and Sidekicks', et: 'Sport ja mängud: Videomängude ikoonid ja kaaslased' },
    facts: [
      ['game-luigi', 'character-luigi-mario', 'What is the name of Mario’s taller brother in green?', 'Mis on Mario pikema rohelisse riietatud venna nimi?', 'Luigi', 'Luigi', 'Luigi began as Mario’s second-player counterpart and developed into a hero in his own games.', 'Luigi alustas Mario teise mängija vastena ning sai hiljem oma mängude kangelaseks.', 'Luigi'],
      ['game-pokemon-pikachu', 'character-pikachu-mascot', 'Which yellow Electric-type Pokémon is the franchise mascot and Ash’s best-known partner?', 'Milline kollane elektritüüpi Pokémon on sarja maskott ja Ashi tuntuim kaaslane?', 'Pikachu', 'Pikachu', 'Pikachu became the most recognisable Pokémon through the games, anime, and merchandise.', 'Pikachust sai mängude, anime ja meenete kaudu kõige tuntum Pokémon.', 'Pikachu'],
      ['game-zelda-link', 'character-link-zelda', 'What is the name of the green-clad hero controlled in most games in The Legend of Zelda series?', 'Mis on rohelisse riietatud kangelase nimi, keda juhitakse enamikus „The Legend of Zelda“ mängudes?', 'Link', 'Link', 'Link is the recurring playable hero who protects Hyrule and Princess Zelda.', 'Link on korduv mängitav kangelane, kes kaitseb Hyrule’i ja printsess Zeldat.', 'Link_(The_Legend_of_Zelda)', ['Link of Hyrule'], ['Hyrule’i Link']],
      ['game-minecraft-creeper', 'character-minecraft-creeper', 'Which green Minecraft enemy silently approaches players and explodes?', 'Milline roheline Minecrafti vaenlane hiilib mängija ligi ja plahvatab?', 'Creeper', 'Creeper', 'A Creeper detonates near the player and can destroy nearby blocks.', 'Creeper plahvatab mängija lähedal ning võib ümbruskonna plokke purustada.', 'Creeper_(Minecraft)', ['Minecraft Creeper'], ['Minecrafti Creeper']],
      ['game-portal-glados', 'character-glados-portal', 'Which artificial intelligence runs the test chambers and taunts the player in Portal?', 'Milline tehisintellekt juhib mängus „Portal“ katsekambreid ja pilkab mängijat?', 'GLaDOS', 'GLaDOS', 'GLaDOS controls Aperture Science’s testing facility and acts as Portal’s main antagonist.', 'GLaDOS juhib Aperture Science’i katsekeskust ning on „Portali“ peamine vastane.', 'GLaDOS', ['Genetic Lifeform and Disk Operating System'], ['Genetic Lifeform and Disk Operating System']],
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
    key: `retained-easy-05-08:${key}`,
    tier,
    subjectKey: `retained-easy-05-08:${subjectKey}`,
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
  batchId: draft.batchId,
  name: draft.name,
  questions: draft.facts.map((fact, index) =>
    buildQuestion(fact, (index + 1) as 1 | 2 | 3 | 4 | 5)),
}));

export const RETAINED_EASY_05_TO_08_CATEGORIES = validateAccessibleCorpus(
  rawCategories,
  TARGETS,
);

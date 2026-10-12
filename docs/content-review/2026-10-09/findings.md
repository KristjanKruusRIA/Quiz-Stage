# Complete repair backlog

Each entry refers to the frozen 9 October 2026 library. Recommended repairs are proposals. Severity is the original reviewer rating; editorial judgments remain identified separately.

## ROOT-ADULT-001: The Body's Calendar exposes two sibling answers in other prompts.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-002 — The Body's Calendar / Keha kalender.
- Questions: built-in-adult-clue-0007, built-in-adult-clue-0009, built-in-adult-clue-0010.
- Location: [content/generated/14-adult.en-et.csv:8](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0007).
- Location: [content/generated/14-adult.en-et.csv:10](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0009).
- Location: [content/generated/14-adult.en-et.csv:11](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0010).

The menstruation prompt explicitly says pregnancy, the answer to tier4. The menopause prompt explicitly says menstruation, the answer to tier2. These five questions do not remain independent in arbitrary play order.

Example: Open the menopause clue before tier2: the screen already supplies 'menstruation'. Open tier2 before tier4: it supplies 'pregnancy'.

Suggested repair: Replace one repeated cycle-stage item with an independent biological subject or rewrite the dependency-bearing prompts without naming sibling answers, then test every ordered clue pair in both languages.

## ROOT-ADULT-002: The egg clue gives the sperm answer and repeats a two-item fact family.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-004 — How Nature Reproduces / Kuidas loodus paljuneb.
- Questions: built-in-adult-clue-0016, built-in-adult-clue-0017.
- Location: [content/generated/14-adult.en-et.csv:17](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0016).
- Location: [content/generated/14-adult.en-et.csv:18](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0017).

Tier1 explicitly says 'sperm cell' / 'seemnerakuga'; tier2 asks for that male gamete. Female and male gametes also form a tiny complementary answer pool.

Example: Reading tier1 supplies the terminology needed for tier2 before either requires a separate fact.

Suggested repair: Retain at most one gamete-identification clue and replace the other with a different reproduction fact while preserving a broad category.

## ROOT-ADULT-003: Film clues and their explanations supply the divorce answer.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-016 — Breaking Up in Culture and Law / Lahkuminek kultuuris ja õiguses.
- Questions: built-in-adult-clue-0076, built-in-adult-clue-0077, built-in-adult-clue-0078.
- Location: [content/generated/14-adult.en-et.csv:77](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0076).
- Location: [content/generated/14-adult.en-et.csv:78](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0077).
- Location: [content/generated/14-adult.en-et.csv:79](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0078).

Tier3's English prompt says 'divorcing'; both film explanations state 'divorce'. Tier1 asks for the legal process ending marriage. The shared topic is sensible, but sibling wording removes the need to retrieve tier1's answer.

Example: Reveal Marriage Story or Kramer vs. Kramer first: the player-facing explanation supplies 'divorce' before tier1.

Suggested repair: Replace the definitional divorce clue with another independent fact or remove explicit sibling answer terms from the film prompts and explanations.

## ROOT-ADULT-004: Dear John letter is described as a two-name phrase.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-019 — Matches, Messages, and Breakups / Sobitamised, sõnumid ja lahkuminekud.
- Questions: built-in-adult-clue-0095.
- Location: [content/generated/14-adult.en-et.csv:96](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0095).

The answer is a three-word term based on a two-word salutation, with one personal name. 'two-name phrase' and Estonian 'kahe nimega väljend' do not describe it correctly.

Suggested repair: Ask for the letter type without the inaccurate two-name qualifier, or explicitly describe the two-word salutation from which the name derives.

## ROOT-ADULT-005: The Brighton Pride clue supplies the city and event type needed to form its answer.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-023 — Pride Events Around the World / Pride'i üritused ümber maailma.
- Questions: built-in-adult-clue-0111.
- Location: [content/generated/14-adult.en-et.csv:112](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0111).

Both prompts name Brighton and Hove and a Pride festival; the response is Brighton Pride. The whole category repeats city-plus-Pride answers, encouraging a formula once the pattern is known.

Suggested repair: Remove the explicit city name and ask from an independent distinguishing fact, or replace this clue with a different kind of Pride-event fact.

## ROOT-ADULT-006: The parade prompt supplies the rainbow-flag answer.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-025 — Words That Became Movements / Sõnadest said liikumised.
- Questions: built-in-adult-clue-0121, built-in-adult-clue-0122.
- Location: [content/generated/14-adult.en-et.csv:122](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0121).
- Location: [content/generated/14-adult.en-et.csv:123](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0122).

Tier2 explicitly mentions rainbow flags in both languages; tier1 asks for that symbol.

Example: Read the parade question first and the rainbow-flag answer is already on screen.

Suggested repair: Remove the sibling answer from the parade prompt and explanation or replace one clue with a different subject.

## ROOT-ADULT-007: The Ellen clue conflates a TIME cover headline with the sitcom character's dialogue.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-026 — Voices That Changed the Conversation / Vestlust muutnud hääled.
- Questions: built-in-adult-clue-0127.
- Location: [content/generated/14-adult.en-et.csv:128](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0127).

The quoted Yep, I'm gay wording belongs to the April14,1997 TIME cover. ABC dates the character's coming-out episode to April30. The question should not present the cover headline as the character's quoted utterance.

Suggested repair: Ask who appeared on the 1997 TIME cover bearing that headline, or remove the inaccurate direct quotation from the episode question.

Source: [https://time.com/4728994/ellen-degeneres-1997-coming-out-cover/](https://time.com/4728994/ellen-degeneres-1997-coming-out-cover/) — Read publisher retrospective; explicitly identifies wording as cover text.

Source: [https://abc.com/news/d37ccfdc-19f8-409c-9b13-d321997beb38/category/1138628](https://abc.com/news/d37ccfdc-19f8-409c-9b13-d321997beb38/category/1138628) — Read broadcaster retrospective identifying the episode and date; not a transcript.

## ROOT-ADULT-008: The Estonian marriage-equality question requires two words but its answer is one word.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-029 — Rights Around the World / Õigused üle maailma.
- Questions: built-in-adult-clue-0141.
- Location: [content/generated/14-adult.en-et.csv:142](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0141).

Marriage equality is two English words. Abieluvõrdsus is one Estonian compound, so the translated word-count constraint is false.

Suggested repair: Remove the word-count hint from the Estonian prompt.

## A-HIS-001: Armstrong explanation reveals the Apollo-program answer.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-history-set-035 — History: The Space Race / Ajalugu: Kosmosevõidujooks.
- Questions: built-in-history-accessible-corpus-011, built-in-history-accessible-corpus-014.
- Location: [content/generated/01-history.en-et.csv:52](../../../content/generated/01-history.en-et.csv) (built-in-history-accessible-corpus-011).
- Location: [content/generated/01-history.en-et.csv:55](../../../content/generated/01-history.en-et.csv) (built-in-history-accessible-corpus-014).

Tier1 explicitly states Apollo 11, while tier4 asks which NASA program carried astronauts to the Moon. The revealed explanation supplies the program name.

Example: Answer tier1, read "Apollo 11", then answer tier4 "Apollo".

Suggested repair: Move one lunar-program clue to another category or remove the Apollo name from tier1 explanation.

Source: [Neil Armstrong — Wikipedia](https://en.wikipedia.org/wiki/Neil_Armstrong) — stored citation; not externally checked for this editorial finding

Source: [Apollo program — Wikipedia](https://en.wikipedia.org/wiki/Apollo_program) — stored citation; not externally checked for this editorial finding

## A-HIS-002: Suffragette explanation names later requested founder.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-history-set-043 — History: Women's Suffrage / Ajalugu: Naiste valimisõigus.
- Questions: built-in-history-accessible-corpus-016, built-in-history-accessible-corpus-019.
- Location: [content/generated/01-history.en-et.csv:57](../../../content/generated/01-history.en-et.csv) (built-in-history-accessible-corpus-016).
- Location: [content/generated/01-history.en-et.csv:60](../../../content/generated/01-history.en-et.csv) (built-in-history-accessible-corpus-019).

Tier1 explanation names Emmeline Pankhurst; tier4 asks who founded her organization.

Example: The earlier revealed explanation says "Emmeline Pankhurst's organisation", supplying the later person answer.

Suggested repair: Keep the explanation generic or replace one clue with a different suffrage event.

Source: [Suffragette — Wikipedia](https://en.wikipedia.org/wiki/Suffragette) — stored citation; not externally checked for this editorial finding

Source: [Emmeline Pankhurst — Wikipedia](https://en.wikipedia.org/wiki/Emmeline_Pankhurst) — stored citation; not externally checked for this editorial finding

## A-HIS-003: Rosa Parks clue supplies the Montgomery boycott answer.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-history-set-039 — History: The Civil Rights Movement / Ajalugu: Kodanikuõiguste liikumine.
- Questions: built-in-history-accessible-corpus-097, built-in-history-accessible-corpus-098.
- Location: [content/generated/01-history.en-et.csv:138](../../../content/generated/01-history.en-et.csv) (built-in-history-accessible-corpus-097).
- Location: [content/generated/01-history.en-et.csv:139](../../../content/generated/01-history.en-et.csv) (built-in-history-accessible-corpus-098).

Tier2 prompt names Montgomery and its explanation describes the sustained boycott of the segregated bus system. Tier3 requests that protest.

Example: The location Montgomery plus the disclosed bus boycott combine into tier3 answer Montgomery bus boycott.

Suggested repair: Replace one clue with another independent civil-rights milestone.

Source: [Rosa Parks — Wikipedia](https://en.wikipedia.org/wiki/Rosa_Parks) — stored citation; not externally checked for this editorial finding

Source: [Montgomery bus boycott — Wikipedia](https://en.wikipedia.org/wiki/Montgomery_bus_boycott) — stored citation; not externally checked for this editorial finding

## A-HIS-004: English temple clue omits the identifying location.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-history-set-002 — Mesopotamia: Cities, Kings and Clay / Mesopotaamia: linnad, kuningad ja savitahvlid.
- Questions: built-in-history-playable-corpus-004.
- Location: [content/generated/01-history.en-et.csv:175](../../../content/generated/01-history.en-et.csv) (built-in-history-playable-corpus-004).

EN asks only "This great stepped temple" without a picture or name. ET identifies the Great Ziggurat of Ur. The English board text therefore lacks the fact selecting Nanna.

Suggested repair: Add "Great Ziggurat of Ur" to English prompt and accept Sin/Suen as deity variants if the source supports them.

Source: [Ziggurat of Ur — Wikipedia](https://en.wikipedia.org/wiki/Ziggurat_of_Ur) — stored citation; not externally checked for this editorial finding

## A-HIS-005: Akbar appears as a named subject in another clue.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-history-set-079 — Mughal India: Courts, Faith and Architecture / Mogulite India: õukond, usk ja arhitektuur.
- Questions: built-in-history-playable-corpus-061, built-in-history-playable-corpus-064.
- Location: [content/generated/01-history.en-et.csv:232](../../../content/generated/01-history.en-et.csv) (built-in-history-playable-corpus-061).
- Location: [content/generated/01-history.en-et.csv:235](../../../content/generated/01-history.en-et.csv) (built-in-history-playable-corpus-064).

Tier1 asks which emperor promoted Din-i Ilahi; tier4 starts "Akbar built...", disclosing an answer candidate in the same small emperor-focused set.

Example: Choose tier4 first, see Akbar, then answer tier1 with the newly supplied emperor name.

Suggested repair: Replace one Akbar clue or move it to a different category.

Source: [Akbar — Wikipedia](https://en.wikipedia.org/wiki/Akbar) — stored citation; not externally checked for this editorial finding

Source: [Fatehpur Sikri — Wikipedia](https://en.wikipedia.org/wiki/Fatehpur_Sikri) — stored citation; not externally checked for this editorial finding

## A-HIS-006: Copernican cosmology supplies Copernicus for another clue.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-history-set-086 — The Scientific Revolution: New Ways of Knowing / Teadusrevolutsioon: uued teadmise viisid.
- Questions: built-in-history-playable-corpus-071, built-in-history-playable-corpus-073.
- Location: [content/generated/01-history.en-et.csv:242](../../../content/generated/01-history.en-et.csv) (built-in-history-playable-corpus-071).
- Location: [content/generated/01-history.en-et.csv:244](../../../content/generated/01-history.en-et.csv) (built-in-history-playable-corpus-073).

Tier1 prompt explicitly names Copernican cosmology; tier3 asks which astronomer argued for a Sun-centered cosmos. It supplies the same scientist surname.

Example: Tier1 names Copernican cosmology; tier3 answer is Copernicus.

Suggested repair: Replace one author identification clue with a different independent scientific event.

Source: [Dialogue Concerning the Two Chief World Systems — Wikipedia](https://en.wikipedia.org/wiki/Dialogue_Concerning_the_Two_Chief_World_Systems) — stored citation; not externally checked for this editorial finding

Source: [De revolutionibus orbium coelestium — Wikipedia](https://en.wikipedia.org/wiki/De_revolutionibus_orbium_coelestium) — stored citation; not externally checked for this editorial finding

## A-HIS-007: Prague explanation reveals the following capital answer.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-history-set-088 — The Thirty Years’ War: Faith and Statecraft / Kolmekümneaastane sõda: usk ja riigikunst.
- Questions: built-in-history-playable-corpus-076, built-in-history-playable-corpus-077.
- Location: [content/generated/01-history.en-et.csv:247](../../../content/generated/01-history.en-et.csv) (built-in-history-playable-corpus-076).
- Location: [content/generated/01-history.en-et.csv:248](../../../content/generated/01-history.en-et.csv) (built-in-history-playable-corpus-077).

Tier1 explanation names Prague defenestration. Tier2 asks the capital near White Mountain.

Example: Read tier1 explanation "Prague defenestration" and use Prague for tier2.

Suggested repair: Replace one Prague location clue with a different theater or diplomatic outcome.

Source: [Defenestrations of Prague — Wikipedia](https://en.wikipedia.org/wiki/Defenestrations_of_Prague) — stored citation; not externally checked for this editorial finding

Source: [Battle of White Mountain — Wikipedia](https://en.wikipedia.org/wiki/Battle_of_White_Mountain) — stored citation; not externally checked for this editorial finding

## A-HIS-008: Multi-country liberation clue does not uniquely select Bolivar.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-history-set-052 — History: Independence Movements / Ajalugu: Iseseisvusliikumised.
- Questions: built-in-history-accessible-corpus-113, built-in-history-accessible-corpus-114.
- Location: [content/generated/01-history.en-et.csv:154](../../../content/generated/01-history.en-et.csv) (built-in-history-accessible-corpus-113).
- Location: [content/generated/01-history.en-et.csv:155](../../../content/generated/01-history.en-et.csv) (built-in-history-accessible-corpus-114).

The clue asks only a South American leader who helped several countries gain independence from Spain; San Martin, requested in its sibling, also satisfies it. The accepted variants exclude San Martin.

Suggested repair: Name Venezuela/Colombia/Bolivia or the Liberator epithet to distinguish Bolivar.

Source: [Simón Bolívar — Wikipedia](https://en.wikipedia.org/wiki/Sim%C3%B3n_Bol%C3%ADvar) — stored citation; not externally checked for this editorial finding

Source: [José de San Martín — Wikipedia](https://en.wikipedia.org/wiki/Jos%C3%A9_de_San_Mart%C3%ADn) — stored citation; not externally checked for this editorial finding

## A-HIS-009: Trotsky was not a tsarist foreign minister.

- Concern: Facts, ambiguity and localization; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-history-set-036 — The Russian Civil War: Armies and Alternatives / Venemaa kodusõda: armeed ja alternatiivid.
- Questions: built-in-history-playable-corpus-116.
- Location: [content/generated/01-history.en-et.csv:287](../../../content/generated/01-history.en-et.csv) (built-in-history-playable-corpus-116).

Both prompts identify Trotsky as former tsarist foreign minister. He was foreign affairs commissar in revolutionary Soviet government formed in October/November 1917. Stored assertion repeats army-building work, not the false premise.

Suggested repair: Change tsarist to Soviet/revolutionary or ask directly which Bolshevik leader organized Red Army.

Source: [Red Army](https://en.wikipedia.org/wiki/Red_Army) — stored citation opened

Source: [Decision to Form the Workers and Peasants Government](https://www.marxists.org/archive/lenin/works/1917/oct/25-26/26e.htm) — primary appointment document actually read

Source: [Official Government Documents from the Peoples Commissar for Foreign Affairs](https://www.marxists.org/archive/trotsky/1918/commissar/gov.htm) — primary government note actually read

## A-HIS-010: Chartism clue fits several demands, accepts only one.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-history-set-022 — Workers Organise: From Mills to Mass Politics / Töölised organiseeruvad: vabrikutest massipoliitikani.
- Questions: built-in-history-playable-corpus-109.
- Location: [content/generated/01-history.en-et.csv:280](../../../content/generated/01-history.en-et.csv) (built-in-history-playable-corpus-109).

Six Chartist demands included suffrage, secret ballot, equal constituencies, paid MPs, abolition of MP property qualification and annual elections. Several were not achieved during the campaign; Parliament dates later adoptions.

Suggested repair: Ask specifically for the demand extending votes to adult men, or accept every valid demand.

Source: [Chartism](https://en.wikipedia.org/wiki/Chartism) — stored citation not yet externally read

Source: [The Chartist Legacy](https://www.parliament.uk/about/living-heritage/transformingsociety/electionsvoting/chartists/case-study/the-right-to-vote/the-chartists-and-birmingham/the-chartist-legacy/) — Parliament institutional account actually read

Source: [1848 Chartist Petition](https://www.parliament.uk/about/living-heritage/transformingsociety/electionsvoting/newport-rising/1839-newp-ris/univ-suff-pet-1848/) — primary petition description actually read

## A-HIS-011: Congo Free State becomes Congo Republic in Estonian.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-history-set-015 — The Scramble for Africa: Treaties and Resistance / Võidujooks Aafrikale: lepingud ja vastupanu.
- Questions: built-in-history-playable-corpus-097.
- Location: [content/generated/01-history.en-et.csv:268](../../../content/generated/01-history.en-et.csv) (built-in-history-playable-corpus-097).

Historical Congo Free State is translated as Kongo Vabariik (Congo Republic). Historical name should be Kongo Vaba Riik; wording can confuse later republics.

Suggested repair: Use Kongo Vaba Riik in ET prompt.

Source: [Congo Free State — Wikipedia](https://en.wikipedia.org/wiki/Congo_Free_State) — stored citation; not externally checked for this editorial finding

## A-HIS-012: Slavery act clue does not identify the act.

- Concern: Facts, ambiguity and localization; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-history-set-090 — Ending Atlantic Slavery: Campaigners and Revolts / Atlandi orjanduse lõpp: võitlejad ja ülestõusud.
- Questions: built-in-history-playable-corpus-240.
- Location: [content/generated/01-history.en-et.csv:411](../../../content/generated/01-history.en-et.csv) (built-in-history-playable-corpus-240).

Both prompts refer to this act but no act title/date is playable. Britain was not the only empire abolishing slavery across colonies; source title cannot supply context.

Suggested repair: Name Slavery Abolition Act 1833 or year in both prompts.

Source: [Slavery Abolition Act 1833 — Wikipedia](https://en.wikipedia.org/wiki/Slavery_Abolition_Act_1833) — stored citation; not externally checked for this editorial finding

## A-HIS-013: Women-education clue refers to unnamed argument.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-history-set-099 — The Enlightenment: Arguments That Travelled / Valgustus: ideed, mis levisid.
- Questions: built-in-history-playable-corpus-085.
- Location: [content/generated/01-history.en-et.csv:256](../../../content/generated/01-history.en-et.csv) (built-in-history-playable-corpus-085).

Both prompts say this pioneering argument/work without title; multiple authors argued for women education.

Suggested repair: Name A Vindication of the Rights of Woman in both prompts.

Source: [A Vindication of the Rights of Woman — Wikipedia](https://en.wikipedia.org/wiki/A_Vindication_of_the_Rights_of_Woman) — stored citation; not externally checked for this editorial finding

## A-HIS-014: Nordic kingdom list permits Norway elimination.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-history-set-075 — Nordic History: Crowns, Reforms and Society / Põhjamaade ajalugu: kroonid, reformid ja ühiskond.
- Questions: built-in-history-playable-corpus-296, built-in-history-playable-corpus-299.
- Location: [content/generated/01-history.en-et.csv:467](../../../content/generated/01-history.en-et.csv) (built-in-history-playable-corpus-296).
- Location: [content/generated/01-history.en-et.csv:470](../../../content/generated/01-history.en-et.csv) (built-in-history-playable-corpus-299).

Tier1 explicitly lists Denmark, Norway, Sweden. Tier4 names Denmark and Sweden and asks another country, leaving Norway in this three-kingdom pool.

Example: Tier1 supplies Denmark/Norway/Sweden; tier4 excludes Denmark/Sweden, leaving Norway without knowing 1905 transition.

Suggested repair: Replace one kingdom-list/location question with independent Nordic social/cultural milestone.

Source: [Kalmar Union — Wikipedia](https://en.wikipedia.org/wiki/Kalmar_Union) — stored citation; not externally checked for this editorial finding

Source: [Dissolution of the union between Norway and Sweden — Wikipedia](https://en.wikipedia.org/wiki/Dissolution_of_the_union_between_Norway_and_Sweden) — stored citation; not externally checked for this editorial finding

## A-HIS-015: Augustus named in sibling Roman clue.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-history-set-045 — Imperial Rome: Rule, Roads and Religion / Keiserlik Rooma: võim, teed ja usk.
- Questions: built-in-history-playable-corpus-181, built-in-history-playable-corpus-182.
- Location: [content/generated/01-history.en-et.csv:352](../../../content/generated/01-history.en-et.csv) (built-in-history-playable-corpus-181).
- Location: [content/generated/01-history.en-et.csv:353](../../../content/generated/01-history.en-et.csv) (built-in-history-playable-corpus-182).

Tier1 asks first emperor; tier2 names Augustus as beginning imperial peace.

Example: Tier2 supplies Augustus for tier1.

Suggested repair: Replace one Augustus clue or remove his name from tier2.

Source: [Augustus — Wikipedia](https://en.wikipedia.org/wiki/Augustus) — stored citation; not externally checked for this editorial finding

Source: [Pax Romana — Wikipedia](https://en.wikipedia.org/wiki/Pax_Romana) — stored citation; not externally checked for this editorial finding

## A-HIS-016: Jerusalem named in sibling crusade clue.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-history-set-059 — The Crusades: Armies and Encounters / Ristisõjad: väed ja kohtumised.
- Questions: built-in-history-playable-corpus-196, built-in-history-playable-corpus-197.
- Location: [content/generated/01-history.en-et.csv:367](../../../content/generated/01-history.en-et.csv) (built-in-history-playable-corpus-196).
- Location: [content/generated/01-history.en-et.csv:368](../../../content/generated/01-history.en-et.csv) (built-in-history-playable-corpus-197).

Tier1 asks First Crusade captured city; tier2 explicitly names Jerusalem as recaptured.

Example: Tier2 supplies Jerusalem for tier1.

Suggested repair: Replace one Jerusalem-target clue.

Source: [First Crusade — Wikipedia](https://en.wikipedia.org/wiki/First_Crusade) — stored citation; not externally checked for this editorial finding

Source: [Saladin — Wikipedia](https://en.wikipedia.org/wiki/Saladin) — stored citation; not externally checked for this editorial finding

## A-HIS-017: Later Luther clue supplies reformer answer.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-history-set-067 — The Reformation: Pulpits and Printing Presses / Reformatsioon: kantslid ja trükipressid.
- Questions: built-in-history-playable-corpus-211, built-in-history-playable-corpus-214.
- Location: [content/generated/01-history.en-et.csv:382](../../../content/generated/01-history.en-et.csv) (built-in-history-playable-corpus-211).
- Location: [content/generated/01-history.en-et.csv:385](../../../content/generated/01-history.en-et.csv) (built-in-history-playable-corpus-214).

Tier1 asks who challenged indulgences; tier4 identifies Luther as asked to recant.

Example: Tier4 names Luther, answer to tier1.

Suggested repair: Replace one Luther clue with another reformer/practice.

Source: [Ninety-five Theses — Wikipedia](https://en.wikipedia.org/wiki/Ninety-five_Theses) — stored citation; not externally checked for this editorial finding

Source: [Diet of Worms — Wikipedia](https://en.wikipedia.org/wiki/Diet_of_Worms) — stored citation; not externally checked for this editorial finding

## A-HIS-018: Two pigeon clues share the same answer.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-history-set-144 — Messages Before Screens / Sõnumid enne ekraane.
- Questions: built-in-history-all-level-expansion-0116, built-in-history-all-level-expansion-0118.
- Location: [content/generated/01-history.en-et.csv:717](../../../content/generated/01-history.en-et.csv) (built-in-history-all-level-expansion-0116).
- Location: [content/generated/01-history.en-et.csv:719](../../../content/generated/01-history.en-et.csv) (built-in-history-all-level-expansion-0118).

Tier1 asks a carrier pigeon from homing-message function; tier3 asks homing pigeons used during Paris siege. ET response is Kirjatuvi/Kirjatuvid, and tier3 accepts singular Kirjatuvi. Learning the first answer and mechanism supplies the other.

Example: Tier1 carrier pigeon explanation says it returns home; tier3 asks which birds carried messages back to Paris, answered by the same pigeon.

Suggested repair: Replace one with a different communication technology or ask an independent non-bird siege fact.

Source: [Carrier pigeon — Wikipedia](https://en.wikipedia.org/wiki/Carrier_pigeon) — stored citation; not externally checked for this editorial finding

Source: [Pigeon post — Wikipedia](https://en.wikipedia.org/wiki/Pigeon_post) — stored citation; not externally checked for this editorial finding

## A-HIS-019: Two scientific-ship clues accept Discovery.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-history-set-149 — Ships With Scientific Missions / Teadusmissioonidega laevad.
- Questions: built-in-history-all-level-expansion-0143, built-in-history-all-level-expansion-0145.
- Location: [content/generated/01-history.en-et.csv:744](../../../content/generated/01-history.en-et.csv) (built-in-history-all-level-expansion-0143).
- Location: [content/generated/01-history.en-et.csv:746](../../../content/generated/01-history.en-et.csv) (built-in-history-all-level-expansion-0145).

Different vessels HMS Discovery and RRS Discovery occupy two tiers, but both explicitly accept Discovery in EN/ET. The successful earlier response can therefore be reused for another question with no additional knowledge.

Example: Answer Cook companion ship Discovery at tier3, then reuse Discovery for Scott/Shackleton ship at tier5.

Suggested repair: Replace one Discovery ship with a different research vessel.

Source: [HMS Discovery (1774) — Wikipedia](https://en.wikipedia.org/wiki/HMS_Discovery_(1774)) — stored citation; not externally checked for this editorial finding

Source: [RRS Discovery — Wikipedia](https://en.wikipedia.org/wiki/RRS_Discovery) — stored citation; not externally checked for this editorial finding

## A-GEO-001: Vatican City clue accepts Holy See as an equivalent answer.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-geography-set-005 — Tiny States, Strong Landscapes / Väikeriigid tugeva maastikuga.
- Questions: built-in-geography-playable-corpus-006.
- Location: [content/generated/02-geography.en-et.csv:7](../../../content/generated/02-geography.en-et.csv) (built-in-geography-playable-corpus-006).

The clue asks for the sovereign state around Saint Peters inside Rome. Holy See/Puha Tool denotes a distinct international legal entity, rather than the territorial Vatican City State. Official Vatican State guidance explicitly separates their personalities.

Suggested repair: Remove Holy See and Puha Tool from accepted variants; retain Vatican City/Vatican City State synonyms.

Source: [https://en.wikipedia.org/wiki/Vatican_City](https://en.wikipedia.org/wiki/Vatican_City) — stored source opened; distinct-entity passage read

Source: [https://www.vaticanstate.va/en/state-and-government/general-informations.html](https://www.vaticanstate.va/en/state-and-government/general-informations.html) — authoritative supporting page actually read

## A-GEO-002: The South African national-park clue does not distinguish Kruger from Addo.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-geography-set-057 — Geography: National Parks / Geograafia: Rahvuspargid.
- Questions: built-in-geography-accessible-corpus-014.
- Location: [content/generated/02-geography.en-et.csv:135](../../../content/generated/02-geography.en-et.csv) (built-in-geography-accessible-corpus-014).

Lions, elephants and rhinos occur in more than one major South African national park. SANParks describes Addos Big Five, its elephants and introduced lions, and its black-rhino population. The question gives no province, river or other Kruger-specific discriminator.

Suggested repair: Add a distinguishing location or feature, such as the Limpopo/Mpumalanga setting or the Mozambique border.

Source: [https://en.wikipedia.org/wiki/Kruger_National_Park](https://en.wikipedia.org/wiki/Kruger_National_Park) — stored source opened; mammals passage read

Source: [https://www.sanparks.org/parks/addo-elephant/camps/addo](https://www.sanparks.org/parks/addo-elephant/camps/addo) — authoritative supporting page actually read

Source: [https://www.sanparks.org/conservation/scientific-services/stories/addo-elephant-national-park-black-rhino-dna-project](https://www.sanparks.org/conservation/scientific-services/stories/addo-elephant-national-park-black-rhino-dna-project) — authoritative supporting search text actually read

## A-GEO-003: The five Nordic-country answers exhaust the familiar country pool.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-geography-set-065 — Geography: The Nordic Countries / Geograafia: Põhjamaad.
- Questions: built-in-geography-accessible-corpus-096, built-in-geography-accessible-corpus-097, built-in-geography-accessible-corpus-098, built-in-geography-accessible-corpus-099, built-in-geography-accessible-corpus-100.
- Location: [content/generated/02-geography.en-et.csv:217](../../../content/generated/02-geography.en-et.csv) (built-in-geography-accessible-corpus-096).
- Location: [content/generated/02-geography.en-et.csv:218](../../../content/generated/02-geography.en-et.csv) (built-in-geography-accessible-corpus-097).
- Location: [content/generated/02-geography.en-et.csv:219](../../../content/generated/02-geography.en-et.csv) (built-in-geography-accessible-corpus-098).
- Location: [content/generated/02-geography.en-et.csv:220](../../../content/generated/02-geography.en-et.csv) (built-in-geography-accessible-corpus-099).
- Location: [content/generated/02-geography.en-et.csv:221](../../../content/generated/02-geography.en-et.csv) (built-in-geography-accessible-corpus-100).

Every question asks for a Nordic country and all five sovereign countries appear once. Once Iceland, Norway, Finland and Sweden are revealed, Denmark is the only remaining sovereign-country candidate, so the last slot can be answered without knowing Jutland geography. Easy clues can be accessible independently; this set additionally supplies an exhaustive elimination pool.

Example: After the first four answers, the Jutland-country question has Denmark as the only unused Nordic sovereign country.

Suggested repair: Mix country identification with Nordic cities, landscapes, waterways or other answer types, or use a wider Northern Europe pool.

Source: [https://www.norden.org/en/information/facts-about-nordic-countries](https://www.norden.org/en/information/facts-about-nordic-countries) — authoritative regional list actually read

## A-GEO-004: Three Estonian-water questions disclose each others answers.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-geography-set-016 — Estonia’s Waters on the Map / Eesti veed kaardil.
- Questions: built-in-geography-playable-corpus-171, built-in-geography-playable-corpus-172, built-in-geography-playable-corpus-173.
- Location: [content/generated/02-geography.en-et.csv:342](../../../content/generated/02-geography.en-et.csv) (built-in-geography-playable-corpus-171).
- Location: [content/generated/02-geography.en-et.csv:343](../../../content/generated/02-geography.en-et.csv) (built-in-geography-playable-corpus-172).
- Location: [content/generated/02-geography.en-et.csv:344](../../../content/generated/02-geography.en-et.csv) (built-in-geography-playable-corpus-173).

Tier 1 explicitly says the river flows from Lake Vortsjarv through Tartu toward Lake Peipus, and its explanation repeats that connection. Tier 3 asks which lake sends water into the Emajogi toward Peipus, so tier 1 already supplies Vortsjarv and the exact relation needed. Tier 3 in turn names Emajogi, the tier 1 response, and both name the tier 2 lake.

Example: Tier 1: flows from Lake Vortsjarv through Tartu toward Lake Peipus; tier 3 answer: Lake Vortsjarv.

Suggested repair: Retain only one clue about this connected lake/river system and replace siblings with other Estonian waters and unrelated identifying facts.

Source: [Emajõgi](https://en.wikipedia.org/wiki/Emajõgi) — stored citation; not externally checked for this editorial finding

Source: [Lake Peipus](https://en.wikipedia.org/wiki/Lake_Peipus) — stored citation; not externally checked for this editorial finding

Source: [Võrtsjärv](https://en.wikipedia.org/wiki/Võrtsjärv) — stored citation; not externally checked for this editorial finding

## A-GEO-005: Vilsandi is called Estonias oldest national park.

- Concern: Facts, ambiguity and localization; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-geography-set-020 — Landmarks Along Estonia’s Coast / Maamärgid Eesti rannikul.
- Questions: built-in-geography-playable-corpus-177.
- Location: [content/generated/02-geography.en-et.csv:348](../../../content/generated/02-geography.en-et.csv) (built-in-geography-playable-corpus-177).

Vilsandi traces its protected-area history to the Vaika bird reserve of 1910 but was redesignated a national park in 1993. Lahemaa, established in 1971, is officially identified as Estonias oldest national park. The question conflates reserve lineage with national-park designation in both languages.

Suggested repair: Say the national park grew from Estonias first bird reserve, established in 1910; remove oldest national park.

Source: [https://en.wikipedia.org/wiki/Vilsandi](https://en.wikipedia.org/wiki/Vilsandi) — stored cited page opened; oldest wording not located

Source: [https://kaitsealad.ee/en/protected-areas/vilsandi-national-park/about-national-park](https://kaitsealad.ee/en/protected-areas/vilsandi-national-park/about-national-park) — Environmental Board supporting page actually read

Source: [https://kaitsealad.ee/en/news/lahemaa-national-park-celebrates-its-55th-anniversary](https://kaitsealad.ee/en/news/lahemaa-national-park-celebrates-its-55th-anniversary) — Environmental Board dated supporting page actually read

## A-GEO-006: River-identification prompts accept delta names instead of the requested rivers.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-geography-set-078 — Deltas with Their Own Geography / Iseloomuga deltad.
- Questions: built-in-geography-playable-corpus-217, built-in-geography-playable-corpus-219, built-in-geography-playable-corpus-220.
- Location: [content/generated/02-geography.en-et.csv:388](../../../content/generated/02-geography.en-et.csv) (built-in-geography-playable-corpus-217).
- Location: [content/generated/02-geography.en-et.csv:390](../../../content/generated/02-geography.en-et.csv) (built-in-geography-playable-corpus-219).
- Location: [content/generated/02-geography.en-et.csv:391](../../../content/generated/02-geography.en-et.csv) (built-in-geography-playable-corpus-220).

Tier 2 asks at the mouth of which Spanish river (Ebro); tier 4 asks which Siberian river (Lena); tier 5 asks which river spreads in Mali (Niger). Canonical answers and variants require Ebro Delta, Lena Delta and Inner Niger Delta/Macina rather than the river names. The host guidance can mislead a host assessing the requested river-name response.

Suggested repair: Rewrite all three prompts to ask which delta, or accept the clearly requested river names and align canonical responses.

Source: [Ebro Delta](https://en.wikipedia.org/wiki/Ebro_Delta) — stored citation; not externally checked for this editorial finding

Source: [Lena Delta](https://en.wikipedia.org/wiki/Lena_Delta) — stored citation; not externally checked for this editorial finding

Source: [Inner Niger Delta](https://en.wikipedia.org/wiki/Inner_Niger_Delta) — stored citation; not externally checked for this editorial finding

## A-GEO-007: The Niger both-banks capital clue also fits Niamey.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-geography-set-000 — Capitals Carried by Rivers / Pealinnad jõgede kaldal.
- Questions: built-in-geography-playable-corpus-005.
- Location: [content/generated/02-geography.en-et.csv:6](../../../content/generated/02-geography.en-et.csv) (built-in-geography-playable-corpus-005).

Both Bamako and Niamey are capitals of landlocked West African countries and extend along both banks of the Niger. A JICA drainage study explicitly places Niamey on both banks; a Niger regional-corridor resettlement report hosted by the World Bank describes the same. The prompt contains no Mali or Bamako-specific qualifier.

Suggested repair: Add Mali or a distinguishing Bamako landmark; preserve both-banks setting as secondary context.

Source: [https://en.wikipedia.org/wiki/Bamako](https://en.wikipedia.org/wiki/Bamako) — stored cited page opened

Source: [https://openjicareport.jica.go.jp/pdf/11674355.pdf](https://openjicareport.jica.go.jp/pdf/11674355.pdf) — primary JICA report search passage actually read

Source: [https://documents1.worldbank.org/curated/en/463031622454320135/pdf/Cadre-de-Politique-de-Reinstallation-pour-Niger.pdf](https://documents1.worldbank.org/curated/en/463031622454320135/pdf/Cadre-de-Politique-de-Reinstallation-pour-Niger.pdf) — primary project report search passage actually read

## A-SCI-001: Inner-planet identity questions exhaust a four-answer pool.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-science-nature-set-013 — Science & Nature: The Inner Planets / Teadus ja loodus: Siseplaneedid.
- Questions: built-in-science-nature-accessible-corpus-001, built-in-science-nature-accessible-corpus-002, built-in-science-nature-accessible-corpus-003, built-in-science-nature-accessible-corpus-004, built-in-science-nature-accessible-corpus-005.
- Location: [content/generated/03-science-nature.en-et.csv:42](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-accessible-corpus-001).
- Location: [content/generated/03-science-nature.en-et.csv:43](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-accessible-corpus-002).
- Location: [content/generated/03-science-nature.en-et.csv:44](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-accessible-corpus-003).
- Location: [content/generated/03-science-nature.en-et.csv:45](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-accessible-corpus-004).
- Location: [content/generated/03-science-nature.en-et.csv:46](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-accessible-corpus-005).

The title restricts identity answers to Earth, Mars, Mercury and Venus, all four used in order. After the first three, Venus is the only remaining inner planet; the tier5 prompt also explicitly prints all four names. This makes the fourth identity depend on unused-name elimination instead of the atmospheric clue.

Example: Earth, Mars and Mercury revealed in tiers1–3 leave only Venus for tier4.

Suggested repair: Broaden to solar-system science with varied answer types, retaining at most one or two planet identities.

Source: [https://science.nasa.gov/solar-system/planets/](https://science.nasa.gov/solar-system/planets/) — NASA inner-planet list actually read

## A-SCI-002: Outer-planet identities form the same four-answer elimination pattern.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-science-nature-set-014 — Science & Nature: The Outer Planets / Teadus ja loodus: Välisplaneedid.
- Questions: built-in-science-nature-accessible-corpus-006, built-in-science-nature-accessible-corpus-007, built-in-science-nature-accessible-corpus-008, built-in-science-nature-accessible-corpus-009, built-in-science-nature-accessible-corpus-010.
- Location: [content/generated/03-science-nature.en-et.csv:47](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-accessible-corpus-006).
- Location: [content/generated/03-science-nature.en-et.csv:48](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-accessible-corpus-007).
- Location: [content/generated/03-science-nature.en-et.csv:49](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-accessible-corpus-008).
- Location: [content/generated/03-science-nature.en-et.csv:50](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-accessible-corpus-009).
- Location: [content/generated/03-science-nature.en-et.csv:51](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-accessible-corpus-010).

Saturn, Jupiter and Uranus occupy the first three slots, leaving Neptune as the only unused outer planet. Tier5 names Uranus and Neptune and its explanation names Jupiter and Saturn, reinforcing the full pool. Easy identity hints are additionally simplified by sibling elimination.

Example: Saturn, Jupiter and Uranus already revealed make Neptune guaranteed for the fourth outer-planet identity.

Suggested repair: Mix moons, missions, physical processes and other answer types in a broader solar-system category.

Source: [https://science.nasa.gov/wp-content/uploads/2023/07/hubble-jovian-planets.pdf](https://science.nasa.gov/wp-content/uploads/2023/07/hubble-jovian-planets.pdf) — NASA four-giant-planet list actually read in search passage

## A-SCI-003: Methane and blue appearance do not uniquely identify Neptune.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-science-nature-set-014 — Science & Nature: The Outer Planets / Teadus ja loodus: Välisplaneedid.
- Questions: built-in-science-nature-accessible-corpus-009.
- Location: [content/generated/03-science-nature.en-et.csv:50](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-accessible-corpus-009).

The prompt only says a distant planet gets its blue appearance partly from atmospheric methane. NASA states both Uranus and Neptune have methane-driven similar blue hues. Uranus is also distant; the clue does not say eighth or farthest planet, so excluding Uranus relies on the preceding sibling answer rather than a unique fact.

Example: Tier3 has already used Uranus, leaving Neptune as the intended unused name despite both satisfying tier4 wording.

Suggested repair: Add eighth/farthest planet or a Neptune-specific storm, wind or moon detail.

Source: [https://en.wikipedia.org/wiki/Neptune](https://en.wikipedia.org/wiki/Neptune) — stored cited page opened

Source: [https://science.nasa.gov/uranus/facts/](https://science.nasa.gov/uranus/facts/) — NASA methane/colour passage actually read

Source: [https://science.nasa.gov/neptune/neptune-facts/](https://science.nasa.gov/neptune/neptune-facts/) — NASA similar-hue and 2024 image-analysis passage actually read

## A-SCI-004: Seed dormancy clue also describes quiescence.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-science-nature-set-045 — How Plants Read Their World / Kuidas taimed keskkonda tajuvad.
- Questions: built-in-science-nature-playable-corpus-056.
- Location: [content/generated/03-science-nature.en-et.csv:142](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-playable-corpus-056).

Waiting merely until moisture, light or temperature become favourable describes environmentally imposed quiescence as well as the broad ecological purpose of dormancy. True dormant seeds fail to germinate under otherwise favourable conditions until a dormancy-breaking requirement is met. Kews seed-bank technical guidance makes that distinction, and the cited Wikipedia page explicitly separates the two.

Suggested repair: State that the viable seed does not germinate even under otherwise suitable conditions until an internal block is lifted, or accept quiescence for the current broader wording.

Source: [https://en.wikipedia.org/wiki/Seed_dormancy](https://en.wikipedia.org/wiki/Seed_dormancy) — stored cited page opened; quiescence distinction actually read

Source: [https://brahmsonline.kew.org/Content/Projects/msbp/resources/Training/13b-Germination-testing-dormancy.pdf](https://brahmsonline.kew.org/Content/Projects/msbp/resources/Training/13b-Germination-testing-dormancy.pdf) — Kew technical-sheet supporting passage actually read

## A-SCI-005: Granite is not uniquely identified by speckling and slow underground cooling.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-science-nature-set-019 — Science & Nature: Rocks and Minerals / Teadus ja loodus: Kivimid ja mineraalid.
- Questions: built-in-science-nature-accessible-corpus-056.
- Location: [content/generated/03-science-nature.en-et.csv:262](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-accessible-corpus-056).

These clues identify coarse-grained intrusive igneous rocks generally. Diorite, gabbro and other rocks also form through slow underground magma cooling; diorite can have contrasting light and dark visible grains. The USGS explanation expressly lists several such intrusive rocks. No quartz/feldspar composition or other granite-specific qualifier appears.

Suggested repair: Add quartz and feldspar, or another granite-specific composition/appearance qualifier.

Source: [https://en.wikipedia.org/wiki/Granite](https://en.wikipedia.org/wiki/Granite) — stored cited page opened

Source: [https://www.usgs.gov/faqs/what-are-igneous-rocks?page=0](https://www.usgs.gov/faqs/what-are-igneous-rocks?page=0) — USGS intrusive-rock definition and alternatives actually read

## A-SCI-006: English caterpillar clue also fits a moth.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-science-nature-set-027 — Science & Nature: Insects / Teadus ja loodus: Putukad.
- Questions: built-in-science-nature-accessible-corpus-082.
- Location: [content/generated/03-science-nature.en-et.csv:288](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-accessible-corpus-082).

A caterpillar is the larval stage of moths as well as butterflies; both pupate into winged adults. The English acceptance list contains only Butterfly and adult butterfly. Estonian liblikas covers the broader Lepidoptera concept, making the English version narrower than its prompt and the Estonian answer.

Suggested repair: Accept moth in English or add a butterfly-specific adult qualifier to both prompts.

Source: [https://en.wikipedia.org/wiki/Butterfly](https://en.wikipedia.org/wiki/Butterfly) — stored cited page opened

Source: [https://www.si.edu/spotlight/buginfo/moths](https://www.si.edu/spotlight/buginfo/moths) — Smithsonian moth/butterfly caterpillar definition actually read

## A-SCI-007: Surfacing through a blowhole does not uniquely identify dolphin.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-science-nature-set-029 — Science & Nature: Mammals / Teadus ja loodus: Imetajad.
- Questions: built-in-science-nature-accessible-corpus-092.
- Location: [content/generated/03-science-nature.en-et.csv:298](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-accessible-corpus-092).

Whales and porpoises are also streamlined marine mammals that surface to breathe through blowholes. The clue has no dolphin-specific feature, and neither language accepts these other correct identities. NOAA explicitly describes cetaceans surfacing to breathe and documents a sperm whales single blowhole.

Suggested repair: Add a dolphin-specific description such as the familiar beaked bottlenose form, or accept the broader cetacean answers.

Source: [https://en.wikipedia.org/wiki/Dolphin](https://en.wikipedia.org/wiki/Dolphin) — stored cited page opened

Source: [https://www.fisheries.noaa.gov/index.php/pacific-islands/science-data/whale-and-dolphin-surveys-pacific-islands](https://www.fisheries.noaa.gov/index.php/pacific-islands/science-data/whale-and-dolphin-surveys-pacific-islands) — NOAA cetacean breathing passage actually read

Source: [https://www.fisheries.noaa.gov/index.php/species/sperm-whale](https://www.fisheries.noaa.gov/index.php/species/sperm-whale) — NOAA single-blowhole and surfacing passage actually read

## A-SCI-008: Two reptile descriptions also fit unaccepted identities.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-science-nature-set-030 — Science & Nature: Reptiles and Amphibians / Teadus ja loodus: Roomajad ja kahepaiksed.
- Questions: built-in-science-nature-accessible-corpus-097, built-in-science-nature-accessible-corpus-100.
- Location: [content/generated/03-science-nature.en-et.csv:303](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-accessible-corpus-097).
- Location: [content/generated/03-science-nature.en-et.csv:306](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-accessible-corpus-100).

A legless scaled reptile can be a slow worm or glass lizard, not only a snake. A large armoured semi-aquatic reptile nesting on land can be an alligator, not only a crocodile. Museum and zoo sources confirm these concrete alternatives; the prompts lack distinguishing details and acceptance lists omit them, particularly in English.

Suggested repair: Add snake-specific eyelid/ear details and crocodile-specific snout/dentition, or accept fitting alternatives.

Source: [https://en.wikipedia.org/wiki/Snake](https://en.wikipedia.org/wiki/Snake) — stored cited page opened

Source: [https://en.wikipedia.org/wiki/Crocodile](https://en.wikipedia.org/wiki/Crocodile) — stored cited page opened

Source: [https://www.nhm.ac.uk/discover/slow-worms-most-unusual-lizards-in-britain.html](https://www.nhm.ac.uk/discover/slow-worms-most-unusual-lizards-in-britain.html) — NHM legless and scaled slow-worm passages actually read

Source: [https://nationalzoo.si.edu/animals/american-alligator](https://nationalzoo.si.edu/animals/american-alligator) — Smithsonian alligator anatomy and nest passages actually read

## A-SCI-009: Flexible wire insulation also fits plastic/PVC.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-science-nature-set-051 — Science & Nature: Electricity / Teadus ja loodus: Elekter.
- Questions: built-in-science-nature-accessible-corpus-108.
- Location: [content/generated/03-science-nature.en-et.csv:314](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-accessible-corpus-108).

Rubber is a valid insulating material, but the prompt describes a common flexible wire coating generally. PVC/plastic is widely used for this exact purpose; Southwire specifies PVC insulation and jacket for flexible household appliance cords. Only rubber-related answers are accepted in either language.

Suggested repair: Ask for the coating role and accept insulation/insulator, accept plastic/PVC, or specify an elastic rubber material.

Source: [https://en.wikipedia.org/wiki/Electrical_insulation](https://en.wikipedia.org/wiki/Electrical_insulation) — stored cited page opened

Source: [https://cabletechsupport.southwire.com/en/tile/10/cable/57973/?country=US](https://cabletechsupport.southwire.com/en/tile/10/cable/57973/?country=US) — Manufacturer household flexible-cord PVC insulation specification actually read

## A-SCI-010: Natural-selection identity also fits Alfred Russel Wallace.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-science-nature-set-094 — Science & Nature: Scientists Everyone Knows / Teadus ja loodus: Teadlased, keda kõik teavad.
- Questions: built-in-science-nature-accessible-corpus-124.
- Location: [content/generated/03-science-nature.en-et.csv:330](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-accessible-corpus-124).

The prompt only asks which naturalist explained evolution through natural selection, accepting Darwin alone. Wallace independently developed the mechanism and a joint Darwin/Wallace paper was presented in 1858, as the Linnean Society confirms. No Origin of Species, Beagle or other Darwin-specific qualifier is present.

Suggested repair: Add the 1859 Origin of Species or Beagle connection, or accept Wallace for this wording.

Source: [https://en.wikipedia.org/wiki/Charles_Darwin](https://en.wikipedia.org/wiki/Charles_Darwin) — stored cited page opened

Source: [https://www.linnean.org/the-society/history-of-science/alfred-russel-wallace](https://www.linnean.org/the-society/history-of-science/alfred-russel-wallace) — Linnean Society joint-theory presentation passage actually read

## A-SCI-011: Crustacean limb-dropping clue also fits lobster.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-science-nature-set-055 — Bodies That Grow Back / Kehaosad, mis kasvavad tagasi.
- Questions: built-in-science-nature-playable-corpus-277.
- Location: [content/generated/03-science-nature.en-et.csv:448](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-playable-corpus-277).

Claws, reflex loss of an injured leg at a joint and replacement over subsequent moults also describe lobsters. The US Fish Commission research documents both claw and walking-leg autotomy and regeneration in lobsters. The prompt contains no crab-specific broad body or sideways walking qualifier, and only crab is accepted.

Suggested repair: Add the broad carapace/sideways walking distinction or accept lobster and other qualifying crustaceans.

Source: [https://en.wikipedia.org/wiki/Autotomy](https://en.wikipedia.org/wiki/Autotomy) — stored cited page opened; crustacean passage actually read

Source: [https://spo.nmfs.noaa.gov/sites/default/files/pdf-content/fish-bull/fb29.6.pdf](https://spo.nmfs.noaa.gov/sites/default/files/pdf-content/fish-bull/fb29.6.pdf) — US Fish Commission lobster autotomy and regeneration research passage actually read

## A-SCI-012: Five atmosphere identities exhaust their familiar ordered answer pool.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-science-nature-set-061 — Layers Above Earth / Kihid Maa kohal.
- Questions: built-in-science-nature-playable-corpus-306, built-in-science-nature-playable-corpus-307, built-in-science-nature-playable-corpus-308, built-in-science-nature-playable-corpus-309, built-in-science-nature-playable-corpus-310.
- Location: [content/generated/03-science-nature.en-et.csv:477](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-playable-corpus-306).
- Location: [content/generated/03-science-nature.en-et.csv:478](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-playable-corpus-307).
- Location: [content/generated/03-science-nature.en-et.csv:479](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-playable-corpus-308).
- Location: [content/generated/03-science-nature.en-et.csv:480](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-playable-corpus-309).
- Location: [content/generated/03-science-nature.en-et.csv:481](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-playable-corpus-310).

All five major atmospheric layers appear as identity answers in altitude order. After troposphere, stratosphere, mesosphere and thermosphere have been revealed, exosphere is the sole remaining major layer; the final answer no longer needs its particle-density clue. This repeats one finite-list fact type across the whole medium category.

Example: The first four named layers leave only exosphere for the outermost-layer finale.

Suggested repair: Broaden to atmospheric science and mix layer identity with weather, measurements, gases or optical phenomena.

Source: [https://science.nasa.gov/earth/earth-atmosphere/earths-atmosphere-a-multi-layered-cake/](https://science.nasa.gov/earth/earth-atmosphere/earths-atmosphere-a-multi-layered-cake/) — NASA five-major-layer ordered list actually read

## A-SCI-013: Toothless long-snouted insect-eater is not uniquely an anteater.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-science-nature-set-131 — Natural Tools for Finding Food / Looduslikud vahendid toidu leidmiseks.
- Questions: built-in-science-nature-all-level-expansion-0052.
- Location: [content/generated/03-science-nature.en-et.csv:653](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-all-level-expansion-0052).

Echidnas and pangolins also lack teeth and use elongated snouts and long sticky tongues to eat insects including ants. The prompt contains no South American or anteater-specific anatomy qualifier. NHM describes the matching echidna features; the English and Estonian acceptance lists contain only anteater.

Suggested repair: Add the South American anteater group or another distinguishing trait, or accept echidna and pangolin for the current wording.

Source: [https://en.wikipedia.org/wiki/Anteater](https://en.wikipedia.org/wiki/Anteater) — stored cited page opened

Source: [https://www.nhm.ac.uk/discover/ten-reasons-to-love-echidnas.html](https://www.nhm.ac.uk/discover/ten-reasons-to-love-echidnas.html) — NHM no-teeth, snout and sticky-tongue passages actually read

Source: [https://www.nationalzoo.si.edu/news/smithsonian-scientists-aid-decoding-mammalian-mystery-genetics-pangolin](https://www.nationalzoo.si.edu/news/smithsonian-scientists-aid-decoding-mammalian-mystery-genetics-pangolin) — Smithsonian pangolin lack-of-teeth and tongue passage actually read

## A-SCI-014: Underground stem tubers also describe Jerusalem artichoke.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-science-nature-set-132 — Plants on the Dinner Plate / Taimed söögilaual.
- Questions: built-in-science-nature-all-level-expansion-0056.
- Location: [content/generated/03-science-nature.en-et.csv:657](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-all-level-expansion-0056).

The prompt asks which plant stores food in underground stem tubers rather than roots. Jerusalem artichoke/sunchoke also has edible stem tubers, and fits the dinner-plate theme. USDA crop descriptions and Kew morphology confirm its tuber-forming rhizomes. No potato-specific leaf, nightshade, eye or culinary qualifier appears.

Suggested repair: Add a potato-specific nightshade or tuber-eye detail, or accept Jerusalem artichoke and other qualifying stem-tuber plants.

Source: [https://en.wikipedia.org/wiki/Potato](https://en.wikipedia.org/wiki/Potato) — stored cited page opened

Source: [https://ageconsearch.umn.edu/record/309293/files/aib409.pdf](https://ageconsearch.umn.edu/record/309293/files/aib409.pdf) — USDA crop-description stem-tuber passage actually read

Source: [https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A329252-2/general-information](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A329252-2/general-information) — Kew tuber-forming rhizome morphology actually read

## A-SCI-015: Two movement clues identify shared adaptations rather than one animal.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-science-nature-set-141 — Animal Movement With a Purpose / Loomade eesmärgipärane liikumine.
- Questions: built-in-science-nature-all-level-expansion-0102, built-in-science-nature-all-level-expansion-0104.
- Location: [content/generated/03-science-nature.en-et.csv:703](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-all-level-expansion-0102).
- Location: [content/generated/03-science-nature.en-et.csv:705](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-all-level-expansion-0104).

The desert animal with long jumping hind legs and balancing tail also fits kangaroo rats; NPS documents the same combination. Siphon jet propulsion also fits octopuses and cuttlefish, as Smithsonian explains for cephalopods generally. The prompts give no jerboa-specific geography or squid-specific arm/body details and accept only the intended identities.

Suggested repair: Add geography/anatomy that distinguishes jerboa and squid, or accept the concrete alternatives.

Source: [https://en.wikipedia.org/wiki/Jerboa](https://en.wikipedia.org/wiki/Jerboa) — stored cited page opened

Source: [https://en.wikipedia.org/wiki/Squid](https://en.wikipedia.org/wiki/Squid) — stored cited page opened

Source: [https://home.nps.gov/orpi/learn/nature/kangaroo-rat.htm](https://home.nps.gov/orpi/learn/nature/kangaroo-rat.htm) — NPS desert, hind-leg and balancing-tail passages actually read

Source: [https://ocean.si.edu/ocean-life/invertebrates/octopus-shows-its-funnel](https://ocean.si.edu/ocean-life/invertebrates/octopus-shows-its-funnel) — Smithsonian octopus siphon propulsion passage actually read

## A-SCI-016: Sibling climate prompts name trade winds before their identity clue.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-science-nature-set-152 — Large-Scale Climate Patterns / Ulatuslikud kliimamustrid.
- Questions: built-in-science-nature-all-level-expansion-0157, built-in-science-nature-all-level-expansion-0158, built-in-science-nature-all-level-expansion-0159.
- Location: [content/generated/03-science-nature.en-et.csv:758](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-all-level-expansion-0157).
- Location: [content/generated/03-science-nature.en-et.csv:759](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-all-level-expansion-0158).
- Location: [content/generated/03-science-nature.en-et.csv:760](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-all-level-expansion-0159).

Tier2 associates La Nina with stronger trade winds, and tier4 asks where trade winds meet near the Equator. Tier3 asks for persistent tropical easterly winds. Both siblings print the answer name in the same tropical-circulation context, so the five-question category supplies the requested terminology.

Example: Read tier4s near-equatorial trade-winds meeting prompt before answering tier3s tropical-wind identity.

Suggested repair: Remove the answer term from sibling prompts or replace one of the overlapping tropical-circulation questions.

Source: [La Niña — Wikipedia](https://en.wikipedia.org/wiki/La_Ni%C3%B1a) — stored citation; not externally checked for this editorial finding

Source: [Trade winds — Wikipedia](https://en.wikipedia.org/wiki/Trade_winds) — stored citation; not externally checked for this editorial finding

Source: [Intertropical Convergence Zone — Wikipedia](https://en.wikipedia.org/wiki/Intertropical_Convergence_Zone) — stored citation; not externally checked for this editorial finding

## A-SCI-017: Hertz clue names the scientist and theory sought in the Maxwell clue.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-science-nature-set-154 — Experiments That Separated Theories / Teooriaid eristanud katsed.
- Questions: built-in-science-nature-all-level-expansion-0168, built-in-science-nature-all-level-expansion-0169.
- Location: [content/generated/03-science-nature.en-et.csv:769](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-all-level-expansion-0168).
- Location: [content/generated/03-science-nature.en-et.csv:770](../../../content/generated/03-science-nature.en-et.csv) (built-in-science-nature-all-level-expansion-0169).

Tier3 asks who connected light and electromagnetism through field equations. Tier4 explicitly says the radio-wave experiment tested Maxwells electromagnetic theory. The surname plus matching theory identifies the tier3 scientist from another prompt.

Example: Read tier4s Maxwells electromagnetic theory phrase, then answer tier3 Maxwell.

Suggested repair: Refer to a predicted electromagnetic-wave theory without naming its author, or replace one of the two closely linked identities.

Source: [James Clerk Maxwell — Wikipedia](https://en.wikipedia.org/wiki/James_Clerk_Maxwell) — stored citation; not externally checked for this editorial finding

Source: [Heinrich Hertz — Wikipedia](https://en.wikipedia.org/wiki/Heinrich_Hertz) — stored citation; not externally checked for this editorial finding

## A-LIT-001: Four translated-title prompts print an accepted answer verbatim.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-literature-language-set-032 — Famous Titles Across Languages / Kuulsad pealkirjad eri keeltes.
- Questions: built-in-literature-language-accessible-corpus-167, built-in-literature-language-accessible-corpus-168, built-in-literature-language-accessible-corpus-169, built-in-literature-language-accessible-corpus-170.
- Location: [content/generated/04-literature-language.en-et.csv:38](../../../content/generated/04-literature-language.en-et.csv) (built-in-literature-language-accessible-corpus-167).
- Location: [content/generated/04-literature-language.en-et.csv:39](../../../content/generated/04-literature-language.en-et.csv) (built-in-literature-language-accessible-corpus-168).
- Location: [content/generated/04-literature-language.en-et.csv:40](../../../content/generated/04-literature-language.en-et.csv) (built-in-literature-language-accessible-corpus-169).
- Location: [content/generated/04-literature-language.en-et.csv:41](../../../content/generated/04-literature-language.en-et.csv) (built-in-literature-language-accessible-corpus-170).

The prompts ask for the book known as Les Trois Mousquetaires, Divina Commedia, Il nome della rosa and Cien anos de soledad. Each printed original-language title is itself an accepted variant in both languages. Repeating visible text obtains the correct response without recognising the work or translating it; this occurs in four of the five clues.

Example: Respond Il nome della rosa to the prompt that already prints Il nome della rosa.

Suggested repair: Require the requested target-language title when the original title is printed, or replace the original-title text with independent plot clues.

Source: [The Three Musketeers](https://en.wikipedia.org/wiki/The_Three_Musketeers) — stored citation; not externally checked for this editorial finding

Source: [Divine Comedy](https://en.wikipedia.org/wiki/Divine_Comedy) — stored citation; not externally checked for this editorial finding

Source: [The Name of the Rose](https://en.wikipedia.org/wiki/The_Name_of_the_Rose) — stored citation; not externally checked for this editorial finding

Source: [One Hundred Years of Solitude](https://en.wikipedia.org/wiki/One_Hundred_Years_of_Solitude) — stored citation; not externally checked for this editorial finding

## A-LIT-002: Nils rides a domestic gander, not a wild goose.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-literature-language-set-090 — Literature & Language: Nordic Children's Stories / Kirjandus ja keel: Põhjamaade lastelood.
- Questions: built-in-literature-language-accessible-corpus-035.
- Location: [content/generated/04-literature-language.en-et.csv:76](../../../content/generated/04-literature-language.en-et.csv) (built-in-literature-language-accessible-corpus-035).

Both language prompts describe a wild goose. In Lagerlofs novel the farm gander Morten joins the wild goose flock and carries Nils. The primary novel repeatedly distinguishes the tame gander from the wild geese. The character answer remains clear, but the biological premise is wrong.

Suggested repair: Say Nils rides a domestic gander travelling with a flock of wild geese, or simply a goose.

Source: [https://en.wikipedia.org/wiki/The_Wonderful_Adventures_of_Nils](https://en.wikipedia.org/wiki/The_Wonderful_Adventures_of_Nils) — stored cited page opened

Source: [https://www.gutenberg.org/cache/epub/10935/pg10935-images.html](https://www.gutenberg.org/cache/epub/10935/pg10935-images.html) — original novel translated by Velma Swantson Howard; tame gander and wild flock passages actually read

## A-LIT-003: Hopscotch alternate reading route does not include all 155 chapters.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-literature-language-set-010 — Novels That Break the Usual Shape / Romaanid, mis murravad vormireegleid.
- Questions: built-in-literature-language-playable-corpus-020.
- Location: [content/generated/04-literature-language.en-et.csv:106](../../../content/generated/04-literature-language.en-et.csv) (built-in-literature-language-playable-corpus-020).

Both prompts say the reader can follow the authors route through all 155 chapters. That route omits chapter55. The stored cited page itself states the omission; an original University of Manchester dissertation discussing Cortazars reading instructions corroborates it. The title answer is clear, but the structural claim is overstated.

Suggested repair: Replace all155 with an alternate route among its155 chapters, or explicitly describe the two routes without the all-chapters claim.

Source: [https://en.wikipedia.org/wiki/Hopscotch_(Cort%C3%A1zar_novel)](https://en.wikipedia.org/wiki/Hopscotch_(Cort%C3%A1zar_novel)) — stored cited page and chapter55 exclusion passage actually read

Source: [https://pure.manchester.ac.uk/ws/portalfiles/portal/54573252/FULL_TEXT.PDF](https://pure.manchester.ac.uk/ws/portalfiles/portal/54573252/FULL_TEXT.PDF) — original dissertation pages66-69 discuss omitted chapter55 and quote authors reading instructions; passages actually read

## A-LIT-004: Published Estonian Bard Beedle title is missing from acceptance.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-literature-language-set-073 — Books That Exist Inside Books / Raamatud, mis elavad teiste raamatute sees.
- Questions: built-in-literature-language-playable-corpus-051.
- Location: [content/generated/04-literature-language.en-et.csv:137](../../../content/generated/04-literature-language.en-et.csv) (built-in-literature-language-playable-corpus-051).

The Estonian response Lugulaulud Beedle Bardilt and variant Beedle Bardi lood do not contain the published title Bard Beedle’i lood. The Estonian Childrens Literature Centre bibliography records Bard Beedle’i lood, translated by Krista Kaer, Varrak2017, ISBN9789985341308. Host guidance omits the actual published Estonian title.

Suggested repair: Use Bard Beedle’i lood as Estonian canonical response and preserve actual published spelling as an accepted variant.

Source: [https://en.wikipedia.org/wiki/The_Tales_of_Beedle_the_Bard](https://en.wikipedia.org/wiki/The_Tales_of_Beedle_the_Bard) — stored cited page opened

Source: [https://elk.ee/wp-content/uploads/2019/02/Lastekirjandus-2017.pdf](https://elk.ee/wp-content/uploads/2019/02/Lastekirjandus-2017.pdf) — Estonian Childrens Literature Centre bibliography entry300 page34 title translator and publisher actually read

## A-LIT-005: Estonian-classics sibling prompt names the author sought next door.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-literature-language-set-092 — Literature & Language: Estonian Literary Classics / Kirjandus ja keel: Eesti kirjandusklassika.
- Questions: built-in-literature-language-accessible-corpus-109, built-in-literature-language-accessible-corpus-110.
- Location: [content/generated/04-literature-language.en-et.csv:235](../../../content/generated/04-literature-language.en-et.csv) (built-in-literature-language-accessible-corpus-109).
- Location: [content/generated/04-literature-language.en-et.csv:236](../../../content/generated/04-literature-language.en-et.csv) (built-in-literature-language-accessible-corpus-110).

Tier4 asks who wrote the Leemet novel. Tier5 explicitly asks for a Kivirähk novel involving kratts and folk belief. Both English and Estonian tier5 print the surname required by tier4, within the same modern Estonian-fiction context.

Example: Read tier5s Kivirähk novel phrase, then answer tier4 Kivirähk.

Suggested repair: Remove the author name from tier5 and retain independent plot details, or replace one overlapping author identity.

Source: [The Man Who Spoke Snakish — Wikipedia](https://en.wikipedia.org/wiki/The_Man_Who_Spoke_Snakish) — stored citation; not externally checked for this editorial finding

Source: [Rehepapp — Wikipedia](https://en.wikipedia.org/wiki/Rehepapp) — stored citation; not externally checked for this editorial finding

## A-LIT-006: Estonian kindergarten clue asks the full meaning but accepts only garden.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-literature-language-set-094 — Literature & Language: Borrowed Words / Kirjandus ja keel: Laensõnad.
- Questions: built-in-literature-language-accessible-corpus-114.
- Location: [content/generated/04-literature-language.en-et.csv:240](../../../content/generated/04-literature-language.en-et.csv) (built-in-literature-language-accessible-corpus-114).

English asks children s what, correctly seeking garden. Estonian asks what the German word kindergarten literally means, which is childrens garden, while the canonical answer is only Aed and lacks Lasteaed. Froebel Trust confirms the compound meaning. The two prompts therefore require differently scoped answers.

Suggested repair: Make the Estonian prompt explicitly seek the garten component or accept Lasteaed for the current whole-word question.

Source: [https://en.wikipedia.org/wiki/Kindergarten](https://en.wikipedia.org/wiki/Kindergarten) — stored cited page opened

Source: [https://www.froebel.org.uk/news/froebel-the-united-states-kindergarten](https://www.froebel.org.uk/news/froebel-the-united-states-kindergarten) — Froebel Trust garden-of-children meaning passage actually read

## A-LIT-007: The Hours prompt prints the adjacent answer Mrs Dalloway.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-literature-language-set-041 — A Whole Novel in One Day / Terve romaan ühe päevaga.
- Questions: built-in-literature-language-playable-corpus-116, built-in-literature-language-playable-corpus-117.
- Location: [content/generated/04-literature-language.en-et.csv:287](../../../content/generated/04-literature-language.en-et.csv) (built-in-literature-language-playable-corpus-116).
- Location: [content/generated/04-literature-language.en-et.csv:288](../../../content/generated/04-literature-language.en-et.csv) (built-in-literature-language-playable-corpus-117).

Tier1 asks for Woolfs novel with Clarissa and Septimus on one London day. Tier2 names Woolf and Mrs Dalloway as the novel connecting its three lives. The author and title in tier2 supply tier1s exact response in both languages.

Example: Read tier2s Virginia Woolf through Mrs Dalloway phrase, then answer tier1 Mrs Dalloway.

Suggested repair: Remove the explicit source-book title from tier2 and retain its three-life/author hooks, or replace one overlapping novel.

Source: [Mrs Dalloway](https://en.wikipedia.org/wiki/Mrs_Dalloway) — stored citation; not externally checked for this editorial finding

Source: [The Hours (novel)](https://en.wikipedia.org/wiki/The_Hours_(novel)) — stored citation; not externally checked for this editorial finding

## A-LIT-008: Published Kummituslik Hilli maja title absent from accepted answers.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-literature-language-set-043 — Houses That Keep a Secret / Majad, mis varjavad saladust.
- Questions: built-in-literature-language-playable-corpus-127.
- Location: [content/generated/04-literature-language.en-et.csv:298](../../../content/generated/04-literature-language.en-et.csv) (built-in-literature-language-playable-corpus-127).

The Estonian canonical response Hill House’i kummitus and its variants omit Kummituslik Hilli maja. Edition records for the2025 Fantaasia translation, ISBN9789916739471, give that published title and the same Dr Montague/Eleanor story. The host answer list omits the title a player using the Estonian edition would naturally give.

Suggested repair: Make Kummituslik Hilli maja the Estonian response and add it to variants, retaining English title acceptance.

Source: [https://en.wikipedia.org/wiki/The_Haunting_of_Hill_House](https://en.wikipedia.org/wiki/The_Haunting_of_Hill_House) — stored cited page opened

Source: [https://www.apollo.ee/et/kummituslik-hilli-maja.html](https://www.apollo.ee/et/kummituslik-hilli-maja.html) — 2025 Estonian edition title publisher ISBN and matching synopsis actually read

Source: [https://rahvaraamat.ee/et/raamatud/ilukirjandus/oudus/kummituslik-hilli-maja/2013888](https://rahvaraamat.ee/et/raamatud/ilukirjandus/oudus/kummituslik-hilli-maja/2013888) — matching Estonian edition metadata actually read

## A-LIT-009: Stevens painting inspiration is presented as established despite source dispute.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-literature-language-set-019 — Poems Look at Works of Art / Luuletused vaatavad kunstiteoseid.
- Questions: built-in-literature-language-playable-corpus-173.
- Location: [content/generated/04-literature-language.en-et.csv:344](../../../content/generated/04-literature-language.en-et.csv) (built-in-literature-language-playable-corpus-173).

The prompt states The Man with the Blue Guitar was inspired by Picassos The Old Guitarist. Its cited page explicitly discusses Stevenss denial and a biographers contrary interpretation. The Art Institute independently says Stevens insisted no single picture inspired the poem. The answer is clear, but the clue turns a disputed attribution into an unqualified factual premise.

Suggested repair: Describe the blue-guitar meditation without the disputed painting premise, or say often associated with Picassos painting.

Source: [https://en.wikipedia.org/wiki/The_Man_with_the_Blue_Guitar](https://en.wikipedia.org/wiki/The_Man_with_the_Blue_Guitar) — stored cited page; primary-letter denial and counterinterpretation passages actually read

Source: [https://www.artic.edu/artworks/111936/title-page-from-the-blue-guitar](https://www.artic.edu/artworks/111936/title-page-from-the-blue-guitar) — Art Institute full catalog description actually read in search response; direct fetch returned403

## A-LIT-010: Constructed-language sibling names Esperanto.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-literature-language-set-084 — Languages Someone Deliberately Invented / Keeled, mille keegi teadlikult lõi.
- Questions: built-in-literature-language-playable-corpus-206, built-in-literature-language-playable-corpus-210.
- Location: [content/generated/04-literature-language.en-et.csv:377](../../../content/generated/04-literature-language.en-et.csv) (built-in-literature-language-playable-corpus-206).
- Location: [content/generated/04-literature-language.en-et.csv:381](../../../content/generated/04-literature-language.en-et.csv) (built-in-literature-language-playable-corpus-210).

Tier1 asks which planned international language Zamenhof introduced in1887. Tier5 explicitly dates Volapuk before Esperanto appeared. Within the same planned-language history set, tier5 supplies the language name sought by tier1, in both languages.

Example: Read tier5 before Esperanto appeared, then use Esperanto for tier1.

Suggested repair: Remove Esperanto from the Volapuk prompt and keep its priest, creator and date qualifiers.

Source: [Esperanto](https://en.wikipedia.org/wiki/Esperanto) — stored citation; not externally checked for this editorial finding

Source: [Volapük](https://en.wikipedia.org/wiki/Volap%C3%BCk) — stored citation; not externally checked for this editorial finding

## A-LIT-011: Campus set omits three published Estonian book titles.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-literature-language-set-075 — Campus Novels Enrol for Class / Ülikooliromaanid astuvad loengusse.
- Questions: built-in-literature-language-playable-corpus-201, built-in-literature-language-playable-corpus-202, built-in-literature-language-playable-corpus-205.
- Location: [content/generated/04-literature-language.en-et.csv:372](../../../content/generated/04-literature-language.en-et.csv) (built-in-literature-language-playable-corpus-201).
- Location: [content/generated/04-literature-language.en-et.csv:373](../../../content/generated/04-literature-language.en-et.csv) (built-in-literature-language-playable-corpus-202).
- Location: [content/generated/04-literature-language.en-et.csv:376](../../../content/generated/04-literature-language.en-et.csv) (built-in-literature-language-playable-corpus-205).

Estonian acceptance contains only the English titles The Secret History, Lucky Jim and Disgrace. Their published Estonian titles Salajane ajalugu, Õnneseen Jim and Häbi are missing. The Tartu University original translation-analysis thesis identifies Salajane ajalugu; edition records identify Õnneseen Jim; the Estonian Literary Translators journal explicitly pairs Häbi with Disgrace.

Suggested repair: Add Salajane ajalugu, Õnneseen Jim and Häbi with their proper Estonian diacritics; use published titles as Estonian canonical responses.

Source: [https://en.wikipedia.org/wiki/The_Secret_History](https://en.wikipedia.org/wiki/The_Secret_History) — stored cited page opened

Source: [https://en.wikipedia.org/wiki/Lucky_Jim](https://en.wikipedia.org/wiki/Lucky_Jim) — stored cited page opened

Source: [https://en.wikipedia.org/wiki/Disgrace](https://en.wikipedia.org/wiki/Disgrace) — stored cited page opened

Source: [https://dspace.ut.ee/items/93401600-a54d-4115-a8dc-17f1444dce0e](https://dspace.ut.ee/items/93401600-a54d-4115-a8dc-17f1444dce0e) — original University of Tartu translation-analysis thesis title and metadata actually read

Source: [https://www.goodreads.com/work/editions/876732-lucky-jim](https://www.goodreads.com/work/editions/876732-lucky-jim) — Estonian1997 edition title translator publisher and ISBN actually read in search response

Source: [https://tolkijad.ee/wp-content/uploads/2020/09/To%CC%83lkijaHa%CC%88a%CC%88l_III.pdf](https://tolkijad.ee/wp-content/uploads/2020/09/To%CC%83lkijaHa%CC%88a%CC%88l_III.pdf) — Estonian Literary Translators journal bibliographic passage pairing Häbi and Disgrace actually read in search response

## A-LIT-012: Victorian-fiction category includes a pre-Victorian Austen novel.

- Concern: Category coherence; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-literature-language-set-152 — Victorian Fiction and Its Secrets / Viktoriaaniaja romaanid ja nende saladused.
- Questions: built-in-literature-language-all-level-expansion-0158.
- Location: [content/generated/04-literature-language.en-et.csv:759](../../../content/generated/04-literature-language.en-et.csv) (built-in-literature-language-all-level-expansion-0158).

The category title restricts the set to Victorian fiction, but Northanger Abbey was published posthumously inDecember1817 with1818 on its title page. Jane Austens House confirms the1817 publication; Victorias reign began in1837. The title therefore gives a false historical scope for one of its five works.

Suggested repair: Rename to nineteenth-century fiction and its secrets, or replace Northanger Abbey with a genuinely Victorian novel.

Source: [https://en.wikipedia.org/wiki/Northanger_Abbey](https://en.wikipedia.org/wiki/Northanger_Abbey) — stored cited page publication passage actually read

Source: [https://janeaustens.house/object/first-edition-northanger-abbey-and-persuasion/](https://janeaustens.house/object/first-edition-northanger-abbey-and-persuasion/) — Jane Austens House primary edition-record December1817 publication passage actually read

Source: [https://www.royal.uk/encyclopedia/victoria-r-1837-1901](https://www.royal.uk/encyclopedia/victoria-r-1837-1901) — official monarchy1837 accession passage actually read

## A-LIT-013: Motif-Index explanation names and defines the sibling ATU Index.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-literature-language-set-157 — Folklore Catalogues and Patterns / Rahvajuttude kataloogid ja mustrid.
- Questions: built-in-literature-language-all-level-expansion-0181, built-in-literature-language-all-level-expansion-0183.
- Location: [content/generated/04-literature-language.en-et.csv:782](../../../content/generated/04-literature-language.en-et.csv) (built-in-literature-language-all-level-expansion-0181).
- Location: [content/generated/04-literature-language.en-et.csv:784](../../../content/generated/04-literature-language.en-et.csv) (built-in-literature-language-all-level-expansion-0183).

Tier1 asks which work classifies folktales by recurring plot types. Revealed tier3 explanation explicitly says the ATU Index classifies folktale types, identifying both the acronym of the intended Aarne-Thompson-Uther Index and its exact function. Unlike merely sharing folklore terminology, this supplies the requested work/definition pairing.

Example: Solve tier3, read ATU Index classifies folktale types, then use the identified index for tier1.

Suggested repair: Keep tier3 explanation focused on individual motifs and remove the comparison naming the other answer, or replace the overlapping index question.

Source: [Aarne–Thompson–Uther Index — Wikipedia](https://en.wikipedia.org/wiki/Aarne%E2%80%93Thompson%E2%80%93Uther_Index) — stored citation; not externally checked for this editorial finding

Source: [Motif-Index of Folk-Literature — Wikipedia](https://en.wikipedia.org/wiki/Motif-Index_of_Folk-Literature) — stored citation; not externally checked for this editorial finding

## A-HIS-020: Baltic set song clue also fits the official Estonian anthem.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-history-set-074 — History: Baltic Independence / Ajalugu: Balti riikide iseseisvus.
- Questions: built-in-history-accessible-corpus-044.
- Location: [content/generated/01-history.en-et.csv:85](../../../content/generated/01-history.en-et.csv) (built-in-history-accessible-corpus-044).

The prompt gives only traditional performance at the Estonian Song Festival and importance to national identity. Mu isamaa, mu õnn ja rõõm satisfies both: the Song Festival Foundation documents its1869/1879 performances, continuing festival use, nationalist demonstrations and status as the anthem. The intended Mu isamaa on minu arm is not distinguished by composer, poet or unofficial-anthem role. The current set no longer has the users literal three-date elimination example.

Suggested repair: Name Gustav Ernesakss setting of Lydia Koidulas poem or its unofficial anthem role, or include the other qualifying patriotic song in host guidance.

Source: [https://en.wikipedia.org/wiki/Mu_isamaa_on_minu_arm](https://en.wikipedia.org/wiki/Mu_isamaa_on_minu_arm) — stored cited page opened

Source: [https://2023.laulupidu.ee/uudiskirjad/6-uudiskiri/mu-isamaa-mu-onn-ja-room-rahva-sudamest-humniks/](https://2023.laulupidu.ee/uudiskirjad/6-uudiskiri/mu-isamaa-mu-onn-ja-room-rahva-sudamest-humniks/) — Song Festival Foundation first/second festival performances, nationalism and2023 conductor account actually read

## B-002: Artist category begins by asking for a painting

- Concern: Category coherence; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-art-architecture-set-008 — Art & Architecture: Modern Artists and Their Signature Looks / Kunst ja arhitektuur: Moodsa kunsti meistrite tunnusstiilid.
- Questions: built-in-art-architecture-accessible-corpus-036.
- Location: [content/generated/05-art-architecture.en-et.csv:37](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-accessible-corpus-036).

The category title promises modern artists and their signature looks, but tier 1 asks for Guernica and never asks for Picasso. This changes the expected response type.

Suggested repair: Ask for Picasso from the painting description, or rename the category to include works and artists.

## B-003: Banksy clue gives away stencil answer

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-art-architecture-set-013 — Art & Architecture: Street Art / Kunst ja arhitektuur: Tänavakunst.
- Questions: built-in-art-architecture-accessible-corpus-061, built-in-art-architecture-accessible-corpus-063.
- Location: [content/generated/05-art-architecture.en-et.csv:62](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-accessible-corpus-061).
- Location: [content/generated/05-art-architecture.en-et.csv:64](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-accessible-corpus-063).

Tier 1 prompt and explanation explicitly name stencil art, while tier 3 asks for the reusable cut-out sheet for spraying an image.

Example: Repeat stencil from Banksy's 'satirical stencil art' at tier 3.

Suggested repair: Describe satirical wall images without naming stencil in tier 1 prompt/explanation, or replace tier 3.

## B-004: East Side Gallery was painted before reunification

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-art-architecture-set-013 — Art & Architecture: Street Art / Kunst ja arhitektuur: Tänavakunst.
- Questions: built-in-art-architecture-accessible-corpus-065.
- Location: [content/generated/05-art-architecture.en-et.csv:66](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-accessible-corpus-065).

Explanation says artists painted it after reunification; Berlin Wall Foundation dates opening to 28 September 1990 and illustrates summer 1990 painting, before 3 October reunification.

Suggested repair: Say painted after the Wall opened in 1989, during 1990 before reunification.

Source: [Berlin Wall Foundation: longest open-air gallery](https://www.stiftung-berliner-mauer.de/de/east-side-gallery/historischer-ort/laengste-open-air-galerie) — Opening 28 September 1990

Source: [Berlin Wall Foundation: East Side Gallery 35](https://www.stiftung-berliner-mauer.de/de/east-side-gallery/eastsidegallery35) — Summer 1990 painting

## B-005: Dome explanation names later rotunda answer

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-art-architecture-set-015 — Art & Architecture: Shapes in Architecture / Kunst ja arhitektuur: Kujundid arhitektuuris.
- Questions: built-in-art-architecture-accessible-corpus-071, built-in-art-architecture-accessible-corpus-074.
- Location: [content/generated/05-art-architecture.en-et.csv:72](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-accessible-corpus-071).
- Location: [content/generated/05-art-architecture.en-et.csv:75](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-accessible-corpus-074).

Tier 1 says Pantheon's dome spans the rotunda; tier 4 asks term for a round building/hall covered by a dome.

Example: 'spans the rotunda' / 'katab rotundi' supplies rotunda / rotund.

Suggested repair: Use circular main hall in tier 1 explanation or replace later clue.

## B-006: Greek-order clues exhaust three-answer pool

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-art-architecture-set-016 — Art & Architecture: Columns and Arches / Kunst ja arhitektuur: Sambad ja kaared.
- Questions: built-in-art-architecture-accessible-corpus-078, built-in-art-architecture-accessible-corpus-079, built-in-art-architecture-accessible-corpus-080.
- Location: [content/generated/05-art-architecture.en-et.csv:79](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-accessible-corpus-078).
- Location: [content/generated/05-art-architecture.en-et.csv:80](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-accessible-corpus-079).
- Location: [content/generated/05-art-architecture.en-et.csv:81](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-accessible-corpus-080).

Doric, Ionic and Corinthian occupy consecutive tiers; tier 3 explicitly announces three major Greek orders. After two, Corinthian is the only remaining standard order.

Example: After Doric and Ionic, name Corinthian without recognizing acanthus.

Suggested repair: Keep at most one or two order-identification clues; add independent architecture concepts.

## B-007: Duomo clue lacks unique identifier for Milan

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-art-architecture-set-018 — Art & Architecture: Great Cathedrals / Kunst ja arhitektuur: Suured katedraalid.
- Questions: built-in-art-architecture-accessible-corpus-088.
- Location: [content/generated/05-art-architecture.en-et.csv:89](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-accessible-corpus-088).

Generic Duomo designation and decorated white stone do not identify a city or distinguish multiple Italian cathedrals.

Suggested repair: Add Milan, Madonnina or the forest of Gothic pinnacles to the prompt.

Source: [Milan Cathedral official site](https://www.duomomilano.it/en/art-and-culture/the-cathedral/) — Candoglia marble and Gothic cathedral

Source: [Opera del Duomo: Florence facade](https://duomo.firenze.it/en/opera-magazine/post/6558/the-facade-of-florence-cathedral) — Florence Duomo also has extensive marble decoration

## B-008: Baltic-capital triple makes third automatic

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-art-architecture-set-027 — Art & Architecture: Architecture of the Baltic Region / Kunst ja arhitektuur: Baltimaade arhitektuur.
- Questions: built-in-art-architecture-accessible-corpus-131, built-in-art-architecture-accessible-corpus-132, built-in-art-architecture-accessible-corpus-133.
- Location: [content/generated/05-art-architecture.en-et.csv:132](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-accessible-corpus-131).
- Location: [content/generated/05-art-architecture.en-et.csv:133](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-accessible-corpus-132).
- Location: [content/generated/05-art-architecture.en-et.csv:134](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-accessible-corpus-133).

Consecutive questions ask which of three Baltic capitals fits a building style. Tallinn and Riga leave only Vilnius.

Example: Answer Vilnius after Tallinn and Riga without knowing Baroque skyline.

Suggested repair: Retain one capital identification; vary other targets among buildings, architects and techniques.

## B-009: Wassily chair namesake supplies answer

- Concern: Question independence and giveaways; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-art-architecture-set-028 — Art & Architecture: Design Objects at Home / Kunst ja arhitektuur: Disainesemed kodus.
- Questions: built-in-art-architecture-accessible-corpus-137.
- Location: [content/generated/05-art-architecture.en-et.csv:138](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-accessible-corpus-137).

Prompt explicitly gives Wassily Kandinsky while asking name of chair named after him.

Example: Named after Wassily Kandinsky -> Wassily Chair.

Suggested repair: Use its tubular frame/sling seat or Breuer's bicycle inspiration without giving the namesake.

## B-010: Estonian quilt response unnecessarily requires patchwork

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-art-architecture-set-030 — Art & Architecture: Textile Art / Kunst ja arhitektuur: Tekstiilikunst.
- Questions: built-in-art-architecture-accessible-corpus-148.
- Location: [content/generated/05-art-architecture.en-et.csv:149](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-accessible-corpus-148).

Prompt defines quilting, which need not have patchwork top. English accepts quilt; Estonian accepts only lapitekk / tepitud lapitekk. Explanation correctly says patchwork can form the top.

Suggested repair: Accept tepitud tekk or explicitly require patchwork in both prompts.

## B-011: Sibelius monument pipe count is wrong

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-art-architecture-set-048 — Public statues you can place / Avalikud kujud, mille asukoha tunned.
- Questions: built-in-art-architecture-playable-corpus-071.
- Location: [content/generated/05-art-architecture.en-et.csv:237](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-playable-corpus-071).

Both explanations assert exactly 569 welded pipes. HAM, the city art collection's curator, states over 600 tubes.

Suggested repair: Replace 569 with over 600 or simply hundreds in both explanations.

Source: [HAM: The Sibelius Monument](https://www.hamhelsinki.fi/en/sculptures/sibelius-monumentti-sibelius-monument/) — Curator states over 600 tubes

## B-012: Cathedral choir was rebuilt for library, not originally museum

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-art-architecture-set-050 — Estonian buildings from one bold feature / Eesti hooned ühe silmatorkava tunnuse järgi.
- Questions: built-in-art-architecture-playable-corpus-083.
- Location: [content/generated/05-art-architecture.en-et.csv:249](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-playable-corpus-083).

Explanation says the surviving choir was rebuilt to house the university museum. University library history says remodeled chancel housed the library from 1806; museum replaced it in 1981. Current-use prompt is valid but chronology in explanation misleading.

Suggested repair: Say choir was converted for the university library in early nineteenth century and has housed museum since 1981.

Source: [University of Tartu Library history](https://utlib.ut.ee/en/content/history-university-tartu-library) — Library moved to remodeled chancel in 1806

Source: [University of Tartu Museum history](https://muuseum.ut.ee/en/story-of-the-museum) — Library moved out at end of 1981; museum followed

## B-013: Cyanotype image pigment confused with sensitizer

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-art-architecture-set-061 — Colours with a story / Värvid, millel on oma lugu.
- Questions: built-in-art-architecture-playable-corpus-138.
- Location: [content/generated/05-art-architecture.en-et.csv:304](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-playable-corpus-138).

The explanation says Prussian blue supplied light-sensitive chemistry of blueprints. The V&A describes paper impregnated with iron salts, exposed to daylight to produce the insoluble Prussian blue image: the pigment is the product, not the sensitizing chemistry.

Suggested repair: Explain that cyanotype exposure produces a Prussian blue image from photosensitive iron salts.

Source: [V&A: Cyanotypes by Anna Atkins](https://www.vam.ac.uk/blog/caring-for-our-collections/a-blueprint-for-the-future-cyanotypes-by-anna-atkins) — Iron salts are exposed to produce Prussian blue image

## B-014: Auction-shredding clue omits the original title

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-art-architecture-set-067 — Modern artworks from one striking sight / Moodsad kunstiteosed ühe rabava vaate järgi.
- Questions: built-in-art-architecture-playable-corpus-169.
- Location: [content/generated/05-art-architecture.en-et.csv:335](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-playable-corpus-169).

It asks which work partly shredded moments after the hammer fell, when its title was Girl with Balloon. Sotheby's states the shredding created a new work subsequently titled Love is in the Bin; only that title is accepted.

Suggested repair: Accept Girl with Balloon as a variant or explicitly ask for the name given to the transformed work.

Source: [Sotheby's: new Banksy artwork created live](https://www.sothebys.com/en/articles/latest-banksy-artwork-love-is-in-the-bin-created-live-at-auction) — Girl with Balloon was shredded; new title assigned afterward

## B-015: Infinity Mirror Rooms date is two years early

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-art-architecture-set-082 — Installations that transformed a place / Paika muutnud installatsioonid.
- Questions: built-in-art-architecture-playable-corpus-243.
- Location: [content/generated/05-art-architecture.en-et.csv:409](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-playable-corpus-243).

Both explanations say mirrored rooms began in 1963. Hirshhorn identifies the breakthrough and first Phalli's Field in 1965.

Suggested repair: Change 1963 to 1965 in both explanations.

Source: [Hirshhorn: Infinity Mirror Rooms](https://hirshhorn.si.edu/kusama/infinity-rooms/) — First mirrored room exhibited in 1965

## B-016: The Gates frames misidentified as steel

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-art-architecture-set-082 — Installations that transformed a place / Paika muutnud installatsioonid.
- Questions: built-in-art-architecture-playable-corpus-242.
- Location: [content/generated/05-art-architecture.en-et.csv:408](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-playable-corpus-242).

Both explanations say steel gates. The Met's contemporary description identifies saffron-coloured vinyl gates; steel was used for footings.

Suggested repair: Describe vinyl gate frames on steel bases, or remove the unnecessary material claim.

Source: [Met: From the Roof](https://www.metmuseum.org/exhibitions/listings/2005/the-gates) — 7500 saffron-coloured vinyl gates

## B-017: Long Room collection claim ignores temporary book removal

- Concern: Facts, ambiguity and localization; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-art-architecture-set-092 — Libraries built as civic landmarks / Linnamaamärkideks ehitatud raamatukogud.
- Questions: built-in-art-architecture-playable-corpus-292.
- Location: [content/generated/05-art-architecture.en-et.csv:458](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-playable-corpus-292).

Present-tense prompt says it houses 200000 books. Trinity's current redevelopment page says 200000 books have been removed for conservation. Historic capacity identifies the room, but present wording needs a stable qualifier.

Suggested repair: Say traditionally housed 200000 oldest books, avoiding current physical-holdings assertion.

Source: [Trinity: Old Library redevelopment](https://www.visittrinity.ie/book-of-kells/old-library-redevelopment-project/) — Current project page says 200000 books have been removed from the Long Room for conservation.

## B-018: Adjacent heated-earth-pigment clues teach the last response template

- Concern: Question independence and giveaways; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-art-architecture-set-102 — Colours Beyond the Rainbow / Värvid väljaspool vikerkaart.
- Questions: built-in-art-architecture-easy-expansion-009, built-in-art-architecture-easy-expansion-010.
- Location: [content/generated/05-art-architecture.en-et.csv:510](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-easy-expansion-009).
- Location: [content/generated/05-art-architecture.en-et.csv:511](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-easy-expansion-010).

Tier 4 explanation explicitly teaches that heating raw umber produces burnt umber. Tier 5 then asks what heating raw sienna produces; only the earth name changes. The top tier can be solved from the previous naming template.

Example: raw umber -> burnt umber teaches raw sienna -> burnt sienna.

Suggested repair: Keep one raw/burnt earth clue, replace the other with independent colour story.

## B-019: Animal category ends with a weapon

- Concern: Category coherence; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-art-architecture-set-124 — Animals in civic sculpture / Loomad linnaskulptuuris.
- Questions: built-in-art-architecture-all-level-expansion-0020.
- Location: [content/generated/05-art-architecture.en-et.csv:621](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-all-level-expansion-0020).

Animals in civic sculpture asks for a trident carried by Neptune at tier 5. A weapon is outside the response/theme promised by the title.

Suggested repair: Replace with a fifth animal in civic sculpture or rename the category to figures and objects.

## B-020: Building geometry category asks for client's medical profession

- Concern: Category coherence; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-art-architecture-set-159 — Geometry beneath famous buildings / Geomeetria kuulsate hoonete taga.
- Questions: built-in-art-architecture-all-level-expansion-0195.
- Location: [content/generated/05-art-architecture.en-et.csv:796](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-all-level-expansion-0195).

Farnsworth being a physician does not concern the geometry, structure or shape of a building. It breaks an otherwise coherent set of geometric/structural clues.

Suggested repair: Replace with an independent geometric fact about Farnsworth House or another building.

## B-021: Monuments that changed place includes an unrelated musical ritual

- Concern: Category coherence; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-art-architecture-set-160 — Monuments that changed their place / Asukohta muutnud monumendid.
- Questions: built-in-art-architecture-all-level-expansion-0198.
- Location: [content/generated/05-art-architecture.en-et.csv:799](../../../content/generated/05-art-architecture.en-et.csv) (built-in-art-architecture-all-level-expansion-0198).

Menin Gate Last Post question describes regular remembrance performance, without any relocation/change-of-place fact.

Suggested repair: Replace with a moved monument or rename the category around public commemoration.

## B-022: Earlier male-range question supplies final baritone term and relation

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-music-set-011 — Music: Types of Singing Voice / Muusika: Lauluhääle liigid.
- Questions: built-in-music-accessible-corpus-008, built-in-music-accessible-corpus-010.
- Location: [content/generated/06-music.en-et.csv:49](../../../content/generated/06-music.en-et.csv) (built-in-music-accessible-corpus-008).
- Location: [content/generated/06-music.en-et.csv:51](../../../content/generated/06-music.en-et.csv) (built-in-music-accessible-corpus-010).

Tier 3 asks adult male part above baritone and answers tenor. Tier 5 asks voice between tenor and bass; baritone has already been introduced as lower than tenor, while tier 4 defines bass lowest.

Example: Tenor is above baritone; bass lowest; final middle male range can be reconstructed from earlier clues.

Suggested repair: Remove the explicit baritone comparison in tier 3 or replace final middle-range clue with an independent concept.

## B-023: Concertmaster prompt explicitly names strings family answer

- Concern: Question independence and giveaways; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-music-set-012 — Music: Sections of the Orchestra / Muusika: Orkestri pillirühmad.
- Questions: built-in-music-accessible-corpus-012, built-in-music-accessible-corpus-015.
- Location: [content/generated/06-music.en-et.csv:53](../../../content/generated/06-music.en-et.csv) (built-in-music-accessible-corpus-012).
- Location: [content/generated/06-music.en-et.csv:56](../../../content/generated/06-music.en-et.csv) (built-in-music-accessible-corpus-015).

Tier 2 asks section of violins/violas/cellos/double basses; tier 5 states principal violinist leads orchestra's string section. The answer term is already displayed if tier 5 is read first.

Example: Tier 5's 'orchestra's string section' directly answers tier 2.

Suggested repair: Say leads the orchestral players/first violins without naming the target family, or replace section question.

## B-024: Wooden-bar percussion description also identifies marimba

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-music-set-013 — Music: Percussion Instruments / Muusika: Löökpillid.
- Questions: built-in-music-accessible-corpus-017.
- Location: [content/generated/06-music.en-et.csv:58](../../../content/generated/06-music.en-et.csv) (built-in-music-accessible-corpus-017).

Tuned wooden bars arranged like a keyboard describe both xylophone and marimba. No range, construction or timbre distinction excludes marimba, yet it is not accepted.

Suggested repair: Specify higher pitch/hard bright timbre or classroom xylophone distinction; alternatively accept marimba.

## B-025: Viola response disclosed in earlier string-family comparisons

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-music-set-014 — Music: String Instruments / Muusika: Keelpillid.
- Questions: built-in-music-accessible-corpus-021, built-in-music-accessible-corpus-023, built-in-music-accessible-corpus-025.
- Location: [content/generated/06-music.en-et.csv:62](../../../content/generated/06-music.en-et.csv) (built-in-music-accessible-corpus-021).
- Location: [content/generated/06-music.en-et.csv:64](../../../content/generated/06-music.en-et.csv) (built-in-music-accessible-corpus-023).
- Location: [content/generated/06-music.en-et.csv:66](../../../content/generated/06-music.en-et.csv) (built-in-music-accessible-corpus-025).

Tier 1 explicitly lists viola and says violin sits above it; tier 3 again lists viola. Tier 5 asks instrument resembling a larger lower violin, inviting reuse of the already supplied instrument/relative-pitch relation.

Example: Tier 1's explanation 'violin sits above the viola' teaches the relation used at tier 5.

Suggested repair: Avoid naming viola in sibling comparison clues or replace the final clue with an independent instrument.

## B-026: Finlandia English prompt says the hymn-like section was added later

- Concern: Facts, ambiguity and localization; severity: medium; confidence: medium; assessment: review finding.
- Categories: built-in-music-set-094 — Classical music turned into public ritual / Avalikuks rituaaliks saanud klassikamuusika.
- Questions: built-in-music-playable-corpus-048.
- Location: [content/generated/06-music.en-et.csv:129](../../../content/generated/06-music.en-et.csv) (built-in-music-playable-corpus-048).

The English asks for a press-celebration work to which Sibelius later added a hymn-like section; the Estonian and explanation instead say its existing hymn section later gained patriotic importance. This is an internal bilingual chronology mismatch and needs a primary chronology check.

Suggested repair: Describe the existing hymn section later becoming a national symbol; distinguish the 1899/1900 orchestral work from later hymn text/arrangements.

Source: [This is Finland: Finlandia by Jean Sibelius](https://finland.fi/arts-culture/finlandia-by-jean-sibelius/) — The existing orchestral hymn melody later received words; 1899 tableaux finale became the revised 1900 Finlandia.

## B-027: The Classical-period answer is named in an earlier prompt

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-music-set-020 — Music: Eras of Classical Music / Muusika: Klassikalise muusika ajastud.
- Questions: built-in-music-accessible-corpus-056, built-in-music-accessible-corpus-057.
- Location: [content/generated/06-music.en-et.csv:177](../../../content/generated/06-music.en-et.csv) (built-in-music-accessible-corpus-056).
- Location: [content/generated/06-music.en-et.csv:178](../../../content/generated/06-music.en-et.csv) (built-in-music-accessible-corpus-057).

Tier1 says Baroque came before 'the Classical period'; tier2 asks the era associated with Haydn and Mozart, accepting Classical period. The earlier prompt teaches the later answer within a small chronological era pool.

Example: Read tier1 'before the Classical period', then answer tier2 with that just-mentioned era.

Suggested repair: Remove the named later era from tier1 and identify Baroque with composers/features; strengthen each era anchor without listing other responses.

## B-028: Accepted aliases repeat the musician nickname already supplied by the question

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-music-set-023 — Music: Jazz / Muusika: Džäss.
- Questions: built-in-music-accessible-corpus-073, built-in-music-accessible-corpus-075.
- Location: [content/generated/06-music.en-et.csv:194](../../../content/generated/06-music.en-et.csv) (built-in-music-accessible-corpus-073).
- Location: [content/generated/06-music.en-et.csv:196](../../../content/generated/06-music.en-et.csv) (built-in-music-accessible-corpus-075).

Armstrong accepts Satchmo although tier3 gives that nickname; Fitzgerald accepts First Lady of Song / laulu esileedi although tier5 gives it. These accepted answers require repeating a clue fragment rather than naming the musician.

Example: Tier3 'nicknamed Satchmo' can be answered 'Satchmo'; tier5 similarly accepts its supplied honorific.

Suggested repair: Remove nickname/honorific variants from these clues and accept artist names and legitimate name variants only.

## B-029: A 1987 U2 album is placed in a 1960s/1970s rock category

- Concern: Category coherence; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-music-set-025 — Music: Rock of the 1960s and 1970s / Muusika: 1960. ja 1970. aastate rokk.
- Questions: built-in-music-accessible-corpus-082.
- Location: [content/generated/06-music.en-et.csv:203](../../../content/generated/06-music.en-et.csv) (built-in-music-accessible-corpus-082).

Both explanations explicitly date The Joshua Tree to 1987 while both category titles limit the scope to the 1960s and 1970s.

Suggested repair: Replace the U2 clue with a 1960s/1970s recording or broaden the category title to cover the 1980s.

## B-030: Firework from 2010 falls outside the 2000s decade

- Concern: Category coherence; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-music-set-028 — Music: Pop of the 2000s / Muusika: 2000. aastate popmuusika.
- Questions: built-in-music-accessible-corpus-098.
- Location: [content/generated/06-music.en-et.csv:219](../../../content/generated/06-music.en-et.csv) (built-in-music-accessible-corpus-098).

The clue explanation explicitly identifies the 2010 album Teenage Dream; the category title is 2000s pop in both languages.

Suggested repair: Use a Katy Perry hit from 2008/2009 or a different 2000s clue, or broaden the decade scope.

## B-031: Boney M is included under Nordic pop

- Concern: Category coherence; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-music-set-031 — Music: Nordic Pop / Muusika: Põhjamaade popmuusika.
- Questions: built-in-music-accessible-corpus-111.
- Location: [content/generated/06-music.en-et.csv:232](../../../content/generated/06-music.en-et.csv) (built-in-music-accessible-corpus-111).

Boney M was formed in West Germany by Frank Farian with Caribbean-origin members, while both titles promise Nordic acts. Nothing in this clue supplies a Nordic relationship.

Suggested repair: Replace Boney M with a Nordic performer or rename the category to European pop.

Source: [Sony Music Germany: Frank Farian 1941-2024](https://www.sonymusic.de/frank-farian-1941-2024/) — German producer founded Boney M in the mid-1970s, supporting the mismatch with a Nordic-category label.

## B-032: Guitar-controller rhythm series clue also describes Rock Band

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-music-set-033 — Music: Music in Video Games / Muusika: Muusika videomängudes.
- Questions: built-in-music-accessible-corpus-125.
- Location: [content/generated/06-music.en-et.csv:246](../../../content/generated/06-music.en-et.csv) (built-in-music-accessible-corpus-125).

Both Guitar Hero and Rock Band are rhythm-game series using guitar-shaped controllers to play rock songs; neither prompt includes a feature that uniquely selects Guitar Hero.

Suggested repair: Add a distinguishing Guitar Hero title/developer/first-release detail, or accept Rock Band if retaining this broad description.

## B-033: Two albums visibly print their titles in a category promising title-free covers

- Concern: Category coherence; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-music-set-036 — Album covers without the title / Albumikaaned ilma pealkirjata.
- Questions: built-in-music-playable-corpus-092, built-in-music-playable-corpus-093.
- Location: [content/generated/06-music.en-et.csv:258](../../../content/generated/06-music.en-et.csv) (built-in-music-playable-corpus-092).
- Location: [content/generated/06-music.en-et.csv:259](../../../content/generated/06-music.en-et.csv) (built-in-music-playable-corpus-093).

Sgt. Pepper's cover has the title on the drum; London Calling's cover visibly prints LONDON CALLING. Tier3 even mentions its lettering. Thus 2 of 5 clues contradict the exact category promise.

Suggested repair: Replace those covers with title-free examples or rename the topic 'Recognizable album covers'.

## B-034: Space-song clues name sibling song answers

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-music-set-045 — Pop songs that looked toward space / Kosmose poole vaadanud poplaulud.
- Questions: built-in-music-playable-corpus-136, built-in-music-playable-corpus-138, built-in-music-playable-corpus-140.
- Location: [content/generated/06-music.en-et.csv:302](../../../content/generated/06-music.en-et.csv) (built-in-music-playable-corpus-136).
- Location: [content/generated/06-music.en-et.csv:304](../../../content/generated/06-music.en-et.csv) (built-in-music-playable-corpus-138).
- Location: [content/generated/06-music.en-et.csv:306](../../../content/generated/06-music.en-et.csv) (built-in-music-playable-corpus-140).

Tier3 names Bowie's Space Oddity verbatim, the tier1 answer. Tier1 names Major Tom, accepted as the entire tier5 response. Three clues revolve around the same astronaut/Bowie chain rather than independent recognition.

Example: Read tier3 and copy 'Space Oddity' into tier1; read tier1 and answer tier5 with its explicit 'Major Tom' accepted variant.

Suggested repair: Replace one or more Bowie-linked titles with unrelated space songs; avoid naming sibling song titles or accepted aliases in any prompt/reveal.

## B-035: Slash's warm-up origin story is presented as settled despite his conflicting later account

- Concern: Facts, ambiguity and localization; severity: low; confidence: medium; assessment: review finding.
- Categories: built-in-music-set-059 — Rock riffs with an origin story / Rokirifid, millel on oma sünnilugu.
- Questions: built-in-music-playable-corpus-208.
- Location: [content/generated/06-music.en-et.csv:374](../../../content/generated/06-music.en-et.csv) (built-in-music-playable-corpus-208).

Guitar World's primary 2009 reader interview described the riff as an exercise, but its later history also reports Slash's 2022 correction that it was simply composing a riff. The clue treats the warm-up story as unqualified fact.

Suggested repair: Remove the warm-up claim and ask about the recognizable riff/band, or explicitly attribute the origin story to the earlier account.

Source: [Guitar World: history of Sweet Child O' Mine with 2009 interview and 2022 correction](https://www.guitarworld.com/artists/guitarists/the-story-of-guns-n-roses-sweet-child-o-mine) — Read article lines136–170; conflicting artist accounts summarized.

## B-036: Fully accompanied Great Gig in the Sky weakly fits a mostly-vocal construction category

- Concern: Category coherence; severity: low; confidence: medium; assessment: review finding.
- Categories: built-in-music-set-082 — Recordings built mostly from the human voice / Peamiselt inimhäälest loodud salvestised.
- Questions: built-in-music-playable-corpus-323.
- Location: [content/generated/06-music.en-et.csv:489](../../../content/generated/06-music.en-et.csv) (built-in-music-playable-corpus-323).

The clue itself specifies piano accompaniment, and the recording also includes substantial band instrumentation. A celebrated wordless vocal lead is different from the surrounding mostly/a-cappella voice-built tracks.

Suggested repair: Rename to 'Recordings that put the human voice first' or substitute an actual mostly-vocal recording.

## B-037: Pictures at an Exhibition is asked as Mussorgsky's suite under orchestral works

- Concern: Category coherence; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-music-set-084 — Orchestral works that paint a world / Orkestriteosed, mis maalivad terve maailma.
- Questions: built-in-music-playable-corpus-333.
- Location: [content/generated/06-music.en-et.csv:499](../../../content/generated/06-music.en-et.csv) (built-in-music-playable-corpus-333).

Mussorgsky composed the suite for solo piano, subsequently orchestrated by Ravel and others. Neither clue nor explanation identifies an orchestral arrangement, despite the category title promising orchestral works.

Suggested repair: Ask specifically about Ravel's orchestration of Mussorgsky's suite or broaden the title to programmatic classical works.

## B-038: Regional dance definitions do not uniquely identify rumba and merengue

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-music-set-103 — Latin American Rhythms / Ladina-Ameerika rütmid.
- Questions: built-in-music-easy-expansion-012, built-in-music-easy-expansion-015.
- Location: [content/generated/06-music.en-et.csv:513](../../../content/generated/06-music.en-et.csv) (built-in-music-easy-expansion-012).
- Location: [content/generated/06-music.en-et.csv:516](../../../content/generated/06-music.en-et.csv) (built-in-music-easy-expansion-015).

The Cuban tradition sharing a ballroom name also describes cha-cha-cha and mambo; the lively Dominican national music/partner dance also describes bachata. No rhythm, instrument, historical figure or movement distinguishes the required responses.

Suggested repair: Add a rumba-specific Afro-Cuban percussion/guaguanco cue and a merengue-specific duple metre or tambora/guira cue; otherwise accept plausible alternatives.

## B-039: A later prompt directly names the singer asked in tier3

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-music-set-134 — Movie Songs Beyond the Credits / Filmilaulud tiitritest kaugemal.
- Questions: built-in-music-all-level-expansion-0068, built-in-music-all-level-expansion-0070.
- Location: [content/generated/06-music.en-et.csv:669](../../../content/generated/06-music.en-et.csv) (built-in-music-all-level-expansion-0068).
- Location: [content/generated/06-music.en-et.csv:671](../../../content/generated/06-music.en-et.csv) (built-in-music-all-level-expansion-0070).

Tier3 asks who sang Footloose. Tier5 explicitly starts 'Kenny Loggins's Danger Zone', naming the same response in both languages.

Example: Select/read tier5 first, then reuse Kenny Loggins for tier3 without knowing Footloose.

Suggested repair: Remove the singer name from tier5 and anchor it to film/music context, or replace one Loggins clue with a different performer.

## B-040: Jazz Stars and Their Partners never asks about partners

- Concern: Category coherence; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-music-set-137 — Jazz Stars and Their Partners / Džässistaarid ja nende kaaslased.
- Questions: built-in-music-all-level-expansion-0081, built-in-music-all-level-expansion-0082, built-in-music-all-level-expansion-0083, built-in-music-all-level-expansion-0084, built-in-music-all-level-expansion-0085.
- Location: [content/generated/06-music.en-et.csv:682](../../../content/generated/06-music.en-et.csv) (built-in-music-all-level-expansion-0081).
- Location: [content/generated/06-music.en-et.csv:683](../../../content/generated/06-music.en-et.csv) (built-in-music-all-level-expansion-0082).
- Location: [content/generated/06-music.en-et.csv:684](../../../content/generated/06-music.en-et.csv) (built-in-music-all-level-expansion-0083).
- Location: [content/generated/06-music.en-et.csv:685](../../../content/generated/06-music.en-et.csv) (built-in-music-all-level-expansion-0084).
- Location: [content/generated/06-music.en-et.csv:686](../../../content/generated/06-music.en-et.csv) (built-in-music-all-level-expansion-0085).

All five clues are solo-artist nickname, style or recording identifications. No collaborator or partner forms the requested relationship promised by either title.

Suggested repair: Rename to 'Jazz stars and signature works' or rewrite several clues around actual collaborators.

## B-041: An instrument-family category ends by asking for a Beatles member

- Concern: Category coherence; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-music-set-146 — Instruments with Family Histories / Pillid ja nende sugulased.
- Questions: built-in-music-all-level-expansion-0130.
- Location: [content/generated/06-music.en-et.csv:731](../../../content/generated/06-music.en-et.csv) (built-in-music-all-level-expansion-0130).

The first four clues ask instruments, while tier5 asks George Harrison's personal training. The category title 'Instruments with Family Histories' does not prepare players for musician biography; the relationship is not a family history of an instrument.

Suggested repair: Ask an instrument's related predecessor/type or broaden the title to 'Instruments and the people who played them'.

## B-042: Jazz Albums with a Clear Identity primarily asks composers of individual songs

- Concern: Category coherence; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-music-set-152 — Jazz Albums with a Clear Identity / Oma näoga džässialbumid.
- Questions: built-in-music-all-level-expansion-0157, built-in-music-all-level-expansion-0159, built-in-music-all-level-expansion-0160.
- Location: [content/generated/06-music.en-et.csv:758](../../../content/generated/06-music.en-et.csv) (built-in-music-all-level-expansion-0157).
- Location: [content/generated/06-music.en-et.csv:760](../../../content/generated/06-music.en-et.csv) (built-in-music-all-level-expansion-0159).
- Location: [content/generated/06-music.en-et.csv:761](../../../content/generated/06-music.en-et.csv) (built-in-music-all-level-expansion-0160).

Blue Rondo a la Turk, 'Round Midnight and Fables of Faubus are presented as individual compositions, with no album identified. Only two clues actually name album/suite releases, making the album-specific promise misleading.

Suggested repair: Rename to 'Jazz works and their creators' or identify the relevant album in each clue.

## B-043: Instrument-centered classical story ends on a philosopher's family relation

- Concern: Category coherence; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-music-set-159 — Instruments Tell the Classical Story / Pillid jutustavad klassikalise loo.
- Questions: built-in-music-all-level-expansion-0195.
- Location: [content/generated/06-music.en-et.csv:796](../../../content/generated/06-music.en-et.csv) (built-in-music-all-level-expansion-0195).

Tier5 asks the philosopher brother of a concerto's commissioner, rather than an instrument or how music depicts characters. The link to the promised topic is incidental family biography.

Suggested repair: Ask which solo instrument played Wittgenstein's left-hand concerto or substitute another story-representing instrument.

## B-044: The Beatles parody answer is repeatedly supplied by earlier film clues

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-music-set-167 — Albums and Bands Become Films / Albumitest ja ansamblitest saavad filmid.
- Questions: built-in-music-all-level-expansion-0233, built-in-music-all-level-expansion-0234, built-in-music-all-level-expansion-0235.
- Location: [content/generated/06-music.en-et.csv:834](../../../content/generated/06-music.en-et.csv) (built-in-music-all-level-expansion-0233).
- Location: [content/generated/06-music.en-et.csv:835](../../../content/generated/06-music.en-et.csv) (built-in-music-all-level-expansion-0234).
- Location: [content/generated/06-music.en-et.csv:836](../../../content/generated/06-music.en-et.csv) (built-in-music-all-level-expansion-0235).

Tier3 explicitly calls Yellow Submarine the Beatles' animation and tier4's explanation calls Across the Universe Beatles-based. Tier5 asks which band the Rutles parody, answer the Beatles.

Example: After tiers3/4, choose the already repeated Beatles answer for tier5 without knowing the Rutles.

Suggested repair: Replace the Rutles clue with a different film/album connection or avoid naming the parody target in sibling clues.

## B-045: Wah-wah is explicitly given before the guitar-effect question

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-music-set-168 — Changing the Instrument's Voice / Pilli hääle muutmine.
- Questions: built-in-music-all-level-expansion-0237, built-in-music-all-level-expansion-0238.
- Location: [content/generated/06-music.en-et.csv:838](../../../content/generated/06-music.en-et.csv) (built-in-music-all-level-expansion-0237).
- Location: [content/generated/06-music.en-et.csv:839](../../../content/generated/06-music.en-et.csv) (built-in-music-all-level-expansion-0238).

Tier2 asks a trumpet accessory that makes a 'wah-wah effect' and its explanation repeats wah-wah. Tier3 asks a guitar effect by filter/vowel description, with response wah-wah.

Example: Use the just-revealed effect name wah-wah for tier3.

Suggested repair: Avoid the effect name in tier2 or choose a different guitar effect that is not taught by the mute clue.

## B-046: Enigma Variations is not a symphony

- Concern: Category coherence; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-music-set-169 — Symphonies with More than a Number / Sümfooniad, millel on enamat kui number.
- Questions: built-in-music-all-level-expansion-0243.
- Location: [content/generated/06-music.en-et.csv:844](../../../content/generated/06-music.en-et.csv) (built-in-music-all-level-expansion-0243).

Both titles specifically promise symphonies, but tier3 asks the dedication of Elgar's orchestral theme-and-variations work, which is not a symphony.

Suggested repair: Replace with a named symphony dedication/story or broaden category to 'Orchestral works with stories'.

## B-048: Hattori Hanzo sword clue requires Volume1 but also fits Volume2

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-film-television-set-007 — One object gives away the film / Üks ese reedab filmi.
- Questions: built-in-film-television-playable-corpus-012.
- Location: [content/generated/07-film-television.en-et.csv:13](../../../content/generated/07-film-television.en-et.csv) (built-in-film-television-playable-corpus-012).

The Bride's Hanzo sword is her essential weapon in both Kill Bill volumes. Prompt does not specify the forging sequence or first film, while response/variants accept only Volume1.

Suggested repair: Ask which first volume contains Hanzo forging the sword, or accept Kill Bill and appropriate volume2 answers under current broad wording.

## B-049: 28 Days Later does not open with the coma awakening

- Concern: Facts, ambiguity and localization; severity: low; confidence: medium; assessment: verification pending.
- Categories: built-in-film-television-set-008 — Films from their first minutes / Filmid esimeste minutite järgi.
- Questions: built-in-film-television-playable-corpus-019.
- Location: [content/generated/07-film-television.en-et.csv:20](../../../content/generated/07-film-television.en-et.csv) (built-in-film-television-playable-corpus-019).

The film begins with animal activists releasing infected chimpanzees; Jim's deserted-hospital awakening follows that prologue. The prompt explicitly says 'opens this way', while explanation itself references the earlier released chimps.

Suggested repair: Say 'After an opening laboratory outbreak, a bicycle courier wakes...' or 'Early in which film...'.

## B-050: Spider-Verse technique clue fits more than one film

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-film-television-set-009 — Animation with a visible technique / Animatsioon nähtava tehnika järgi.
- Questions: built-in-film-television-playable-corpus-023.
- Location: [content/generated/07-film-television.en-et.csv:24](../../../content/generated/07-film-television.en-et.csv) (built-in-film-television-playable-corpus-023).

Both Into the Spider-Verse and Across the Spider-Verse layer drawn/painted comic textures over CGI. No Miles origin, release year or production-specific distinguishing anchor selects the exact required first film.

Suggested repair: Add 2018, Miles's first Spider-Man origin, or another first-film-specific feature; accept Across if keeping generic technique description.

## B-051: Frodo does not leave the Shire with eight companions

- Concern: Facts, ambiguity and localization; severity: medium; confidence: medium; assessment: verification pending.
- Categories: built-in-film-television-set-042 — Film & Television: Fantasy Films / Film ja televisioon: Fantaasiafilmid.
- Questions: built-in-film-television-accessible-corpus-026.
- Location: [content/generated/07-film-television.en-et.csv:152](../../../content/generated/07-film-television.en-et.csv) (built-in-film-television-accessible-corpus-026).

The nine-member Fellowship forms at Rivendell. Frodo initially leaves the Shire with Sam and then Merry/Pippin; the prompt transfers the later Fellowship composition to the start of the Shire journey.

Suggested repair: Say the film begins Frodo's quest from the Shire and later forms a nine-member Fellowship, or locate the eight-companion departure at Rivendell.

## B-052: Daredevil hallway scene duration and rescue are overstated

- Concern: Facts, ambiguity and localization; severity: medium; confidence: medium; assessment: verification pending.
- Categories: built-in-film-television-set-028 — The Camera Doesn't Blink / Kaamera ei pilguta.
- Questions: built-in-film-television-playable-corpus-103.
- Location: [content/generated/07-film-television.en-et.csv:189](../../../content/generated/07-film-television.en-et.csv) (built-in-film-television-playable-corpus-103).

The first-season episode2 hallway fight is commonly documented as approximately three minutes and rescues one kidnapped boy. Prompt says nearly six minutes and trafficking victims plural; needs primary production/Marvel source check.

Suggested repair: Use 'a continuous hallway fight to rescue a kidnapped boy' without unsupported exact duration, or correct duration from production source.

## B-053: Yesterday explanation says only Jack remembers the Beatles

- Concern: Facts, ambiguity and localization; severity: low; confidence: medium; assessment: verification pending.
- Categories: built-in-film-television-set-066 — Strange Roads to Fame / Kummalised teed kuulsuseni.
- Questions: built-in-film-television-playable-corpus-146.
- Location: [content/generated/07-film-television.en-et.csv:232](../../../content/generated/07-film-television.en-et.csv) (built-in-film-television-playable-corpus-146).

The film reveals two other people who remember the Beatles and confront/support Jack. 'Music only he remembers' in both explanations turns the central premise into an absolute that the actual story contradicts.

Suggested repair: Say 'music most of the world no longer remembers' or 'music he realizes the world has largely forgotten'.

## B-054: Fort Boyard clue presents the removed tigers as current format

- Concern: Facts, ambiguity and localization; severity: medium; confidence: medium; assessment: verification pending.
- Categories: built-in-film-television-set-048 — Game shows by the signature gimmick / Telemängud tunnusvõtte järgi.
- Questions: built-in-film-television-playable-corpus-192.
- Location: [content/generated/07-film-television.en-et.csv:278](../../../content/generated/07-film-television.en-et.csv) (built-in-film-television-playable-corpus-192).

Prompt and explanation say treasure room is guarded by tigers in present tense; the French show's real tigers were retired after the 2021 season. No era qualifier tells players this is the historic gimmick.

Suggested repair: Use 'historically guarded by tigers' or ask about the sea fortress/keys without claiming current live tigers.

## B-055: This Is Me musical-film clue fits Camp Rock too

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-film-television-set-075 — Film & Television: Memorable Film Music / Film ja televisioon: Meeldejääv filmimuusika.
- Questions: built-in-film-television-accessible-corpus-100.
- Location: [content/generated/07-film-television.en-et.csv:391](../../../content/generated/07-film-television.en-et.csv) (built-in-film-television-accessible-corpus-100).

The Greatest Showman's 2017 song and Camp Rock's 2008 Demi Lovato/Joe Jonas song share the title This Is Me. Prompt asks only which musical film includes it, with no cast/year/lyric distinction.

Suggested repair: Specify the Keala Settle/Lettie Lutz ensemble anthem or 2017 circus musical; accept Camp Rock if retaining the broad song-title-only prompt.

Source: [Disney Video: This Is Me](https://video.disney.com/watch/this-is-me-4bb39c96c1921a8833003b15) — Disney identifies This Is Me as a song in Camp Rock, a competing musical-film answer.

## B-056: A daytime soap appears under an English prime-time category title.

- Concern: Category coherence; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-film-television-set-118 — Prime-Time Classics of the 1980s and 1990s / 1980. ja 1990. aastate teleklassika.
- Questions: built-in-film-television-easy-expansion-089.
- Location: [content/generated/07-film-television.en-et.csv:590](../../../content/generated/07-film-television.en-et.csv) (built-in-film-television-easy-expansion-089).

The English title specifies Prime-Time Classics of the 1980s and 1990s, but The Bold and the Beautiful is a daytime soap. The Estonian title only says television classics, so the category scope differs across languages.

Suggested repair: Drop Prime-Time from the English title, or substitute a prime-time classic and align both titles.

## B-057: Walter White does not fit the category's detectives and badges promise.

- Concern: Category coherence; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-film-television-set-138 — Detectives Behind Their Badges / Uurijad märgi taga.
- Questions: built-in-film-television-all-level-expansion-0088.
- Location: [content/generated/07-film-television.en-et.csv:689](../../../content/generated/07-film-television.en-et.csv) (built-in-film-television-all-level-expansion-0088).

The title is Detectives Behind Their Badges / Uurijad märgi taga, but tier 3 asks for criminal Walter White's Heisenberg alias. Neither he nor that alias is an investigator's qualification or badge-related identity.

Suggested repair: Use a broader title such as Crime Characters Beyond the Case, or replace the Walter White clue with a detective's background fact.

## B-058: Oliver! is an adaptation but not a relocation to a new setting.

- Concern: Category coherence; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-film-television-set-146 — Literature Finds a New Setting / Kirjandus leiab uue tegevuspaiga.
- Questions: built-in-film-television-all-level-expansion-0129.
- Location: [content/generated/07-film-television.en-et.csv:730](../../../content/generated/07-film-television.en-et.csv) (built-in-film-television-all-level-expansion-0129).

Literature Finds a New Setting promises relocation examples like Beverly Hills Emma and Vietnam Heart of Darkness. Oliver! retains Oliver Twist's nineteenth-century London setting; the clue asks only its source novel.

Suggested repair: Broaden the category to Literature Reimagined for Film, or replace Oliver! with a work whose setting is actually relocated.

## B-059: The Catan desert is described as having a rollable production number.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-007 — Sports & Games: Around the Game Table / Sport ja mängud: Ümber mängulaua.
- Questions: built-in-sports-games-accessible-corpus-159.
- Location: [content/generated/08-sports-games.en-et.csv:35](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-159).

The question asks which terrain produces nothing when its number is rolled, but the desert has no production number. The explanation explicitly says it has no production number, so the prompt's premise is internally false in both languages.

Suggested repair: Ask which Catan terrain has no production number and begins with the robber on it, or ask which terrain produces no resource without mentioning its number being rolled.

Source: [CATAN official rules and almanac](https://www.catan.com/sites/default/files/2021-07/catan-25th-rules_eng-200313.pdf) — Variable setup explicitly skips desert and states desert never receives a number token.

## B-060: The 2022-final explanation supplies the next clue's country.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-011 — Sports & Games: Football World Cup Nations / Sport ja mängud: Jalgpalli maailmameistrivõistluste riigid.
- Questions: built-in-sports-games-accessible-corpus-011, built-in-sports-games-accessible-corpus-012.
- Location: [content/generated/08-sports-games.en-et.csv:52](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-011).
- Location: [content/generated/08-sports-games.en-et.csv:53](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-012).

Tier 1 reveals that Argentina beat France. Tier 2 then asks which country Les Bleus represented in 2018, with France as its response. The explanation gives the answer explicitly before the next country question.

Example: Answer Argentina and read 'Argentina beat France'; the next response is France.

Suggested repair: Keep the first explanation focused on Argentina's title or score without naming France, or ask a different independently identifying fact.

## B-061: Calendar Grand Slam explanation enumerates three sibling tournament answers.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-014 — Sports & Games: Tennis Grand Slams / Sport ja mängud: Tennise suure slämmi turniirid.
- Questions: built-in-sports-games-accessible-corpus-027, built-in-sports-games-accessible-corpus-028, built-in-sports-games-accessible-corpus-029, built-in-sports-games-accessible-corpus-030.
- Location: [content/generated/08-sports-games.en-et.csv:68](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-027).
- Location: [content/generated/08-sports-games.en-et.csv:69](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-028).
- Location: [content/generated/08-sports-games.en-et.csv:70](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-029).
- Location: [content/generated/08-sports-games.en-et.csv:71](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-030).

Tier 5's explanation names the Australian, French, Wimbledon and US titles. Tiers 2–4 ask for French, Australian and US Open. Since a category can be selected in any order, revealing tier 5 explicitly supplies those tournament identities.

Example: Reveal tier 5, then select Melbourne, Roland-Garros or Flushing Meadows: their answers were just enumerated.

Suggested repair: Explain that all four majors must be won in one calendar year without listing their names, and avoid tournament enumeration in sibling explanations.

## B-062: Jump-ball explanation permits tapping the ball while it is still rising.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-019 — Basketball Terms from One Play / Korvpalliterminid ühe olukorra järgi.
- Questions: built-in-sports-games-playable-corpus-011.
- Location: [content/generated/08-sports-games.en-et.csv:92](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-playable-corpus-011).

Both explanations describe tapping the rising ball. FIBA Article 12.2.4 permits jumper contact only after it has started its downward flight.

Suggested repair: Replace rising ball with tossed ball on its downward flight, matching FIBA Article 12.2.4.

Source: [FIBA Official Basketball Rules 2024](https://assets.fiba.basketball/image/upload/documents-corporate-fiba-official-rules-2024-v10a.pdf) — Article 12.2.4 requires jumper contact after the ball starts its downward flight.

## B-063: Cathy Freeman's victory flags are misidentified.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-020 — Olympic Stories That Made History / Ajalukku läinud olümpialood.
- Questions: built-in-sports-games-playable-corpus-018.
- Location: [content/generated/08-sports-games.en-et.csv:99](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-playable-corpus-018).

The explanation says Freeman carried Olympic and Aboriginal flags after winning Sydney 400 metres. The famous dual-flag lap used Australian and Aboriginal flags.

Suggested repair: Replace Olympic with Australian in both explanations and cite an authoritative account of the Sydney lap.

Source: [Australian Olympic Committee: Cathy Freeman](https://www.olympics.com.au/olympians/cathy-freeman/) — Olympic profile identifies her Sydney victory-lap flags as Australian and Aboriginal.

## B-064: The generic word-explanation rule does not uniquely identify Alias.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-025 — Party Games from the Rule Everyone Remembers / Seltskonnamängud kõigile tuttava reegli järgi.
- Questions: built-in-sports-games-playable-corpus-041.
- Location: [content/generated/08-sports-games.en-et.csv:122](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-playable-corpus-041).

Explaining a card's word to teammates without saying that word is also fundamental to Taboo, Articulate and other word games. The prompt supplies no distinctive Alias mechanic, origin or product identifier, while only Alias is accepted.

Suggested repair: Add an Alias-specific anchor such as the Finnish publisher Tactic or its named game format, or accept other games consistent with the generic rule.

## B-065: Shot-clock clue places the deadline on rim contact rather than release.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-028 — Rules That Stop the Action / Reeglid, mis mängu peatavad.
- Questions: built-in-sports-games-playable-corpus-059.
- Location: [content/generated/08-sports-games.en-et.csv:140](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-playable-corpus-059).

The wording requires an attempt that reaches the rim within 24 seconds. A legal shot can leave the player's hand before the buzzer and contact the rim after the clock expires; release must be timely, while subsequent rim contact validates the attempt.

Suggested repair: Ask for the violation when no shot leaves the player's hand before the shot clock expires and then hits the rim or enters the basket. State the selected basketball rule code.

Source: [FIBA Official Basketball Rules 2024](https://assets.fiba.basketball/image/upload/documents-corporate-fiba-official-rules-2024-v10a.pdf) — Article 29.1.1 requires release before shot-clock signal and subsequent ring contact or basket; 29.1.2 allows scoring while airborne at signal.

## B-066: The Verstappen clue names the driver sought by its sibling clue.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-029 — Formula One Household Names / Vormel 1 üldtuntud nimed.
- Questions: built-in-sports-games-playable-corpus-063, built-in-sports-games-playable-corpus-064.
- Location: [content/generated/08-sports-games.en-et.csv:144](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-playable-corpus-063).
- Location: [content/generated/08-sports-games.en-et.csv:145](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-playable-corpus-064).

Tier 3 asks for Lewis Hamilton by championship achievement. Tier 4 states that Verstappen passed Lewis Hamilton in the finale, directly giving the other driver's name.

Example: Read the tier 4 prompt, then select the first Black F1 competitor clue: Lewis Hamilton was just supplied.

Suggested repair: Refer to the defending champion or championship rival without naming Hamilton, or change one clue to an independent fact.

## B-068: A fantasy game master and d20 do not uniquely identify Dungeons & Dragons.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-042 — Fantasy and Adventure on the Table / Fantaasia ja seiklus mängulaual.
- Questions: built-in-sports-games-playable-corpus-126.
- Location: [content/generated/08-sports-games.en-et.csv:207](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-playable-corpus-126).

Pathfinder and other d20 fantasy tabletop RPGs also have a game master guide adventurers and resolve uncertain actions with a twenty-sided die. Only Dungeons & Dragons variants are accepted, without a distinctive D&D-specific anchor.

Suggested repair: Add Gary Gygax and Dave Arneson, the 1974 debut, or other distinctive D&D identification; alternatively accept consistent RPG answers.

## B-069: The Kinect console clue also fits Xbox One.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-045 — Consoles That Defined a Generation / Konsoolid, mis määrasid põlvkonna.
- Questions: built-in-sports-games-playable-corpus-142.
- Location: [content/generated/08-sports-games.en-et.csv:223](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-playable-corpus-142).

Xbox One supports online multiplayer and used a later Kinect controller-free motion system. The prompt gives no 2005 launch, red-ring or generation anchor that uniquely identifies Xbox 360.

Suggested repair: Specify the 2005 Microsoft console whose Kinect add-on arrived in 2010, or another unique Xbox 360 identifier.

## B-070: Ryu, Ken and Hadouken do not select Street Fighter II over its siblings.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-046 — Arcade Cabinets by the Action / Arkaadikapid tegevuse järgi.
- Questions: built-in-sports-games-playable-corpus-147.
- Location: [content/generated/08-sports-games.en-et.csv:228](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-playable-corpus-147).

Both characters and their Hadouken attacks appear across Street Fighter titles, including the original. The clue asks a landmark fighting game but accepts only Street Fighter II, with no date or eight-character roster anchor.

Suggested repair: Mention the 1991 sequel, eight selectable fighters or another uniquely second-game fact; accept Street Fighter as a broad answer if retaining this wording.

## B-071: The horizontal-bar clue also describes pole vault.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-052 — Sports & Games: Track and Field / Sport ja mängud: Kergejõustik.
- Questions: built-in-sports-games-accessible-corpus-049.
- Location: [content/generated/08-sports-games.en-et.csv:260](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-049).

Both high jump and pole vault require clearing a horizontal bar without dislodging it. The one-foot takeoff appears only after the answer in the explanation, while the prompt accepts only high jump.

Suggested repair: Specify jumping from one foot without using a pole, or add the Fosbury flop; otherwise accept pole vault as consistent.

## B-072: The medley clue lists all four swimming-style answers.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-053 — Sports & Games: Competitive Swimming / Sport ja mängud: Võistlusujumine.
- Questions: built-in-sports-games-accessible-corpus-051, built-in-sports-games-accessible-corpus-052, built-in-sports-games-accessible-corpus-053, built-in-sports-games-accessible-corpus-054, built-in-sports-games-accessible-corpus-055.
- Location: [content/generated/08-sports-games.en-et.csv:262](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-051).
- Location: [content/generated/08-sports-games.en-et.csv:263](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-052).
- Location: [content/generated/08-sports-games.en-et.csv:264](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-053).
- Location: [content/generated/08-sports-games.en-et.csv:265](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-054).
- Location: [content/generated/08-sports-games.en-et.csv:266](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-055).

Tier 5 prompt names butterfly, backstroke, breaststroke and freestyle, which directly names tiers 2–4 and strongly narrows front crawl. Tier 4 explanation also says butterfly developed from breaststroke, revealing tier 3. Four recognized competitive strokes form the explicitly complete pool.

Example: Select the medley clue first and repeat breaststroke, backstroke and butterfly in the three style clues; after three style answers the remaining one is a finite-pool choice.

Suggested repair: Replace multiple style-definition clues with varied swimming concepts and avoid naming unrevealed style responses in the medley clue or explanation.

## B-073: Breakaway explanation supplies peloton.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-054 — Sports & Games: Road Cycling / Sport ja mängud: Maanteerattasõit.
- Questions: built-in-sports-games-accessible-corpus-057, built-in-sports-games-accessible-corpus-059.
- Location: [content/generated/08-sports-games.en-et.csv:268](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-057).
- Location: [content/generated/08-sports-games.en-et.csv:270](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-059).

Tier 2 asks the French term for the main group, peloton. Tier 4 explanation explicitly says a breakaway has separated ahead of the peloton, giving that response if played first.

Example: Reveal breakaway at tier 4, then answer the main-group term using peloton from the explanation.

Suggested repair: Use main pack in the breakaway explanation or choose an independent cycling fact.

## B-074: The putter prompt gives away green/griin.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-059 — Sports & Games: Golf / Sport ja mängud: Golf.
- Questions: built-in-sports-games-accessible-corpus-082, built-in-sports-games-accessible-corpus-083.
- Location: [content/generated/08-sports-games.en-et.csv:293](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-082).
- Location: [content/generated/08-sports-games.en-et.csv:294](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-083).

Tier 2 asks the club designed to roll the ball on the green/griin. Tier 3 asks the name of that closely mown area, with green/griin as the response.

Example: Read 'on the green' in tier 2 and repeat green when asked the area name at tier 3.

Suggested repair: Use near the hole in the putter prompt and explanation, or replace the area-name clue.

## B-075: Queen explanation names the rook and bishop answers.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-062 — Sports & Games: Chess Basics / Sport ja mängud: Male põhitõed.
- Questions: built-in-sports-games-accessible-corpus-097, built-in-sports-games-accessible-corpus-098, built-in-sports-games-accessible-corpus-100.
- Location: [content/generated/08-sports-games.en-et.csv:308](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-097).
- Location: [content/generated/08-sports-games.en-et.csv:309](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-098).
- Location: [content/generated/08-sports-games.en-et.csv:311](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-100).

Tier 2's explanation states that the queen combines movement powers of the rook and bishop. Tiers 3 and 5 ask for those two pieces. Four piece-identification clues also create a small familiar pool.

Example: Reveal queen and repeat rook or bishop from its explanation for the later piece-move clues.

Suggested repair: Explain the queen's directions without naming other pieces; replace some piece-definition clues with independently varied chess concepts.

## B-076: Fixed opposite partnerships do not uniquely identify bridge.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-063 — Sports & Games: Card Games / Sport ja mängud: Kaardimängud.
- Questions: built-in-sports-games-accessible-corpus-104.
- Location: [content/generated/08-sports-games.en-et.csv:315](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-104).

Whist, spades and euchre also use four players in opposite partnerships for trick-taking. Bridge's distinguishing auction is supplied only in the revealed explanation.

Suggested repair: Include contract bidding and a declarer's exposed dummy hand in the prompt, or accept other games matching the broad definition.

## B-077: World-map army conquest is insufficiently specific to Risk.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-064 — Sports & Games: Board Games / Sport ja mängud: Lauamängud.
- Questions: built-in-sports-games-accessible-corpus-109.
- Location: [content/generated/08-sports-games.en-et.csv:320](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-109).

The prompt describes a general genre also occupied by Axis & Allies and other world-map conquest games. It does not include Risk's distinctive plastic armies, attack dice or territory-card reinforcements.

Suggested repair: Add Risk-specific dice or territory-card mechanics, or the familiar objective of eliminating opposing armies from the world map.

## B-078: Mario rescuing Toadstool in the Mushroom Kingdom fits several games.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-065 — Sports & Games: Classic Video Games / Sport ja mängud: Klassikalised videomängud.
- Questions: built-in-sports-games-accessible-corpus-112.
- Location: [content/generated/08-sports-games.en-et.csv:323](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-112).

Super Mario Bros. 3 and other entries share Mario, Mushroom Kingdom and Princess Toadstool rescue. The 1985 anchor appears only in the explanation after the answer.

Suggested repair: Move the 1985 date into the prompt or identify the original eight-world NES adventure.

## B-079: Stone Age civilization advancement does not distinguish Age of Empires.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-066 — Sports & Games: Video Games of the 1990s / Sport ja mängud: 1990. aastate videomängud.
- Questions: built-in-sports-games-accessible-corpus-116.
- Location: [content/generated/08-sports-games.en-et.csv:327](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-116).

Civilization and Empire Earth also guide a civilization from ancient eras into later ages. No real-time gameplay, 1997 date or Bronze/Iron Age cap is supplied.

Suggested repair: Ask for the 1997 real-time strategy game advancing through Stone, Tool, Bronze and Iron Ages.

## B-080: Original Doom is placed on Mars rather than its moons.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: medium; assessment: verification pending.
- Categories: built-in-sports-games-set-066 — Sports & Games: Video Games of the 1990s / Sport ja mängud: 1990. aastate videomängud.
- Questions: built-in-sports-games-accessible-corpus-118.
- Location: [content/generated/08-sports-games.en-et.csv:329](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-118).

The 1993 Doom's initial bases are on Phobos and Deimos, with the third episode in Hell. A Mars-surface setting better describes later Doom releases; the 1993 date makes the prompt's location inaccurate.

Suggested repair: Say demon-filled bases on Mars's moons before a journey into Hell, and cite the original manual or publisher synopsis.

## B-081: The island battle-royale rule does not uniquely identify Fortnite.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-067 — Sports & Games: Esports / Sport ja mängud: E-sport.
- Questions: built-in-sports-games-accessible-corpus-121.
- Location: [content/generated/08-sports-games.en-et.csv:332](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-accessible-corpus-121).

PUBG and other battle-royale games also drop players onto an island and award victory to the last player or team. Fortnite's distinguishing construction mechanic is only in the explanation.

Suggested repair: Mention building structures while fighting on an island, or the Battle Bus, in the prompt.

## B-082: Wheelchair basketball travelling is counted by pushes, not mere wheel touches.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-073 — Paralympic Sports by Their Adaptation / Paralümpiaalad kohanduse järgi.
- Questions: built-in-sports-games-playable-corpus-196.
- Location: [content/generated/08-sports-games.en-et.csv:362](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-playable-corpus-196).

The prompt and explanation say touching the chair's wheels more than twice is travelling. The rule regulates more than two consecutive pushes while holding the ball, so merely touching or adjusting grip on the wheels is not equivalent to a push.

Suggested repair: Say more than two consecutive pushes on the wheels while holding the ball without dribbling, passing or shooting; cite IWBF rules.

Source: [IWBF Official Wheelchair Basketball Rules 2023](https://www.iwbf-europe.org/wp-content/uploads/2023/03/2023_IWBF_rules-Ver2_underlined-small.pdf) — Articles 24/25 count pushes, allow two, and exclude braking without hand movement from a push.

## B-083: Feeding and dressing a title pet does not uniquely identify Pou.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-095 — Virtual Pets Through the Years / Virtuaallemmikud läbi aastate.
- Questions: built-in-sports-games-playable-corpus-309.
- Location: [content/generated/08-sports-games.en-et.csv:475](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-playable-corpus-309).

My Talking Tom, My Talking Angela and other virtual-pet games also have feeding, dressing and caring for a title creature. The clue provides no distinctive Pou shape or alien identity.

Suggested repair: Describe Pou as a small brown triangular alien pet or identify its creator, while retaining the recognizable care mechanic.

## B-084: Four-instrument living-room play also fits Guitar Hero's band games.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-099 — Music Games from the Controller / Muusikamängud juhtimisviisi järgi.
- Questions: built-in-sports-games-playable-corpus-327.
- Location: [content/generated/08-sports-games.en-et.csv:493](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-playable-corpus-327).

Guitar Hero World Tour and later Guitar Hero installments support guitar, bass, drums and microphone. The prompt asks a series but provides no Harmonix, 2007 or Rock Band-specific anchor.

Suggested repair: Mention the Harmonix series launched in 2007 or another unique Rock Band identifier; otherwise accept compatible Guitar Hero answers.

## B-085: Being airborne does not uniquely define a jump shot.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-106 — Basketball Moves / Korvpallivõtted.
- Questions: built-in-sports-games-easy-expansion-028.
- Location: [content/generated/08-sports-games.en-et.csv:529](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-easy-expansion-028).

Layups, jump hooks and alley-oop finishes can also release the ball while the shooter is airborne; this category itself includes a layup and alley-oop. No standard shooting form distinguishes jump shot in the prompt.

Suggested repair: Describe a conventional shot released near the top of a vertical jump from the shooter's usual above-head shooting position; avoid defining it only as airborne.

## B-086: The tennis net clue excludes legal around-the-post returns.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-113 — On a Tennis Court / Tenniseväljakul.
- Questions: built-in-sports-games-easy-expansion-063.
- Location: [content/generated/08-sports-games.en-et.csv:564](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-easy-expansion-063).

Prompt and explanation say the ball must pass over the net. Tennis rules permit a return around the net post, above or below net height, if it otherwise lands in the correct court.

Suggested repair: Say the net normally separates players and they send the ball to the opposite court, without requiring every legal ball to travel over it; cite ITF Rule 25.

Source: [ITF Tennis Glossary](https://www.itftennis.com/en/about-us/organisation/tennis-glossary/) — Court layout explicitly permits returns around net posts.

## B-087: The enclosed-court rubber-ball description also fits racquetball.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-116 — Racket Sports Beyond Tennis / Reketialad väljaspool tennist.
- Questions: built-in-sports-games-easy-expansion-077.
- Location: [content/generated/08-sports-games.en-et.csv:578](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-easy-expansion-077).

Racquetball also uses rackets to hit a rubber ball against the front wall in a small enclosed court. The clue omits squash's small low-bounce ball, tin boundary or no-ceiling-in-play restriction.

Suggested repair: Specify the small low-bouncing squash ball and front-wall tin, or otherwise add a distinguishing rule.

## B-088: A Russian Washington Capitals goal scorer is not uniquely Ovechkin.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-117 — Ice-Hockey Stars / Jäähokitähed.
- Questions: built-in-sports-games-easy-expansion-083.
- Location: [content/generated/08-sports-games.en-et.csv:584](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-easy-expansion-083).

Alexander Semin and Evgeny Kuznetsov are also Russian stars associated with scoring for Washington. Only Ovechkin is accepted, without his Great Eight nickname or NHL goal record.

Suggested repair: Add Ovechkin's number 8/Great Eight nickname or a historically dated unique scoring milestone.

## B-089: A hostile Minecraft mob appears under game companions.

- Concern: Category coherence; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-125 — Game Heroes Have Company / Mängukangelastel on kaaslased.
- Questions: built-in-sports-games-all-level-expansion-0025.
- Location: [content/generated/08-sports-games.en-et.csv:626](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-all-level-expansion-0025).

Game Heroes Have Company groups four recognizable companions with an Enderman that becomes hostile when looked at. The question and explanation identify an enemy rather than a companion.

Suggested repair: Rename the category to Game Characters Beyond the Hero, or replace Enderman with a recognizable companion.

## B-090: A sprint-nationality clue sits under Athletics Beyond the Sprint.

- Concern: Category coherence; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-126 — Athletics Beyond the Sprint / Kergejõustik sprindist kaugemal.
- Questions: built-in-sports-games-all-level-expansion-0027.
- Location: [content/generated/08-sports-games.en-et.csv:628](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-all-level-expansion-0027).

The Bolt question explicitly asks the country represented in Olympic sprint victories, despite both category titles promising athletics beyond sprinting.

Suggested repair: Replace with a non-sprint athlete or broaden the category title to Athletics Around the Track and Field.

## B-091: Most clues do not concern Olympic cities' first achievements.

- Concern: Category coherence; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-135 — Olympic Cities Have a First / Olümpialinnadel on esmakordne saavutus.
- Questions: built-in-sports-games-all-level-expansion-0073, built-in-sports-games-all-level-expansion-0074, built-in-sports-games-all-level-expansion-0075.
- Location: [content/generated/08-sports-games.en-et.csv:674](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-all-level-expansion-0073).
- Location: [content/generated/08-sports-games.en-et.csv:675](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-all-level-expansion-0074).
- Location: [content/generated/08-sports-games.en-et.csv:676](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-all-level-expansion-0075).

Olympic Cities Have a First / Olümpialinnadel on esmakordne saavutus promises first-host milestones. Tiers 3–5 instead ask arrow, James Bond and gymnastics, with no first-achievement claim.

Suggested repair: Rename to Olympic Host Cities and Their Ceremonies, or replace tiers 3–5 with accessible city-first milestones.

## B-092: Women's-cup clue names Ryder Cup, the other answer.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-141 — Cups Beyond the Usual Shelf / Karikad tavalisest riiulist kaugemal.
- Questions: built-in-sports-games-all-level-expansion-0102, built-in-sports-games-all-level-expansion-0103.
- Location: [content/generated/08-sports-games.en-et.csv:703](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-all-level-expansion-0102).
- Location: [content/generated/08-sports-games.en-et.csv:704](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-all-level-expansion-0103).

Tier 2 asks the men's Europe-versus-USA competition, Ryder Cup. Tier 3 explicitly calls Solheim Cup its counterpart to the Ryder Cup, supplying tier 2's response in both languages.

Example: Read the Solheim prompt and repeat Ryder Cup for the men's competition.

Suggested repair: Describe Europe's and America's women's teams without naming Ryder Cup, or choose an independent cup question.

## B-093: Bluffing question gives the folding action.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-142 — Cards and Decisions / Kaardid ja otsused.
- Questions: built-in-sports-games-all-level-expansion-0106, built-in-sports-games-all-level-expansion-0107.
- Location: [content/generated/08-sports-games.en-et.csv:707](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-all-level-expansion-0106).
- Location: [content/generated/08-sports-games.en-et.csv:708](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-all-level-expansion-0107).

Tier 1 seeks folding/loobumine; tier 2 explicitly asks the tactic that makes opponents fold/loobuma. This supplies the core response word rather than merely explaining unrelated poker context.

Example: Read 'make opponents fold' and use fold for the withdraw-from-hand clue.

Suggested repair: Describe pressuring opponents to abandon their hands without using fold/loobuma, or replace the action clue with independent card knowledge.

## B-094: The team-tennis category ends with two individual-match rules.

- Concern: Category coherence; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-143 — Tennis Has Team Events Too / Ka tennises on võistkonnavõistlused.
- Questions: built-in-sports-games-all-level-expansion-0114, built-in-sports-games-all-level-expansion-0115.
- Location: [content/generated/08-sports-games.en-et.csv:715](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-all-level-expansion-0114).
- Location: [content/generated/08-sports-games.en-et.csv:716](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-all-level-expansion-0115).

Tennis Has Team Events Too / Ka tennises on võistkonnavõistlused promises team competitions. Underarm serve and a seven-point tiebreak's service sequence are general individual-match rules, unrelated to Billie Jean King, Hopman or Laver team events.

Suggested repair: Broaden the title to Tennis Cups and Court Rules, or replace tiers 4–5 with independently recognizable team-event facts.

## B-095: Rosenberg farming and family feeding also fits Caverna.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-155 — Different Worlds on the Table / Erinevad maailmad laual.
- Questions: built-in-sports-games-all-level-expansion-0173.
- Location: [content/generated/08-sports-games.en-et.csv:774](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-all-level-expansion-0173).

Both Agricola and Uwe Rosenberg's Caverna involve developing a farm, expanding a household and feeding the family. The prompt has no two-room wooden house or 2007 original-game anchor to select Agricola.

Suggested repair: Specify the 2007 game beginning with a two-room wooden hut and two family members, or distinguish ordinary farmers from Caverna's dwarfs.

## B-096: A track race appears under field-event stories.

- Concern: Category coherence; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-162 — Field Events Have Their Stories / Tehnilistel aladel on oma lood.
- Questions: built-in-sports-games-all-level-expansion-0210.
- Location: [content/generated/08-sports-games.en-et.csv:811](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-all-level-expansion-0210).

The English title Field Events Have Their Stories groups four field or combined-event facts with the 800-metre track conclusion of the heptathlon. The response is a track distance, not a field event.

Suggested repair: Broaden to Track and Field Have Their Stories, or replace the final clue with an independent field-event fact.

## B-097: The carcass-carrying horse sport also fits kok-boru.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-166 — Traditional Sports Around the World / Traditsioonilised spordialad maailmas.
- Questions: built-in-sports-games-all-level-expansion-0229.
- Location: [content/generated/08-sports-games.en-et.csv:830](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-all-level-expansion-0229).

Kyrgyz kok-boru also has mounted teams carry a goat carcass to a goal. Central Asia plus goat/calf carcass alone does not uniquely choose buzkashi over related named traditions.

Suggested repair: Anchor Afghanistan and the sport's goat-pulling name or a distinctive buzkashi target format; otherwise accept kok-boru when compatible.

## B-098: Gammon explanation omits the triple-value loss exception.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-sports-games-set-167 — Strategy Has Its Own Vocabulary / Strateegial on oma sõnavara.
- Questions: built-in-sports-games-all-level-expansion-0234.
- Location: [content/generated/08-sports-games.en-et.csv:835](../../../content/generated/08-sports-games.en-et.csv) (built-in-sports-games-all-level-expansion-0234).

It says a player who has borne off no pieces loses double stakes. If that loser also has a checker on the bar or in the winner's home board, the result is a backgammon worth triple stakes. The prompt specifies double-value, but its explanation teaches an incomplete rule.

Suggested repair: Add that the loser has no checker on the bar or in the winner's home board; explain the triple-value backgammon distinction.

Source: [US Backgammon Federation: Backgammon Basics](https://usbgf.org/backgammon-basics-how-to-play/) — No borne-off checkers loses double, except bar/winner-home-board checkers cause backgammon and triple loss.

## C-FOOD-009-ET-ORANGE: The Estonian orange clue repeats a name/colour pun that does not work in Estonian.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-food-drink-set-009 — Food & Drink: Fruits / Toit ja jook: Puuviljad.
- Questions: built-in-food-drink-accessible-corpus-003.
- Location: [content/generated/09-food-drink.en-et.csv:44](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-accessible-corpus-003).

The English fruit orange shares a word with its colour. The Estonian response is apelsin, while the colour is oranž; the translated prompt says the fruit has the same name as its colour and therefore supplies a false identifying property.

Suggested repair: Rewrite the Estonian prompt around orange peel and citrus segments, or explicitly ask about the English word while preserving equivalent challenge.

Source: [EKI Keelenõuanne: Puuviljad](https://keeleabi.eki.ee/artiklid/puuviljad.html) — Apelsin defined as oranži värvi vili; confirms translation error.

Source: [EKI ÕS: oranž](https://arhiiv.eki.ee/dict/qs/index.cgi?Q=oran%C5%BE) — Estonian colour term.

## C-FOOD-011-ROSEMARY-DISCLOSURE: Scarborough Fair clue explicitly names the fifth herb answer.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-food-drink-set-011 — Food & Drink: Fresh Herbs / Toit ja jook: Värsked maitsetaimed.
- Questions: built-in-food-drink-accessible-corpus-011, built-in-food-drink-accessible-corpus-015.
- Location: [content/generated/09-food-drink.en-et.csv:52](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-accessible-corpus-011).
- Location: [content/generated/09-food-drink.en-et.csv:56](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-accessible-corpus-015).

Tier 1 quotes parsley, sage, rosemary and ...; tier 5 asks for rosemary. Both the first prompt and revealed first explanation disclose the exact later answer, so independent knowledge is unnecessary for the harder clue.

Example: Tier 1 prompt and explanation say rosemary; tier 5 answer is Rosemary / rosmariin.

Suggested repair: Replace the song-based thyme clue with an independent culinary/botanical discriminator, with an explanation that does not enumerate sibling herbs.

## C-FOOD-014-NONUNIQUE-CHEESES: Later cheese descriptions identify multiple valid cheeses.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-food-drink-set-014 — Food & Drink: Cheeses of the World / Toit ja jook: Maailma juustud.
- Questions: built-in-food-drink-accessible-corpus-029, built-in-food-drink-accessible-corpus-030.
- Location: [content/generated/09-food-drink.en-et.csv:70](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-accessible-corpus-029).
- Location: [content/generated/09-food-drink.en-et.csv:71](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-accessible-corpus-030).

A soft French cheese with pale edible rind and creamy interior also describes Camembert, not only Brie. A Dutch cheese named after a Dutch city also describes Edam, not only Gouda. Neither alternative is accepted, and the prompts contain no distinguishing region/shape/history.

Suggested repair: Add distinguishing Brie and Gouda properties, or accept every defensible answer; keep independent fact families rather than merely country and city naming.

Source: [BC Dairy: Cheese Lover’s Reference Guide](https://bcdairy.ca/cheese-lovers-reference-guide/) — Brie and Camembert both classed as soft surface-ripened with bloomy rind and creamy texture.

Source: [Laag Holland: Edam cheese](https://www.laagholland.com/en/edam/edam-cheese) — Regional tourism body explains cheese naming after Edam trading port.

## C-FOOD-021-COCOA-BUTTER-DISCLOSURE: Chocolate siblings explicitly supply cocoa butter, a separate answer.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-food-drink-set-021 — Food & Drink: Chocolate / Toit ja jook: Šokolaad.
- Questions: built-in-food-drink-accessible-corpus-062, built-in-food-drink-accessible-corpus-063, built-in-food-drink-accessible-corpus-064, built-in-food-drink-accessible-corpus-065.
- Location: [content/generated/09-food-drink.en-et.csv:103](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-accessible-corpus-062).
- Location: [content/generated/09-food-drink.en-et.csv:104](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-accessible-corpus-063).
- Location: [content/generated/09-food-drink.en-et.csv:105](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-accessible-corpus-064).
- Location: [content/generated/09-food-drink.en-et.csv:106](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-accessible-corpus-065).

Tier 2 asks for the fat pressed from cacao beans. Tier 4 prompt names cocoa butter outright, tier 3 explanation names it, and tier 5 explanation names its crystals. These supply the target in both languages regardless of selection order.

Example: Tier 4: cocoa butter / kakaovõi; tier 2 response: Cocoa butter / kakaovõi.

Suggested repair: Replace the cocoa-butter clue with a chocolate topic whose answer is not required in sibling prompts/explanations, or remove all sibling naming without making their clues vague.

## C-FOOD-024-TEA-STYLES-DISCLOSURE: Oolong prompt supplies the earlier black and green tea answers.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-food-drink-set-024 — Food & Drink: Tea / Toit ja jook: Tee.
- Questions: built-in-food-drink-accessible-corpus-076, built-in-food-drink-accessible-corpus-077, built-in-food-drink-accessible-corpus-079.
- Location: [content/generated/09-food-drink.en-et.csv:117](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-accessible-corpus-076).
- Location: [content/generated/09-food-drink.en-et.csv:118](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-accessible-corpus-077).
- Location: [content/generated/09-food-drink.en-et.csv:120](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-accessible-corpus-079).

Tier 4 asks for the Chinese style between green and black varieties. Under the tea category, those phrases explicitly provide Black tea and Green tea, the earlier answers, and the oxidation comparison also explains their distinction.

Example: Tier 4: between green and black varieties / jääb rohelise ja musta vahele; earlier responses are Black tea and Green tea.

Suggested repair: Use an independent oolong origin or production clue and explanation that avoids naming the sibling tea styles.

## C-FOOD-028-YEAST-DISCLOSURE: The proofing prompt identifies yeast, an accepted earlier answer.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-food-drink-set-028 — Food & Drink: Baking Basics / Toit ja jook: Küpsetamise põhitõed.
- Questions: built-in-food-drink-accessible-corpus-096, built-in-food-drink-accessible-corpus-099.
- Location: [content/generated/09-food-drink.en-et.csv:137](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-accessible-corpus-096).
- Location: [content/generated/09-food-drink.en-et.csv:140](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-accessible-corpus-099).

Tier 1 asks for the living microorganism that raises dough, accepting yeast / pärm. Tier 4 names shaped yeast dough / pärmitainas, giving that organism directly.

Example: Tier 4 prompt: shaped yeast dough / vormitud pärmitainal; tier 1 accepted answer: yeast / pärm.

Suggested repair: Remove explicit yeast naming from the proofing clue and explain expansion without naming the organism, or replace one of these clues.

## C-FOOD-030-SALSA-DISCLOSURE: The taco explanation supplies salsa, the third answer.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-food-drink-set-030 — Food & Drink: Mexican Food / Toit ja jook: Mehhiko toit.
- Questions: built-in-food-drink-accessible-corpus-106, built-in-food-drink-accessible-corpus-108.
- Location: [content/generated/09-food-drink.en-et.csv:147](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-accessible-corpus-106).
- Location: [content/generated/09-food-drink.en-et.csv:149](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-accessible-corpus-108).

Revealing tier 1 exposes salsa in the list of taco fillings. Tier 3 asks for the broad Mexican sauce name, whose exact response is Salsa in both languages.

Example: Tier 1 explanation: meat, vegetables, salsa / liha-, köögivilja-, salsa-; tier 3 response: Salsa / salsa.

Suggested repair: Remove named salsa from the taco explanation; describe seasoned fillings generically.

## C-FOOD-007-ICE-BATH-SOURCE: Ice-bath clue cites sports recovery rather than culinary blanching.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-food-drink-set-007 — Kitchen Rescue Missions / Köögi päästeoperatsioonid.
- Questions: built-in-food-drink-accessible-corpus-158.
- Location: [content/generated/09-food-drink.en-et.csv:34](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-accessible-corpus-158).

The supplied Wikipedia Ice bath page is about human immersion for recovery and treatment. The actual page read contains no cooking text, so it does not substantiate the asserted vegetable-blanching method despite the shared term. Health Canada directly supports the culinary claim.

Suggested repair: Replace both display and evidence supporting-source records with a page about culinary blanching and record the correct publisher/license rather than reusing the sports article.

Source: [Ice bath — actual supporting URL](https://en.wikipedia.org/wiki/Ice_bath) — Sports recovery/human immersion; no match for cooking in page read.

Source: [Health Canada: How to blanch vegetables](https://www.canada.ca/en/health-canada/services/food-guide/eating-support/kitchen/cooking-skills/how-blanch-vegetables.html) — Defines blanching with immersion in an ice bath to stop cooking.

## C-FOOD-098-UMAMI-DISCLOSURE: MSG explanation identifies umami, the separate first answer.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-food-drink-set-098 — Sources of Deep Savour / Sügava maitse allikad.
- Questions: built-in-food-drink-playable-corpus-321, built-in-food-drink-playable-corpus-322.
- Location: [content/generated/09-food-drink.en-et.csv:487](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-playable-corpus-321).
- Location: [content/generated/09-food-drink.en-et.csv:488](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-playable-corpus-322).

Tier 1 asks for the savoury basic taste. Tier 2 explanation says monosodium glutamate produces an umami taste, naming the tier-1 target exactly in both languages; after revealing tier 2 the first clue is automatic.

Example: Tier 2 explanation: produces an umami taste / tekitab ... umami maitse; tier 1 response: umami.

Suggested repair: Remove the named basic taste from the MSG explanation or replace one of these linked clues with an independent savoury-food fact.

## C-FOOD-089-NONUNIQUE-JAPANESE-TEA: Whole-leaf Japanese green tea does not uniquely identify sencha.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-food-drink-set-089 — Five Teas with a Story / Viis lugu teest.
- Questions: built-in-food-drink-playable-corpus-280.
- Location: [content/generated/09-food-drink.en-et.csv:446](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-playable-corpus-280).

Gyokuro, bancha and other Japanese green teas are also brewed from processed whole leaves rather than whisked powder. Only sencha is accepted; the prompt lacks its unshaded cultivation or characteristic steaming/rolling discriminator.

Suggested repair: Add a distinguishing sencha cultivation/processing fact, or accept the other valid whole-leaf teas.

Source: [Beverages - Traditional Foods in Japan](https://www.maff.go.jp/e/policies/market/dento_syoku/bunrui/inryou.html) — Gyokuro is Japanese green tea manufactured similarly to sencha and brewed by extracting its leaves in low-temperature water; the clue does not exclude it.

## C-FOOD-100-MAIZE-PORRIDGE-OVERLAP: Generic ugali description also fits the sibling sadza.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-food-drink-set-100 — Staple Dishes of Africa and South America / Aafrika ja Lõuna-Ameerika põhitoidud.
- Questions: built-in-food-drink-playable-corpus-334, built-in-food-drink-playable-corpus-335.
- Location: [content/generated/09-food-drink.en-et.csv:500](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-playable-corpus-334).
- Location: [content/generated/09-food-drink.en-et.csv:501](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-playable-corpus-335).

Tier 4 asks for any widely eaten African dish made by cooking maize flour to a stiff dough-like consistency, accepting ugali, posho and nsima. Sadza, the tier-5 response and a widely eaten maize staple, satisfies that same description but is omitted from tier-4 variants. This repeats the same dish family without an East African regional discriminator.

Example: The two final clues both identify stiff cooked maize meal; tier 4 specifies Africa and tier 5 Zimbabwe.

Suggested repair: Specify an East African regional term in the ugali clue or replace one final maize-porridge clue with an independent food; accepted answers should cover valid regional terms if retaining the broad question.

Source: [Guidelines for measuring household and individual dietary diversity](https://www.fao.org/docrep/014/i1983e/i1983e00.pdf) — Box 2 groups ugali, nsima/nshima, posho and sadza among local names for corn/maize preparations. Relevant Box 2 section read, not the entire 60-page document.

Source: [Sorghum and millets in human nutrition - Culinary preparations](https://www.fao.org/4/T0818e/T0818e0g.htm) — Regional thick-porridge names include ugali and Zimbabwean sadza. This page focuses on sorghum/millet rather than independently proving every maize preparation.

## C-FOOD-126-HUMMUS-DISCLOSURE: Tahini clue directly supplies hummus, a separate answer.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-food-drink-set-126 — Give It a Dip / Kasta sisse.
- Questions: built-in-food-drink-all-level-expansion-0026, built-in-food-drink-all-level-expansion-0027.
- Location: [content/generated/09-food-drink.en-et.csv:627](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-all-level-expansion-0026).
- Location: [content/generated/09-food-drink.en-et.csv:628](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-all-level-expansion-0027).

Tier 1 asks for the chickpea dip with an Arabic chickpea name. Tier 2 prompt names hummus directly and its explanation repeats hummus, so revealing/reading tier 2 answers tier 1 without knowing the etymology.

Example: Tier 2: gives hummus its nutty richness / annab hummusele pähklise maitse; tier 1 response: Hummus / hummus.

Suggested repair: Rewrite the tahini clue and explanation around ground sesame paste without mentioning hummus, or replace one linked clue.

## C-FOOD-133-GLOGG-ALMONDS-RECIPROCAL: Glögg and almonds are reciprocal clues to the same serving fact.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-food-drink-set-133 — Holiday Sips / Pühadejoogid.
- Questions: built-in-food-drink-all-level-expansion-0062, built-in-food-drink-all-level-expansion-0064.
- Location: [content/generated/09-food-drink.en-et.csv:663](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-all-level-expansion-0062).
- Location: [content/generated/09-food-drink.en-et.csv:665](../../../content/generated/09-food-drink.en-et.csv) (built-in-food-drink-all-level-expansion-0064).

Tier 2 asks which nuts accompany Nordic glögg and answers almonds; tier 4 asks which Nordic drink accompanies raisins and almonds and answers glögg. Each prompt contains the other's exact answer, and either revealed explanation contains both answers. These are one fact presented in reverse, so the second clue requires no independent knowledge.

Example: Tier 2: glögg is commonly served with raisins and blanched almonds; tier 4 asks the drink served with raisins and almonds.

Suggested repair: Replace one of the two clues with another holiday-drink tradition and avoid naming the remaining answer in its text.

## C-TECH-005-MICROPHONE-DISCLOSURE: Two other questions name the microphone sought by the first clue.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-005 — How Gadgets Capture Sound and Pictures / Kuidas seadmed heli ja pilti jäädvustavad.
- Questions: built-in-technology-inventions-accessible-corpus-146, built-in-technology-inventions-accessible-corpus-148, built-in-technology-inventions-accessible-corpus-150.
- Location: [content/generated/10-technology-inventions.en-et.csv:22](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-accessible-corpus-146).
- Location: [content/generated/10-technology-inventions.en-et.csv:24](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-accessible-corpus-148).
- Location: [content/generated/10-technology-inventions.en-et.csv:26](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-accessible-corpus-150).

Tier three describes a mesh screen between a singer and microphone; tier five places two microphones like ears. Both languages explicitly name the tier-one answer in unrevealed prompts, while explanations repeat it.

Example: Tier 1 asks which device turns sound into an electrical signal; tier 3 says 'between a singer and microphone' / 'laulja ja mikrofoni vahele'.

Suggested repair: Use an independent capture-device clue or replace the microphone response; rewrite siblings without naming another target.

## C-TECH-011-USB-SSD-OVERLAP: SSD clue also describes the USB flash drive in the same category.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-011 — Technology & Inventions: Digital Storage / Tehnoloogia ja leiutised: Digitaalne andmesalvestus.
- Questions: built-in-technology-inventions-accessible-corpus-012, built-in-technology-inventions-accessible-corpus-014.
- Location: [content/generated/10-technology-inventions.en-et.csv:53](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-accessible-corpus-012).
- Location: [content/generated/10-technology-inventions.en-et.csv:55](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-accessible-corpus-014).

A common storage device using flash memory with no moving mechanical parts includes USB flash drives; tier two's explanation explicitly establishes that the device combines flash memory and a USB connector. Only SSD is accepted at tier four.

Example: After USB-drive reveal, players know it uses flash memory and can offer that same valid device for tier four.

Suggested repair: Specify the internal SATA/NVMe drive replacing a magnetic hard disk, or replace one clue with a different storage fact.

## C-TECH-012-NONUNIQUE-FORMATS: Generic audio, archive and transparent-image descriptions do not uniquely identify the accepted formats.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-012 — Technology & Inventions: Files and Formats / Tehnoloogia ja leiutised: Failid ja vormingud.
- Questions: built-in-technology-inventions-accessible-corpus-018, built-in-technology-inventions-accessible-corpus-019, built-in-technology-inventions-accessible-corpus-020.
- Location: [content/generated/10-technology-inventions.en-et.csv:59](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-accessible-corpus-018).
- Location: [content/generated/10-technology-inventions.en-et.csv:60](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-accessible-corpus-019).
- Location: [content/generated/10-technology-inventions.en-et.csv:61](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-accessible-corpus-020).

'Familiar format compresses digital audio' admits AAC, Ogg and others; bundling/compressing multiple files admits RAR and 7z; lossless images with transparency admit GIF and lossless WebP. Their valid alternatives are not accepted variants.

Suggested repair: Add a discriminating extension, origin or format-specific feature to each clue, or expand variants when a generic class is intended.

Source: [7z Format](https://www.7-zip.org/7z.html) — 7z is an archive format supporting compressed files; ZIP is not uniquely identified by bundling/compression alone.

Source: [An image format for the Web](https://developers.google.com/speed/webp) — Lossless WebP supports transparency, satisfying the generic PNG clue.

Source: [Vorbis audio compression](https://xiph.org/vorbis/) — Ogg Vorbis is a general-purpose compressed audio format, a valid alternative to the generic MP3 description.

## C-TECH-013-HTTP-DISCLOSURE: The web-server explanation gives the HTTP answer and its request role.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-013 — Technology & Inventions: How the Web Works / Tehnoloogia ja leiutised: Kuidas veeb toimib.
- Questions: built-in-technology-inventions-accessible-corpus-023, built-in-technology-inventions-accessible-corpus-024.
- Location: [content/generated/10-technology-inventions.en-et.csv:64](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-accessible-corpus-023).
- Location: [content/generated/10-technology-inventions.en-et.csv:65](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-accessible-corpus-024).

Tier three asks which protocol browsers and servers use to request/deliver pages. Tier four reveals that a web server 'accepts HTTP requests and returns pages' in both languages, answering the protocol question.

Example: Revealed web-server explanation: 'accepts HTTP requests and returns pages' / 'võtab vastu HTTP-päringuid ning tagastab lehti'.

Suggested repair: Replace one linked definition or describe the server role without naming its sibling protocol.

## C-TECH-015-CC-DISCLOSURE: The BCC prompt identifies the visible CC field sought by another clue.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-015 — Technology & Inventions: Email and Messaging / Tehnoloogia ja leiutised: E-post ja sõnumside.
- Questions: built-in-technology-inventions-accessible-corpus-034, built-in-technology-inventions-accessible-corpus-035.
- Location: [content/generated/10-technology-inventions.en-et.csv:75](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-accessible-corpus-034).
- Location: [content/generated/10-technology-inventions.en-et.csv:76](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-accessible-corpus-035).

Tier four asks where to place an additional recipient if everyone sees their address; tier five names To and CC and explains that BCC conceals recipients from those fields. It supplies the field name and contrast needed to solve tier four.

Example: BCC explanation says recipients are concealed from 'To and CC recipients' / 'adressaadi ja koopia väljale märgitud saajate'.

Suggested repair: Keep only one visible/hidden-copy definition and replace the other with an independent email concept.

## C-TECH-019-PIXEL-SENSOR-DISCLOSURE: Sibling photography clues supply pixel and image-sensor responses.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-019 — Technology & Inventions: Digital Photography / Tehnoloogia ja leiutised: Digifotograafia.
- Questions: built-in-technology-inventions-accessible-corpus-051, built-in-technology-inventions-accessible-corpus-052, built-in-technology-inventions-accessible-corpus-054, built-in-technology-inventions-accessible-corpus-055.
- Location: [content/generated/10-technology-inventions.en-et.csv:92](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-accessible-corpus-051).
- Location: [content/generated/10-technology-inventions.en-et.csv:93](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-accessible-corpus-052).
- Location: [content/generated/10-technology-inventions.en-et.csv:95](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-accessible-corpus-054).
- Location: [content/generated/10-technology-inventions.en-et.csv:96](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-accessible-corpus-055).

Tier two names image pixels and its explanation says camera resolution counts sensor pixels; tier five explicitly names the sensor and explains its receiving magnified scene. Those terms are the responses or accepted sensor variant sought by tiers one and four.

Example: Tier 2 asks for one million 'image pixels' / 'pildipikslit'; tier 5 explanation says scene reaches 'the sensor' / 'sensorile'.

Suggested repair: Replace linked component definitions with independent photography facts or remove explicit target names from siblings while preserving clear questions.

## C-TECH-020-HEADPHONE-SPEAKER-DISCLOSURE: The category repeatedly names its headphone and loudspeaker responses in sibling clues.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-020 — Technology & Inventions: Sound Technology / Tehnoloogia ja leiutised: Helitehnoloogia.
- Questions: built-in-technology-inventions-accessible-corpus-056, built-in-technology-inventions-accessible-corpus-057, built-in-technology-inventions-accessible-corpus-059, built-in-technology-inventions-accessible-corpus-060.
- Location: [content/generated/10-technology-inventions.en-et.csv:97](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-accessible-corpus-056).
- Location: [content/generated/10-technology-inventions.en-et.csv:98](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-accessible-corpus-057).
- Location: [content/generated/10-technology-inventions.en-et.csv:100](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-accessible-corpus-059).
- Location: [content/generated/10-technology-inventions.en-et.csv:101](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-accessible-corpus-060).

Tier five is explicitly a headphone-feature question; tier one explanation names loudspeaker drivers; tier four prompt and explanation name loudspeaker/headphones. These are answers sought elsewhere in the same set.

Example: Tier 4 asks which component can 'drive a loudspeaker' / 'valjuhääldit käitada'; tier 2 answer is loudspeaker/valjuhääldi.

Suggested repair: Regroup the linked device definitions and features across different categories or replace overlapping device targets.

## C-TECH-027-TITLE-SCOPE: Communication-pioneers title mislabels aviation and vacuum-cleaner clues.

- Concern: Category coherence; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-027 — Technology & Inventions: Pioneers of Communication / Tehnoloogia ja leiutised: Sidepidamise teerajajad.
- Questions: built-in-technology-inventions-accessible-corpus-091, built-in-technology-inventions-accessible-corpus-093.
- Location: [content/generated/10-technology-inventions.en-et.csv:132](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-accessible-corpus-091).
- Location: [content/generated/10-technology-inventions.en-et.csv:134](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-accessible-corpus-093).

Wright brothers' powered flight and James Dyson's vacuum-cleaner work are invention facts, but do not fit a category advertised as pioneers of communication. The category otherwise has varied subjects and can be repaired by its title.

Suggested repair: Rename both-language category to a broad technology/invention-pioneers title.

## C-TECH-035-PAGER-DISCLOSURE: StarTAC prompt names pager/peiler, the first response.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-035 — Before the Smartphone / Enne nutitelefoni.
- Questions: built-in-technology-inventions-playable-corpus-006, built-in-technology-inventions-playable-corpus-010.
- Location: [content/generated/10-technology-inventions.en-et.csv:172](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-playable-corpus-006).
- Location: [content/generated/10-technology-inventions.en-et.csv:176](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-playable-corpus-010).

The final question compares StarTAC's advertised size with a pager, explicitly naming the device sought in the first question in both languages.

Example: StarTAC was 'roughly pager-sized' / 'ligikaudu peileri suurusena'; tier-one answer is pager/peiler.

Suggested repair: Use an independent StarTAC identifying feature that does not mention a sibling device, or regroup the pager clue.

## C-TECH-047-FLOPPY-DISCLOSURE: Zip-disk prompt and explanation expose the floppy-disk response.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-047 — Data You Could Hold / Käega katsutavad andmed.
- Questions: built-in-technology-inventions-playable-corpus-066, built-in-technology-inventions-playable-corpus-070.
- Location: [content/generated/10-technology-inventions.en-et.csv:232](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-playable-corpus-066).
- Location: [content/generated/10-technology-inventions.en-et.csv:236](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-playable-corpus-070).

The final prompt names a standard floppy/diskett, and its explanation identifies floppy disks as the earlier lower-capacity storage medium. That is the first clue's response.

Example: 'far more than a standard floppy' / 'palju rohkem kui tavalisele disketile'.

Suggested repair: Replace the relative-to-floppy comparison with an independent identifying feature or separate these device targets.

## C-TECH-049-TRAFFIC-LIGHT-DISCLOSURE: Roundabout prompt names the traffic-light answer.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-049 — At a Road Junction / Teeristil.
- Questions: built-in-technology-inventions-playable-corpus-076, built-in-technology-inventions-playable-corpus-078.
- Location: [content/generated/10-technology-inventions.en-et.csv:242](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-playable-corpus-076).
- Location: [content/generated/10-technology-inventions.en-et.csv:244](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-playable-corpus-078).

The roundabout question explicitly contrasts taking turns at traffic lights / waiting behind a foor, which supplies the first question's accepted response in both languages.

Example: Tier 3: 'Instead of taking turns at traffic lights' / 'Foori taga ootamise asemel'.

Suggested repair: Describe the circular junction independently without naming another target, or replace the traffic-light clue.

## C-TECH-051-FORKLIFT-PALLET-DISCLOSURE: Forklift and pallet questions expose each other's responses.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-051 — A Parcel on the Move / Pakk on teel.
- Questions: built-in-technology-inventions-playable-corpus-087, built-in-technology-inventions-playable-corpus-088.
- Location: [content/generated/10-technology-inventions.en-et.csv:253](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-playable-corpus-087).
- Location: [content/generated/10-technology-inventions.en-et.csv:254](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-playable-corpus-088).

Pallet prompt explicitly names the forklift lifting it; forklift explanation says it lifts loads especially on pallets. Both languages reveal the paired responses through the same load-lifting relationship.

Example: Pallet question: 'so a forklift can lift them together' / 'et kahveltõstuk saaks need koos üles tõsta'. Forklift explanation: 'especially on pallets' / 'eriti kaubaalustel'.

Suggested repair: Keep one of this paired fact family and replace the other with independent parcel/logistics technology.

## C-TECH-056-EMAIL-DISCLOSURE: Instant-messaging prompt explicitly names the email response.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-056 — Messages Across the Years / Sõnumid läbi aja.
- Questions: built-in-technology-inventions-playable-corpus-111, built-in-technology-inventions-playable-corpus-113.
- Location: [content/generated/10-technology-inventions.en-et.csv:277](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-playable-corpus-111).
- Location: [content/generated/10-technology-inventions.en-et.csv:279](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-playable-corpus-113).

Tier three uses 'Unlike email' / 'Erinevalt e-postist' to identify its speed distinction. Email/e-post is the response sought in the first question.

Example: Tier 3 begins 'Unlike email' / 'Erinevalt e-postist'.

Suggested repair: Describe instant messaging without naming the other target, or choose a different communication fact.

## C-TECH-058-GENERATOR-DISCLOSURE: Power-station explanation supplies the generator response and function.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-058 — Electricity at Work / Elekter töös.
- Questions: built-in-technology-inventions-playable-corpus-121, built-in-technology-inventions-playable-corpus-124.
- Location: [content/generated/10-technology-inventions.en-et.csv:287](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-playable-corpus-121).
- Location: [content/generated/10-technology-inventions.en-et.csv:290](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-playable-corpus-124).

The first explanation says a power station uses generators driven by turbines to supply electricity. The fourth asks which machine a wind turbine spins to convert rotation into electricity, accepting generator/generaator.

Example: 'uses generators, often driven by turbines, to supply electricity' / 'kasutab ... generaatoreid, mida käitavad sageli turbiinid'.

Suggested repair: Replace one generator-function clue or avoid the component name in the power-station explanation.

## C-TECH-062-FUNICULAR-DISCLOSURE: Aerial-tramway explanation names and contrasts the funicular response.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-062 — Ways Up and Over / Teed üles ja üle.
- Questions: built-in-technology-inventions-playable-corpus-144, built-in-technology-inventions-playable-corpus-145.
- Location: [content/generated/10-technology-inventions.en-et.csv:310](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-playable-corpus-144).
- Location: [content/generated/10-technology-inventions.en-et.csv:311](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-playable-corpus-145).

It explicitly says unlike a funicular the cabins travel through the air rather than on rails; the final question asks for the cable hillside railway. This gives the term and its relevant rail distinction in both languages.

Example: 'Unlike a funicular ... rather than on rails' / 'Erinevalt funikulöörist ... mitte rööbastel'.

Suggested repair: Explain aerial tramways independently without identifying another target, or replace one linked rail/cable clue.

## C-TECH-066-CNC-SELF-DISCLOSURE: The CNC-machine question supplies nearly the entire response before asking it.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-066 — Machines and Methods That Make Parts / Masinad ja meetodid detailide valmistamiseks.
- Questions: built-in-technology-inventions-playable-corpus-163.
- Location: [content/generated/10-technology-inventions.en-et.csv:329](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-playable-corpus-163).

The question starts 'CNC is short for ... computer numerical control' and then asks what kind of machine follows coded coordinates. Accepted response is CNC machine or the expansion plus machine. Estonian likewise gives CNC before asking for a tööpink, accepting CNC-tööpink.

Example: Question: 'CNC is short for ... computer numerical control. What kind of machine ...?' Answer: 'CNC machine'.

Suggested repair: Ask which three-letter control term describes the coded-coordinate machine without supplying the abbreviation or expansion.

## C-TECH-077-ET-TELSTAR-FIRST: Estonian explanation adds an unqualified historical first absent from English.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-077 — Satellites That Changed the View / Satelliidid, mis muutsid meie maailmapilti.
- Questions: built-in-technology-inventions-playable-corpus-218.
- Location: [content/generated/10-technology-inventions.en-et.csv:384](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-playable-corpus-218).

English says Telstar 1 was an active communications satellite; Estonian says it was the first. Army history describes active SCORE relays in 1958 and Courier communications in 1960, while NASA's detailed Telstar history identifies its first transatlantic television and private funding. Some authoritative short summaries also call Telstar the first active satellite, so the issue is an overbroad, disputed first claim and bilingual divergence, rather than an assertion that all sources agree it is false.

Suggested repair: Translate English accurately as 'oli aktiivne sidesatelliit', or specify the documented live transatlantic television first in both languages.

Source: [Early Signal Corps satellite programs remembered](https://www.army.mil/article/37602/early_signal_corps_satellite_programs_remembered) — SCORE demonstrated active relay in 1958; Courier 1B received, stored and transmitted communications in 1960.

Source: [Telstar Opened Era of Global Satellite Television](https://www.nasa.gov/history/telstar-opened-era-of-global-satellite-television/) — Telstar's specific firsts were live transatlantic television capability and private financing.

## C-TECH-083-DIALYSIS-FLUID-MECHANISM: Dialysis question incorrectly says diffusion removes excess fluid.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-083 — Engineering That Helps the Body / Keha toetav meditsiinitehnika.
- Questions: built-in-technology-inventions-playable-corpus-248.
- Location: [content/generated/10-technology-inventions.en-et.csv:414](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-playable-corpus-248).

The bilingual prompt says diffusion across a membrane removes wastes and excess fluid. Solute diffusion removes wastes; net fluid removal during hemodialysis uses pressure-driven ultrafiltration. The explanation already mentions diffusion and filtration, but the question teaches the wrong combined mechanism.

Suggested repair: Say 'diffusion removes wastes and ultrafiltration removes excess fluid' in both prompts, or omit mechanism details and ask about the dialysis machine's overall function.

Source: [Ultrafiltration](https://www.kidney.org/kidney-topics/ultrafiltration) — Hemodialysis removes fluid by ultrafiltration across the membrane due to a pressure difference.

## C-TECH-132-TITLE-SKYLIGHT: Daylighting skylight does not belong in the load-carrying structures category.

- Concern: Category coherence; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-132 — Structures That Carry the Load / Koormat kandvad ehitised.
- Questions: built-in-technology-inventions-all-level-expansion-0059.
- Location: [content/generated/10-technology-inventions.en-et.csv:660](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-all-level-expansion-0059).

Suspension bridge, arch bridge, cantilever and foundation concern how loads are supported or transferred; skylight asks about a glazed roof opening admitting natural light. It has no load-bearing discriminator and breaks the advertised topic in both languages.

Suggested repair: Rename the category to a broader building/bridge-features topic in both languages or replace skylight with another load-bearing structural feature.

## C-TECH-146-NONUNIQUE-EARLY-COMPUTER: Plugged cables and switches do not uniquely identify ENIAC.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-146 — Landmarks before the Laptop / Verstapostid enne sülearvutit.
- Questions: built-in-technology-inventions-all-level-expansion-0126.
- Location: [content/generated/10-technology-inventions.en-et.csv:727](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-all-level-expansion-0126).

The clue provides no country, date, purpose or hardware discriminator beyond an early computer programmed with plugs and switches. Colossus also used switches/plugs, as this corpus itself explains in technology set 69 tier two, yet it is not an accepted variant.

Suggested repair: Add an ENIAC-specific clue such as its US Army artillery-table purpose, Pennsylvania developers or full acronym meaning.

Source: [Rebuilding Colossus](https://www.tnmoc.org/rebuilding-colossus) — Describes the Colossus switch panel and complex jack plugging used to configure its algorithm, also fitting the generic ENIAC clue.

## C-TECH-147-ET-DAEMON-SELF-DISCLOSURE: Estonian daemon question contains the exact answer deemon.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-147 — Software Borrowed the Words / Tarkvara laenatud sõnad.
- Questions: built-in-technology-inventions-all-level-expansion-0134.
- Location: [content/generated/10-technology-inventions.en-et.csv:735](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-all-level-expansion-0134).

English distinguishes computing 'daemon' from Maxwell's 'demon'; both become deemon in Estonian. The Estonian origin clue therefore prints its own accepted response while asking for the background-process term.

Example: Prompt: 'Maxwelli kujuteldavast deemonist, mitte pahatahtlikust vaimust'; response: 'deemon'.

Suggested repair: Use an independent background-process clue in Estonian, or explicitly ask for the English spelling daemon and set matching variants accordingly.

## C-TECH-148-NONUNIQUE-RECYCLABLE-MATERIAL: Repeatedly remeltable packaging material is not uniquely glass.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-148 — Ideas that Reduce Waste / Raiskamist vähendavad ideed.
- Questions: built-in-technology-inventions-all-level-expansion-0139.
- Location: [content/generated/10-technology-inventions.en-et.csv:740](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-all-level-expansion-0139).

The generic description also fits aluminium packaging, which can be repeatedly recycled without loss of material properties; only glass/klaas is accepted. The clue lacks transparency, mineral composition or another glass-specific attribute.

Suggested repair: Add a glass-specific discriminator, or accept aluminium and other qualifying materials if a generic answer class is intended.

Source: [Sustainability - Recycling](https://www.aluminum.org/Recycling) — Aluminum can be repeatedly melted and reformed without changing fundamental properties; packaging/cans make it another valid clue answer.

## C-TECH-168-RADAR-DISCLOSURE: Magnetron clue names the radar answer sought by the previous question.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-168 — Technologies with a History / Ajalooga tehnoloogiad.
- Questions: built-in-technology-inventions-all-level-expansion-0237, built-in-technology-inventions-all-level-expansion-0238.
- Location: [content/generated/10-technology-inventions.en-et.csv:838](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-all-level-expansion-0237).
- Location: [content/generated/10-technology-inventions.en-et.csv:839](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-all-level-expansion-0238).

Tier two asks which detection technology powered Chain Home. Tier three says the component was developed 'for radar' / 'radarite jaoks' and the explanation repeats its wartime radar use, giving the target name in both languages.

Example: Tier 3: 'developed for radar by John Randall and Harry Boot' / 'arendasid ... radarite jaoks'.

Suggested repair: Replace one linked wartime radar fact or identify the magnetron independently without printing a sibling answer.

## C-TECH-096-FIRST-WEBSITE-DATE: The first website's creation is conflated with the August 1991 public announcement.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-technology-inventions-set-096 — The Early Web Was Weird / Varajane veeb oli veider.
- Questions: built-in-technology-inventions-playable-corpus-311.
- Location: [content/generated/10-technology-inventions.en-et.csv:477](../../../content/generated/10-technology-inventions.en-et.csv) (built-in-technology-inventions-playable-corpus-311).

Both prompts and explanations assert that Berners-Lee created the first website in August 1991. CERN dates its working first server/browser to the end of 1990, identifies info.cern.ch as the first website, and separately dates the Internet-newsgroup announcement to August 1991. The answer remains recognizable but the asserted chronology is misleading.

Suggested repair: Ask what milestone Berners-Lee created at CERN by the end of 1990, or explicitly ask about the website introduced to a wider audience in 1991, and distinguish creation from public announcement in both explanations.

Source: [A short history of the Web](https://home.cern/science/computing/the-birth-of-the-web/short-history-web/) — First server/browser working by end 1990; first website at info.cern.ch; Internet-newsgroup announcement August 1991.

## C-POL-009-ET-VOTING-ANSWER: The Estonian prompt asks for an action but accepts only the vote noun.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-politics-economics-society-set-009 — Politics, Economics & Society: Democracy Basics / Poliitika, majandus ja ühiskond: Demokraatia põhitõed.
- Questions: built-in-politics-economics-society-accessible-corpus-001.
- Location: [content/generated/11-politics-economics-society.en-et.csv:42](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-accessible-corpus-001).

The prompt asks which formal action lets a citizen record an electoral choice. The explanation correctly calls the action hääletamine, but the expected response hääl and sole variant valimishääl mean the vote itself rather than voting. A natural correct response hääletamine is absent.

Suggested repair: Use hääletamine as the Estonian response and accept hääle andmine, or rewrite the prompt to ask what choice/support a citizen records.

## C-POL-011-THREE-BRANCH-ELIMINATION: Three branch-definition clues exhaust the same small answer pool.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-politics-economics-society-set-011 — Politics, Economics & Society: Branches of Government / Poliitika, majandus ja ühiskond: Riigivõimu harud.
- Questions: built-in-politics-economics-society-accessible-corpus-011, built-in-politics-economics-society-accessible-corpus-012, built-in-politics-economics-society-accessible-corpus-013.
- Location: [content/generated/11-politics-economics-society.en-et.csv:52](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-accessible-corpus-011).
- Location: [content/generated/11-politics-economics-society.en-et.csv:53](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-accessible-corpus-012).
- Location: [content/generated/11-politics-economics-society.en-et.csv:54](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-accessible-corpus-013).

The first three prompts each ask which branch performs a different function, and their answers are legislature, executive and judiciary. Once two branches are revealed, the remaining named branch follows from the familiar three-branch model without knowing the third function. The final two institutional concepts do not remove this first-three dependence.

Example: After legislature and executive are revealed, the remaining branch clue can be answered judiciary by elimination.

Suggested repair: Keep one branch definition and replace or regroup the other two with independent constitutional/governance concepts from other contexts.

## C-POL-016-TREATY-DISCLOSURE: Article 5's revealed explanation names the later founding-treaty answer.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-politics-economics-society-set-016 — Politics, Economics & Society: NATO / Poliitika, majandus ja ühiskond: NATO.
- Questions: built-in-politics-economics-society-accessible-corpus-037, built-in-politics-economics-society-accessible-corpus-040.
- Location: [content/generated/11-politics-economics-society.en-et.csv:78](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-accessible-corpus-037).
- Location: [content/generated/11-politics-economics-society.en-et.csv:81](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-accessible-corpus-040).

The collective-defence clue explains that Article 5 is part of the North Atlantic Treaty/Põhja-Atlandi leping. Those exact terms answer the final clue asking which treaty established NATO in 1949. The clue can be solved by retaining the already displayed treaty name.

Example: Reveal tier 2: Article 5 of the North Atlantic Treaty; tier 5's expected answer is North Atlantic Treaty.

Suggested repair: Remove the treaty name from the earlier explanation or replace/regroup the founding-treaty clue with an independent alliance/history fact.

## C-POL-018-VAT-SELF-DISCLOSURE: VAT and KM are accepted answers already printed in the question.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-politics-economics-society-set-018 — Politics, Economics & Society: Taxes / Poliitika, majandus ja ühiskond: Maksud.
- Questions: built-in-politics-economics-society-accessible-corpus-047.
- Location: [content/generated/11-politics-economics-society.en-et.csv:88](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-accessible-corpus-047).

The question asks which consumption levy is shown by VAT (ET VAT or KM), while the variants explicitly accept VAT and KM respectively. Copying the acronym from the displayed question meets the answer list without identifying or expanding the tax.

Example: The EN prompt prints VAT and the EN accepted variant is VAT; ET similarly prints and accepts KM.

Suggested repair: Explicitly require the expanded name and remove the acronym variants, or ask for the tax using its mechanism without printing either acronym.

## C-POL-019-INTEREST-DISCLOSURE: Savings and loan clues disclose the interest answer and its relationship to borrowing.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-politics-economics-society-set-019 — Politics, Economics & Society: Banks and Saving / Poliitika, majandus ja ühiskond: Pangad ja säästmine.
- Questions: built-in-politics-economics-society-accessible-corpus-052, built-in-politics-economics-society-accessible-corpus-053, built-in-politics-economics-society-accessible-corpus-054, built-in-politics-economics-society-accessible-corpus-055.
- Location: [content/generated/11-politics-economics-society.en-et.csv:93](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-accessible-corpus-052).
- Location: [content/generated/11-politics-economics-society.en-et.csv:94](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-accessible-corpus-053).
- Location: [content/generated/11-politics-economics-society.en-et.csv:95](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-accessible-corpus-054).
- Location: [content/generated/11-politics-economics-society.en-et.csv:96](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-accessible-corpus-055).

Tier 3 asks what payment is charged for borrowing or earned for lending. Savings-account wording names interest/intress, and the loan prompt says repayment is usually with interest; its explanation repeats principal and interest. The compound-interest clue also repeatedly names the earlier target. These siblings supply both the term and its money-lending context.

Example: Tier 4: a borrowed sum repaid usually with interest/intress. Tier 3 asks for the payment for borrowing money: interest/intress.

Suggested repair: Regroup interest, loan and compound-interest facts into separate sets or replace one with an independent banking practice; remove incidental target terms from retained explanations where feasible.

## C-POL-021-TRADE-FLOW-DISCLOSURE: Later trade questions print both earlier trade-flow answers.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-politics-economics-society-set-021 — Politics, Economics & Society: International Trade / Poliitika, majandus ja ühiskond: Rahvusvaheline kaubandus.
- Questions: built-in-politics-economics-society-accessible-corpus-061, built-in-politics-economics-society-accessible-corpus-062, built-in-politics-economics-society-accessible-corpus-063, built-in-politics-economics-society-accessible-corpus-065.
- Location: [content/generated/11-politics-economics-society.en-et.csv:102](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-accessible-corpus-061).
- Location: [content/generated/11-politics-economics-society.en-et.csv:103](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-accessible-corpus-062).
- Location: [content/generated/11-politics-economics-society.en-et.csv:104](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-accessible-corpus-063).
- Location: [content/generated/11-politics-economics-society.en-et.csv:106](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-accessible-corpus-065).

The export and import questions ask for the directional flow names. The customs-duty prompt explicitly calls border arrivals imported/importimisel, and the balance-of-trade prompt prints a country's exports and imports/ekspordi ja impordi. This narrows the earlier naming questions to words supplied on the same board, especially when the balance explanation distinguishes outward and inward flow values.

Example: The final prompt prints exports and imports; the first two expected answers are export and import.

Suggested repair: Use a single direction-of-trade clue and diversify the other slots with independent international-commerce examples, or reword later clues without naming either target flow.

## C-POL-052-CORPORATE-TITLE-SCOPE: The corporate-failure category includes a personal privacy lawsuit.

- Concern: Category coherence; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-politics-economics-society-set-052 — Corporate Ideas That Backfired / Ettevõtete ideed, mis läksid valesti.
- Questions: built-in-politics-economics-society-playable-corpus-092.
- Location: [content/generated/11-politics-economics-society.en-et.csv:258](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-playable-corpus-092).

Corporate Ideas That Backfired/Ettevõtete ideed, mis läksid valesti frames all five clues as corporate initiatives. The Streisand effect clue instead concerns a singer's attempt to remove a photograph of her personal home. The other four are corporate product or promotional decisions, so this slot breaks the stated scope although it fits the wider idea of unintended publicity.

Suggested repair: Broaden the title to product and publicity ideas that backfired, or replace the personal-lawsuit clue with a recognisable corporate example.

## C-POL-074-JOHN-BULL-DISCLOSURE: The Johnny Canuck clue names John Bull twice before John Bull's clue is answered.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-politics-economics-society-set-074 — Countries as Characters / Riigid tegelaskujudena.
- Questions: built-in-politics-economics-society-playable-corpus-204, built-in-politics-economics-society-playable-corpus-205.
- Location: [content/generated/11-politics-economics-society.en-et.csv:370](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-playable-corpus-204).
- Location: [content/generated/11-politics-economics-society.en-et.csv:371](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-playable-corpus-205).

The final prompt says Johnny Canuck appeared as a younger cousin of Uncle Sam and John Bull. John Bull is the exact response to tier 4, which asks for the British political-cartoon personification. This supplies the earlier character name in a matching cartoon-personification context in both languages.

Example: Read tier 5: cousin of Uncle Sam and John Bull; tier 4's expected answer is John Bull.

Suggested repair: Remove the John Bull comparison from the Canuck prompt, keeping Canadian lumberjack, wartime hero and hockey-logo identifiers, or regroup the two.

## C-POL-082-DAILY-SHOW-DISCLOSURE: The Colbert Report prompt prints The Daily Show, answering its sibling.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-politics-economics-society-set-082 — Satire in the Corridors of Power / Satiir võimukoridorides.
- Questions: built-in-politics-economics-society-playable-corpus-242, built-in-politics-economics-society-playable-corpus-243.
- Location: [content/generated/11-politics-economics-society.en-et.csv:408](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-playable-corpus-242).
- Location: [content/generated/11-politics-economics-society.en-et.csv:409](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-playable-corpus-243).

Tier 2 asks for Jon Stewart's Comedy Central mock-news show. Tier 3 calls Colbert's show a Daily Show spin-off/The Daily Show kõrvalsari. Daily Show is an accepted variant of the tier-2 answer, so no independent programme recall is needed after seeing the sibling.

Example: Tier 3 prints Daily Show/The Daily Show; tier 2 expects The Daily Show and accepts Daily Show.

Suggested repair: Replace the spin-off reference with its 2005–2014 fictional-pundit format or regroup the parent show and spin-off into separate categories.

## C-POL-149-TITLE-SCOPE: The final clue does not concern a government title.

- Concern: Category coherence; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-politics-economics-society-set-149 — Titles from Different Governments / Eri valitsuste tiitlid.
- Questions: built-in-politics-economics-society-all-level-expansion-0145.
- Location: [content/generated/11-politics-economics-society.en-et.csv:746](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-all-level-expansion-0145).

The title is 'Titles from Different Governments' / 'Eri valitsuste tiitlid'. Four clues ask Chancellor, Taoiseach, Doge and Grand Duke, but tier 5 asks which country holds open-air cantonal assemblies, with Switzerland as the response. It concerns voting practice rather than any office title.

Suggested repair: Broaden the title to government titles and traditions, or replace the Swiss assembly clue with an independently identifiable office title.

## C-POL-152-NONUNIQUE-UNCODIFIED-CONSTITUTION: The uncodified-constitution description also fits New Zealand.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-politics-economics-society-set-152 — Constitutions Take Different Forms / Põhiseadused võtavad eri kuju.
- Questions: built-in-politics-economics-society-all-level-expansion-0156.
- Location: [content/generated/11-politics-economics-society.en-et.csv:757](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-all-level-expansion-0156).

Neither language provides a British identifier; the clue only asks for a country whose constitution spans statutes, conventions and other sources rather than one codified document. New Zealand's Ministry of Justice explicitly describes the same arrangement, but the only recorded answer is United Kingdom and no alternative is accepted.

Suggested repair: Add an identifying UK feature, such as Westminster or the British constitutional context, or explicitly accept New Zealand as another valid example.

Source: [Constitutional](https://www.justice.govt.nz/justice-sector-policy/regulatory-stewardship/regulatory-systems/constitutional/) — Actual page paragraphs 1–2 state that New Zealand's constitutional arrangements span statutes, documents, practices and conventions and are not set out in one document; this establishes a concrete second valid response.

## C-POL-170-REPLACEMENT-DISCLOSURE: Population-momentum clue supplies the replacement-fertility threshold requested by its sibling.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-politics-economics-society-set-170 — Reading Population Data / Rahvastikuandmete tõlgendamine.
- Questions: built-in-politics-economics-society-all-level-expansion-0247, built-in-politics-economics-society-all-level-expansion-0250.
- Location: [content/generated/11-politics-economics-society.en-et.csv:848](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-all-level-expansion-0247).
- Location: [content/generated/11-politics-economics-society.en-et.csv:851](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-all-level-expansion-0250).

Tier 2 asks for the threshold of enough births for a generation to replace itself, answered 'Replacement fertility' / 'taastetaseme sündimus'. Tier 5's prompt and explanation explicitly place growth 'after fertility reaches replacement'; Estonian similarly says 'pärast sündimuse taastetasemele jõudmist'. This names the same technical response with reordered words and gives its threshold role, reducing independent recall within the set.

Example: Read tier 5's 'fertility reaches replacement' or 'sündimuse taastetasemele' and use those same two components to answer tier 2 without independently recalling the demographic term.

Suggested repair: Move one of these closely dependent demographic concepts to another category, or rewrite the momentum clue and explanation so they do not name or define the sibling threshold.

## C-MYTH-003-MEDUSA-DISCLOSURE: The Pegasus prompt prints the Medusa answer from the same creature category.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-003 — Mythology, Religion & Philosophy: Creatures of Greek Myth / Mütoloogia, religioon ja filosoofia: Kreeka müütide olendid.
- Questions: built-in-mythology-religion-philosophy-accessible-corpus-011, built-in-mythology-religion-philosophy-accessible-corpus-012.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:12](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-011).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:13](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-012).

Tier 1 asks players to name the snake-haired Gorgon, answered Medusa. Tier 2 names Medusa in the same Greek creature setting while describing the winged horse's origin; players can harvest the exact preceding creature name from a sibling prompt.

Example: Tier 2 begins 'Which winged horse sprang from Medusa’s blood' / 'Milline tiivuline hobune sündis Medusa verest', supplying the complete tier-1 response.

Suggested repair: Move Pegasus or Medusa to a different category, or describe the horse's identifying story without naming the sibling creature in prompt or explanation.

## C-MYTH-005-LOKI-DISCLOSURE: Baldr's revealed explanation identifies Loki and his deceptive scheme before the trickster clue.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-005 — Mythology, Religion & Philosophy: The Norse Gods / Mütoloogia, religioon ja filosoofia: Põhjala jumalad.
- Questions: built-in-mythology-religion-philosophy-accessible-corpus-022, built-in-mythology-religion-philosophy-accessible-corpus-023.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:23](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-022).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:24](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-023).

Tier 3 asks for the cunning figure who helps and harms the Norse gods. Tier 2's explanation names Loki as the arranger of a scheme using a blind god to kill Baldr, giving both the response and a concrete instance of the requested deceptive role.

Example: Reveal tier 2: 'Loki arranges for the blind god Höðr to throw the mistletoe weapon'; use the named schemer Loki for the subsequent trickster question.

Suggested repair: Keep the Baldr explanation focused on the mistletoe weapon, or move the Loki-identification clue to another set.

## C-MYTH-007-OSIRIS-DISCLOSURE: The Isis prompt names the restored ruler sought by the Osiris clue.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-007 — Mythology, Religion & Philosophy: The Gods of Ancient Egypt / Mütoloogia, religioon ja filosoofia: Vana-Egiptuse jumalad.
- Questions: built-in-mythology-religion-philosophy-accessible-corpus-033, built-in-mythology-religion-philosophy-accessible-corpus-034.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:34](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-033).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:35](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-034).

Tier 3 identifies its god partly by being murdered and restored. Tier 4 directly says that the goddess restores her husband Osiris, handing over the name and restoration event in both languages.

Example: Tier 4's 'restores her husband Osiris' / 'taastab oma abikaasa Osirise' supplies the preceding response with its distinctive restoration fact.

Suggested repair: Replace one of the closely connected Osiris/Isis questions, or remove the sibling name and restoration identification from the other prompt and explanation.

## C-MYTH-008-ARTHUR-DISCLOSURE: Arthur is named repeatedly in the sword and wizard clues within the same legend.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-008 — Mythology, Religion & Philosophy: Celtic Legends / Mütoloogia, religioon ja filosoofia: Keldi legendid.
- Questions: built-in-mythology-religion-philosophy-accessible-corpus-036, built-in-mythology-religion-philosophy-accessible-corpus-037, built-in-mythology-religion-philosophy-accessible-corpus-038.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:37](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-036).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:38](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-037).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:39](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-038).

Tier 1 asks for the legendary British king at Camelot. Tier 2 names Arthur as the sword's owner, and tier 3 names him as the wizard's advised future king; the same identifying figure appears in prompts and explanations before players need independently recall the king's name.

Example: The wizard prompt says 'advises Arthur' and refers to 'the future king', allowing the named Arthur to be used for the tier-1 king response.

Suggested repair: Spread the three Arthurian clues across broader legend categories, or replace one or two with independent Celtic subjects.

## C-MYTH-011-SINGLE-WORK: The whole category requires familiarity with the single Kalevala epic.

- Concern: Category coherence; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-011 — Mythology, Religion & Philosophy: The Finnish Kalevala / Mütoloogia, religioon ja filosoofia: Soome Kalevala.
- Questions: built-in-mythology-religion-philosophy-accessible-corpus-051, built-in-mythology-religion-philosophy-accessible-corpus-052, built-in-mythology-religion-philosophy-accessible-corpus-053, built-in-mythology-religion-philosophy-accessible-corpus-054, built-in-mythology-religion-philosophy-accessible-corpus-055.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:52](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-051).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:53](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-052).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:54](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-053).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:55](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-054).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:56](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-055).

All five clues ask about the same work: its principal singer, magical object, antagonist, smith and tragic youth. This is an epic-specific character/plot quiz rather than a broad category playable through varied general-trivia subjects; knowledge of the one work controls almost the entire set.

Suggested repair: Regroup these questions among broader Northern European myths, legendary objects, magical craftspeople and tragic heroes, using different works or traditions in each five-clue set.

## C-MYTH-011-SAMPO-DISCLOSURE: The smith clue explicitly names the forged magical object requested by its sibling.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-011 — Mythology, Religion & Philosophy: The Finnish Kalevala / Mütoloogia, religioon ja filosoofia: Soome Kalevala.
- Questions: built-in-mythology-religion-philosophy-accessible-corpus-052, built-in-mythology-religion-philosophy-accessible-corpus-054.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:53](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-052).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:55](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-054).

Tier 2 asks for the mysterious prosperity-making object that is forged and fought over, answered Sampo. Tier 4 asks who forges the Sampo, and its explanation calls forging the magical Sampo the smith's greatest achievement; the same object and forging fact are handed over.

Example: Read 'Which eternal smith forges the Sampo?' / 'Milline igavene sepp sepistab Sampo?' and use Sampo for tier 2.

Suggested repair: Move the Sampo and Ilmarinen questions into separate broader categories; changing only the prompt would still leave the explanatory hand-off.

## C-MYTH-013-NOAH-DISCLOSURE: The rainbow question identifies the biblical flood protagonist by name.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-013 — Mythology, Religion & Philosophy: Flood Myths / Mütoloogia, religioon ja filosoofia: Veeuputusmüüdid.
- Questions: built-in-mythology-religion-philosophy-accessible-corpus-061, built-in-mythology-religion-philosophy-accessible-corpus-062.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:62](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-061).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:63](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-062).

Tier 1 asks who builds the ark in the biblical flood story. Tier 2 explicitly calls the same event Noah's flood / Noa veeuputus, supplying the precise protagonist response in the identical story context.

Example: 'What colourful sign appears after Noah’s flood' prints Noah, the tier-1 answer.

Suggested repair: Use an independent flood tradition for one clue, or remove Noah's name from the rainbow prompt and explanation.

## C-MYTH-016-MJOLNIR-ETYMOLOGY: The English prompt falsely treats Mjolnir as a literal name meaning 'Thor's hammer'.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-016 — Mythology, Religion & Philosophy: Legendary Objects / Mütoloogia, religioon ja filosoofia: Legendaarsed esemed.
- Questions: built-in-mythology-religion-philosophy-accessible-corpus-078.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:79](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-078).

English asks 'Which weapon’s name means Thor’s hammer'. Estonian instead correctly asks which weapon is Thor's hammer. The Swedish History Museum describes the name as likely meaning 'the crusher'; the cited Wikipedia page also lists disputed lightning/grinding derivations, none a translation of Thor's hammer. Ownership and etymology have been conflated.

Suggested repair: Make English match Estonian: ask which weapon is Thor's hammer and returns after being thrown. Avoid inventing a settled etymology.

Source: [Thor's hammer rings](https://historiska.se/en/explore-history/history-hub/thors-hammer-rings/) — Actual museum paragraph at line 77 identifies Thor's weapon Mjolnir and says its name likely means the crusher, supporting ownership rather than the clue's claimed literal translation.

Source: [Mjolnir](https://en.wikipedia.org/wiki/Mj%C3%B6lnir) — Actual Etymology section describes scholarly disagreement among lightning-maker, shining lightning weapon and grinder derivations; the listed source does not support the English claim that the name means Thor's hammer.

## C-MYTH-022-JESUS-DISCLOSURE: The cross explanation supplies Jesus and his death, the preceding central-person response.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-022 — Mythology, Religion & Philosophy: Christianity Basics / Mütoloogia, religioon ja filosoofia: Kristluse põhitõed.
- Questions: built-in-mythology-religion-philosophy-accessible-corpus-106, built-in-mythology-religion-philosophy-accessible-corpus-107, built-in-mythology-religion-philosophy-accessible-corpus-109.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:107](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-106).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:108](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-107).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:110](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-109).

Tier 1 asks whose life, death and resurrection are central to Christianity. Tier 2's revealed explanation directly names Jesus's crucifixion; tier 4 also names Jesus's meal with his disciples. Both expose the exact person, and the cross explanation connects him with the death component of the identifying clue.

Example: Reveal tier 2: 'The cross recalls Jesus’s crucifixion' / 'Rist meenutab Jeesuse ristilöömist'; Jesus is the tier-1 response.

Suggested repair: Replace the person-identification clue with an independent Christian subject, or keep sibling explanations from naming the answer and its identifying life event.

## C-MYTH-024-MECCA-HAJJ-RECIPROCAL: Mecca and hajj are supplied reciprocally by the two pilgrimage prompts.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-024 — Mythology, Religion & Philosophy: Islam Basics / Mütoloogia, religioon ja filosoofia: Islami põhitõed.
- Questions: built-in-mythology-religion-philosophy-accessible-corpus-118, built-in-mythology-religion-philosophy-accessible-corpus-119.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:119](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-118).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:120](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-119).

Tier 3 asks the city containing the Kaaba and destination of the hajj, answered Mecca. Tier 4 asks for the required pilgrimage to Mecca, answered hajj. Each prompt names the sibling answer and the same destination relationship in both languages.

Example: The city clue names hajj; the pilgrimage clue names Mecca. Reading either prompt supplies the central name needed by the other.

Suggested repair: Move city and pilgrimage into separate categories, or replace one with a different Islamic practice that does not disclose its sibling in either prompt or explanation.

## C-MYTH-025-SAMSARA-SELF-DISCLOSURE: The samsara question prints its own accepted answer.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-025 — Mythology, Religion & Philosophy: Hinduism Basics / Mütoloogia, religioon ja filosoofia: Hinduismi põhitõed.
- Questions: built-in-mythology-religion-philosophy-accessible-corpus-124, built-in-mythology-religion-philosophy-accessible-corpus-125.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:125](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-124).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:126](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-125).

Tier 4 asks 'Which cycle of death and rebirth do Indian traditions call saṃsāra?' and Estonian likewise prints saṃsāra. The recorded English variant and Estonian variant are both exactly saṃsāra, so the prompt supplies the required response. The moksha explanation additionally names samsara/sansaar as the rebirth cycle.

Example: Copy 'saṃsāra' from the tier-4 prompt; it is explicitly accepted in both languages.

Suggested repair: Ask what the death-and-rebirth cycle is called without printing its name, and move or rewrite the moksha explanation to avoid naming the sibling response.

## C-MYTH-026-NOBLE-TRUTHS-DISCLOSURE: The Eightfold Path explanation supplies the Noble Truth terminology for the four-part teaching.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-026 — Mythology, Religion & Philosophy: Buddhism Basics / Mütoloogia, religioon ja filosoofia: Budismi põhitõed.
- Questions: built-in-mythology-religion-philosophy-accessible-corpus-127, built-in-mythology-religion-philosophy-accessible-corpus-130.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:128](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-127).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:131](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-130).

Tier 2 asks the four-part teaching about suffering, its cause, its end and its path, answered Four Noble Truths. Tier 5's explanation calls the Eightfold Path the practical 'fourth Noble Truth' / 'neljas õilis tõde', supplying the distinctive term and a fourth member of the same four-part scheme.

Example: Reveal tier 5's 'fourth Noble Truth'; combine that phrase with tier 2's four-part wording to answer Four Noble Truths.

Suggested repair: Use one of these linked teachings in a different category or explain the Eightfold Path's practice without naming its place among the sibling truths.

## C-MYTH-027-KHALSA-DISCLOSURE: The Five Ks explanation names the initiated community sought by the Khalsa clue.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-027 — Mythology, Religion & Philosophy: Sikhism Basics / Mütoloogia, religioon ja filosoofia: Sikhismi põhitõed.
- Questions: built-in-mythology-religion-philosophy-accessible-corpus-133, built-in-mythology-religion-philosophy-accessible-corpus-134.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:134](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-133).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:135](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-134).

Tier 4 asks for the initiated Sikh community, answered Khalsa. Tier 3's explanation describes articles of faith worn by initiated Khalsa Sikhs; Estonian explicitly says members initiated into Khalsa, providing the same community's name and initiation association.

Example: Tier 3 explanation: 'initiated Khalsa Sikhs' / 'Khalsa liikmeks pühitsetud sikhide'; Khalsa then answers the initiated-community clue.

Suggested repair: Move one linked initiation question, or omit the sibling community name from the Five Ks explanation.

## C-MYTH-031-PUPIL-TEACHER-DISCLOSURE: Socrates and Plato are named across the pupil-teacher clue chain.

- Concern: Question independence and giveaways; severity: high; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-031 — Mythology, Religion & Philosophy: Philosophers of the Ancient World / Mütoloogia, religioon ja filosoofia: Antiikmaailma filosoofid.
- Questions: built-in-mythology-religion-philosophy-accessible-corpus-151, built-in-mythology-religion-philosophy-accessible-corpus-152, built-in-mythology-religion-philosophy-accessible-corpus-153.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:152](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-151).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:153](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-152).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:154](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-accessible-corpus-153).

Tier 1's explanation names Plato as Socrates's student, while tier 2 asks which student of Socrates founded the Academy. Tier 2 and tier 3 also print Socrates and Plato respectively, both sibling response names. In particular, the revealed tier-1 explanation hands over Plato with the exact pupil relationship used by tier 2.

Example: Tier 1 explanation: 'dialogues by his student Plato' / 'tema õpilase Platoni dialoogidest'; use that identified student Plato for tier 2.

Suggested repair: Regroup the three linked philosophers into separate broad sets, or remove sibling names and identifying relationships from prompts and explanations.

## C-MYTH-036-PRINTED-DEITY-VARIANTS: Two deity/day pairs can be assembled from names and calendar positions already printed in the prompts.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-036 — Gods in the English Week / Jumalad inglise nädalas.
- Questions: built-in-mythology-religion-philosophy-playable-corpus-013, built-in-mythology-religion-philosophy-playable-corpus-015.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:179](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-playable-corpus-013).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:181](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-playable-corpus-015).

Tier 3 prints Woden and asks for the English midweek day; 'Woden and Wednesday' is an accepted complete response. Tier 5 prints Tiw and says the English day after Monday; 'Tiw and Tuesday' is accepted. The supplied Old English name plus the ordinary day position bypasses recalling the requested Norse god, especially at the final tier.

Example: For tier 5, copy Tiw and identify the day after Monday as Tuesday, yielding the expressly accepted 'Tiw and Tuesday' without knowing Tyr.

Suggested repair: Remove the explicit Woden/Tiw names, or ask only for the deity from an independently identifying day-name relation without accepting a printed deity form as the response.

## C-MYTH-040-ET-FLAG-SYMBOLS: Estonian changes a six-pointed star into a hexagon and leaf emblems into tree images.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-040 — Faith and Symbols on National Flags / Usk ja sümbolid riigilippudel.
- Questions: built-in-mythology-religion-philosophy-playable-corpus-031, built-in-mythology-religion-philosophy-playable-corpus-035.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:197](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-playable-corpus-031).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:201](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-playable-corpus-035).

Tier 1's English says hexagram, but Estonian says kuusnurk (hexagon); Israel's flag has the Star of David, a six-pointed star. Tier 5's English sacred-tree emblems and expected bo leaves become 'neli püha puu kujutist' (four depictions of a sacred tree), although the flag's corner emblems are leaves. These translations describe different shapes/objects from the responses.

Suggested repair: Use kuusnurkne täht, kuueharuline täht or heksagramm for tier 1, and clearly ask for sacred-tree leaves or lehekujutised in tier 5.

Source: [Independence Day: history of Israel's flag](https://icc.nativ.gov.il/about-israel/israel-today/belo-goluboj-flag-istoriya-i-sovremennost) — Actual Russian paragraphs at lines 54–55 describe the flag's central Star of David and explicitly call it a six-pointed star; this supports the English hexagram rather than an Estonian hexagon.

Source: [Vision and Mission — The National Flag](https://airforce.lk/pages.php?pages=mission_vision) — Actual National Flag section at line 84 states that four yellow Bo leaves are at the four corners; the symbols are leaves rather than whole-tree depictions.

## C-MYTH-051-MISSING-RAT-VARIANTS: Ganesha and the rat is a valid response omitted from both languages' paired answers.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-051 — Animals in Sacred Stories / Loomad pühades lugudes.
- Questions: built-in-mythology-religion-philosophy-playable-corpus-088.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:254](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-playable-corpus-088).

The clue asks for the elephant-headed god and his small animal mount. Its own explanation says Ganesha is commonly depicted with a mouse or rat, yet the only response pairs are Ganesha and mouse, in either order. The British Museum's actual curated exhibit also identifies the vehicle as the rat, so 'Ganesha and the rat' / 'Ganeša ja rott' should not be rejected by the supplied answer list.

Suggested repair: Add rat/rott response pairs in both orders in both languages, preserving mouse/hiir as valid alternatives.

Source: [Celebrating Ganesha](https://artsandculture.google.com/story/celebrating-ganesha-the-british-museum/jwWxaGE_2ddqIg?hl=en) — Actual 'Why does Ganesha ride a rat?' section at lines 59–64 names the rat vehicle and presents a museum object labeled Ganesha on his rat mount; credits identify the British Museum tour and curator.

## GLOBAL-ATTRIBUTION-001: Packaging excludes the content notices and CC BY-SA licence text.

- Concern: Attribution and provenance; severity: high; confidence: high; assessment: review finding.
- Scope: Content distribution configuration.
- Location: [forge.config.ts:79](../../../forge.config.ts).
- Location: [content/THIRD_PARTY_NOTICES.md:7](../../../content/THIRD_PARTY_NOTICES.md).
- Location: [src/shared/content/sourceCitation.ts:38](../../../src/shared/content/sourceCitation.ts).
- Location: [src/renderer/features/content/CategorySetEditor.tsx:153](../../../src/renderer/features/content/CategorySetEditor.tsx).

forge.config.ts packages only the two content databases and resources/media; its ignore rule excludes content/THIRD_PARTY_NOTICES.md and content/LICENSE-CC-BY-SA-4.0.txt. The public game displays the source title only. The content editor does expose the article URL and recorded licence label, which is useful attribution but does not resolve the missing distribution notices and derivation disclosures. No new installer was built or inspected in this review.

Suggested repair: Prepare content notices that identify retained sources, relevant licence links and adaptations/translations; package them and provide a discoverable in-app link. Verify them in the packaged application. Apply share-alike to adapted content where required; this finding does not impose that licence on all application code.

Source: [https://creativecommons.org/licenses/by-sa/4.0/](https://creativecommons.org/licenses/by-sa/4.0/) — Attribution, licence link, changes and share-alike conditions apply to licensed material and adaptations.

Source: [https://wiki.creativecommons.org/wiki/Recommended_practices_for_attribution](https://wiki.creativecommons.org/wiki/Recommended_practices_for_attribution) — Attribution should reasonably identify the creator and work, source, licence and modifications.

## GLOBAL-ATTRIBUTION-002: All 1,200 OpenTDB-inspired questions lose their recorded inspiration identifiers in the production seed.

- Concern: Attribution and provenance; severity: medium; confidence: high; assessment: review finding.
- Scope: 1,200 openTdbInspired evidence records and their seed citations.
- Location: [content/THIRD_PARTY_NOTICES.md:12](../../../content/THIRD_PARTY_NOTICES.md).

The evidence records preserve the OpenTDB inspiration candidate IDs, but source citations in the seed contain only the separate supporting factual source. The repository notices say candidate data is draft inspiration and retain an attribution-update placeholder. This is a provenance and derivation audit gap: the metadata alone does not establish that every inspired clue copied or adapted copyrighted wording.

Suggested repair: Review whether each inspired clue is an original factual summary or an adaptation. Retain original source and derivation information for adaptations and include the required OpenTDB credit and licence in distributed notices. Keep factual support and original inspiration as distinct provenance fields.

Source: [https://opentdb.com/api_config.php](https://opentdb.com/api_config.php) — OpenTDB identifies its database licence as CC BY-SA 4.0.

## GLOBAL-ATTRIBUTION-003: Two Adult clues record 'source' as their licence.

- Concern: Attribution and provenance; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-015 — Love Words Across Cultures / Armastussõnad eri kultuurides; built-in-adult-set-092 — The Language of Romance / Romantika keel.
- Questions: built-in-adult-clue-0075, built-in-adult-clue-0460.
- Location: [content/generated/14-adult.en-et.csv:76](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0075).
- Location: [content/generated/14-adult.en-et.csv:461](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0460).

The Wendy Darling and Closure entries use 'source' in both CSV and evidence, and that value propagates into the seed. It does not identify a licence or a citation-only usage basis. The Wikipedia article's CC BY-SA notice is visible; the APA page's embedded definition could not be read in this session.

Suggested repair: Replace the placeholders with verified source-specific licence or citation-only information. Distinguish independently written factual summaries from adaptations, and use a readable supporting source for Closure if the APA definition cannot be verified.

Source: [https://en.wikipedia.org/wiki/Wendy_Darling](https://en.wikipedia.org/wiki/Wendy_Darling) — Article and licence footer read.

Source: [https://dictionary.apa.org/closure](https://dictionary.apa.org/closure) — Page opened; embedded definition unavailable. No external factual verification claimed.

## GLOBAL-ATTRIBUTION-004: The licence field mixes licences with source descriptions, and one 'compatibleOpen' record points to an NC source.

- Concern: Attribution and provenance; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-politics-economics-society-set-118 — Learning for a Career / Ametiks õppimine.
- Questions: built-in-politics-economics-society-easy-expansion-086.
- Location: [content/generated/11-politics-economics-society.en-et.csv:587](../../../content/generated/11-politics-economics-society.en-et.csv) (built-in-politics-economics-society-easy-expansion-086).

Several source_license values describe a page or citation-only use rather than a standard licence. An online-course clue is tagged compatibleOpen while its source is recorded as CC-BY-NC-SA-4.0. Original facts and original summaries do not automatically inherit a source's copyright licence, so this is a classification and derivation review requirement rather than a finding of infringement.

Suggested repair: Record the source's actual licence separately from the authored clue's derivation and usage basis. Confirm the EPALE source terms and whether text was adapted; replace or obtain suitable permission for adapted NC material if the intended distribution conflicts with those terms.

Source: [https://epale.ec.europa.eu/et/blog/opime-internetis-aga-kas-moisted-selged](https://epale.ec.europa.eu/et/blog/opime-internetis-aga-kas-moisted-selged) — Recorded supporting source. NC classification is from CSV/evidence, not a fresh determination of this page's legal terms.

## B-FINAL-001: Hard computer Final title includes the answer's distinctive nickname.

- Concern: Question independence and giveaways; severity: low; confidence: high; assessment: review finding.
- Categories: built-in-finals-final-set-0124 — The Stored-Program Baby / Salvestatud programmiga Baby.
- Questions: built-in-finals-final-0124.
- Location: [content/generated/13-finals.en-et.csv:125](../../../content/generated/13-finals.en-et.csv) (built-in-finals-final-0124).

The title The Stored-Program Baby gives Baby before the response Manchester Baby.

Example: Baby in title -> Manchester Baby.

Suggested repair: Use A British Computer Experiment or First Stored Program.

## B-FINAL-002: Watt improvement question excludes the original engine he improved.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-finals-final-set-0126 — A Separate Condenser / Eraldi kondensaator.
- Questions: built-in-finals-final-0126.
- Location: [content/generated/13-finals.en-et.csv:127](../../../content/generated/13-finals.en-et.csv) (built-in-finals-final-0126).

Which steam engine did Watt make more efficient naturally asks for Newcomen engine. Only Watt steam engine/Watt engine are accepted, while Watt and steam engine already occur in the question.

Example: James Watt + steam engine combines into the only accepted response.

Suggested repair: Ask who developed the condenser, or ask which earlier engine he improved and accept Newcomen.

Source: [Science Museum Group: Watt's second separate condenser](https://collection.sciencemuseumgroup.org.uk/objects/co50928) — Collection description discusses early Newcomen engines and the efficiency gain from a separate condensing chamber.

## B-FINAL-003: Currency Final names euro in eurozone/euroala.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-finals-final-set-0129 — Coins and Notes of a Union / Liidu mündid ja rahatähed.
- Questions: built-in-finals-final-0129.
- Location: [content/generated/13-finals.en-et.csv:130](../../../content/generated/13-finals.en-et.csv) (built-in-finals-final-0129).

Both language prompts supply the complete currency name as the region's stem. Dates become unnecessary.

Example: Currency used by eurozone -> euro; euroalal kasutatav raha -> Euro.

Suggested repair: Replace eurozone/euroala with participating EU countries, retaining dates.

## B-FINAL-004: Funerary-text clue fails to distinguish Book of the Dead from earlier collections.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-finals-final-set-0142 — Spells for the Afterlife / Loitsud hauataguseks eluks.
- Questions: built-in-finals-final-0142.
- Location: [content/generated/13-finals.en-et.csv:143](../../../content/generated/13-finals.en-et.csv) (built-in-finals-final-0142).

Texts or selections in tombs also describe Pyramid Texts and Coffin Texts; no papyrus/New Kingdom identifier distinguishes the answer.

Suggested repair: Mention illustrated papyrus scrolls or New Kingdom Book of Going Forth by Day.

Source: [UCL Digital Egypt: Book of the Dead chapter 50](https://www.ucl.ac.uk/museums-static/digitalegypt/literature/religious/bd50.html) — UCL traces this chapter to earlier Middle Kingdom Coffin Texts, showing the generic description spans collections.

## ROOT-ADULT-009: The Estonian after-party clue requires a hyphenated answer but Järelpidu has no hyphen.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-040 — When the Party Runs Late / Kui pidu venib pikaks.
- Questions: built-in-adult-clue-0198.
- Location: [content/generated/14-adult.en-et.csv:199](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0198).

The English after-party orthography hint was translated literally instead of matching the Estonian answer.

Suggested repair: Remove the hyphen constraint in Estonian.

## ROOT-ADULT-010: The British classification-board question supplies PG, the answer to the US rating question.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-042 — Movie Ratings Around the World / Filmide vanusepiirangud maailmas.
- Questions: built-in-adult-clue-0206, built-in-adult-clue-0209.
- Location: [content/generated/14-adult.en-et.csv:207](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0206).
- Location: [content/generated/14-adult.en-et.csv:210](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0209).

Tier4 lists U, PG,12A and18 in its prompt and explanation in both languages; tier1 asks for PG. Cross-country breadth does not prevent a literal sibling answer leak.

Suggested repair: Remove PG from the British-board clue and explanation or replace the US PG question with an independent rating fact.

## ROOT-ADULT-011: The red-band-trailer clue does not distinguish it from a green-band trailer.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-047 — From Mailboxes to Movie Screens / Postkastidest kinoekraanideni.
- Questions: built-in-adult-clue-0235.
- Location: [content/generated/14-adult.en-et.csv:236](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0235).

Advertising a restricted film to an age-appropriate audience is not the distinguishing red-band property; green-band previews can also advertise R-rated films. The distinguishing restriction concerns trailer content and approval conditions.

Suggested repair: Specify the preview's restricted content or its approval notice, supported by the MPA trailer rules.

Source: [https://www.filmratings.com/wp-content/uploads/2025/08/MPA-Advertising-Handbook-2025.pdf](https://www.filmratings.com/wp-content/uploads/2025/08/MPA-Advertising-Handbook-2025.pdf) — Read advertising-approval categories, especially ArticleII section5: restricted audience advertising distinguished by stronger advertising content, separate from rating of advertised movie.

## ROOT-ADULT-012: The Adonis clue supplies Aphrodite, the answer to tier2.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-053 — Myths of Love and Desire / Armastuse ja iha müüdid.
- Questions: built-in-adult-clue-0262, built-in-adult-clue-0265.
- Location: [content/generated/14-adult.en-et.csv:263](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0262).
- Location: [content/generated/14-adult.en-et.csv:266](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0265).

Both the tier5 prompt and explanation name Aphrodite; tier2 asks for that goddess.

Suggested repair: Replace one clue or rewrite tier5 without the sibling answer in either language.

## ROOT-ADULT-013: The Estonian Fauvism clue incorrectly calls a twentieth-century movement early modern.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-055 — Art Movements with Feeling / Tundelised kunstivoolud.
- Questions: built-in-adult-clue-0274.
- Location: [content/generated/14-adult.en-et.csv:275](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0274).

Varauusaeg refers to the historical early-modern period, rather than modern art. Fauvism dates from the early twentieth century, as the explanation itself states.

Suggested repair: Use twentieth-century wording in the Estonian prompt.

## ROOT-ADULT-014: An armless ancient Greek statue in the Louvre does not uniquely identify Venus de Milo.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-051 — Famous Figures in Art / Kuulsad figuurid kunstis.
- Questions: built-in-adult-clue-0252.
- Location: [content/generated/14-adult.en-et.csv:253](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0252).

The Winged Victory of Samothrace also satisfies the supplied description. The clue needs a distinguishing feature, such as discovery on Milos, or the alternative needs explicit acceptance.

Suggested repair: Add the island of discovery or another unique identifying detail without supplying the answer.

Source: [https://www.louvre.fr/en/explore/the-palace/a-stairway-to-victory](https://www.louvre.fr/en/explore/the-palace/a-stairway-to-victory) — Read official museum account: Greek statue on display; head and arms not found, separate recovered right hand exhibited in a case.

## ROOT-ADULT-015: All five Hard market clues are basic term definitions with obvious contextual hints.

- Concern: Difficulty calibration; severity: important; confidence: high; assessment: editorial judgment.
- Categories: built-in-adult-set-069 — Markets After Dark / Turud pärast pimedat.
- Questions: built-in-adult-clue-0341, built-in-adult-clue-0342, built-in-adult-clue-0343, built-in-adult-clue-0344, built-in-adult-clue-0345.
- Location: [content/generated/14-adult.en-et.csv:342](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0341).
- Location: [content/generated/14-adult.en-et.csv:343](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0342).
- Location: [content/generated/14-adult.en-et.csv:344](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0343).
- Location: [content/generated/14-adult.en-et.csv:345](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0344).
- Location: [content/generated/14-adult.en-et.csv:346](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0345).

Night market, food hall, flea market, bazaar and floating market are asked from their defining everyday features. Even tier5 describes shoppers in boats in Thailand, requiring no advanced fact. This is a set-level mismatch rather than one intentionally accessible entry clue.

Suggested repair: Move this set to Easy or replace upper tiers with independently sourced market facts that require broader trivia knowledge.

## ROOT-ADULT-016: The entire Hard rights-at-work set consists of common employment definitions.

- Concern: Difficulty calibration; severity: important; confidence: high; assessment: editorial judgment.
- Categories: built-in-adult-set-070 — Rights at Work / Õigused tööl.
- Questions: built-in-adult-clue-0346, built-in-adult-clue-0347, built-in-adult-clue-0348, built-in-adult-clue-0349, built-in-adult-clue-0350.
- Location: [content/generated/14-adult.en-et.csv:347](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0346).
- Location: [content/generated/14-adult.en-et.csv:348](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0347).
- Location: [content/generated/14-adult.en-et.csv:349](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0348).
- Location: [content/generated/14-adult.en-et.csv:350](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0349).
- Location: [content/generated/14-adult.en-et.csv:351](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0350).

Minimum wage, sick leave, parental leave, equal pay and collective bargaining are cued by near-definitions. There is little progression across tiers and none of the upper clues asks a historical or otherwise harder fact.

Suggested repair: Reclassify the set or strengthen upper tiers while retaining recognizable, varied labor topics.

## ROOT-ADULT-017: Cinerama's prompt and explanation disclose the widescreen answer.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-074 — Pictures Bigger and Brighter / Suuremad ja eredamad pildid.
- Questions: built-in-adult-clue-0367, built-in-adult-clue-0370.
- Location: [content/generated/14-adult.en-et.csv:368](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0367).
- Location: [content/generated/14-adult.en-et.csv:371](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0370).

Tier5 literally uses widescreen/laiekraan while tier2 asks for that format. It can be exposed before tier2 in either language.

Suggested repair: Describe the three-projector curved-screen process without naming the sibling format in any public text.

## ROOT-ADULT-018: The director explanation supplies producer, and the producer explanation mentions directing.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-077 — Behind the Screen / Ekraani taga.
- Questions: built-in-adult-clue-0381, built-in-adult-clue-0382.
- Location: [content/generated/14-adult.en-et.csv:382](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0381).
- Location: [content/generated/14-adult.en-et.csv:383](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0382).

The player-facing explanation for tier1 names the producer, the response to tier2. Related roles are valid topics but their definitions are not independent as displayed.

Suggested repair: Remove sibling role names from explanations or choose distinct factual questions about filmmaking roles.

## ROOT-ADULT-019: The satellite-dish explanation gives antenna, the answer to tier1.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-080 — Signals and Subscriptions / Signaalid ja tellimused.
- Questions: built-in-adult-clue-0396, built-in-adult-clue-0397.
- Location: [content/generated/14-adult.en-et.csv:397](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0396).
- Location: [content/generated/14-adult.en-et.csv:398](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0397).

Both explanations classify the dish as an antenna/antenn and tier1 asks for that generic receiver. This is a subtype-definition dependency.

Suggested repair: Replace one identification clue with an independent signal fact, or avoid naming the generic answer in the dish explanation.

## ROOT-ADULT-020: The multinational European lottery description permits EuroMillions and Eurojackpot.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-082 — Lotteries Around the World / Loteriid maailmas.
- Questions: built-in-adult-clue-0409.
- Location: [content/generated/14-adult.en-et.csv:410](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0409).

The only supplied property is shared jackpots across several European countries. This does not distinguish the accepted EuroMillions answer from Eurojackpot.

Suggested repair: Specify a unique participant-country or launch-history fact, or accept both answers explicitly.

Source: [https://eestiloto.zendesk.com/hc/et-ee/articles/15852803719069-Eurojackpoti-m%C3%A4ngujuhend](https://eestiloto.zendesk.com/hc/et-ee/articles/15852803719069-Eurojackpoti-m%C3%A4ngujuhend) — Read official operator rules: nineteen participating European countries and shared winnings/jackpot pool. Confirms an alternative fits the clue.

## ROOT-ADULT-021: The royal-flush prompt supplies ace, the answer to tier1.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-084 — Cards on the Table / Kaardid laual.
- Questions: built-in-adult-clue-0416, built-in-adult-clue-0418.
- Location: [content/generated/14-adult.en-et.csv:417](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0416).
- Location: [content/generated/14-adult.en-et.csv:419](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0418).

Tier3 names ace/äss in both prompt and explanation, while tier1 asks which card has a single suit symbol. This reveals another answer even before the flush is solved.

Suggested repair: Remove the named card from tier3's public wording or ask an independent card-history fact instead.

## ROOT-ADULT-022: After-hours-club explanations supply closing time and curfew, two sibling answers.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-087 — When Nightlife Closes / Kui ööelu sulgub.
- Questions: built-in-adult-clue-0431, built-in-adult-clue-0433, built-in-adult-clue-0434.
- Location: [content/generated/14-adult.en-et.csv:432](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0431).
- Location: [content/generated/14-adult.en-et.csv:434](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0433).
- Location: [content/generated/14-adult.en-et.csv:435](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0434).

Tier4's English explanation explicitly says curfew closing time, the answers to tiers3 and1; Estonian wording repeats sulgemisaeg. The after-hours relationship makes these definitions dependent.

Suggested repair: Replace at least one of the linked definitions, or ensure neither prompts nor explanations disclose other accepted answers.

## ROOT-ADULT-023: The moonshine name hint does not apply to the Estonian answer Puskar.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-090 — Prohibition in Pop Culture / Keeluaeg popkultuuris.
- Questions: built-in-adult-clue-0447.
- Location: [content/generated/14-adult.en-et.csv:448](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0447).

The Estonian prompt says the liquor's name suggests making it at night, but the stored response is Puskar. Only the English name moonshine has that supplied relationship.

Suggested repair: Explicitly ask for the English name and accept moonshine, or use a language-neutral identifying fact in Estonian.

## ROOT-ADULT-024: The middle-age prompt directly supplies young adulthood, tier1's answer.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-adult-set-099 — Milestones and Life Transitions / Eluetapid ja üleminekud.
- Questions: built-in-adult-clue-0491, built-in-adult-clue-0492.
- Location: [content/generated/14-adult.en-et.csv:492](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0491).
- Location: [content/generated/14-adult.en-et.csv:493](../../../content/generated/14-adult.en-et.csv) (built-in-adult-clue-0492).

Tier2 identifies its stage as between young adulthood and old age, naming tier1's accepted answer in both languages. Related life stages can be asked independently only with different facts.

Suggested repair: Remove the named sibling stage from tier2's prompt and explanation or replace one stage definition.

## ROOT-ADULT-025: A cohort of Hard Adult sets uses basic recognition or word-construction hints across nearly every tier.

- Concern: Difficulty calibration; severity: important; confidence: medium; assessment: editorial judgment.
- Categories: built-in-adult-set-071 — From Cinema to Streaming / Kinost voogedastuseni; built-in-adult-set-072 — Movie Night Technology / Filmiõhtu tehnika; built-in-adult-set-073 — How We Watched at Home / Kuidas me kodus vaatasime; built-in-adult-set-075 — Home Media Formats / Kodused meediaformaadid; built-in-adult-set-076 — Selling a Movie / Filmi müümine; built-in-adult-set-078 — Awards Night / Auhinnaõhtu; built-in-adult-set-079 — Television Around the World / Televisioon maailmas; built-in-adult-set-080 — Signals and Subscriptions / Signaalid ja tellimused; built-in-adult-set-083 — Games at the Pub / Pubimängud; built-in-adult-set-092 — The Language of Romance / Romantika keel; built-in-adult-set-093 — Survey Basics / Küsitluse põhitõed; built-in-adult-set-096 — Signs of Growing Up / Kasvamise märgid; built-in-adult-set-099 — Milestones and Life Transitions / Eluetapid ja üleminekud; built-in-adult-set-100 — Healthy Relationships / Terved suhted.

Examples include projector/smartTV/popcornmachine/soundbar/HDMI; darts/pool/tablefootball/dominoes/pubquiz; and respect/honesty/support/autonomy/conflictresolution. NHK and K-drama are mechanically constructed from letters supplied in their prompts. Accessibility is desirable, but a Hard five-clue set needs a meaningful upper-tier challenge rather than five dictionary descriptions.

Suggested repair: Calibrate these fourteen sets with representative players, then move easy sets or strengthen upper tiers using independent, recognizable factual subjects. Preserve Easy/Medium/Hard quotas when correcting the classifications.

## ROOT-ESTONIA-001: The cornflower explanation supplies rye, the answer to the black-bread clue.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-001 — Blue, Black, White—and More / Sinine, must, valge ja veel.
- Questions: built-in-estonia-clue-0001, built-in-estonia-clue-0002.
- Location: [content/generated/15-estonia.en-et.csv:2](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0001).
- Location: [content/generated/15-estonia.en-et.csv:3](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0002).

Tier1's explanation says fields of rye/rukkipõldudel; tier2 asks for that grain. The explanation reveals a relevant sibling answer in both languages.

Suggested repair: Remove the named grain from the cornflower explanation or replace one question with a different national-symbol fact.

## ROOT-ESTONIA-002: The first-film clue asks for an animal but stores a film title.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-002 — Estonia’s Famous Firsts / Eesti kuulsad esimesed.
- Questions: built-in-estonia-clue-0010.
- Location: [content/generated/15-estonia.en-et.csv:11](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0010).

Both prompts end by describing hunting this animal; the accepted response is Bear Hunt in Pärnumaa/Karujaht Pärnumaal, rather than bear/karu. No animal alternative is supplied.

Suggested repair: Ask for the film title explicitly, or store and accept the animal answer.

## ROOT-ESTONIA-003: Four of five Estonia-by-numbers clues supply all facts and ask only trivial arithmetic or formatting.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: editorial judgment.
- Categories: built-in-estonia-set-003 — Estonia by the Numbers / Eesti arvudes.
- Questions: built-in-estonia-clue-0011, built-in-estonia-clue-0012, built-in-estonia-clue-0013, built-in-estonia-clue-0014.
- Location: [content/generated/15-estonia.en-et.csv:12](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0011).
- Location: [content/generated/15-estonia.en-et.csv:13](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0012).
- Location: [content/generated/15-estonia.en-et.csv:14](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0013).
- Location: [content/generated/15-estonia.en-et.csv:15](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0014).

2317 is supplied before choosing over2000; twelve-plus-two yields fourteen;00372 is supplied before replacing zeroes with+;46minus26 yields20. These do not test four independent Estonian trivia facts, and most of the set can be solved without prior knowledge.

Suggested repair: Ask the factual quantities from contextual clues, or explicitly classify this as a numeric puzzle set and calibrate its low difficulty. Also clarify best rounded threshold:2317 is both over200 and over2000.

## ROOT-ESTONIA-004: The title From AHHAA to Ekspress supplies one complete answer and most of another.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-012 — From AHHAA to Ekspress / AHHAAst Ekspressini.
- Questions: built-in-estonia-clue-0056, built-in-estonia-clue-0060.
- Location: [content/generated/15-estonia.en-et.csv:57](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0056).
- Location: [content/generated/15-estonia.en-et.csv:61](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0060).

AHHAA is exactly tier1's answer and Ekspress strongly identifies Eesti Ekspress at tier5. The board title is visible before any question is opened. The five topics are varied but their title undermines two retrieval tasks.

Suggested repair: Use a broad title that does not name any accepted response, such as Estonian Names from A to E, and remove redundant mechanical letter hints as needed.

## ROOT-ESTONIA-005: The sauna-whisk question requires birch although it describes only unspecified leafy twigs.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-022 — A Weekend in the Country / Nädalavahetus maal.
- Questions: built-in-estonia-clue-0109.
- Location: [content/generated/15-estonia.en-et.csv:110](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0109).

The defining object is a sauna whisk/viht. The question never specifies a birch tree, yet its response requires birch sauna whisk/kaseviht and supplies no generic alternative. Other leafy whisk materials are possible.

Suggested repair: Accept sauna whisk/viht, or add a distinguishing birch-leaf/tree description if species recall is intended.

## ROOT-ESTONIA-006: Several clues supply the answer components and ask only mechanical assembly, including upper tiers.

- Concern: Question independence and giveaways; severity: important; confidence: medium; assessment: editorial judgment.
- Categories: built-in-estonia-set-030 — Curtain Up in Estonia / Eesriie tõuseb Eestis; built-in-estonia-set-002 — Estonia’s Famous Firsts / Eesti kuulsad esimesed; built-in-estonia-set-007 — Made, Written or Invented Here / Siin tehtud, kirjutatud või leiutatud; built-in-estonia-set-025 — Estonia on the Playlist / Eesti esitusloendis.
- Questions: built-in-estonia-clue-0006, built-in-estonia-clue-0033, built-in-estonia-clue-0124, built-in-estonia-clue-0150.
- Location: [content/generated/15-estonia.en-et.csv:7](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0006).
- Location: [content/generated/15-estonia.en-et.csv:34](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0033).
- Location: [content/generated/15-estonia.en-et.csv:125](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0124).
- Location: [content/generated/15-estonia.en-et.csv:151](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0150).

1441-to1440s and kiik+ing require no trivia recall. The Estonian Ewert prompt supplies Ewert,two and dragons; the Kanuti Gildi SAAL prompt supplies the full venue name in components at tier5. The English Ewert version still requires the singer's first name, creating an avoidable language imbalance.

Suggested repair: Use independent identifying facts for upper tiers and ensure bilingual hints require comparable knowledge. Keep word-assembly games only if intentionally labeled and calibrated.

## ROOT-ESTONIA-007: The jaw-harp wording incorrectly suggests its flexible tongue is plucked against the teeth.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-028 — Strings, Pipes and Keys / Keeled, torud ja klahvid.
- Questions: built-in-estonia-clue-0138.
- Location: [content/generated/15-estonia.en-et.csv:139](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0138).

The instrument's frame is held at the teeth; the flexible tongue vibrates freely when plucked. Both prompts and explanations conflate these parts or describe vibration against the mouth cavity.

Suggested repair: Describe holding the frame at the teeth and plucking the free tongue; verify the wording against the cited university instrument guide.

Source: [https://pilliportaal.kultuur.ut.ee/parimuspillid/parmupill/](https://pilliportaal.kultuur.ut.ee/parimuspillid/parmupill/) — Read university instrument guide: frame arms rest against upper/lower teeth; tongue moves freely between them and is plucked by finger.

## ROOT-ESTONIA-008: The Estonian version supplies every compound-word answer in its component words.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: editorial judgment.
- Categories: built-in-estonia-set-031 — Say It in Estonian / Ütle eesti keeles.
- Questions: built-in-estonia-clue-0151, built-in-estonia-clue-0152, built-in-estonia-clue-0153, built-in-estonia-clue-0154, built-in-estonia-clue-0155.
- Location: [content/generated/15-estonia.en-et.csv:152](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0151).
- Location: [content/generated/15-estonia.en-et.csv:153](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0152).
- Location: [content/generated/15-estonia.en-et.csv:154](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0153).
- Location: [content/generated/15-estonia.en-et.csv:155](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0154).
- Location: [content/generated/15-estonia.en-et.csv:156](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0155).

Lennu+jaam,raamat+kogu,pea+linn,jää+lõhkuja,päeva+lill simply assemble all five stored Estonian answers. The category therefore asks no independent word knowledge in Estonian. Conversely its English title Say It in Estonian contradicts the stored English responses airport/library/capitalcity/icebreaker/sunflower.

Suggested repair: Ask recognizable Estonian compounds from definitions without supplying their parts, and choose a title whose task matches each locale.

## ROOT-ESTONIA-009: The eight-pointed-star prompt explicitly names knitted mittens, tier2's answer.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-033 — Patterns You Meet around Estonia / Mustrid, mida Eestis kohtad.
- Questions: built-in-estonia-clue-0162, built-in-estonia-clue-0163.
- Location: [content/generated/15-estonia.en-et.csv:163](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0162).
- Location: [content/generated/15-estonia.en-et.csv:164](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0163).

Tier3 begins On Estonian knitted mittens/Eesti kootud kinnastel. Tier2 identifies those hand coverings from their patterns. A player opening tier3 first has already seen its sibling's response.

Suggested repair: Use a different object for the motif question or remove the named sibling response from all public fields.

## ROOT-ESTONIA-010: The English board title Dots,Tildes and Long Vowels supplies the tilde answer.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-038 — Dots, Tildes and Long Vowels / Täpid, lained ja pikad vokaalid.
- Questions: built-in-estonia-clue-0186.
- Location: [content/generated/15-estonia.en-et.csv:187](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0186).

Tier1 asks for the wavy diacritic and the title explicitly names tildes. The Estonian title uses waves rather than the answer word, creating unequal disclosure.

Suggested repair: Use a language-neutral title that does not contain accepted answers, such as Distinctive Estonian Spelling.

## ROOT-ESTONIA-011: The airport clue asks for the writer-president's name but stores the whole airport name.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-044 — Names above the Door / Nimed ukse kohal.
- Questions: built-in-estonia-clue-0216.
- Location: [content/generated/15-estonia.en-et.csv:217](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0216).

The blank identified by this writer-president's name is Lennart Meri, yet the accepted response is Lennart Meri Tallinn Airport and no person-only variant is supplied.

Suggested repair: Accept Lennart Meri or explicitly ask for the airport's full name.

## ROOT-ESTONIA-012: Magma is mislabeled an orchestral cycle.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-051 — Estonia Takes the Stage / Eesti astub lavale.
- Questions: built-in-estonia-clue-0255.
- Location: [content/generated/15-estonia.en-et.csv:256](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0255).

The composer's official catalogue calls Magma SymphonyNo4 for percussion and orchestra; it is not an orchestral cycle. Both question languages use the wrong work type.

Suggested repair: Call it the fourth symphony, or a work for percussion and orchestra.

Source: [https://www.erkkisven.com/recordings/24/magma](https://www.erkkisven.com/recordings/24/magma) — Read composer recording catalogue explicitly identifying the work.

## ROOT-ESTONIA-013: The Father and Son clue cites a Seattle sculpture by Louise Bourgeois while asking about Ülo Õun's Tartu work.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-059 — Studios, Streets and Stories / Ateljeed, tänavad ja lood.
- Questions: built-in-estonia-clue-0292.
- Location: [content/generated/15-estonia.en-et.csv:293](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0292).

The stored Wikipedia revision1361319463 explicitly identifies an outdoor2005 Seattle fountain by Louise Bourgeois. It cannot support the claimed1977 Õun sculpture installed in Tartu in2004. The prompt's much-smaller boy also misdescribes the Tartu sculpture, whose child is enlarged to the father's height.

Suggested repair: Replace the wrong-entity citation with an authoritative Tartu/Õun source and accurately describe the two figures at the same height.

Source: [https://en.wikipedia.org/w/index.php?oldid=1361319463](https://en.wikipedia.org/w/index.php?oldid=1361319463) — Read the actual stored permanent source. Its artist, location, date and physical form differ from this clue.

Source: [https://en.wikipedia.org/wiki/%C3%9Clo_%C3%95un](https://en.wikipedia.org/wiki/%C3%9Clo_%C3%95un) — Search result describes Õun and his18-month-old son standing at same height; official VisitTartu page was403 in reader, so original municipal corroboration remains desirable.

## ROOT-ESTONIA-014: The EKA clue supplies an explicitly accepted answer before asking for the academy.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-057 — Made and Displayed in Estonia / Eestis loodud ja näidatud.
- Questions: built-in-estonia-clue-0281.
- Location: [content/generated/15-estonia.en-et.csv:282](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0281).

Known by the abbreviation EKA appears in both prompts, and EKA is a stored accepted response. A player can repeat the supplied abbreviation rather than identify the university.

Suggested repair: If asking to expand EKA, require the full institution name and remove the abbreviation from accepted variants for this clue; alternatively ask from a different identifying fact.

## ROOT-ESTONIA-015: The online-school-platform clue does not distinguish eKool from Stuudium.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-061 — Digital Daily Life / Digitaalne argipäev.
- Questions: built-in-estonia-clue-0303.
- Location: [content/generated/15-estonia.en-et.csv:304](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0303).

Grades, homework and family messaging are explicitly offered by Stuudium too. The generic supplied facts do not identify just eKool.

Suggested repair: Add a distinctive founding/history fact or accept both platforms.

Source: [https://stuudium.com/](https://stuudium.com/) — Read the official features page describing student/parent grades, homework and communication.

## ROOT-ESTONIA-016: The Clevon prompt names Cleveron, the answer to another clue in the set.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-063 — Robots Made in Estonia / Eestis loodud robotid.
- Questions: built-in-estonia-clue-0313, built-in-estonia-clue-0315.
- Location: [content/generated/15-estonia.en-et.csv:314](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0313).
- Location: [content/generated/15-estonia.en-et.csv:316](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0315).

Both languages identify Clevon as a Cleveron spin-off; Cleveron is the answer to tier3.

Suggested repair: Describe Clevon without naming Cleveron or replace one clue.

## ROOT-ESTONIA-017: ESTCube-2 is described as having tested orbit-removal technology, although it never separated from its launcher.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-065 — Estonia Looks to Space / Eesti vaatab kosmosesse.
- Questions: built-in-estonia-clue-0321.
- Location: [content/generated/15-estonia.en-et.csv:322](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0321).

The University of Tartu confirms the2023 satellite failed to separate and burned up on re-entry. Carrying a planned experiment does not establish that the orbital test was performed.

Suggested repair: Change the explanation to the intended experiment and state the launch failure; retain a clearly qualified launch-date prompt.

Source: [https://kosmos.ut.ee/en/news/ut-tartu-observatory-develop-estcube-3-satellite-support-european-space-agency](https://kosmos.ut.ee/en/news/ut-tartu-observatory-develop-estcube-3-satellite-support-european-space-agency) — Read the official2025 account confirming failure to separate and destruction on re-entry.

## ROOT-ESTONIA-018: The Estonian Taevaskoda clue supplies the answer stem in the question.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-066 — Reading the Landscape / Maastikku lugedes.
- Questions: built-in-estonia-clue-0327.
- Location: [content/generated/15-estonia.en-et.csv:328](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0327).

It calls the formations kaks kuulsat taevakoda, while Taevaskojad is the accepted response. The English version instead gives a translated name hint.

Suggested repair: Use river, location and sandstone facts without naming taevakoda.

## ROOT-ESTONIA-019: Two upper-tier questions supply arithmetic sufficient to construct the answer.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-067 — Engineering the Journey / Teekonna tehnika; built-in-estonia-set-070 — How Estonia Votes / Kuidas Eesti valib.
- Questions: built-in-estonia-clue-0335, built-in-estonia-clue-0348.
- Location: [content/generated/15-estonia.en-et.csv:336](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0335).
- Location: [content/generated/15-estonia.en-et.csv:349](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0348).

The rail gauge asks1,520 minus85; the local voting-age clue asks18 minus2. Neither requires knowing the stated Estonian fact.

Suggested repair: Ask the historical/engineering fact directly, or use the arithmetic only in a lower-tier puzzle category.

## ROOT-ESTONIA-020: The Estonian State explanations reveal two sibling answers.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-069 — The Estonian State / Eesti riik.
- Questions: built-in-estonia-clue-0341, built-in-estonia-clue-0342, built-in-estonia-clue-0343, built-in-estonia-clue-0345.
- Location: [content/generated/15-estonia.en-et.csv:342](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0341).
- Location: [content/generated/15-estonia.en-et.csv:343](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0342).
- Location: [content/generated/15-estonia.en-et.csv:344](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0343).
- Location: [content/generated/15-estonia.en-et.csv:346](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0345).

The Government explanation names the1992 Constitution, answering tier1; the Chancellor explanation names Supreme Court/Riigikohus, answering tier3. Both explanations are revealed publicly during play.

Suggested repair: Remove sibling answers from explanations or replace the overlapping questions.

## ROOT-ESTONIA-021: The advance-voting translation says six election days before election day.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-070 — How Estonia Votes / Kuidas Eesti valib.
- Questions: built-in-estonia-clue-0349.
- Location: [content/generated/15-estonia.en-et.csv:350](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0349).

The English means voting on six days preceding election day. Kuuel valimispäeval enne valimispäeva is a contradictory and misleading Estonian construction.

Suggested repair: Use kuuel päeval enne valimispäeva, and verify the time-specific voting arrangement against the election authority.

## ROOT-ESTONIA-022: The coin-map claim incorrectly covers every Estonian euro coin.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-072 — Estonian Money, Old and New / Eesti raha enne ja nüüd.
- Questions: built-in-estonia-clue-0356.
- Location: [content/generated/15-estonia.en-et.csv:357](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0356).

Estonian commemorative2-euro circulation coins have other national-side designs, as the central bank explains. The clue needs to exclude them.

Suggested repair: Qualify ordinary circulation designs and distinguish commemorative issues.

Source: [https://www.eestipank.ee/sularaha/2eurosed-puhendusmundid](https://www.eestipank.ee/sularaha/2eurosed-puhendusmundid) — Read the central bank catalogue, including the2012 design with people, ship, factory and windmills.

## ROOT-ESTONIA-023: Vilsandi is wrongly called Estonia’s oldest national park.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-077 — Estonian Islands / Eesti saared.
- Questions: built-in-estonia-clue-0383.
- Location: [content/generated/15-estonia.en-et.csv:384](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0383).

Vaika protection began1910, but Vilsandi became a national park1993; Lahemaa became one1971. The explanation confuses protected-area ancestry with national-park designation.

Suggested repair: Preserve the island category and Vilsandi response: ask which western island names the national park that grew from the 1910 Vaika bird sanctuary. Explain the 1910 reserve ancestry and the 1993 national-park designation without calling Vilsandi the oldest national park. Lahemaa is the older national park but is not an island substitute.

Source: [https://kaitsealad.ee/en/protected-areas/vilsandi-national-park/about-national-park](https://kaitsealad.ee/en/protected-areas/vilsandi-national-park/about-national-park) — Official Environmental Board sources corroborated by reviewer-a; also https://kaitsealad.ee/en/news/lahemaa-national-park-celebrates-its-55th-anniversary.

## ROOT-ESTONIA-024: Veerpalu’s explanation invents a2002 Olympic30km victory.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-086 — Estonia on Snow / Eesti lumel.
- Questions: built-in-estonia-clue-0427.
- Location: [content/generated/15-estonia.en-et.csv:428](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0427).

His second2002 Olympic medal was silver in50km classical. The explanation incorrectly says he won the30km race.

Suggested repair: State50km silver and retain the correct total of three Olympic medals.

Source: [https://medias3.fis-ski.com/pdf/2002/CC/2855/2855RL.pdf](https://medias3.fis-ski.com/pdf/2002/CC/2855/2855RL.pdf) — Official FIS result identifies the50km classical event and Veerpalu rank2.

## ROOT-ESTONIA-025: Urmo Aava is wrongly credited with a2008 Jordan WRC podium.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-087 — Rally Roads / Ralliteed.
- Questions: built-in-estonia-clue-0435.
- Location: [content/generated/15-estonia.en-et.csv:436](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0435).

The contemporary BP-Ford team report states Aava retired from fifth with suspension failure; the podium was Hirvonen, Sordo and Atkinson.

Suggested repair: Replace the invented podium fact with an accurately sourced career result.

Source: [https://au.motorsport.com/wrc/news/rally-jordan-bp-ford-final-leg-summary/2298441/](https://au.motorsport.com/wrc/news/rally-jordan-bp-ford-final-leg-summary/2298441/) — Read the original BP-Ford final-leg press report syndicated by Motorsport.com, explicitly reporting Aava retirement.

## ROOT-ESTONIA-026: Green-and-white Tallinn club with numerous titles also describes Levadia.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-089 — Fans in the Stands / Fännid tribüünil.
- Questions: built-in-estonia-clue-0443.
- Location: [content/generated/15-estonia.en-et.csv:444](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0443).

Levadia’s official history confirms every supplied property, so Flora is not uniquely identifiable.

Suggested repair: Add Flora’s1990 founding fact or accept Levadia too.

Source: [https://fcilevadia.ee/en/history/](https://fcilevadia.ee/en/history/) — Official club history gives Tallinn, green/white colours and multiple national championships.

## ROOT-ESTONIA-027: The Lilleküla Stadium clue supplies its accepted A.LeCoq Arena alias.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-089 — Fans in the Stands / Fännid tribüünil.
- Questions: built-in-estonia-clue-0444.
- Location: [content/generated/15-estonia.en-et.csv:445](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0444).

Both prompts explicitly name A.LeCoq Arena and it is an accepted variant.

Suggested repair: Ask for the unsponsored name and remove that alias for this clue, or ask from different facts.

## ROOT-ESTONIA-028: Rapla is described as competing in the2025–26 top division after withdrawing.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-089 — Fans in the Stands / Fännid tribüünil.
- Questions: built-in-estonia-clue-0445.
- Location: [content/generated/15-estonia.en-et.csv:446](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0445).

The club’s June2025 announcement explicitly states it will not enter the2025/26 Estonian-Latvian or Estonian top leagues.

Suggested repair: Use a season when Rapla participated or replace the clue with another independently sourced club fact.

Source: [https://www.raplakk.ee/rapla-korvpallikool-ei-osale-eesti-lati-korvpalliliigas-ja-eesti-meistriliigas-hooajal-2025-2026/](https://www.raplakk.ee/rapla-korvpallikool-ei-osale-eesti-lati-korvpalliliigas-ja-eesti-meistriliigas-hooajal-2025-2026/) — Read official club withdrawal announcement.

## ROOT-ESTONIA-029: Klavan is wrongly identified as the first Estonian Premier League player.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-092 — Estonian Sports Stars / Eesti sporditähed.
- Questions: built-in-estonia-clue-0457.
- Location: [content/generated/15-estonia.en-et.csv:458](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0457).

Mart Poom’s club records his Premier League debut for Derby on5April1997, long before Klavan’s2016 Liverpool debut. The supplied Ragnar hint forces a wrong premise.

Suggested repair: Ask the Liverpool signing fact for Klavan or replace the first-player question with Poom.

Source: [https://www.dcfc.co.uk/news/2020/04/poom-i-will-never-forget-the-date](https://www.dcfc.co.uk/news/2020/04/poom-i-will-never-forget-the-date) — Read Derby County’s official account of Poom debut at Manchester United in1997.

## ROOT-ESTONIA-030: The English cinnamon-roll question states its entire answer.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-093 — From Bakery to Dessert / Pagariletist magustoiduni.
- Questions: built-in-estonia-clue-0461.
- Location: [content/generated/15-estonia.en-et.csv:462](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0461).

The prompt literally says cinnamon roll and the canonical English response is a cinnamon roll; it asks neither the Estonian name nor a different fact.

Suggested repair: Explicitly ask for kaneelirull and require it, or describe the pastry without naming it.

## ROOT-ESTONIA-031: The English sõir clue says cumin where the Estonian and explanation say caraway.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-094 — Savoury Estonia / Eesti soolased maitsed.
- Questions: built-in-estonia-clue-0470.
- Location: [content/generated/15-estonia.en-et.csv:471](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0470).

Cumin and caraway are distinct spices; köömned translates to caraway here. The bilingual fact is inconsistent.

Suggested repair: Use caraway in the English prompt and retain köömned.

## ROOT-ESTONIA-032: The mulled-wine clue gives its accepted Glögi variant in the event name.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-095 — Estonian Drinks / Eesti joogid.
- Questions: built-in-estonia-clue-0471.
- Location: [content/generated/15-estonia.en-et.csv:472](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0471).

Glögi Café Day/glögikohvikute päev exposes Glögi, an explicit accepted response.

Suggested repair: Remove the alias for a translation question or describe the winter event without giving the drink name.

## ROOT-ESTONIA-033: Tänan is called a six-letter word although it has five letters.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-096 — Five Useful Estonian Words / Viis kasulikku eesti sõna.
- Questions: built-in-estonia-clue-0477.
- Location: [content/generated/15-estonia.en-et.csv:478](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0477).

Both language prompts require six letters; T-ä-n-a-n totals five.

Suggested repair: Correct the count to five or use a different unambiguous expression.

## ROOT-ESTONIA-034: The Estonian juniper-wood question describes ash wood.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-097 — Crafted in Estonia / Eestis meisterdatud.
- Questions: built-in-estonia-clue-0483.
- Location: [content/generated/15-estonia.en-et.csv:484](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0483).

Saarepuit is ash wood in Estonian; translating island wood as saarepuit introduces a different tree species than kadakapuit.

Suggested repair: Say Saaremaal kasutatav lõhnav puit or another idiomatic description without naming ash.

## ROOT-ESTONIA-035: The Christmas-performance clue excludes alternatives acknowledged by its own explanation.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-098 — Estonian Christmas Traditions / Eesti jõulutraditsioonid.
- Questions: built-in-estonia-clue-0488.
- Location: [content/generated/15-estonia.en-et.csv:489](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0488).

The prompt asks any short performance before receiving a gift. Its explanation explicitly permits a song or riddle, but only reciting a poem is stored.

Suggested repair: Accept singing/reciting a riddle as appropriate or narrow the question to a spoken verse.

## ROOT-ESTONIA-036: Noisy autumn V-formations in Estonia do not uniquely identify geese.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-estonia-set-084 — Signs of the Seasons / Aastaaegade märgid.
- Questions: built-in-estonia-clue-0417.
- Location: [content/generated/15-estonia.en-et.csv:418](../../../content/generated/15-estonia.en-et.csv) (built-in-estonia-clue-0417).

The national ornithological society’s migration guide also lists cranes and swans among V-flying birds, and names autumn migration in Estonia.

Suggested repair: Add a distinctive goose fact or allow valid alternatives.

Source: [https://www.eoy.ee/img/Lindude_r2nne.pdf](https://www.eoy.ee/img/Lindude_r2nne.pdf) — Official Estonian Ornithological Society guide explicitly lists geese, cranes and swans in V formations.

## ROOT-FINALS-001: The buried Roman city clue also identifies Herculaneum.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-finals-final-set-0001 — Cities Under Ash / Linnad tuha all.
- Questions: built-in-finals-final-0001.
- Location: [content/generated/13-finals.en-et.csv:2](../../../content/generated/13-finals.en-et.csv) (built-in-finals-final-0001).

Vesuvius, AD79 and preservation beneath volcanic material describe Herculaneum as well as Pompeii. The category title does not distinguish them.

Suggested repair: Add a Pompeii-specific identifying detail or accept Herculaneum too.

Source: [https://ercolano.cultura.gov.it/the-story/?lang=en](https://ercolano.cultura.gov.it/the-story/?lang=en) — Official archaeological park history confirms the Roman city was buried in the79AD eruption.

## ROOT-FINALS-002: The Beethoven Final gives the requested symphony number in its category title.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-finals-final-set-0066 — Joy in a Ninth Symphony / Rõõm üheksandas sümfoonias.
- Questions: built-in-finals-final-0066.
- Location: [content/generated/13-finals.en-et.csv:67](../../../content/generated/13-finals.en-et.csv) (built-in-finals-final-0066).

Joy in a Ninth Symphony/Rõõm üheksandas sümfoonias names Ninth. The prompt supplies Beethoven, so the whole answer is available before independent recall.

Suggested repair: Remove the symphony number from the category title.

## ROOT-FINALS-003: The Estonian kinescope answer names the display tube instead of television-film recording.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-finals-final-set-0089 — Television Recorded on Film / Televisioon filmilindil.
- Questions: built-in-finals-final-0089.
- Location: [content/generated/13-finals.en-et.csv:90](../../../content/generated/13-finals.en-et.csv) (built-in-finals-final-0089).

EKI defines kineskoop as the electron-beam display component of an older television. The prompt asks for a device filming the monitor; EN kinescope also names the recording process. The two language answers are not equivalent for this question.

Suggested repair: Ask for the recording technique and use a sourced Estonian term such as kineskoopsalvestus, rather than describing the CRT as the film-recording device.

Source: [https://sonaveeb.ee/search/unif/est%2Crus/eki/kineskoop/1/est?uilang=en](https://sonaveeb.ee/search/unif/est%2Crus/eki/kineskoop/1/est?uilang=en) — Read EKI Combined Dictionary2026 definition identifying the television/display component.

## ROOT-FINALS-004: An annual stage race with a yellow overall-leader jersey does not uniquely identify Tour de France.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-finals-final-set-0094 — The Yellow Jersey / Kollane särk.
- Questions: built-in-finals-final-0094.
- Location: [content/generated/13-finals.en-et.csv:95](../../../content/generated/13-finals.en-et.csv) (built-in-finals-final-0094).

Tour de Suisse also uses a yellow jersey for the overall leader. Neither the prompt nor The Yellow Jersey title supplies France or another distinguishing constraint.

Suggested repair: Add France, the three-week Grand Tour format or another distinguishing fact.

Source: [https://www.tourdesuisse.ch/wp-content/uploads/6-Etappe-Ulrichen-Blatten-TdS2024-1.pdf](https://www.tourdesuisse.ch/wp-content/uploads/6-Etappe-Ulrichen-Blatten-TdS2024-1.pdf) — Official organizer document explicitly identifies the yellow jersey as the overall leader.

## ROOT-ESTONIA-037: Several Hard Estonia sets mainly use familiar definitions and transparent word constructions.

- Concern: Difficulty calibration; severity: important; confidence: editorial; assessment: editorial judgment.
- Categories: built-in-estonia-set-096 — Five Useful Estonian Words / Viis kasulikku eesti sõna; built-in-estonia-set-082 — Forests, Bogs and Meadows / Metsad, rabad ja niidud; built-in-estonia-set-084 — Signs of the Seasons / Aastaaegade märgid; built-in-estonia-set-093 — From Bakery to Dessert / Pagariletist magustoiduni; built-in-estonia-set-100 — A Free Day in Estonia / Vaba päev Eestis.

Useful Words asks palun, tänan, ilm, kodu and saar; Forests asks oak, wild garlic, bogs, cloudberry and juniper; Bakery includes the answer cinnamon roll in its English prompt and transparent ingredient-to-compound clues. These are editorial calibration concerns for an Estonian-speaking casual audience, separate from proved factual errors.

Suggested repair: Calibrate with representative EN/ET players; retain accessible low tiers but replace higher tiers with independently knowable harder facts, or reclassify while preserving bank quotas.

## ROOT-MYTHOLOGY-001: The Recusal prompt gives the sibling answer Impartiality.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-142 — Principles of Fair Treatment / Õiglase kohtlemise põhimõtted.
- Questions: built-in-mythology-religion-philosophy-all-level-expansion-0109, built-in-mythology-religion-philosophy-all-level-expansion-0110.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:710](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-all-level-expansion-0109).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:711](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-all-level-expansion-0110).

The tier5 prompt and explanation both name impartiality/erapooletus, the exact tier4 response.

Suggested repair: Describe the judge’s personal stake or conflict instead of naming impartiality.

## ROOT-MYTHOLOGY-002: The Bragi clue names Idunn, the answer to tier2.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-152 — Norse Gods outside the Battlefield / Põhjala jumalad väljaspool lahinguvälja.
- Questions: built-in-mythology-religion-philosophy-all-level-expansion-0156, built-in-mythology-religion-philosophy-all-level-expansion-0157.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:757](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-all-level-expansion-0156).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:758](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-all-level-expansion-0157).

Both languages say Bragi is married to Idunn, exposing a later answer in the same category.

Suggested repair: Remove the spouse name or replace one overlapping clue.

## ROOT-MYTHOLOGY-003: The Mandorla prompt names Mary, the answer to tier3.

- Concern: Question independence and giveaways; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-158 — Religious Images and Symbols / Usulised kujutised ja sümbolid.
- Questions: built-in-mythology-religion-philosophy-all-level-expansion-0188, built-in-mythology-religion-philosophy-all-level-expansion-0189.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:789](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-all-level-expansion-0188).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:790](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-all-level-expansion-0189).

Christ or the Virgin Mary/neitsi Maarja appears in the tier4 prompt, while tier3 asks for the Christian figure Mary/Maarja.

Suggested repair: Use a general sacred-figure description for mandorla or replace the overlapping Mary clue.

## ROOT-MYTHOLOGY-004: The atomist-philosopher clue does not distinguish Democritus from Leucippus.

- Concern: Facts, ambiguity and localization; severity: important; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-140 — Ancient Thinkers and Their Ideas / Antiikmõtlejad ja nende ideed.
- Questions: built-in-mythology-religion-philosophy-all-level-expansion-0100.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:701](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-all-level-expansion-0100).

Leucippus is also associated with indivisible atoms moving in void. No distinguishing date, teacher relation or title is supplied.

Suggested repair: Add a uniquely identifying Democritus detail or accept Leucippus.

Source: [https://plato.stanford.edu/entries/leucippus/](https://plato.stanford.edu/entries/leucippus/) — Stanford Encyclopedia of Philosophy entry consulted for the relevant philosopher and historical context.

## ROOT-MYTHOLOGY-005: The Ancient Images title includes the later image traditionally called Buridan’s ass.

- Concern: Category coherence; severity: important; confidence: editorial; assessment: editorial judgment.
- Categories: built-in-mythology-religion-philosophy-set-166 — Ancient Images of the Human Condition / Antiiksed kujundid inimese olukorrast.
- Questions: built-in-mythology-religion-philosophy-all-level-expansion-0229.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:830](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-all-level-expansion-0229).

The category's other examples have straightforward ancient associations, while this named image is traditionally associated with the 14th-century philosopher. The Stanford Encyclopedia says the donkey example does not appear in his writings and is likely a later parody; ancient antecedents are also acknowledged. The concern is title fit, not a proven medieval invention date or a denial of ancient antecedents.

Suggested repair: Broaden the title to philosophical images. If retaining a chronological restriction, choose an example with an unambiguous ancient source.

Source: [https://plato.stanford.edu/entries/buridan/](https://plato.stanford.edu/entries/buridan/) — Stanford Encyclopedia of Philosophy entry consulted for the relevant philosopher and historical context.

## ROOT-MYTHOLOGY-006: The Cottingley clue overstates the joint admission about all five photographs.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-082 — Famous Frauds and Media Myths / Kuulsad pettused ja meediamüüdid.
- Questions: built-in-mythology-religion-philosophy-playable-corpus-244.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:410](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-playable-corpus-244).

The prompt describes five photographs admitted to use paper cut-outs, and the explanation treats the creators as jointly admitting that account. The museum preserves Elsie’s admission about all five but explicitly says Frances maintained that the fifth was genuine. Its research also distinguishes the fifth image’s double exposure from the first four cut-out images. This does not support a supernatural explanation for the fifth; it makes the blanket admission and technique wording inaccurate.

Suggested repair: Ask about the photographic series exposed as a fairy hoax, without asserting that both creators admitted the same technique for every image. In the explanation distinguish the four jointly admitted cut-out pictures and the later disagreement over the fifth.

Source: [https://blog.scienceandmediamuseum.org.uk/the-story-of-the-cottingley-fairies-shows-that-image-manipulation-is-nothing-new/](https://blog.scienceandmediamuseum.org.uk/the-story-of-the-cottingley-fairies-shows-that-image-manipulation-is-nothing-new/) — Museum account and preserved 1983 letter: Elsie revealed all five were faked; Frances continued to maintain the fifth was genuine.

Source: [https://journal.sciencemuseum.ac.uk/article/power-at-play-in-paranormal-history/](https://journal.sciencemuseum.ac.uk/article/power-at-play-in-paranormal-history/) — Museum research distinguishes double exposure in the fifth image from hand-drawn cut-outs in the first four.

## ROOT-MYTHOLOGY-007: Two Estonian calendar prompts ask for an English month name but record only the Estonian name.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-089 — Ancient Rome on the Modern Calendar / Vana-Rooma tänapäeva kalendris.
- Questions: built-in-mythology-religion-philosophy-playable-corpus-276, built-in-mythology-religion-philosophy-playable-corpus-280.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:442](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-playable-corpus-276).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:446](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-playable-corpus-280).

The Estonian March and February prompts explicitly ask for the English name. Their responses are märts and veebruar, with no March or February variants. The explanations mention English etymology, but the answer guidance does not match the requested language.

Suggested repair: Ask which month generally, accepting the localized month name, or retain the English-name request and provide March and February as the English responses and accepted Estonian-play variants.

## ROOT-MYTHOLOGY-008: The adiós answer is given as a Dios in the prompt.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-092 — Sacred Histories of Everyday Greetings / Igapäevaste tervituste püha ajalugu.
- Questions: built-in-mythology-religion-philosophy-playable-corpus-292.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:458](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-playable-corpus-292).

Both prompts print a Dios while accepting adios as a response. Joining the printed words produces the accepted answer without knowing a Spanish farewell. This is especially weak for the Hard category.

Example: Remove the space from the printed a Dios; the result is the accepted variant adios.

Suggested repair: Ask which Spanish farewell literally invokes God without printing its component words, or replace it with a greeting having an independent cultural identifying fact.

## ROOT-MYTHOLOGY-009: Four named-target questions accept descriptive restatements or a translated variant supplied by the prompt.

- Concern: Question independence and giveaways; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-101 — Roman Gods Through Familiar Associations / Rooma jumalad tuntud seoste järgi; built-in-mythology-religion-philosophy-set-110 — Objects Used in Worship / Jumalateenistustel kasutatavad esemed; built-in-mythology-religion-philosophy-set-112 — Faith at the Table / Usk söögilauas; built-in-mythology-religion-philosophy-set-119 — Latin Phrases in Everyday Use / Ladinakeelsed väljendid igapäevaelus.
- Questions: built-in-mythology-religion-philosophy-easy-expansion-005, built-in-mythology-religion-philosophy-easy-expansion-050, built-in-mythology-religion-philosophy-easy-expansion-056, built-in-mythology-religion-philosophy-easy-expansion-092.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:506](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-easy-expansion-005).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:551](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-easy-expansion-050).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:557](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-easy-expansion-056).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:593](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-easy-expansion-092).

Vesta accepts Roman goddess of the hearth, although the prompt already identifies the Roman goddess of home and hearth. Mezuzah accepts Jewish doorpost scroll, largely restating the supplied parchment-and-doorpost description. Halal asks for an Arabic word but accepts permitted food, the condition supplied by the prompt. The Estonian tabula rasa prompt explicitly supplies puhas leht in inflected form and accepts that phrase while asking for Latin. These weaken the host's stated answer boundary by allowing supplied descriptions rather than the requested name or language. This finding does not reject established translated phrase aliases generally; that policy question is recorded separately.

Suggested repair: For these four prompts, align host guidance with the requested name or language: remove descriptive restatements already supplied, or rewrite the question to require another identifying fact. Keep genuine spellings and established localized names. Review broader translated phrase aliases separately as an accessibility policy.

## ROOT-MYTHOLOGY-010: Charon’s underworld crossing does not uniquely identify the Styx.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: high; assessment: review finding.
- Categories: built-in-mythology-religion-philosophy-set-114 — Greek Myths and Beliefs / Kreeka müüdid ja uskumused.
- Questions: built-in-mythology-religion-philosophy-easy-expansion-066.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:567](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-easy-expansion-066).

The clue asks which Greek underworld river Charon crosses and accepts only Styx. Classical sources also depict his ferry on Acheron. Pausanias’s description of Polygnotus’s underworld painting explicitly identifies the river as Acheron and then names the ferryman Charon, so Acheron is a valid alternative to this unqualified prompt.

Suggested repair: Add a distinguishing Styx fact, such as the gods’ binding oaths by its waters, or accept Acheron and explain the differing traditions.

Source: [https://www.theoi.com/Khthonios/Kharon.html](https://www.theoi.com/Khthonios/Kharon.html) — Read hosted primary-text extract: Pausanias, Description of Greece10.28.1ff, identifies Acheron and Charon together.

## ROOT-MYTHOLOGY-011: The World Vision clue supplies a generic Christian-aid mission rather than a distinguishing identity.

- Concern: Facts, ambiguity and localization; severity: medium; confidence: medium; assessment: editorial judgment.
- Categories: built-in-mythology-religion-philosophy-set-099 — Religion and Symbols in Humanitarian Work / Religioon ja sümbolid humanitaartöös.
- Questions: built-in-mythology-religion-philosophy-playable-corpus-329.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:495](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-playable-corpus-329).

Christian relief, development and advocacy with children, families and communities describes a broad class of charities. Compassion International, for example, describes Christian child development with family/community support, disaster relief and child advocacy. A player is being asked to infer a brand from a widely shared mission; no founder, location, date or distinctive programme narrows it to World Vision.

Suggested repair: Add a verified distinguishing fact, for example World Vision’s founding by Bob Pierce in1950, while keeping the broad humanitarian category.

Source: [https://www.compassion.com/child-development-model.htm/](https://www.compassion.com/child-development-model.htm/) — Official alternative describes church-based child development tailored to family and community, mother support and disaster relief.

Source: [https://www.compassion.com/about-us/](https://www.compassion.com/about-us/) — Official alternative describes child protection and advocacy.

Source: [https://www.worldvision.org/charitable-giving-news-stories/what-is-world-vision](https://www.worldvision.org/charitable-giving-news-stories/what-is-world-vision) — Official founding history: Bob Pierce, incorporation22September1950.

## ROOT-MYTHOLOGY-012: Clarify whether translated meanings are intentionally valid in the Latin-phrase category.

- Concern: Facts, ambiguity and localization; severity: low; confidence: editorial; assessment: editorial judgment.
- Categories: built-in-mythology-religion-philosophy-set-119 — Latin Phrases in Everyday Use / Ladinakeelsed väljendid igapäevaelus.
- Questions: built-in-mythology-religion-philosophy-easy-expansion-091, built-in-mythology-religion-philosophy-easy-expansion-093, built-in-mythology-religion-philosophy-easy-expansion-095.
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:592](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-easy-expansion-091).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:594](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-easy-expansion-093).
- Location: [content/generated/12-mythology-religion-philosophy.en-et.csv:596](../../../content/generated/12-mythology-religion-philosophy.en-et.csv) (built-in-mythology-religion-philosophy-easy-expansion-095).

The prompts ask for Latin phrases while accepted variants include seize the day, existing state of affairs and in good faith, with localized Estonian equivalents. These are legitimate translated meanings and may support Easy accessibility; they are not inherently bad trivia or verbatim giveaways. The unresolved editorial question is whether naming Latin is actually required by the prompt and host guidance.

Suggested repair: Decide the intended answer-language boundary. If translated meanings are intentionally acceptable, make that clear in the category or host guidance. If naming Latin is required, keep the accepted variants within that requirement. Do not remove useful translated aliases merely because they make Easy content more accessible.

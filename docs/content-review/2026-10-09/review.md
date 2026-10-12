# Full content review — 9 October 2026

The complete frozen library was read: **11,374 bilingual questions in 2,240 five-question board categories and 174 Finals**. The review recorded **304 findings affecting 311 categories**, including editorial judgments and four distribution/provenance findings. These counts are findings, not a count of independently confirmed false facts.

The library needs repairs before it can be described as consistently independent, factually sound and correctly attributed. Many broad categories work well. The recurring weakness is that uniqueness of subjects does not establish independence of questions: another question or its publicly revealed explanation can give away an answer, and a small known answer pool can collapse through elimination.

## Findings by concern

| Concern | Findings |
| --- | ---: |
| Attribution and provenance | 4 |
| Category coherence | 30 |
| Difficulty calibration | 4 |
| Facts, ambiguity and localization | 138 |
| Question independence and giveaways | 128 |

The [complete repair backlog](findings.md) contains each finding's category, question IDs, locations, rationale, confidence, source observations and suggested repair. [findings.json](findings.json) provides the same findings in structured form. A category marked clean in [coverage.json](coverage.json) means no material issue was identified during this review; it is not a guarantee that every fact or difficulty judgment is correct.

6 factual candidates remain explicitly marked **verification pending** (B-049, B-051, B-052, B-053, B-054, B-080). Do not make factual corrections to those candidates without primary confirmation. Difficulty estimates and some ambiguity/coherence judgments are editorial rather than verified factual errors.

## Representative issues

- **Closed answer pools:** the Baltic-capitals, Nordic-country, inner/outer-planet, three Greek architectural orders and three branches of government sets can become solvable by elimination. A question needs its own identifying knowledge even after the other answers are known.
- **Answers in another question:** Armstrong's explanation names Apollo, the Idunn/Bragi pair names the other answer, and several sets repeat answers in public explanations. Explanations matter because PublicClue displays them after reveal.
- **Answers in the current prompt or category title:** an Estonia football clue already includes the accepted A. Le Coq Arena variant; translated literary-title clues reproduce the accepted original titles. These are direct giveaways rather than accessible trivia.
- **Incorrect facts:** the Vilsandi clue calls it Estonia's oldest national park, although [Lahemaa was founded in 1971](https://kaitsealad.ee/en/news/lahemaa-national-park-celebrates-its-55th-anniversary). An ESTCube-2 explanation describes completed orbital experiments even though the [university says the satellite never separated from the launcher](https://kosmos.ut.ee/en/news/ut-tartu-observatory-develop-estcube-3-satellite-support-european-space-agency).
- **Ambiguous correct answers:** an armless Greek statue in the Louvre also describes [the Winged Victory](https://www.louvre.fr/en/explore/the-palace/a-stairway-to-victory); the multinational lottery description fits Eurojackpot as well as EuroMillions. Specific distinguishing facts are needed.
- **Translation and scoring guidance:** the orange fruit/colour pun becomes false in Estonian (apelsin versus oranž); several prompts request a person or animal while the recorded answer is a full airport or film title. Missing established Estonian titles affect host guidance; the game uses human judgment rather than automatic fuzzy rejection.
- **Difficulty:** some Hard categories rely on everyday definitions, word parts already supplied, or simple arithmetic on numbers printed in the prompt. These are calibration judgments. Familiar trivia can be good Easy content; no rule requires every question to be obscure.

## Attribution and provenance

The CSV and evidence source fields agree with each other and the seed for all 11,374 questions. That verifies metadata consistency, not whether the cited page supports the claim: the Tartu Father and Son clue, for example, cites a frozen Wikipedia article about a different sculpture in Seattle.

The public game shows source titles; the content editor shows source URLs and recorded licence labels. However, forge.config.ts excludes the content notices and CC BY-SA licence file from the packaged resources. The seed also omits the recorded OpenTDB inspiration identifiers for all 1,200 inspired questions. Two Adult entries contain the placeholder licence “source”; another entry is classified compatibleOpen despite a recorded CC BY-NC-SA source.

These require a source/derivation audit and packaged notices, with credit, licence links and modification information where applicable. Independently written factual summaries and adaptations must be distinguished. A source licence does not automatically licence uncopyrightable facts, and the content's share-alike obligations do not automatically apply to the application's entire code. See the [CC BY-SA terms](https://creativecommons.org/licenses/by-sa/4.0/) and [attribution guidance](https://wiki.creativecommons.org/wiki/Recommended_practices_for_attribution). No new installer was inspected in this review.

## Preventing the Baltic-independence-date problem

1. **Review every five-question set together.** For each question ask: after any subset of the other four questions and their explanations has been revealed, does this still require its own knowledge? Pay particular attention to the user's two-answers-reveal-the-third example. Review both languages independently and arbitrary play order.
2. **Detect literal giveaways.** Compare responses and accepted variants against their own prompt/title and all other prompts and public explanations. Check all 20 ordered sibling pairs. Use this as a review flag, with word boundaries and human disambiguation, rather than rejecting incidental mentions automatically.
3. **Review shared fact families and finite pools.** Five different country subject keys can still repeat the same national-date template. Record review evidence for repeated relationships and small answer pools; retain at most one interchangeable date clue in a Baltic set and use independent geography, culture, people, language or history facts for the rest.
4. **Calibrate point tiers and category difficulty separately.** Review whether higher tiers involve additional identifying knowledge and whether the whole set fits its selected difficulty. Validate with representative players before treating subjective difficulty estimates as established.
5. **Bind source review to the exact wording.** Validate the cited entity, explanation, translation, alternatives and derivation, then retain that decision with content hashes. A reachable URL and five unique subject keys are insufficient.

The present playability validators check structural completeness, tiers, duplicate identities and distinct subject keys. The expansion answer-diversity check requires at least four answer entities. They do not establish semantic independence or test public explanations for sibling-answer disclosure. New checks should supplement whole-set review, not turn broad casual categories into narrow specialist categories.

## Coverage and verification

| Batch | Categories read | Questions read | Categories with findings |
| --- | ---: | ---: | ---: |
| 01-history | 170 | 850 | 20 |
| 02-geography | 170 | 850 | 7 |
| 03-science-nature | 170 | 850 | 16 |
| 04-literature-language | 170 | 850 | 13 |
| 05-art-architecture | 170 | 850 | 18 |
| 06-music | 170 | 850 | 25 |
| 07-film-television | 170 | 850 | 11 |
| 08-sports-games | 170 | 850 | 38 |
| 09-food-drink | 170 | 850 | 13 |
| 10-technology-inventions | 170 | 850 | 24 |
| 11-politics-economics-society | 170 | 850 | 13 |
| 12-mythology-religion-philosophy | 170 | 850 | 30 |
| 13-finals | 174 | 174 | 8 |
| 14-adult | 100 | 500 | 37 |
| 15-estonia | 100 | 500 | 38 |

Coverage validation matches every reviewed clue ID to the frozen category and rejects missing IDs, overlapping assignments, unknown findings or changed inputs. All generated CSV, evidence JSONL and snapshot hashes remain unchanged. Source-consistency audit: zero CSV/evidence mismatches and zero seed citation mismatches. External sources were checked selectively for factual disputes and alternatives; this review does not claim independent web verification of all 11,374 facts.

The [input manifest](snapshot-manifest.json), [metadata audit](metadata-audit.json), [coverage ledger](coverage.json) and [artifact validation](artifact-validation.json) make the scope reviewable. No production questions, evidence, seed or runtime code were changed as part of this review. Existing expansion changes remain untouched. Repair recommendations and prevention checks have not yet been implemented.

Independent spot-checks are retained in [root-finding checks](independent-root-spotcheck.json) and [attribution checks](independent-attribution-spotcheck.json). Review feedback corrected the Vilsandi repair to preserve its island category, qualified the history of Buridan's-ass illustration, separated translated-answer policy from direct prompt giveaways, and strengthened the coverage/seed verification guards.

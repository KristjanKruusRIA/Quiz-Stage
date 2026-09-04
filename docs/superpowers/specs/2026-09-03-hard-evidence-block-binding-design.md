# Hard 089–100 Exact Evidence-Block Binding Design

## 1. Status and relationship to the corpus overhaul

This design replaces only the rejected free-form source matcher for Mythology Hard sets 089–100. It supplements `docs/superpowers/specs/2026-08-28-playable-medium-hard-corpus-overhaul-design.md`; all player-experience, bilingual, difficulty, collision, inventory, Adult/Estonia, Windows-only, and frozen-Easy constraints from that design remain authoritative.

Hard 078–088 remains accepted at local commit `fbfc325d39bdc3060ec87dbcf426bd8b83089266`. This design does not authorize a push, production-bank edit, Easy edit, Adult/Estonia edit, Linux work, seed rebuild, or release-artifact rebuild.

## 2. Problem

Three independently reviewed repair rounds showed that regular expressions over free-form rendered text cannot honestly prove natural-language entailment:

- deletion-based negatives were tautological;
- keyword denial filters overfit known fixtures and rejected unrelated valid text;
- sentence subwindows accepted positive sentences explicitly denied by adjacent sentences;
- broad text extraction leaked gallery and reference content;
- exact phrase alternatives sometimes omitted a subject, relation, object, chronology, attribution, or qualification required by the proposition; and
- changing the matcher repeatedly made RED evidence difficult to preserve and reproduce.

A fourth regex repair is prohibited. The replacement must distinguish what deterministic automation can prove from what requires independent editorial judgment.

## 3. Chosen approach

Use exact semantic-block evidence binding.

Automation proves source identity, provider scope, visibility, exact approved evidence-block presence, ordering, collision boundaries, and tamper resistance. It does not claim to infer truth from arbitrary prose. Independent full and bilingual/target-audience reviewers approve whether each claim is actually entailed by its live evidence blocks and remains fair, natural, playable trivia.

Provider-specific subject/predicate/object parsers were rejected because they would require dozens of one-off natural-language parsers. An LLM or NLI build-time judge was rejected because it would add nondeterminism, network/model dependencies, cost, and an unstable release boundary.

## 4. Evidence record

Each of the 180 Hard 089–100 propositions has one immutable evidence record containing:

- stable set, tier, and proposition index;
- exact claim text and SHA-256 of its normalized UTF-8 form;
- exact source ID, requested URL, final URL, canonical identity, provider, article kind, publisher, retrieval date, and honest license/copyright classification;
- a provider-specific semantic scope descriptor;
- one exact whole semantic block, or an explicitly ordered list of whole blocks when the complete proposition cannot be supported by one block;
- SHA-256 of every normalized whole block;
- a short reviewer-facing excerpt for each block; and
- explicit full-review and bilingual/target-audience entailment verdicts.

The evidence artifacts remain task-local and ignored. The production game receives the reviewed clues, responses, explanations, source identity, and stable keys; it does not ship source-page blocks.

## 5. Provider scopes and extraction

Extraction returns an ordered inventory of whole semantic blocks. A block is a visible paragraph, list item, definition item, or table row after normalization. Sentence fragments and arbitrary one-to-five-sentence windows are not matchable units.

Before block collection, extraction removes:

- `script`, `style`, `template`, `noscript`, hidden nodes, `aria-hidden` nodes, and inline/computed hidden content;
- navigation, headers, footers, sidebars, infobox chrome, tables of contents, edit controls, metadata and maintenance banners;
- references, reflists, notes, bibliography, external-link and further-reading sections;
- galleries, gallery boxes, image captions, figures and provider-specific gallery structures; and
- parser/debug attributes and Unicode formatting controls that are not visible semantic content.

Provider scopes fail closed:

- Wikipedia uses the validated main article-content container after structural cleanup.
- Wiktionary uses the exact requested language heading and only its following siblings up to the next same-level language heading.
- Official institutional pages use a validated article-body container and provider identity from the final/canonical page.

Synthetic DOM fixtures must prove that hidden, navigation, gallery, caption, reference, other-language, and debug sentinels never enter the extracted block inventory. Legitimate adjacent blocks and table rows must remain available without being fused.

## 6. Exact binding and failure behavior

A live evidence check passes only when every approved normalized block SHA-256 is present in order within the validated provider scope. There is no substring regex, sentence subwindow, lookahead, automatic distance widening, denial vocabulary, or page-wide answer-token assumption.

Single-block evidence binds one whole block. Multi-block evidence binds an ordered list and must be used only when independent review confirms that the blocks jointly support one proposition without relying on unrelated intervening prose.

Any source edit, missing block, reordered block, identity mismatch, provider mismatch, article-kind mismatch, license/copyright mismatch, hidden-content dependency, or extraction drift fails closed. Repair requires an explicit evidence refresh, new hashes, and fresh review; the matcher never widens automatically.

## 7. Mutation and review contract

Each proposition keeps one hand-authored controlled semantic mutation that changes exactly one material element: subject, relation, object, date/chronology, attribution, or uncertainty/qualification. The mutation retains the other claim elements and is shown beside the approved live block during review.

Automation verifies that:

- claim and block digests are immutable and recomputable;
- a mutated claim does not equal the approved claim digest;
- altered, hidden, gallery, reference, wrong-language, wrong-provider, or wrong-order evidence cannot satisfy the block binding; and
- all 180 propositions and 180 controlled mutations are present with complete taxonomy coverage.

Automation must not report that digest inequality proves semantic falsehood. Full and bilingual/target-audience reviewers own the entailment verdict for every approved claim/block pairing and confirm that each mutation is materially false for the intended reason.

## 8. Content-specific requirements

Hard 089–094 retains its approved non-evidence payload while replacing the rejected evidence implementation. Its source-entailment wording may change only when the exact live blocks require a more precise claim, and every such change must be listed and independently reviewed.

Hard 095–100 additionally requires:

- replace 095:2 Notre Dame with `Uppsala University / Uppsala ülikool`, using the first-party Uppsala history page and the approved 1477/Jakob Ulvsson/Sixtus IV/clerical-education route;
- remove unauthenticated `azhar.swlt.ae`; use a stable authenticated HTML source when available, otherwise an honest compatible HTML source with narrower claims and no false official provenance;
- remove `Natalia` and `Natalja` from 097:4 and make the intended Natalie spelling constructible in both languages;
- bind the infinity guard to 091:1;
- preserve the approved 095 and 099 orders, short Al-Azhar response, symmetric Galileo event labels, and 090/098/100 playtest watches; and
- prove complete exact/title/fact/subject/semantic/source-ID/source-route/within/cross-half collisions against the current 7,114-question / 14,228-language-owner accepted authority, including Adult and Estonia as read-only authorities.

## 9. TDD and task sequence

1. Preserve rejected FIX3 contract, regression, reports, and all three review reports by exact SHA-256.
2. Write a new architecture regression before implementation. Against FIX3 it must fail for the regex schema, denial-wrapper acceptance, valid-wrapper rejection, gallery/reference leakage, under-entailing routes, wrong provider/language scope, block-hash mutation, unordered multi-block evidence, and unreproducible binding state.
3. Implement the reusable exact-block schema and extractor only inside ignored Task 6 evidence artifacts.
4. Rebuild 089–094 with 30 routes, 90 claims, 90 exact block bindings, 90 controlled mutations, complete synthetic extraction coverage, and unchanged non-evidence payload.
5. Obtain an independent full review of the complete 089–094 artifact. Any Critical or Important finding rejects it.
6. Build 095–100 with the same approved architecture and content-specific replacements.
7. Obtain an independent full review of the complete 095–100 artifact.
8. Build one combined 089–100 preflight with exactly 12 sets, 60 rows, 180 propositions, 180 proposition-binding records, at least 180 block digests, and complete cross-slate collision axes.
9. Obtain both full and bilingual/target-audience approval of the exact combined candidate.
10. Only then render the production bank, run production reviews and Windows-only branch-wide verification, and make the authorized local bank commit. Do not push without a new explicit instruction.

## 10. Acceptance criteria

The evidence architecture is accepted only when fresh evidence proves:

- exact 12 sets / 60 rows / 180 propositions / 180 proposition-binding records, at least 180 block digests, and all six mutation taxonomies;
- every source route, final/canonical identity, provider, article kind, publisher, and license/copyright classification;
- exact whole-block SHA-256 presence and order for all 180 propositions;
- zero hidden, navigation, gallery, caption, reference, other-language, parser/debug, or CSS-hidden leakage;
- all deliberate bad identity, scope, block, order, visibility, and mutation controls fail closed;
- 089–094 non-evidence payload is preserved except explicitly reviewed source-entailment wording;
- the Uppsala, Al-Azhar, Natalie, infinity, ramp, response, and playtest requirements are satisfied;
- all collision axes are zero against the current accepted corpus while Easy, Adult, and Estonia remain read-only;
- independent full and bilingual/target-audience reviewers approve the final combined candidate; and
- no tracked production edit occurs before that approval.

Exact block hashes are intentionally sensitive to provider edits. That brittleness is a safety property: source drift becomes an explicit refresh and review event instead of silently widening a matcher or accepting unsupported prose.

# Hard 089–100 Exact Evidence-Block Binding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Replace the rejected regex evidence checks for Mythology Hard 089–100 with deterministic whole-block source bindings, obtain independent full and bilingual approval, render the approved 60-row bank, and verify it on Windows without changing Easy, Adult, or Estonia.

**Architecture:** Task-local ignored evidence modules extract provider-scoped visible semantic blocks and bind exact normalized SHA-256 values. Automation proves source identity, scope, visibility, ordering, collision boundaries, and tamper resistance; independent reviewers approve claim entailment and target-audience playability. Only the final approved bank and canonical plan/spec are tracked.

**Tech Stack:** TypeScript 6, Node.js 24, tsx, jsdom, repository playability types/validators, Vitest/content tests, ESLint, PowerShell, Git for Windows.

**Spec:** docs/superpowers/specs/2026-09-03-hard-evidence-block-binding-design.md

## Global Constraints

- Work only in E:\git\jeopardy\.worktrees\playable-packs-09-12 on feat/playable-packs-09-12.
- Windows only; do not perform or repair Linux work.
- Easy is frozen and read-only. Adult and Estonia are read-only collision/preservation authorities.
- Fresh origin/main (452f87eb10560907575b75c1b31484ff270cfe2f) and Adult/Estonia tip (ae258202812b93723fa06802d81593ead52dfa1b) are ancestors of this branch; recheck before final verification.
- Accepted content authority is 3,174 generated + 3,940 authored = 7,114 questions / 14,228 language-qualified owners until an approved production edit changes it.
- Hard 078–088 remains accepted at fbfc325d39bdc3060ec87dbcf426bd8b83089266; do not edit it.
- All preflight implementation, snapshots, caches, reports, and review packages stay under .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/ and remain ignored.
- Subagents may append to .learnings/LEARNINGS.md and .learnings/ERRORS.md. They may not edit tracked files unless their task explicitly names the final production bank.
- Never claim that hash mismatch proves semantic falsehood. Full and bilingual reviewers own claim-to-block entailment.
- Do not edit resources/content/seed.sqlite, canonical release reports/caches, generated/evidence release artifacts, shared production infrastructure, or remotes.
- Do not push. The only new content commit authorized by this plan is the final reviewed scripts/content/playability/banks/packs09to12.ts bank commit.

---

### Task 1: Build the reusable exact-block evidence foundation

**Files:**
- Create: .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-exact-block-evidence.ts
- Create: .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-exact-block-evidence-regression.ts
- Create: .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-exact-block-evidence-report.md
- Preserve: rejected FIX3 contract/regression/source report/author report and all three review reports as hash-named immutable copies in the same ignored directory.

**Interfaces:**
- Produces:

~~~ts
export type EvidenceProvider = 'wikipedia' | 'wiktionary' | 'official-institution';
export type EvidenceScope =
  | Readonly<{ kind: 'wiki-article' }>
  | Readonly<{ kind: 'wiktionary-language'; headingId: string; language: string }>
  | Readonly<{ kind: 'institution-article'; selector: string }>;

export type EvidenceBlockBinding = Readonly<{
  sha256: string;
  reviewExcerpt: string;
}>;

export type PropositionEvidence = Readonly<{
  id: string;
  claim: string;
  claimSha256: string;
  taxonomy: 'subject' | 'relation' | 'object' | 'date/chronology' | 'attribution' | 'uncertainty/qualification';
  controlledMutation: string;
  controlledMutationSha256: string;
  blocks: readonly EvidenceBlockBinding[];
}>;

export type SourceIdentity = Readonly<{
  sourceId: string;
  requestedUrl: string;
  canonicalIdentity: string;
  provider: EvidenceProvider;
  articleKind: string;
  publisher: string;
  license: string;
  scope: EvidenceScope;
}>;

export type FetchedEvidencePage = Readonly<{
  requestedUrl: string;
  finalUrl: string;
  canonicalUrl: string;
  status: number;
  title: string;
  html: string;
}>;

export type EvidenceFailure = Readonly<{
  kind: 'http' | 'provider' | 'article-kind' | 'canonical' | 'publisher' | 'license' | 'scope' | 'block';
  expected: string;
  actual: string;
}>;

export const normalizeEvidenceText: (value: string) => string;
export const evidenceSha256: (value: string) => string;
export const extractSemanticBlocks: (html: string, scope: EvidenceScope) => readonly string[];
export const findOrderedBlockBindings: (
  blocks: readonly string[],
  expected: readonly EvidenceBlockBinding[],
) => Readonly<{ matched: boolean; indexes: readonly number[] }>;
export const auditEvidenceIdentity: (
  expected: SourceIdentity,
  fetched: FetchedEvidencePage,
) => readonly EvidenceFailure[];
~~~

- Consumes no production files and exports no runtime Electron API.

- [ ] **Step 1: Preserve the rejected boundary**

Verify FIX3 contract 570F4B688564E56AA2378CAA0C6607359DB7DCC30082C31ED66BC327D62BEF42, regression C1BFF0179102511534255ABF5511970D1F3877C9E00D533DA776A67149D01382, source report 0F1EECB71DF6D35BC0BF321B8CAD552937ADFB2A79358901FF0A513A14FAAE3C, author report 3552635EC8767B72F46F8D37B3615C31996908395DC556876C05DFEB22C2F2DC, and final review 6399BB29023DAEB88612FD6F2F9325CF2B84D9800B7643CA7B6C37E52EF94264. Preserve them with apply_patch at these exact names and recompute every copy before proceeding:

- task-6-mythology-hard-089-094-source-contracts-fix3-baseline-570f4b.ts
- task-6-mythology-hard-089-094-source-contract-fix3-regression-fix3-baseline-c1bff0.ts
- task-6-mythology-hard-089-094-source-contracts-report-fix3-baseline-0f1eec.md
- task-6-mythology-hard-089-094-source-contract-fix3-author-report-fix3-baseline-355263.md
- task-6-mythology-hard-089-094-source-contract-fix3-review-fix3-baseline-6399bb.md

- [ ] **Step 2: Write the failing architecture regression**

The regression dynamically imports a target module path. It requires the exact interfaces above and exercises these literal cases:

~~~ts
const denialWrappers = [
  'The following statement is false. May was named for the Greek goddess Maia.',
  'May was named for the Greek goddess Maia. The preceding statement is false.',
];

const extractionSentinels = {
  hidden: 'HIDDEN_SENTINEL',
  navigation: 'NAV_SENTINEL',
  gallery: 'GALLERY_SENTINEL',
  reference: 'REFERENCE_SENTINEL',
  otherLanguage: 'OTHER_LANGUAGE_SENTINEL',
};
~~~

It also tests exact whole-block matching, altered block-hash rejection, ordered multi-block matching, wrong language scope, wrong provider/canonical identity, hidden/CSS-hidden/reference/gallery/caption removal, and preservation of adjacent legitimate paragraphs/table rows.

- [ ] **Step 3: Run RED against preserved FIX3**

~~~powershell
npx tsx .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-exact-block-evidence-regression.ts .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-mythology-hard-089-094-source-contracts-fix3-baseline-570f4b.ts
~~~

Expected: exit 1 with explicit missing exact-block schema/extractor failures plus denial-wrapper, gallery/reference, scope, and block-order failures. Syntax, path, or CommonJS top-level-await errors do not count as RED. Record this literal command in the report.

- [ ] **Step 4: Implement the minimal exact-block foundation**

Use JSDOM only. Normalize Unicode to NFKC, remove Unicode format controls, collapse visible whitespace, and hash normalized UTF-8 bytes. Extract whole p, li, dd, dt, and tr blocks without fusing siblings. Implement provider scopes and remove every selector class named in the spec. Exact bindings compare hashes and preserve order; they never scan substrings or sentence windows.

- [ ] **Step 5: Run foundation GREEN checks**

~~~powershell
npx tsx .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-exact-block-evidence-regression.ts
npx eslint .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-exact-block-evidence.ts .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-exact-block-evidence-regression.ts
git diff --check
git diff --cached --check
git status --short
~~~

Expected: regression and lint exit 0; all synthetic sentinels are excluded; ordered binding tests pass; no tracked/index change exists; only .learnings/ may be untracked.

- [ ] **Step 6: Record hash-bound evidence and request fresh review**

Write exact RED/GREEN output, interface inventory, selector coverage, hashes, and concerns to the report. Dispatch a fresh read-only reviewer. Any Critical/Important finding returns to the same implementer for at most three bounded fix rounds; ignored evidence is never committed.

---

### Task 2: Rebuild Hard 089–094 on exact block bindings

**Files:**
- Create: .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-mythology-hard-089-094-exact-block-contract.ts
- Create: .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-mythology-hard-089-094-exact-block-regression.ts
- Create: .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-mythology-hard-089-094-exact-block-report.md
- Consume: approved Task 1 foundation hash and accepted non-evidence payload from rejected FIX3.

**Interfaces:**
- Produces MYTHOLOGY_HARD_089_094_EXACT_BLOCK_CONTRACTS, exactly 30 rows and 90 PropositionEvidence records.
- Produces audit inventory for 30 routes, 90 claims, 90 proposition-binding records, at least 90 block digests, 90 mutations, six taxonomies, source identities, extraction leakage, authority/collisions, and non-evidence parity.

- [ ] **Step 1: Write the 089–094 failing regression**

Require exact 6 sets / 30 rows / 90 claims / 90 proposition-binding records / at least 90 block digests / 90 mutations. Bind the accepted non-evidence payload hash, Task 1 foundation hash, accepted HEAD, authority inventory, both playtest watches, and all prior response/variant/order guards. Require the four rejected under-entailment routes and all denial/extraction probes to fail on preserved FIX3.

- [ ] **Step 2: Run RED against preserved FIX3**

~~~powershell
npx tsx .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-mythology-hard-089-094-exact-block-regression.ts .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-mythology-hard-089-094-source-contracts-fix3-baseline-570f4b.ts
~~~

Expected: exit 1 for missing block records/hashes, under-entailing 090:2 C2/C3, 093:5 C3, 094:1 C3, and extraction failures—not setup errors. Record this literal command.

- [ ] **Step 3: Author exact source records route by route**

For each route, fetch through the approved foundation, inspect the scoped whole-block inventory, bind the minimal whole block(s) that fully support each claim, and store normalized SHA-256 plus a short excerpt. If no block fully supports a claim, narrow the proposition and list the exact wording delta; do not combine unrelated blocks or widen matching.

- [ ] **Step 4: Author all 90 controlled mutations**

Each mutation changes exactly one material claim element and preserves all other elements. Record taxonomy and both claim digests. The audit checks completeness and immutability only; the reviewer adjudicates whether the mutation is genuinely false.

- [ ] **Step 5: Run offline, live, collision, and parity GREEN checks**

~~~powershell
npx tsx .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-mythology-hard-089-094-exact-block-regression.ts
npx tsx .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-mythology-hard-089-094-exact-block-contract.ts
npx eslint .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-exact-block-evidence.ts .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-mythology-hard-089-094-exact-block-contract.ts .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-mythology-hard-089-094-exact-block-regression.ts
~~~

Expected: 30/30 live routes, 90/90 proposition bindings with every ordered block digest present, 90/90 mutations, all identity/extraction/collision arrays zero, exact non-evidence parity, and lint exit 0.

- [ ] **Step 6: Independently review every claim/block/mutation triplet**

Dispatch a fresh read-only full reviewer with complete hash-bound artifacts and live replay instructions. It inspects all 90 triplets and target-audience fairness. Approval requires Critical 0 / Important 0. Store the review report and approval hash in the SDD ledger; do not commit ignored artifacts.

---

### Task 3: Build and approve Hard 095–100 exact block contracts

**Files:**
- Create: .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-mythology-hard-095-100-exact-block-contract.ts
- Create: .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-mythology-hard-095-100-exact-block-regression.ts
- Create: .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-mythology-hard-095-100-exact-block-report.md
- Consume: approved Task 1/2 hashes; baseline 095–100 contract SHA 99ADD1081C8091031823D77249B890203F5B44CB8ED73FA58BD86C29529C8BAF.

**Interfaces:**
- Produces MYTHOLOGY_HARD_095_100_EXACT_BLOCK_CONTRACTS, exactly 30 rows and 90 proposition records.
- Exposes all forms, titles, fact/subject/semantic keys, source IDs/routes, and block identities needed by the combined audit.

- [ ] **Step 1: Write and run the 095–100 behavioral RED**

Before changing the candidate, require exact-block records, 90 controlled mutations, provider/article/license/scope validation, complete cross-half fields, Uppsala replacement, authenticated/honest Al-Azhar route, Natalie-only spelling guard, and infinity slot 091:1. Run against exact 99ADD... baseline and expect exit 1 for those missing behaviors.

- [ ] **Step 2: Replace 095:2 with Uppsala**

Use https://www.uu.se/en/about-uu/history/summary, final/canonical identity, publisher Uppsala University, article kind institution-history, and honest citation-only/no-open-license metadata. Bind whole block(s) supporting Jakob Ulvsson, Sixtus IV permission in 1477, clerical education, and early theology. Preserve q2 and use subject university:uppsala plus fact mythology-hard:095:2:uppsala-1477-archbishop-papal-permission.

- [ ] **Step 3: Repair Al-Azhar and Natalie**

Freshly test the institution-controlled Al-Azhar HTML route. If final/canonical/provider identity is unstable, use a direct compatible HTML article with honest non-official metadata and narrow Cairo/Fatimid/learning claims; do not add PDF tooling or claim uninterrupted university status. Remove Natalia/Natalja from 097:4 and bind a block that makes Natalie constructible in both languages.

- [ ] **Step 4: Author remaining exact blocks and controlled mutations**

Bind 30/30 routes, 90/90 proposition records, and 90/90 isolated mutations. Preserve approved 095/099 orders, short Al-Azhar, symmetric Galileo labels, corrected infinity guard, and 098/100 watches. List every delta outside 095:2, 095:5, 097:4, evidence metadata, and stale guards.

- [ ] **Step 5: Run complete half-corpus GREEN checks**

Run the regression, live contract, scoped ESLint, accepted-authority collisions, cross-half collisions against approved 089–094, hashes, diff/index, and status. Expected: exact 6/30/90/90, all source/extraction/collision arrays zero, no tracked change.

- [ ] **Step 6: Obtain fresh independent approval**

Dispatch a new read-only reviewer, not the implementer or 089–094 reviewer. It inspects all 90 claim/block/mutation triplets, content replacements, source provenance, Estonian recoverability, and ramp fairness. Critical 0 / Important 0 is required.

---

### Task 4: Build and review the combined 089–100 preflight

**Files:**
- Create: .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-mythology-hard-089-100-exact-block-preflight.ts
- Create: .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-mythology-hard-089-100-exact-block-manifest.json
- Create: .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-mythology-hard-089-100-exact-block-preflight-report.md

**Interfaces:**
- Consumes exact approved Task 2 and Task 3 hashes.
- Produces one immutable 12-set / 60-row / 180-claim / 180-proposition-binding manifest for rendering; total bound block digests may exceed 180 when a reviewed claim requires multiple ordered blocks.

- [ ] **Step 1: Write a combined failing audit before integration**

Require exact half hashes, 12 sets / 60 rows / 180 claims / 180 proposition-binding records, at least 180 block digests, unique stable slots, complete language forms, zero exact/title/fact/subject/semantic/source-ID/source-route/within/cross-half collisions, zero accepted-authority collisions, and complete block/source/reviewer bindings.

- [ ] **Step 2: Assemble only approved halves**

Import the two approved modules without copying or transforming records. Reject mismatched hashes, missing review approvals, old rejected 089–100 rows, or any Easy/Adult/Estonia mutation.

- [ ] **Step 3: Run deterministic combined verification twice**

~~~powershell
npx tsx .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-mythology-hard-089-100-exact-block-preflight.ts
npx tsx .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-mythology-hard-089-100-exact-block-preflight.ts
~~~

Expected: byte-identical manifest hashes and all arrays zero on both runs.

- [ ] **Step 4: Run full and bilingual reviews in parallel**

Dispatch two read-only reviewers concurrently: one for full source/content/collision integrity and one native-target review for Estonian phrasing, accepted variants, clue recoverability, and all 12 ramps. Both approve the same manifest hash with Critical 0 / Important 0. Repair uses the conservative union and fresh scoped re-review.

---

### Task 5: Render and locally commit the approved production bank

**Files:**
- Modify: scripts/content/playability/banks/packs09to12.ts — only Mythology Hard sets 089–100.
- Create ignored: production roster, deterministic generator, immutable RED, integrated audit, author report, full review, and bilingual review under the Task 6 SDD directory.

**Interfaces:**
- Consumes only the approved combined manifest hash.
- Produces 12 PlayableCategory objects / 60 Hard questions with stable IDs and repository-valid bilingual variants.

- [ ] **Step 1: Write the immutable production RED**

Compare the current committed bank with the approved manifest and require exact 12 title mismatches / 60 row mismatches while proving all non-target prefix, suffix, Easy, Medium, Adult, Estonia, and Hard 078–088 bytes unchanged.

- [ ] **Step 2: Write a deterministic renderer before editing the bank**

Map each manifest row to the existing PlayableCategory/question structure. Preserve stable category/question IDs, difficulty, tier, pack, round, batch, inspiration allocation, and non-target fields. Handle only approved cross-language variant overlays required by the real validator.

- [ ] **Step 3: Render once with apply_patch and prove idempotence**

Run the renderer in check mode, apply the exact generated slice using apply_patch, then rerun check mode. Expected: second run reports no write/diff and bank SHA equals the manifest-bound expected hash.

- [ ] **Step 4: Run production validation**

Run the integrated production audit, real bank validator, exact-block live audit, accepted-authority collision audit, focused 147-test content surface, npm run typecheck, and scoped ESLint. Prove one tracked file only, LF determinism, exact non-target preservation, and no Easy/Adult/Estonia mutation.

- [ ] **Step 5: Obtain full and bilingual production reviews**

Dispatch two fresh read-only reviewers in parallel against the exact bank hash. Both inspect all 60 clues/responses/explanations/variants, source mapping, ramps, stable IDs, and preservation. Critical 0 / Important 0 is required.

- [ ] **Step 6: Commit only the approved bank**

~~~powershell
git add -- scripts/content/playability/banks/packs09to12.ts
git diff --cached --check
git diff --cached --name-only
git commit -m "content(trivia): author mythology hard checkpoint 6"
~~~

Expected: cached name list contains exactly the bank file; no .learnings/ or ignored artifact is staged. Do not push.

---

### Task 6: Run Windows-only branch-wide acceptance

**Files:**
- Create ignored: .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-mythology-hard-089-100-postcommit-audit.ts
- Create ignored: .superpowers/sdd/2026-08-28-playable-medium-hard-corpus-overhaul/task-6-mythology-hard-089-100-postcommit-report.md
- Do not modify production files.

- [ ] **Step 1: Verify ancestry and committed scope**

Fetch origin, then prove origin/main and Adult/Estonia tip are ancestors of HEAD. Prove the new commit direct-parent diff contains exactly scripts/content/playability/banks/packs09to12.ts and the preceding documentation commits contain only canonical design/plan files.

- [ ] **Step 2: Replay every Task 1–5 audit from clean HEAD**

Recompute immutable hashes, live block bindings, manifest, production mapping, collisions, source identities, review approvals, and Easy/Adult/Estonia preservation. Expected: all declared failure arrays zero.

- [ ] **Step 3: Run Windows content and application gates**

~~~powershell
npm run test:run
npm run typecheck
npm run lint
npm run build
npm run test:product-e2e
~~~

Before Electron Playwright, remove inherited ELECTRON_RUN_AS_NODE. Expected: every command exits 0 on Windows.

- [ ] **Step 4: Verify cleanliness and remote state**

~~~powershell
git diff --check
git diff --cached --check
git status --short --branch
git branch -r --contains HEAD
~~~

Expected: no tracked/index changes, only authorized .learnings/ untracked, and no remote branch contains the new local commits. Record exact commands, hashes, and nonblocking playtest watches in the postcommit report. Leave the full corpus goal active for remaining work; do not push or mark it complete merely because this checkpoint is accepted.

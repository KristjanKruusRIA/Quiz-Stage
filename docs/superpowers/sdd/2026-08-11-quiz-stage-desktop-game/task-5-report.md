# Task 5 Report: Deterministic Balanced Board Selection

## Status

Complete. Commit `b1f37b4` (`feat(game): select balanced deterministic boards`) contains the requested three-file implementation and tests.

## Files

- `src/shared/game/boardSelector.ts`
  - Defines the selectable category/Final input records and atomic success/shortage result.
  - Filters category sets and Final clues by enabled pack/content, configured language and difficulty, required round, and exact enabled tiers 1-5.
  - Ranks unseen records first and used records by ascending `lastSeenAt`, applying seeded Fisher-Yates shuffling only within equal-rank groups.
  - Backtracks across both boards to enforce six categories per board, twelve selected-language-distinct category names, and at most two categories per macro-topic per board.
  - Selects one Round One and two distinct Round Two Daily Double tile IDs after board construction.
  - Selects deterministic, excluded-ID-aware Final-eligible tiebreakers and converts the persisted canonical clue to the reducer-required `tiebreaker` round.
- `tests/fixtures/contentFactory.ts`
  - Supplies bilingual selectable category, clue, Final, config, and selection-input fixtures.
- `tests/unit/game/boardSelector.test.ts`
  - Covers RNG repeatability, complete/balanced selection, ranking, all eligibility filters, exact atomic shortages, byte equivalence, Daily Double placement, and tiebreaker persistence/non-reuse.

## RED evidence

Command:

```powershell
npm run test:run -- tests/unit/game/boardSelector.test.ts
```

Observed expected failure before production code existed:

```text
FAIL tests/unit/game/boardSelector.test.ts
Error: Cannot find module '../../../src/shared/game/boardSelector'
Test Files  1 failed (1)
EXIT_CODE=1
```

The failure was caused by the missing Task 5 module, not a fixture typo or unrelated test failure.

## GREEN and verification evidence

Focused verbose command (run twice during implementation, including after the final ES2022 compatibility fix):

```powershell
npm run test:run -- tests/unit/game/boardSelector.test.ts -- --reporter=verbose
```

Final focused result:

```text
Test Files  1 passed (1)
Tests       7 passed (7)
EXIT_CODE=0
```

Fresh pre-commit verification:

```powershell
npm run lint
npm run typecheck
npm run test:run -- tests/unit/game
git diff --check
```

Results:

```text
eslint .                         EXIT_CODE=0
tsc --noEmit                     EXIT_CODE=0
Test Files  8 passed (8)
Tests       62 passed (62)       EXIT_CODE=0
git diff --check                 EXIT_CODE=0
```

One verification issue was found and corrected before the final run: `Array.prototype.toSorted` was incompatible with the repository's ES2022 target. It was replaced by a copied-array `sort`, after which typecheck and all tests were rerun successfully.

## Contract integration

The successful `SelectedMatch` is structurally compatible with Task 4's `SelectedBoards` seam through `seed`, ordered `boards`, `dailyDoubleClueIds`, `finalClue`, and `tiebreakerClues`. The test constructs `SelectedBoards` from selector output, appends selected canonical tiebreakers, and verifies `createGame` has persisted them while no clue is active yet. The algorithm remains outside the reducer.

Shortages return only:

```ts
{ ok: false, roundOneMissing, roundTwoMissing, finalMissing }
```

No boards, Final, or Daily Double IDs are returned on shortage.

## Self-review

- Determinism and ordering: equal-rank inputs are canonicalized by ID before domain-separated seeded shuffling; unequal ranks are never shuffled across one another. Boards, Final choice, Daily Doubles, and tie-index selection derive only from input plus the persisted seed.
- Balance and names: complete-board search enforces maximum two identical macro-topics per board and normalized selected-language name uniqueness across both boards.
- Shortage atomicity: exact maximum feasible board sizes drive the missing counts; cross-round name conflicts are attributed to Round Two after preserving a complete Round One. Partial selected content is never returned.
- Daily Double privacy: Daily Double IDs exist only on the private canonical success result/`GameState`; Task 4's `PublicGameView` contract has no Daily Double or tiebreaker-list fields. This task did not widen that public contract.
- Tiebreakers: candidates use the same Final eligibility filters, exclude every supplied used/selected ID, incorporate `tieIndex` into the deterministic shuffle scope, and are returned in Task 4's canonical `tiebreaker` round. The integration test verifies persistence precedes display.
- Scope: no database, repository, ingestion, network, UI, IPC, public-view, or reducer files changed.
- Secret review: the staged diff contains fixture-only text and no credentials or environment values.

## Concerns and assumptions

- `lastSeenAt` is intentionally supplied per category set/Final candidate. The future content service is responsible for aggregating clue-use history into that field before calling the pure selector.
- As required by the Task 4 seam, `selectNextTiebreakerClue` is pure: its caller must append and persist the returned clue before issuing the gameplay action that displays it. The test demonstrates that ordering through `createGame`.
- No remaining implementation or verification concern was found.

## Fix Round 1: Joint shortages and bounded conflict search

### Reviewed findings and root cause

The two Important findings were verified against commit `b1f37b462b2207bbdff8daab5b728925d44ce2a4`.

1. The shortage path independently maximized Round One and Round Two unless both independently reached six. It could therefore report a pair of counts that no single cross-round, name-unique allocation could realize.
2. Complete-board search enumerated Round One combinations and started a fresh Round Two recursion for each. Duplicate names and macro conflicts were repeatedly normalized and revisited, producing combinatorial work.

The corrected deterministic allocation policy is: maximize the total categories jointly selectable across both rounds; among equal-total allocations, maximize Round One before Round Two. Every attempted allocation enforces normalized-name uniqueness across the match and the two-per-macro cap independently on each board.

### RED evidence

After adding three focused regressions, this command was run before changing production code:

```powershell
npm run test:run -- tests/unit/game/boardSelector.test.ts -- --reporter=verbose
```

Observed failures:

```text
reports jointly feasible shortages when category names overlap across rounds
  expected roundTwoMissing 5, received 0

computes joint shortage counts under both macro caps and cross-round name conflicts
  expected roundTwoMissing 4, received 0

bounds conflict search after pruning hundreds of dominated candidates
  Error: Joint search exceeded the deterministic name-read bound

Test Files  1 failed (1)
Tests       3 failed | 7 passed (10)
EXIT_CODE=1
```

The first inventory had Round One names A-E and Round Two names A-F. The old `1/0` shortage was infeasible; the stated joint policy requires the feasible `1/5`. The combined name/macro fixture similarly required `2/4` rather than `2/0`. The stress fixture contained 400 valid conflict-heavy category sets and deterministically stopped the old recursion after more than 2,000 normalized-name reads.

### Implementation

- Group eligible candidates once by normalized selected-language category name, making cross-round uniqueness structural.
- Apply safe dominance pruning: for a name, round, and macro-topic signature, retain only the earliest already-ranked candidate because later candidates have identical feasibility effects.
- Search Round One and Round Two jointly with board-size targets capped at six.
- Enumerate targets by descending total fill, then descending Round One fill to implement the documented deterministic shortage policy.
- Memoize failed joint states by group index, remaining board slots, and both boards' macro counts.
- Prune states using remaining unique-name groups, per-round suffix availability, and remaining per-topic macro capacity.
- Keep selection outside the reducer and preserve the pure caller-persistence tiebreaker contract; Task 8 remains responsible for authoritative main-process wiring.

### GREEN evidence

Focused verbose command after the fix:

```powershell
npm run test:run -- tests/unit/game/boardSelector.test.ts -- --reporter=verbose
```

Result:

```text
Test Files  1 passed (1)
Tests       10 passed (10)
EXIT_CODE=0
```

The stress regression uses a fixed 2,000 normalized-name-read ceiling rather than elapsed time. The 400-candidate inventory completes under that deterministic operation bound and returns the exact jointly feasible `4/4` shortage.

### Fix Round 1 verification and self-review

The first post-fix verification run produced:

```text
npm run lint                       EXIT_CODE=0
npm run typecheck                  EXIT_CODE=0
npm run test:run -- tests/unit/game
  Test Files 8 passed (8)
  Tests      65 passed (65)        EXIT_CODE=0
git diff --check                   EXIT_CODE=0
```

Self-review findings:

- Exactness: each returned shortage pair comes from an actual joint allocation found under both constraint families; no independently computed or partial board is returned.
- Dominance safety: candidates are removed only when a higher-ranked candidate has the same normalized name, round, and macro-topic, so the retained option has identical feasibility impact.
- Memoization safety: after processing a name group, future feasibility depends only on remaining slots and macro counts; processed category identities cannot recur because names are grouped exactly once.
- Bounded behavior: board targets are fixed at six, high-conflict macro inventories are rejected by capacity bounds, duplicate signatures collapse before search, and failed states are memoized without an attempt cap or false-shortage fallback.
- Ordering: ranked candidates are preserved in each board's final output; the allocation target policy and option order are deterministic.
- Scope/privacy: only selector logic and its focused test changed. No reducer, renderer, persistence, public-view, network, or tiebreaker contract was widened.

## Fix Round 2: Polynomial flow allocation and independent round ranking

### Reviewed findings and root cause

The remaining Important findings were verified against commit `dd9c84618d11ba10b3e26ccce8f4d0e41e2ebfbb`.

1. The memoized recursion was exact, but its state key retained arbitrary macro-topic identities. The number of reachable macro-count maps could still grow combinatorially. The prior stress case collapsed 400 candidates into only five names and one macro, and its name-read counter measured preprocessing rather than recursive states.
2. Name groups inherited Round One insertion order. When the same names were options in both rounds, traversal could consume the name for Round One and force Round Two to select a lower-ranked candidate even though a higher-ranked jointly feasible allocation existed.

### RED evidence

Before production changes, the focused verbose command was run with a new Round Two overlap regression and a 600-option flow-bound regression:

```powershell
npm run test:run -- tests/unit/game/boardSelector.test.ts -- --reporter=verbose
```

Observed failures:

```text
applies Round Two ranking independently when names also occur in Round One
  expected Round Two IDs to contain r2-high; received r2-low

bounds exact allocation work for hundreds of distinct names and macro options
  expected diagnostics.targetChecks to be greater than 0; received 0

Test Files  1 failed (1)
Tests       2 failed | 9 passed (11)
EXIT_CODE=1
```

The ranking fixture forces a choice between two shared names. The old Round One-first traversal consumed the name belonging to the best Round Two candidate. The stress fixture contains 150 distinct normalized names, both rounds, and two macro-topic options per name/round, totaling 600 eligible category-set options.

### Polynomial exact allocation

The recursive joint search was replaced by a deterministic integral min-cost maximum-flow network:

- Source to normalized-name nodes: capacity 1, enforcing one category name across the match.
- Name to round/macro nodes: capacity 1 candidate-option edges, costed by that candidate's independently computed round rank.
- Round/macro nodes to their round node: capacity 2, enforcing the per-board macro cap.
- Round nodes to sink: capacities from 0 through 6, enforcing exact board targets.

Names and macro topics are canonical-sorted before graph construction. Candidates are still ranked separately per round using unseen status, ascending `lastSeenAt`, and seeded shuffle only within equal ranks. Safe dominance pruning retains the first ranked candidate for each equivalent `(round, normalized name, macro topic)` option.

The allocation policy remains unchanged: maximize total fill, then maximize Round One fill. One flow with capacities 6/6 establishes maximum total fill. If it is below twelve, no more than seven exact target checks find the greatest feasible Round One allocation at that total. Thus one selection performs at most eight flow runs.

Each flow run uses successive shortest augmenting paths with deterministic Bellman-Ford relaxation. Integral capacities and a maximum of twelve sink units bound each run to at most twelve augmentations. Each augmentation performs at most `V-1` passes over the directed residual edges, making the allocation polynomial with no attempt cap or false-shortage fallback.

An optional `SelectionFlowDiagnostics` argument exposes only structural work counts for the focused regression; it does not add fields to `SelectedMatch`, `SelectionShortage`, `SelectedBoards`, `GameState`, or `PublicGameView`.

### GREEN evidence

After the flow implementation:

```powershell
npm run test:run -- tests/unit/game/boardSelector.test.ts -- --reporter=verbose
```

Result:

```text
Test Files  1 passed (1)
Tests       11 passed (11)
EXIT_CODE=0
```

The distinct-name stress asserts these algorithm-derived bounds rather than elapsed time:

```text
targetChecks <= 8
maxAugmentationsPerCheck <= 12
maxEdgeScansPerCheck <= 12 * nodeCount * directedEdgeCount
```

The existing exact joint shortage regressions remain `1/5` and `2/4`, and atomic failure, deterministic bytes, balance, Daily Doubles, Final, and tiebreaker persistence/non-reuse remain green.

### Fix Round 2 self-review

- Exactness: integral max flow directly encodes name, macro, and round capacities; exact round target checks saturate both round-to-sink edges before an allocation is accepted.
- Polynomial bound: at most eight runs, twelve augmentations per run, and Bellman-Ford's fixed vertex/edge loops replace arbitrary recursive state growth.
- Ranking: option cost is the index from its own round's already-ranked candidate array. Canonical name ordering cannot override the cost, and the regression proves `r2-high` replaces `r2-low` despite Round One insertion order.
- Dominance: only a later option with identical round, normalized name, and macro topic is removed; it has the same capacities and a worse independent round rank.
- Determinism: canonical node/edge order, strict distance improvement, seeded candidate ranking, and sorted board output make equal-cost flow choices repeatable.
- Shortage policy: maximum total then maximum Round One is preserved without partial selected content.
- Scope/privacy: no reducer, renderer, persistence, public-view, network, Final, Daily Double, or tiebreaker behavior changed.

# Feature: tracker preflight and label catalog
Status: IN_PROGRESS
Issue: https://github.com/daniel-kindl/dkstack/issues/68
Branch: feat/68-tracker-preflight
PR: not created

## Goal

Add a dry-run tracker preflight and the label catalog to bootstrap.

## Requirements and acceptance criteria

- The capability checklist and an optional mapping are documented.
- The label catalog has names, descriptions, colors, cardinality and migration rules.
- The default run is a dry run. A second run plans no new create.
- Unsupported capabilities have an explicit fallback.
- Protection, settings and infrastructure stay owner-gated.
- `npm run check` passes and the Unreleased changelog is updated.

## In scope

- `scripts/preflight.mjs`, `workflow/preflight.md`, the bootstrap step, the tests and the changelog.

## Out of scope

- Issue mapping, claims, a live tracker write, and migrating every repository.
- Issue #69.

## Decisions and open questions

- The script prints a plan. It does not change the tracker. Decision: a write client would bind the portable core to one product.
- The bootstrap skill does not name a product. The optional mapping that names one tracker is in `workflow/preflight.md`.
- No open question.

## Commit plan

### C01: preflight and labels
Status: IN_PROGRESS
Depends on: none
Proposed commit: feat(bootstrap): add preflight and labels
Actual commit: none until this commit exists
Objective: The preflight plans missing labels, reports fallbacks, and does not write.
Verification: `npm run check`.
Evidence: `npm run check` on Linux passed. 124 tests, 0 fail. GitHub `validate` has not run.

## Handoff
Next action: Commit, open the pull request, and record the validate result.
Blockers: none
Risks: A later change can make the script write to a tracker. The tests require an empty update list and an empty remove list.

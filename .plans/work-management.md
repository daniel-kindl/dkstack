# Feature: work management contract
Status: IN_PROGRESS
Issue: https://github.com/daniel-kindl/dkstack/issues/67
Branch: docs/67-work-contract
PR: https://github.com/daniel-kindl/dkstack/pull/72

## Goal

Document the portable work contract. Do not add a tracker adapter.

## Requirements and acceptance criteria

- The lifecycle, readiness and authorization model is in `workflow/` and the workflow index links it.
- Precedence and fail-closed behavior are defined.
- The mapping session does not implement mapped work. A fresh session implements it.
- The contract does not require a named tracker or code host.
- Docs, checks and the Unreleased changelog are updated.

## In scope

- `workflow/work.md`, its index line, the tests and the changelog entry.
- One pointer from `workflow/feature-plans.md`, `AGENTS.md` and `README.md`.

## Out of scope

- Live issue or label changes, a tracker adapter, claims, the `map-work` skill, a scheduler, a release or a deploy.
- Issues #68, #69, #70 and #71.
- Changes to the rules in `workflow/safety.md`.

## Dependencies and constraints

- The owner pointed at issue #67 on 2026-10-30. That is the OK to write this contract. It is not an OK to publish.
- Issues #68 to #71 are blocked by this contract. This page does not implement them.
- Link safety, roles, review and feature plans. Do not copy their rules.

## Decisions and open questions

- The page is `workflow/work.md`. Decision: the workflow index is the index the issue asks for.
- Type values are feature, bug, refactor, chore, docs and research. Priority values are p0, p1, p2 and p3. Eligibility values are agent and human. Decision: these names are the contract. Issue #68 maps them to tracker labels. This page does not define colors or label syntax.
- Absent eligibility means the issue is not ready. Decision: from the fail-closed rule and from issue #70, agent-ready is explicit.
- Priority does not change readiness. Decision: issue #68 makes priority optional.
- This issue does not change `skills/triage`. Decision: issue #71 routes triage to the contract.
- No open question.

## Commit plan

### C01: work contract
Status: COMPLETED
Depends on: none
Proposed commit: docs(workflow): define work management contract
Actual commit: adb76d03c5a5593893927a173d974ac806db7ccb
Objective: The work contract states the lifecycle, the sources, the readiness checks, fail closed and session isolation.
Work: One commit. The tests cover the page and the index, so a split commit would leave the branch red.
Verification: `npm run check` and GitHub `validate`.
Evidence: `npm run check` on Linux passed. 111 tests, 0 fail. GitHub `validate` passed on `d676a8e` (run 41117498945).

## Final verification

`npm run check` on Linux passed. 111 tests, 0 fail. GitHub `validate` passed on `d676a8e` (run 41117498945). No tag.

## Handoff
Next action: Wait for review of pull request 72. Do not merge. Do not remove this plan before that review.
Blockers: none
Risks: A later issue can copy these rules into a skill. The test forbids a copy of the force-push rule and of the reviewed-head merge sentence.

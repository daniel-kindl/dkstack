# Feature: workflow lifecycle integration
Status: IN_PROGRESS
Issue: https://github.com/daniel-kindl/dkstack/issues/71
Branch: feat/71-workflow-lifecycle
PR: https://github.com/daniel-kindl/dkstack/pull/79

## Goal

Connect the existing skills to the work, claim, preflight and review contracts. Document the lifecycle and the safe stops.

## Requirements and acceptance criteria

- Skills link the shared contracts and do not copy those rules.
- One scenario runs from an external issue through preflight, mapping, a fresh session, independent review and a policy-compliant merge.
- Collision, an incomplete prerequisite, missing permission, same-session implementation and an unreviewed merge stop safely.
- An external-request template and an example are documented.
- Checks pass and the Unreleased changelog is updated.

## In scope

The lifecycle page, the issue template, short skill links, tests and the changelog.

## Out of scope

A scheduler, automatic sessions, migrating repositories, and a release or deploy.

## Dependencies and constraints

Issues #68, #69 and #70 are merged. The skill text stays free of a tracker product name.

## Decisions and open questions

The lifecycle page links the contracts. It does not restate their procedures. The negative cases are instructions to stop, with a link to the page that holds the rule.
No open question.

## Commit plan

### C01: Document the lifecycle route
Status: COMPLETED
Depends on: none
Proposed commit: feat(workflow): integrate the lifecycle
Actual commit: 5578be5
Objective: Skills and a lifecycle page route external work and stop on the named failures.
Work: Write failing tests, then add the page, the template and the skill links.
Verification: `npm run check` and GitHub `validate`.
Evidence: `npm run check` on Linux passed. 152 tests, 0 fail. GitHub `validate` passed on
`9ca49e3` (run 41200126207).

## Final verification

Not run yet.

## Handoff

Next action: Wait for review of pull request 79. Do not merge. Do not remove this plan before that review.
Blockers: none.
Risks: A skill link can copy a rule that the tests forbid.

# Feature: reviewed active-parent scope amendments
Status: IN_PROGRESS
Issue: #100
Branch: feat/100-active-parent-amendments
PR: none
Claim-ID: 6d2ee559-9f73-4600-b219-a76c0a5600ee

## Goal

Allow a map-work session to add reviewed children to an active parent after explicit owner approval, without changing the initial map-work workflow.

## Acceptance criteria

- Require owner approval on the parent or linked ADR. Approval names the scope and acceptance criteria.
- Preserve the parent lifecycle and all existing children, parent links, claims, assignments, prerequisites and comments.
- Require normal preflight, permission and native-link checks.
- Reject duplicate children, conflicting prerequisites and dependency cycles.
- Keep new children in planning until the mapping PR passes independent review and the owner merges it.
- Add regression tests. Keep normal initial map-work rules unchanged.

## Commits

### C01: Add the active-parent amendment route and regression tests
Status: COMPLETED
Actual commit: 5fb6a1b
Evidence: The focused lifecycle and map-work tests passed. They cover recorded scope approval, acceptance criteria, claim ownership, preflight, permissions, tracker support, duplicates, prerequisite conflicts and cycles. They also check that initial mapping still stops for active parents.

### C02: Document the owner-approved amendment procedure
Status: COMPLETED
Actual commit: 5fb6a1b
Evidence: The map-work skill defines the separate active-parent procedure. It preserves existing issue state, requires duplicate and graph checks, keeps children in planning, and requires independent review and owner merge. The lifecycle page documents the route.

### C03: Record the change
Status: COMPLETED
Actual commit: 5fb6a1b
Evidence: The Unreleased changelog records the amendment path.

## Final verification

`npm run check` passed. It ran all repository checks and 177 tests. `git diff --check` passed.

## Handoff

The implementation is complete. Open a pull request for independent review. Do not merge it. Do not create or promote child issues in this implementation session. The owner must use the standard review and merge gate.

# Feature: isolated issue mapping
Status: IN_PROGRESS
Issue: #70
Branch: feat/70-map-work
PR: not created
Claim-ID: 1473f429-3a29-4546-a702-1baff3865d92

## Goal

Add a map-work skill for accepted objectives that need more than one pull request.

## Requirements and acceptance criteria

- Route multi-PR objectives to map-work and one-PR work to plan-work.
- Define bounded child issues, native hierarchy and blockers, labels, optional milestones and a handoff.
- Validate capabilities, permissions, duplicates, readiness and owner decisions.
- Stop the mapping session after publication. A fresh session implements a child.
- Test the routing and isolation instructions. Pass checks and update Unreleased.

## In scope

The skill, its index and triage route, tests and changelog.

## Out of scope

Implementing mapped children, a scheduler or automatic fresh sessions.

## Dependencies and constraints

Issues #67 and #68 are complete. Live read probes reached the native hierarchy and blocker-link
endpoints. Write permission is not verified. The skill remains portable.

## Decisions and open questions

Use the number of independently reviewable pull requests to route work. A map file in the
repository is a handoff record; native tracker links remain the source for relationships.
Do not invent a numeric size threshold. A successful capability read does not prove write
permission, so the mapping agent checks each write result and rereads native records.

## Commit plan

### C01: Define and test map-work
Status: COMPLETED
Depends on: none
Proposed commit: feat(skills): add isolated map-work
Actual commit: 61bb90b
Objective: Add the skill and route only multi-PR objectives to it.
Work: Write failing tests, then add the skill, index and triage route.
Verification: Run the focused tests and repository checks.
Evidence: The new tests failed before the skill existed. After the change, the focused tests and
`npm run check` passed. The full check ran 139 tests. The STE linter found no violations.

### C02: Record the skill
Status: COMPLETED
Depends on: C01
Proposed commit: docs(changelog): record map-work
Actual commit: d4aa448
Objective: Record the feature in Unreleased.
Work: Update CHANGELOG.md.
Verification: Run the changelog check and full repository checks.
Evidence: `npm run check` passed after the commit with 139 tests.

### C03: Resolve review findings
Status: IN_PROGRESS
Depends on: C02
Proposed commit: fix(skills): classify mapped children first
Actual commit: none
Objective: Make child creation and readiness checks safe after partial writes.
Work: Create children in planning, check readiness inputs before ready labels, and state the
parent review lifecycle.
Verification: Run focused tests, the full check and the STE linter.
Evidence: focused tests passed; full check not yet run.

## Final verification

The first full check passed after C02. The self-review found a circular readiness check and
unclassified child issues after a partial write. C03 addresses them.

## Handoff

Next action: Run the full check, commit C03 and open the pull request.
Blockers: none.
Risks: A tracker can permit relationship reads but reject writes.

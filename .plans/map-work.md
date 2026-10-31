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

Issues #67 and #68 are complete. The current tracker has native hierarchy and blocker links.
The skill remains portable and names no required tracker product.

## Decisions and open questions

Use the number of independently reviewable pull requests to route work. A map file in the
repository is a handoff record; native tracker links remain the source for relationships.
Do not invent a numeric size threshold. A successful capability read does not prove write
permission, so the mapping agent checks each write result and rereads native records.

## Commit plan

### C01: Define and test map-work
Status: IN_PROGRESS
Depends on: none
Proposed commit: feat(skills): add isolated map-work
Actual commit: none
Objective: Add the skill and route only multi-PR objectives to it.
Work: Write failing tests, then add the skill, index and triage route.
Verification: Run the focused tests and repository checks.
Evidence: not yet run

### C02: Record the skill
Status: PENDING
Depends on: C01
Proposed commit: docs(changelog): record map-work
Actual commit: none
Objective: Record the feature in Unreleased.
Work: Update CHANGELOG.md.
Verification: Run the changelog check and full repository checks.
Evidence: not yet run

## Final verification

Not yet run.

## Handoff

Next action: Write the failing skill tests.
Blockers: none.
Risks: A tracker can permit relationship reads but reject writes.

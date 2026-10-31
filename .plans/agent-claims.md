# Feature: agent claim and recovery protocol
Status: IN_PROGRESS
Issue: #69
Branch: docs/69-agent-claims
PR: not created
Claim-ID: c5a7b43c-e0e7-4029-813b-e31794cf9d3c

## Goal

Define one auditable, portable claim lifecycle for agent sessions that share a tracker account.

## Requirements and acceptance criteria

- Document the claim event schema and allowed transitions.
- Cover collisions, failed writes, crashes, replay, handoff and owner recovery with examples.
- State the fallback when the tracker cannot support reliable claims.
- Preserve claim history. Update the Unreleased changelog and pass checks.

## In scope

The claim protocol, its workflow links, examples and checks.

## Out of scope

A lock service, scheduler, heartbeat and automatic stale recovery. The preflight API endpoint fix has a separate PR.

## Dependencies and constraints

Issue #67 is complete. The owner approved the ready transition. The native dependency and readiness labels were verified before the claim.

## Decisions and open questions

The tracker comment ID and timestamp order events. The assignee identifies the shared account. A claim ID identifies one agent session. Comments remain immutable audit records.

## Commit plan

### C01: Define claim events and lifecycle
Status: IN_PROGRESS
Depends on: none
Proposed commit: docs(workflow): define agent claims
Actual commit: none
Objective: Define the schema, transitions, reconciliation and fallback.
Work: Add the protocol page, link it from the workflow index, and add scenario examples.
Verification: Run repository checks and compare each acceptance criterion with the page.
Evidence: not yet run

### C02: Record the change
Status: PENDING
Depends on: C01
Proposed commit: docs(changelog): record claim protocol
Actual commit: none
Objective: Record the new protocol in Unreleased.
Work: Update CHANGELOG.md.
Verification: Run the changelog check and full repository checks.
Evidence: not yet run

## Final verification

Not yet run.

## Handoff

Next action: Write the protocol page.
Blockers: none.
Risks: Tracker comments cannot make assignment and claim writes atomic.

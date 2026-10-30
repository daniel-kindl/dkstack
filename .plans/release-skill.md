# Feature: release skill and triage ladder
Status: IN_PROGRESS
Issue: https://github.com/daniel-kindl/dkstack/issues/64
Branch: docs/64-release-skill
PR: https://github.com/daniel-kindl/dkstack/pull/66

## Goal

Add a release skill that links the versioning and safety rules, and add a short scale ladder to triage.

## Requirements and acceptance criteria

- `skills/release/SKILL.md` exists, is listed in `skills/index.md`, and triage routes it.
- The release skill links `versioning/` and `workflow/safety.md`. It does not copy their rules.
- The release skill states the publish rule. The owner OK names the exact version. The OK never covers a production deploy or a project's release workflow.
- Triage has the ladder and the handoffs. A small task can use one or two skills only.
- No skill names a bot, tool or platform, or implies one role for each agent. Tests check this.
- `npm run check` passes. `CHANGELOG.md` has an Unreleased entry. No tag and no release.

## In scope

- The release skill, its index line, the triage ladder, the tests and the changelog entry.

## Out of scope

- Role skills.
- Changes to the rules in `versioning/` or `workflow/safety.md`.
- Any tag, release or publish.

## Dependencies and constraints

- The owner asked to do this work on 2026-10-30. That is the OK to write the design and the text. It is not an OK to publish.
- Skills stay tool-agnostic. They link rules. They do not copy them.
- One agent can do every step. Many agents can share the steps.
- Use subagents only for the compatibility check and the changelog check. The version choice and the publish rule stay with the agent.
- `versioning/index.md` has no separate packaging procedure. The release steps on that page are for the dkstack repository only.

## Decisions and open questions

- Packaging: the skill points at the versioning page. It tells the agent not to invent packaging steps. Decision from the versioning page. No open question.
- The ladder has three lines: bug fix, feature and release. The feature line adds `writing-check` and `release` only when they apply. The issue gives the first two lines as examples. The release line is required so triage routes the new skill.
- The publish rule is stated in the skill because the issue requires that statement. The rest of the safety page is linked, not copied.

## Commit plan

### C01: release skill and triage ladder
Status: COMPLETED
Depends on: none
Proposed commit: docs(skills): add release skill and ladder
Actual commit: 8fea687b84ad0754f028e51a78ed32d5ed6c50b5
Objective: The release skill links the rules and states the publish rule. Triage maps a bug fix, a feature and a release to skills in order.
Work: One commit. The tests cover both parts, so a split commit would leave the branch red.
Verification: `npm run check` and GitHub `validate`.
Evidence: `npm run check` on Linux passed. 107 tests, 0 fail. GitHub `validate` passed on `0e7580c` (run 41110494802).

## Final verification

`npm run check` on Linux passed. 107 tests, 0 fail. GitHub `validate` passed on `0e7580c` (run 41110494802). No tag.

## Handoff
Next action: Wait for review of pull request 66. Do not merge. Do not remove this plan before that review.
Blockers: none
Risks: A later edit can copy a versioning sentence into the skill. The test forbids the release commands and the SemVer increment sentence.

# Feature: Codebase stewardship
Status: IN_PROGRESS
Issue: https://github.com/daniel-kindl/dkstack/issues/77
Branch: docs/77-codebase-stewardship
PR: https://github.com/daniel-kindl/dkstack/pull/82
Claim-ID: 2d544c36-af14-423e-82bd-2a0b17202b1a

## Goal

Make agents consider long-term ease of change during normal work. Analyze only when a signal
or a human request justifies it. Change code only inside the current authorization.

## Requirements and acceptance criteria

- Audit the current guidance and record the overlap before the edits.
- State the three levels and their triggers in one place.
- State agent and owner authority. Link the safety and work contracts. Do not copy them.
- Triage reads the page only for a named signal or a human request.
- `apply-architecture`, `plan-work`, `tdd-loop` and `code-review` point at the page and do not
  copy the rules.
- Principles have no fixed rank. The easier-to-change rule remains the tie-breaker.
- The page includes seven scenarios: typo fix, normal feature, new dependency, public API
  change, unrelated architectural issue, obsolete ADR, and DRY against coupling.
- The scenarios change the action, not only the length of the explanation.
- Links use the current pattern: relative links in the repository pages, and `v1` raw URLs in
  skills.

## In scope

- `architecture/stewardship.md`
- Links from `architecture/index.md`, `AGENTS.md` and the four skills
- A signal list in `skills/triage/SKILL.md`
- Tests that lock those facts
- An Unreleased changelog entry

## Out of scope

- A new skill
- A glossary file. The repository has no glossary. The page defines the term.
- An ADR. The page is easy to change, so it is the permanent record.
- Role skills, maintenance schedules, architecture rewrites, consumer projects
- A release or a merge

## Dependencies and constraints

- Issue #77 has no parent, no children and no blockers.
- The owner asked this session to start the work.
- Claim `2d544c36-af14-423e-82bd-2a0b17202b1a` is the effective claim.
- Do not copy safety, work or role rules.
- Do not add a phase, a checklist or a report for ordinary work.

## Decisions and open questions

- Audit: KISS, YAGNI, DRY, SOLID, orthogonality and reversibility already have pages. No page
  connected them to routine work. No skill named long-term consequences or unrelated refactors.
  `workflow/work.md` already requires the owner for a material scope expansion.
- Design A is the selected design. One page holds the rules. Triage names the signals so it can
  route without opening the page. The four skills keep a pointer only.
- Design B left those skills unchanged. It does not meet the requirement that they apply the
  guidance.
- The signal names appear in the page and in triage. That list is the routing interface. The
  four skills do not repeat it.
- No open questions.

## Commit plan

### C01: Lock the stewardship behavior
Status: COMPLETED
Depends on: none
Proposed commit: test: lock stewardship behavior
Actual commit: 7ddd33a
Objective: A test fails until the page, the links and the skill pointers exist.
Work: Add `test/stewardship.test.mjs`.
Verification: `node --test test/stewardship.test.mjs` fails because the page is absent.
Evidence: Before `architecture/stewardship.md` existed, the four tests failed. The page test
failed with `ENOENT`. The link tests failed on the missing stewardship link. This commit does
not pass `npm run check`.

### C02: Add the page and the pointers
Status: COMPLETED
Depends on: C01
Proposed commit: docs: add codebase stewardship
Actual commit: e087649
Objective: The tests pass. Ordinary work still has no extra phase.
Work: Add the page, the index link, the AGENTS line, the triage signals and the four pointers.
  Add the changelog entry.
Verification: `npm run check`
Evidence: `npm run check` passed on this tree before the commit. 161 tests passed. Skills,
links, dashes, workflows and the changelog check passed. GitHub `validate` is NOT RUN.

### C03: Fix the review findings
Status: COMPLETED
Depends on: C02
Proposed commit: docs: fix stewardship review findings
Actual commit: 0f09786
Objective: Triage names the obsolete-ADR signal. A refactor stays in scope and keeps tests green.
Work: Add the ADR signal to the page list and to triage. Replace the coverage limit in
  `tdd-loop`.
Verification: The new assertions failed before the text change. `npm run check` then passed.
Evidence: Triage omitted `ADR no longer matches` from its signal list. `tdd-loop` still said
  `current tests cover`. After the edit, `npm run check` passed with 162 tests. GitHub
  `validate` on this commit is NOT RUN.

## Final verification

`npm run check` passed locally after C03: 162 tests, and the skill, link, dash, workflow and
changelog checks passed. GitHub `validate` passed on `7b36f24` and is NOT RUN on the review fix.

## Handoff
Next action: An independent reviewer reviews the new head of
https://github.com/daniel-kindl/dkstack/pull/82. Do not merge it from this session.
Blockers: none
Risks: The signal list exists in two files. The test now compares the two signal sections,
including the ADR signal.

---
name: plan-work
description: "Use when you plan a feature, a requirement or a milestone for an agent to do, or when you create, change, resume or keep a feature plan. Writes a Markdown plan that lists small, logical commits for one feature branch and one pull request."
---

# Plan work

Turn an approved feature goal into a plan. Another agent must be able to do the plan without the original conversation.

Read [feature-plans.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/feature-plans.md). Read the project plans, requirements and tasks that apply.

## Steps

1. Find the feature goal, the acceptance criteria, the non-goals, the constraints and the known facts. If a requirement that changes the plan is not clear, use `clarify-intent`.
2. Read the work that exists and the active plans. Do not plan work again that is done or already in a plan.
3. Write the plan to `.plans/<feature-slug>.md`, or to the path that the project documents. Use the format below.
4. Divide the feature into the smallest increments that are complete and that a reviewer can review alone. Plan each increment as a logical conventional commit. Do not plan a fixed number of commits. For each increment, write its dependencies, its risks and how to verify it. Write full details only for the items that the known facts support. For the later items, write only the outcome. See [small steps](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/small-steps.md).
5. Make sure that each acceptance criterion maps to planned work. Make sure that no item adds scope that nobody asked for.
6. When you do the work or hand it over, compare the plan with the real commits and checks. Update the status, the evidence and the next action as the shared protocol tells you. After each commit, if its result shows a new fact, change the later items.
7. Follow the review and cleanup steps of the shared protocol. Do not remove the plan only because all its items show as complete.

## Plan format

Use these headings. Add details only when they are necessary.

```markdown
# Feature: <name>
Status: PENDING
Issue: <reference or none>
Branch: <name or not created>
PR: <reference or not created>

## Goal
## Requirements and acceptance criteria
## In scope
## Out of scope
## Dependencies and constraints
## Decisions and open questions
## Commit plan

### C01: <short outcome>
Status: PENDING
Depends on: none
Proposed commit: feat(scope): summary
Actual commit: none
Objective:
Work:
Verification:
Evidence: not yet run

## Final verification
## Handoff
Next action:
Blockers:
Risks:
```

Each commit item must describe a change that has a purpose and a result that you can verify. Put the tests before the behavior changes, as TDD tells you. When you learn more, change the commit boundaries. Keep the proposed commits apart from the real commits.

## Subagents

If you can start subagents, use them for the checks that do not depend on each other. In step 6, compare the plan with the issue, with the commits and with the check results at the same time, each in its own subagent. Give each subagent a brief that is complete without your context:

- The plan path and the plan text.
- The source for its comparison: the issue text, the list of commits on the branch, or the check results.
- The full text of step 6 and the status and evidence rules in the shared protocol.
- What to report, and a word limit, for example 300 words.
- This line: "Report to me only. Do not change the plan, commit, push, post, approve or merge."

Collect the reports. Check each difference that a report gives against its source before you change the plan. If you cannot find the difference in the source, do not change the plan for it, and say so. Then update the plan yourself.

If you cannot start subagents, do the steps one at a time in the order of this skill.

## When a piece is missing

The steps expect an issue, a feature branch, a pull request, automated checks and write access to the plan path. If a piece is missing, use its fallback below. In the plan or in your report, say which fallback you used and why.

- No issue: write `none` in the `Issue` field. In step 1, take the goal and the acceptance criteria from the person who asked for the plan. If you cannot find them, ask. Do not invent them.
- No branch: write `not created` in the `Branch` field. Do the planning steps. Do not create the branch unless someone asked you to do the work.
- No pull request yet: write `not created` in the `PR` field. Update the field when the pull request exists.
- No automated checks: run the project checks locally if you can, and record the real result as evidence. If you cannot run a check, record it as not run. A check that did not run is not a pass.
- You cannot write to the plan path: do not write the plan to a different path on your own. Give the plan in your report, say why you could not write it, and ask where to put it.
- The plan changed since you read it, for example because another agent edited it: follow step 5 in [feature-plans.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/feature-plans.md).

## Boundaries

- Only plan, unless someone also asks you to do the work.
- Use one feature, one issue, one feature branch and one pull request. The branch can have many commits. The squash merge rule does not change.
- Do not tell the project which models, agents, languages, tools or repository hosts to use.
- Do not use a plan in place of the issue, the tests, the source code or the permanent documentation.
- Do not invent a status, a commit identifier, a test result or a decision.
- Obey the hard limits in [safety.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/safety.md).

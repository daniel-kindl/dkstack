---
name: plan-work
description: "Use when you plan a feature, a requirement or a milestone before you implement it. Writes a plan with the goal, the acceptance criteria and small reviewable increments that put tests first."
---

# Plan work

Turn an approved goal into a plan. Another agent must be able to do the plan without the original conversation.

Put the plan where the task asks: in the issue, in the pull request or in the chat.

## Steps

1. Find the goal, the acceptance criteria, the non-goals, the constraints and the known facts. If a requirement that changes the plan is not clear, use `clarify-intent`. If a map for the goal exists in `docs/maps/`, use the map. Take the goal, the acceptance criteria, the dependencies and the decisions from it. Invent none of them. See [chart-route](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/chart-route/SKILL.md).
2. Read the work that exists. Do not plan work again that is done.
3. Divide the work into the smallest increments that are complete and that a reviewer can review alone. Plan each increment as a logical conventional commit. Do not plan a fixed number of commits. For each increment, write its dependencies, its risks and how to verify it. Write full details only for the items that the known facts support. For the later items, write only the outcome. See [small steps](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/small-steps.md). For each increment, assess logging against [logging](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/logging.md). Write the result in the `Observability:` entry. For an increment that changes a rendered UI, plan the checks in the [minimum evidence](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/ui/visual-verification.md#minimum-evidence). Write them in Verification.
4. In each increment, put the tests before the behavior changes. See [tdd/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/tdd/index.md).
5. Map each acceptance criterion to a test or a check in the plan. Make sure that no item adds scope that nobody asked for.
6. After each commit, if its result shows a new fact, change the later items.
7. Before you report, compare the plan with the issue, the commits and the check results.

## Plan format

Use these headings. Add details only when they are necessary.

```markdown
# Plan: <name>
Issue: <reference or none>

## Goal
## Acceptance criteria
## In scope
## Out of scope
## Dependencies and constraints
## Decisions and open questions
## Increments

### 1. <short outcome>
Depends on: none
Proposed commit: feat(scope): summary
Tests first:
Work:
Verification:
Observability: <events added or changed, or none>
Criteria covered:
```

Write `none` when the increment needs no event.

Each increment must describe a change that has a purpose and a result that you can verify. When you learn more, change the increment boundaries.

Add a diagram only when it makes the order of the increments or the structure clearer than the text. Use [make-diagram](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/make-diagram/SKILL.md).

## More than one task

A plan can cover more than one task, for example a milestone. Each task gets its own issue. The plan issue is the issue in the `Issue` field.

- Open each task issue as a sub-issue of the plan issue. Use [start-issue](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/start-issue/SKILL.md).
- Write the task issue in the heading of each increment of that task, for example `### 2. Export the file (#161)`.
- Set the order as "blocked by" relations. When an increment depends on an increment of a different task, its task issue is blocked by that other task issue.
- Follow the [relations](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/issues.md#relations) rules.

If the `Issue` field is `none`, there is no parent. Still set the "blocked by" relations between the task issues.

## Subagents

If you can start subagents, use them for the checks that do not depend on each other. In step 7, compare the plan with the issue, with the commits and with the check results. Do the three comparisons at the same time, each in its own subagent. Give each subagent a brief that is complete without your context:

- The plan text.
- The source for its comparison: the issue text, the list of commits, or the check results.
- The full text of steps 5 to 7.
- What to report, and a word limit, for example 300 words.
- This line: "Report to me only. Do not change the plan, commit, push, post, approve or merge."

Collect the reports. Check each difference that a report gives against its source before you change the plan. If you cannot find the difference in the source, do not change the plan for it, and say so. Then update the plan yourself.

Start each subagent with the setting below. The [subagent guide](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/subagents.md) maps each tier to a model.

- Plan against the issue: tier medium, effort medium.
- Plan against the commits: tier small, effort low.
- Plan against the check results: tier small, effort low.

If you cannot start subagents, do the steps one at a time in the order of this skill.

## When a piece is missing

The steps expect an issue, automated checks and a place for the plan. If a piece is missing, use its fallback below. In the plan or in your report, say which fallback you used and why.

- No issue: write `none` in the `Issue` field. In step 1, take the goal and the acceptance criteria from the person who asked for the plan. If you cannot find them, ask. Do not invent them.
- No automated checks: run the project checks locally if you can, and record the real result. If you cannot run a check, record it as NOT RUN. A check that did not run is not a pass.
- You cannot write the plan where the task asks: give the plan in your report and say why. Ask where to put it.

## Boundaries

- Stay inside the issue scope. Do not add work that the issue does not allow.
- Record a design risk in the plan only when
  [stewardship](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/stewardship.md)
  says to analyze. Do not add that record for ordinary work.
- Only plan, unless someone also asks you to do the work.
- Use one issue, one branch and one pull request. The branch can have many commits. The squash merge rule does not change.
- Do not tell the project which models, agents, languages, tools or repository hosts to use.
- Do not use a plan in place of the issue, the tests, the source code or the permanent documentation.
- Do not invent a commit identifier, a test result or a decision.
- Obey the hard limits in [safety.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/safety.md).

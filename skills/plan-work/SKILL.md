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
4. Divide the feature into the smallest increments that are complete and that a reviewer can review alone. Plan each increment as a logical conventional commit. Do not plan a fixed number of commits. For each increment, write its dependencies, its risks and how to verify it.
5. Make sure that each acceptance criterion maps to planned work. Make sure that no item adds scope that nobody asked for.
6. When you do the work or hand it over, compare the plan with the real commits and checks. Update the status, the evidence and the next action as the shared protocol tells you.
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

## Boundaries

- Only plan, unless someone also asks you to do the work.
- Use one feature, one issue, one feature branch and one pull request. The branch can have many commits. The squash merge rule does not change.
- Do not tell the project which models, agents, languages, tools or repository hosts to use.
- Do not use a plan in place of the issue, the tests, the source code or the permanent documentation.
- Do not invent a status, a commit identifier, a test result or a decision.
- Obey the hard limits in [safety.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/safety.md).

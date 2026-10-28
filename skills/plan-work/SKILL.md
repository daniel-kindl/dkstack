---
name: plan-work
description: "Use when asked to plan a feature, requirement, or milestone for agent execution, or to create, revise, resume, or maintain a persistent feature plan. Produces a detailed Markdown plan with small logical commit-sized work items for one feature branch and pull request."
---

# Plan work

Turn an approved feature goal into a plan that another agent can execute without the original conversation.

Read [feature-plans.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/feature-plans.md) and existing relevant project plans, requirements and tasks.

## Steps

1. Determine the feature goal, acceptance criteria, non-goals, constraints and known facts. Use `clarify-intent` if a material requirement is unresolved.
2. Inspect existing work and active plans. Do not duplicate completed or already planned work.
3. Write `.plans/<feature-slug>.md`, or the documented project path, using the format below.
4. Divide the feature into the smallest coherent, reviewable increments. Plan logical Conventional Commits, not arbitrary commit counts. Identify dependencies, risks and explicit verification for each increment.
5. Check that all acceptance criteria map to planned work, and no item adds speculative scope.
6. During execution or handoff, reconcile the plan against actual commits and checks. Update status, evidence and the next action using the shared protocol.
7. Follow the shared review and cleanup protocol. Do not remove the plan just because its checklist is marked complete.

## Plan format

Use these headings; add details when justified:

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

Each commit item must describe a meaningful change and verifiable result. Put tests before behavior changes in accordance with TDD. Revise commit boundaries as evidence develops, and distinguish proposed commits from committed changes.

## Boundaries

- Plan only unless implementation is separately requested.
- One feature, one issue, one feature branch, one PR. Multiple commits on the branch; existing squash-merge policy stays in force.
- Do not prescribe models, agents, languages, tools or repository hosts.
- Do not replace the issue, tests, source code or durable documentation with a plan.
- Do not invent status, commit identifiers, test results or decisions.
- Observe the hard limits in [safety.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/safety.md).

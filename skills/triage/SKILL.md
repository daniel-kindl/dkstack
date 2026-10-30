---
name: triage
description: "Use when you start any task in a repository that uses dkstack. Selects the guidelines and skills that apply to the task."
---

# Triage

Use this skill first when you work in any repository that points to dkstack.

Decide which sections and skills apply to the current task. Read only those.

## Steps

If a feature plan exists, follow [feature-plans.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/feature-plans.md).

1. Identify the type of work: design, implementation, documentation, version control, review, workflow, or mixed.
2. Select the relevant sections and skills from the lists below.
3. Read the section index or skill, then the detailed files it links to.
4. Apply the rules. Prefer the smallest set that covers the task.
5. If the task spans multiple areas, read each relevant item.

## Skills

- New or non-compliant repository: [bootstrap](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/bootstrap/SKILL.md)
- Non-trivial change: [clarify-intent](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/clarify-intent/SKILL.md)
- Design or structure: [apply-architecture](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/apply-architecture/SKILL.md)
- Plan or resume a feature: [plan-work](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/plan-work/SKILL.md)
- Implementation: [tdd-loop](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/tdd-loop/SKILL.md)
- Review: [code-review](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md)
- Bug or unexpected behavior: [coding/debugging.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/debugging.md)
- Durable decision: [write-adr](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/write-adr/SKILL.md)
- Any text: [writing-check](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/writing-check/SKILL.md)
- Version number or release: [release](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/release/SKILL.md)

## Scale

The ladder is a guide, not a gate. Use the smallest set of skills. A small task uses one or two skills. It does not go through every step.

- Bug fix: [tdd-loop](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/tdd-loop/SKILL.md), then [code-review](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md).
- Feature: [clarify-intent](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/clarify-intent/SKILL.md), [apply-architecture](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/apply-architecture/SKILL.md), [plan-work](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/plan-work/SKILL.md), [tdd-loop](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/tdd-loop/SKILL.md), then [code-review](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md). Use [writing-check](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/writing-check/SKILL.md) when the change has text that people or agents read. Use [release](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/release/SKILL.md) only when the task is a release.
- Release: [release](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/release/SKILL.md), after the change is reviewed.

Handoffs:

- A review finding goes back to the implementation step.
- A design finding goes back to the architecture step.

One agent can do all the steps. Many agents can share the steps. A skill does not make one role into one agent.

## Section map

- Design or structure changes: [architecture/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/index.md)
- Code changes: [coding/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/index.md) and [tdd/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/tdd/index.md)
- Commits or branches: [version-control/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/version-control/index.md)
- Version numbers or releases: [versioning/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/versioning/index.md)
- Documentation, comments, or messages: [writing/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/writing/index.md)
- Any text: [writing/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/writing/index.md)
- Issues, pull requests, review, merge or release: [workflow/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/index.md)

## Rules

- Do not read every file. Read only what the task needs.
- If two dkstack rules conflict, follow the more specific rule. If a project rule conflicts with a dkstack rule, follow the precedence rules in [AGENTS.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/AGENTS.md).
- To decide between two designs that both work, use the easier to change rule in [architecture/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/index.md).
- If no section clearly applies, read [architecture/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/index.md) and [coding/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/index.md).
- After you finish, dkstack remains the source of truth.

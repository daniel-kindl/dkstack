---
name: triage
description: "Use when you start any task in a repository that uses dkstack. Selects the guidelines and skills that apply to the task."
---

# Triage

Use this skill first when you work in any repository that points to these guidelines.

Decide which sections and skills apply to the current task. Read only those.

## Steps

1. Identify the type of work: design, implementation, documentation, version control, review, workflow, or mixed.
2. Select the relevant sections and skills from the lists below.
3. Read the section index or skill, then the detailed files it links to.
4. Apply the rules. Prefer the smallest set that covers the task.
5. If the task spans multiple areas, read each relevant item.

## Skills

- New or non-compliant repository: [bootstrap](../bootstrap/SKILL.md)
- Non-trivial change: [clarify-intent](../clarify-intent/SKILL.md)
- Design or structure: [apply-architecture](../apply-architecture/SKILL.md)
- Implementation: [tdd-loop](../tdd-loop/SKILL.md)
- Review: [code-review](../code-review/SKILL.md)
- Bug or unexpected behavior: [coding/debugging.md](../../coding/debugging.md)
- Durable decision: [write-adr](../write-adr/SKILL.md)
- Any text: [writing-check](../writing-check/SKILL.md)

## Section map

- Design or structure changes: [architecture/index.md](../../architecture/index.md)
- Code changes: [coding/index.md](../../coding/index.md) and [tdd/index.md](../../tdd/index.md)
- Commits or branches: [version-control/index.md](../../version-control/index.md)
- Version numbers or releases: [versioning/index.md](../../versioning/index.md)
- Documentation, comments, or messages: [writing/index.md](../../writing/index.md)
- Any text: [writing/index.md](../../writing/index.md)
- Issues, pull requests, review, merge or release: [workflow/index.md](../../workflow/index.md)

## Rules

- Do not read every file. Read only what the task needs.
- When two rules conflict, prefer the more specific one.
- To decide between two designs that both work, use the easier to change rule in [architecture/index.md](../../architecture/index.md).
- If no section clearly applies, read [architecture/index.md](../../architecture/index.md) and [coding/index.md](../../coding/index.md).
- After you finish, the guidelines in this repository remain the source of truth.

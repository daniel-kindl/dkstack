# AGENTS.md

Read and follow the guidelines in this repository.

Start with the triage skill. It tells you which sections to read for the current task.

## Entry point

- [skills/triage/SKILL.md](skills/triage/SKILL.md): Read this first. It maps tasks to the relevant sections.

## Sections

- [architecture/index.md](architecture/index.md): Architecture principles.
- [coding/index.md](coding/index.md): Coding standards and practices.
- [tdd/index.md](tdd/index.md): Test-driven development.
- [version-control/index.md](version-control/index.md): Conventional commits and feature branches.
- [versioning/index.md](versioning/index.md): Semantic versioning.
- [writing/index.md](writing/index.md): Writing style (ASD-STE100).
- [skills/index.md](skills/index.md): Skills to apply.
- [tips/index.md](tips/index.md): Short tips.

## Authority

The content in this repository is the source of truth for coding standards, architecture rules, skills, and tips.

Do not duplicate these rules in other projects. Link to them instead.

## General rules

- Prefer the smallest change that solves the problem.
- Write tests that prove behavior.
- Make small commits with clear messages.
- Do not weaken quality gates.
- State trade-offs when a choice depends on context.
- Do not invent facts, citations, or personal experience.
- Keep components independent. Avoid hidden coupling.

## Changes

Do not change this repository from another project. To propose a rule, open an issue in
[daniel-kindl/dkstack](https://github.com/daniel-kindl/dkstack/issues) or tell the owner. The owner
approves every change.

A shared rule set must change only through review. An agent edit from another project skips that
review. See [CONTRIBUTING.md](CONTRIBUTING.md) for the change flow.

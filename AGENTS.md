# AGENTS.md

These are the dkstack guidelines for coding agents. dkstack is the repository
[daniel-kindl/dkstack](https://github.com/daniel-kindl/dkstack). Follow these guidelines in each
project that points to this file.

## Start here

1. Read [skills/triage/SKILL.md](skills/triage/SKILL.md). It tells you which sections and skills
   apply to the task.
2. Read only those sections and skills.
3. If a rule is unclear, do not guess. Ask the owner. Use
   [skills/clarify-intent/SKILL.md](skills/clarify-intent/SKILL.md).

## Version

Projects follow the `v1` branch. Read this file from this URL:

> https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/AGENTS.md

The `main` branch has changes that are not released yet. The links in this file resolve against
the ref in your URL, so you read all files on the same version. The skills link to `v1`. See
[ADR 0001](docs/adr/0001-how-consumers-follow-versions.md).

## Precedence

- A dkstack rule wins over a project rule.
- A project can differ from a dkstack rule only through a documented exception. Record the
  exception in the project's `AGENTS.md` or `CONTRIBUTING.md`. The exception names the dkstack
  rule, the project rule and the reason. For example, a project can use a `dev` branch if it
  records this exception.
- The rules in [workflow/safety.md](workflow/safety.md) have no exceptions.
  A rule that allows an action with the owner's OK is not an exception.
- If two dkstack rules conflict, follow the more specific rule.

## Hard limits

Every rule in [workflow/safety.md](workflow/safety.md) is a hard limit. For example:

- Do not force-push.
- Do not bypass branch protection or a ruleset.
- Do not start a production deploy. Only the owner starts one.
- Do not publish or release without the owner's explicit OK for that release.

## Sections

- [architecture/index.md](architecture/index.md): Architecture principles.
- [coding/index.md](coding/index.md): Coding standards and practices.
- [tdd/index.md](tdd/index.md): Test-driven development.
- [version-control/index.md](version-control/index.md): Conventional commits and feature branches.
- [versioning/index.md](versioning/index.md): Semantic versioning.
- [writing/index.md](writing/index.md): Writing style (ASD-STE100).
- [skills/index.md](skills/index.md): Skills to apply.
- [tips/index.md](tips/index.md): Short tips.
- [workflow/index.md](workflow/index.md): Workflow: work, roles, review and merge, and safety.
- [workflow/feature-plans.md](workflow/feature-plans.md): Feature plans. If a feature has a plan,
  find it and compare it with the repository before you implement.

## Key rules

- Select the smallest design that works. See [architecture/design.md](architecture/design.md).
- Consider coherence, coupling, complexity, compatibility and ease of future change while you
  work. Read [architecture/stewardship.md](architecture/stewardship.md) when triage says to read
  it.
- Write a failing test first. Tests must prove behavior. See [tdd/index.md](tdd/index.md).
- Write each commit title as a conventional commit of 50 characters or fewer. See
  [version-control/index.md](version-control/index.md).
- Never weaken a quality gate. See [coding/quality-gates.md](coding/quality-gates.md).
- Keep components independent. See [architecture/orthogonality.md](architecture/orthogonality.md).
- Do not invent facts, citations or personal experience.

## Owner

The owner of dkstack is Daniel Kindl (GitHub: `daniel-kindl`). Only the owner approves a change to
dkstack and a release of it. See [workflow/safety.md](workflow/safety.md).

## Changes

Do not change dkstack from another project. To propose a rule, open an issue in
[daniel-kindl/dkstack](https://github.com/daniel-kindl/dkstack/issues) or tell the owner.

A shared rule set must change only through review. An agent edit from another project skips that
review. See [CONTRIBUTING.md](CONTRIBUTING.md) for the change flow.

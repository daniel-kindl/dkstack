# Roles

Give each task to one role, so that each agent has one responsibility.

Status: outline. Issue #8 writes the full rules.

## Rules

This file will hold these rules:

- The responsibility of each role, in one sentence.
- What each role must not do. For example, an author does not review or merge its own work.
- One agent can hold more than one role, but never author and reviewer on the same pull request.
- The human owner approves scope, decisions and every release.

## Role map

Use the generic role names in all rules. Each team maps them to its own agents.

| Role | Responsibility | This team |
| --- | --- | --- |
| Implementer | Writes code and tests from an issue | Forge |
| Reviewer | Reviews pull requests and merges them | Sentinel |
| Architect | Writes ADRs and reviews design | Atlas |
| Writer | Writes docs and pull request text | Scribe |
| Coordinator | Plans the work and escalates to the owner | Pip |
| Human owner | Decides, approves and publishes | Daniel Kindl |

## Good example

Issue #8 adds an example.

## Bad example

Issue #8 adds an example.

Related: [review-and-merge.md](review-and-merge.md), [safety.md](safety.md).

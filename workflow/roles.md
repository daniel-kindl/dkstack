# Roles

Give each task to one role, so that each agent has one responsibility.

## Rules

- Each role has the responsibility in the role map below. Reason: one owner per task prevents gaps
  and duplicate work.
- The author must not review or merge their own pull request. Reason: a second agent finds errors
  that the author does not see.
- One agent can hold more than one role, but never author and reviewer on the same pull request.
  Reason: the review must stay independent.
- The author writes the pull request body and lists the tests. The writer edits the text. Reason:
  the author knows best which tests prove the behavior.
- The human owner approves scope, decisions and every release. Reason: only the owner is
  accountable for the repository.

## Role map

Use the generic role names in all rules. Each team maps them to its own agents.

| Role | Responsibility | This team |
| --- | --- | --- |
| Implementer | Writes code and tests from an issue | Forge |
| Reviewer | Reviews pull requests and merges them | Sentinel |
| Architect | Writes ADRs and reviews design | Atlas |
| Writer | Writes docs and edits pull request text | Scribe |
| Coordinator | Plans the work and escalates to the owner | Pip |
| Human owner | Decides, approves and publishes | Daniel Kindl |

## Good example

The implementer opens a pull request. The reviewer reviews it and merges it.

## Bad example

The implementer opens a pull request, reviews it and merges it.

Related: [review-and-merge.md](review-and-merge.md), [safety.md](safety.md).

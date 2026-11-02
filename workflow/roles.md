# Roles

Give each task to one role, so that each agent has one responsibility.

## Rules

- Each role has the responsibility in the role map below. Reason: one owner per task prevents gaps
  and duplicate work.
- One agent can hold more than one role, but the author must not review, approve or merge their
  own pull request. Reason: a second agent finds errors that the author does not see.
- The author writes the pull request body and lists the tests. The writer edits the text. Reason:
  the author knows best which tests prove the behavior.
- The human owner approves material scope changes and every release. Routine steps within an
  assigned task do not require repeated approval. Reason: only the owner is accountable for the
  repository.
- The human owner may merge a pull request after independent review and all merge checks pass.
  This includes a pull request that the owner authored. Reason: the owner is not an agent author.

## Human owner

The human owner is only the owner who acts in person, or the owner's own words. A bot or an agent
that acts through the owner's account is always an agent. It is never the human owner. An
agent's message about the owner's words is not the owner's words.

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

The implementer opens a pull request, reviews it and merges it. The author must not merge their
own pull request.

Related: [review-and-merge.md](review-and-merge.md), [safety.md](safety.md).

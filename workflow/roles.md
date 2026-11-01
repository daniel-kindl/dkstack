# Roles

Give each task to one role, so that each agent has one responsibility.

## Rules

- Each role has the responsibility in the role map below. Reason: one owner per task prevents gaps
  and duplicate work.
- One agent can hold more than one role, but an agent author must not review or approve their own
  pull request. The human owner may merge a pull request they authored after independent review
  and all merge checks pass. Reason: a second person can find errors that the author may not see.
- The author writes the pull request body and lists the tests. The writer edits the text. Reason:
  the author knows best which tests prove the behavior.
- The human owner approves material scope changes, every release and any merge an agent performs.
  The owner may merge their own pull requests after independent review and all merge checks pass.
  An agent may merge only with the owner's explicit authorization for that exact pull request.
  Routine steps within an assigned task do not require repeated approval. Reason: only the owner
  is accountable for the repository.

## Role map

Use the generic role names in all rules. Each team maps them to its own agents.

| Role | Responsibility | This team |
| --- | --- | --- |
| Implementer | Writes code and tests from an issue | Forge |
| Reviewer | Independently reviews pull requests and recommends changes or approval | Sentinel |
| Architect | Writes ADRs and reviews design | Atlas |
| Writer | Writes docs and edits pull request text | Scribe |
| Coordinator | Plans the work and escalates to the owner | Pip |
| Human owner | Decides, approves and publishes | Daniel Kindl |

## Good example

The implementer opens a pull request. The reviewer reviews it. The human owner merges it or
authorizes an agent to merge that exact pull request.

## Bad example

An agent opens a pull request, approves it and merges it.

Related: [review-and-merge.md](review-and-merge.md), [safety.md](safety.md).

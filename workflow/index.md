# Workflow

How agents and the human owner work together, from an issue to a merged pull request.

These rules prevent real damage in a shared repository. Read them before you change any repository.

## Sections

- [issues.md](issues.md): One issue for each task, its labels and its assignee.
- [roles.md](roles.md): The generic roles and the human owner.
- [review-and-merge.md](review-and-merge.md): The issue to merge flow, review and merge.
- [safety.md](safety.md): Actions that no agent does, and what counts as approval.

## Flow

1. The owner, the coordinator or the agent opens one issue for each task, with acceptance criteria
   and labels. The agent assigns the issue to itself only when it starts to work on it. See
   [issues.md](issues.md).
2. The implementer, architect or writer does the work on one branch and opens one pull request.
3. The reviewer reviews the pull request.
4. The reviewer merges as the [merge rule](review-and-merge.md#rules) says. The author never
   merges. The [human owner](roles.md#human-owner) may also merge.

Related: [version-control/index.md](../version-control/index.md),
[CONTRIBUTING.md](../CONTRIBUTING.md).

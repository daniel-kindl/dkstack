# Workflow

How agents and the owner work together, from an issue to a merged pull request.

These rules prevent real damage in a shared repository. Read them before you change any repository.

## Sections

- [issues.md](issues.md): One issue for each task, its labels and its assignee.
- [review-and-merge.md](review-and-merge.md): The issue to merge flow, review and merge.
- [safety.md](safety.md): Actions that no agent does, what counts as approval, and the owner.
- [subagents.md](subagents.md): When to start a subagent, the brief, and the model tier and effort.

## Flow

1. The owner or an agent opens one issue for each task, with acceptance criteria and labels. The
   agent assigns the issue to itself only when it starts to work on it. See
   [issues.md](issues.md).
2. The author does the work on one branch and opens one pull request. The task and the skills that
   [triage](../skills/triage/SKILL.md) selects tell the author what to do.
3. An agent that is not the author reviews the pull request. If the verdict is not
   APPROVE-RECOMMENDED, the author fixes each finding and gets a new review. See the
   [fix loop](review-and-merge.md#rules).
4. The reviewer merges as the [merge rule](review-and-merge.md#rules) says. The author never
   merges. The [owner](safety.md#owner) may also merge.

Related: [version-control/index.md](../version-control/index.md),
[CONTRIBUTING.md](../CONTRIBUTING.md).

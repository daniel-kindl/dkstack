---
name: start-issue
description: "Use when you start a task, or when you are asked to open, file or track an issue. Finds or opens one issue for the task and sets the labels. When the work on the issue starts, assigns the issue to the logged-in account and starts the branch."
---

# Start issue

Use before you change files for a task. Follow the rules in [issues](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/issues.md). Do not restate them here.

## Steps

1. Find out if the project uses an issue tracker that you can use. If it does not, use the [local files](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/issues.md#projects-without-an-issue-tracker).
2. Divide the request into tasks. Each task gets one issue.
3. For each task, search the open issues. Use an issue that exists. If none exists, open one with a goal, acceptance criteria and the labels that the rules require.
4. Set the [relations](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/issues.md#relations). If the task is a part of a larger task, make it a sub-issue of the parent issue. If it must wait for another issue, set "blocked by" on it.
5. If you only open, triage or review the issue, stop here. Do not assign it.
6. When you start to work on the issue, check its blockers. If a blocker is open, do not start. Tell the owner.
7. Then, if a different account is assigned, stop and ask the owner. Otherwise, assign the issue to the account that you are logged in as.
8. Create one branch for the issue from the default branch. See [feature branches](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/version-control/feature-branches.md).

## Boundaries

- Do not create, change or delete a label without the owner's OK.
- An assignment is not an approval. It does not change who may review or merge.
- Do not open an issue for work that the owner did not ask for.

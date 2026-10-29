# Feature plans

A feature can have one plan that stays in the repository while the work continues. Use `.plans/<feature-slug>.md`, unless the project documents a different path. The plan is a plain Markdown file on the feature branch. Keep one feature in one issue, one branch and one pull request. The branch can have small, logical commits, and the pull request still uses a squash merge.

## Find and resume a plan

1. Before you change code, find the active plan for the feature. Not every change needs a plan.
2. Read its goal, constraints, tasks, decisions and handoff note. Compare the statuses in the plan with the working tree, the commit history and the real check results. Do not trust a claim that you did not check.
3. Select the next item that is not blocked. If the plan conflicts with the code or a requirement is not clear, solve this before you start.
4. Update the plan after each important step. Record the identifiers of the commits that are done and the real check results. Record the failed checks and the checks that did not run.
5. Before you write to the plan, read its latest version. Do not overwrite the edits of another agent. If the plan changed since you read it, read the latest version again. Keep the other edits. Add your edits where they change different items. If both change the same item, record the conflict in the plan as an open question and ask.

## Status and evidence

Use `PENDING`, `IN_PROGRESS`, `BLOCKED` and `COMPLETED` for work items. The `Status` field of the feature uses the same values. Mark an item `COMPLETED` only after you commit its changes and do its required checks. A failed check or a check that did not run is not a pass. For each blocker, write what must happen to remove it. Keep a handoff note with the next action and the risks that remain.

A planned commit is a proposal. It does not say that the commit exists. A commit can contain many small TDD cycles, or one cycle can go across commits. The final pull request must pass the required quality gates. Do not say that each commit in the red phase passed all checks.

## Review and cleanup

Review the plan against the final change, the acceptance criteria of the issue and the check results. Keep the permanent decisions in an ADR or in the permanent documentation. By default, after the final review passes, remove the completed plan in a last commit on the feature branch, before the merge. The reviewers must read the plan before it is removed. A commit that only removes the plan does not need a new review. Any other change does. Do not remove a plan that is not complete or that is blocked. A project can choose to archive or keep its plans, if it says so explicitly. Removing a plan does not prove that the work is complete.

A plan helps agents work together. It does not give permission to break the dkstack safety rules or the project requirements.

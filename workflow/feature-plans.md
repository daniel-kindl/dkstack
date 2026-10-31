# Feature plans

A feature can have one plan that stays in the repository while the work continues. Use `.plans/<feature-slug>.md`, unless the project documents a different path. The plan is a plain Markdown file on the feature branch. Keep one feature in one issue, one branch and one pull request. The branch can have small, logical commits, and the pull request still uses a squash merge.

For the issue lifecycle and for map-work, see [work.md](work.md).

## Find and resume a plan

1. Before you change code, find the active plan for the feature. Not every change needs a plan.
2. Read its goal, constraints, tasks, decisions and handoff note. Compare the statuses in the plan with the working tree, the commit history and the real check results. Do not trust a claim that you did not check.
3. Select the next item that is not blocked. If the plan conflicts with the code or a requirement is not clear, solve this before you start.
4. Update the plan after each important step. Record the identifiers of the commits that are done and the real check results. Record the failed checks and the checks that did not run.
5. Before you write to the plan, read its latest version. Do not overwrite the edits of another agent. Keep the other edits. Add your edits where they change different items. If both change the same item, record the conflict in the plan as an open question and ask.

## Status and evidence

Use `PENDING`, `IN_PROGRESS`, `BLOCKED` and `COMPLETED` for work items. The `Status` field of the feature uses the same values. Mark an item `COMPLETED` only after you commit its changes and do its required checks. A failed check or a check that did not run is not a pass. For each blocker, write what must happen to remove it. Keep a handoff note with the next action and the risks that remain.

A planned commit is a proposal. It does not say that the commit exists. A commit can contain many small TDD cycles, or one cycle can go across commits. The final pull request must pass the required quality gates. Do not say that each commit in the red phase passed all checks.

## Review and cleanup

The plan guides the implementation. It is not a required part of the pull request.

When the implementation is complete and the required checks have passed, keep each durable
decision in an ADR or in the permanent documentation. Then remove the completed plan before you
open the pull request.

Do not remove a plan that is not complete or that is blocked. A project can keep or archive its
plans when it says so. By default, do not add an archive. Git history keeps the removed plan.

The reviewer uses the issue, its acceptance criteria, the pull request diff and the verification
evidence. The reviewer may read the plan when it is present and it adds context. The review does
not require the plan.

A plan does not give permission to break the dkstack safety rules or the project requirements.

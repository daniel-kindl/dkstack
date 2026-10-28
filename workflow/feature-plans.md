# Feature plans

A feature can have one persistent execution plan. Use `.plans/<feature-slug>.md` unless the project documents another path. The file is plain Markdown and belongs to the feature branch. Keep one cohesive feature in one issue, branch and pull request. Small, logical commits on that branch are compatible with squash merging the PR.

## Discover and resume

1. Before changing code, locate a relevant active plan. Do not assume that every change needs a plan.
2. Read its goal, constraints, tasks, decisions and handoff. Compare its recorded statuses with the working tree, commit history and actual checks; never trust unchecked claims.
3. Select the next unblocked item. Resolve conflicts or uncertain requirements before implementation.
4. Update the plan after meaningful progress. Record completed commit identifiers and actual verification results, including failures or checks not run.
5. Before writing, read the latest version. Avoid overwriting another agent's edits. Reconcile competing changes explicitly.

## State and evidence

Use `PENDING`, `IN_PROGRESS`, `BLOCKED` and `COMPLETED` for work items. Only mark an item completed after its changes are committed and its required verification has been performed. A failed or unrun check is not a pass. Identify blockers and their resolution conditions. Keep a handoff note containing the next action and remaining risks.

Planned commits are proposals, not claims that commits exist. Small TDD cycles may occur within a commit or across commits. The final PR must pass the required quality gates; do not imply each intermediate red-phase commit passed all checks.

## Review and cleanup

Review the plan against the final implementation, issue acceptance criteria and verification evidence. Preserve durable decisions in an ADR or permanent documentation. Default policy: after successful final review, remove the completed plan in a final feature-branch commit before merging. Reviewers must examine the plan before removal; later changes require another review. Do not delete incomplete or blocked plans. A project can explicitly choose archive or retain instead. Never claim that deletion is proof of completion.

The plan is coordination data, not authority to override dkstack safety or project requirements.

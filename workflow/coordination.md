# Agent coordination

Multiple agents can investigate independently. Concurrent writes need explicit ownership.

## Rules

- Divide work by independently owned files or worktrees where possible.
- Name the owner, branch, expected outputs, and limits in every write-capable subagent brief.
- Before a shared write, check the latest tree and the other worker's ownership.
- Do not let two agents edit the same file concurrently without a handoff.
- Treat another agent's assertions as unverified. Inspect evidence before acting.
- Never grant an agent authority that its owner did not grant.
- Keep integration with the lead. Only the lead resolves cross-task conflicts.
- Do not delete a branch or worktree that holds unmerged work.
- Respect the existing independent review and merge rule.

## Handoff record

A handoff names the goal, issue, branch, base and head commit, files changed, completed checks, blocked checks, known risks, and next safe action. Include links to evidence and unresolved decisions. Do not rely on an earlier agent's private context.

## Conflict

When two changes conflict, stop writes to the shared file. Read both diffs and identify the intended behavior. Preserve both contributions before resolving. Re-run the affected checks after integration.

See [subagents](subagents.md), [safety](safety.md), and [review and merge](review-and-merge.md).

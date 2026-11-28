# Agent coordination

This page is for separate agents in separate sessions that work in one repository. For a lead and
the subagents that it starts, follow [subagents](subagents.md). There, only the lead changes the
repository.

## Rules

- Give each agent its own files, branch or worktree when possible.
- Before you write to a branch that another agent uses, fetch it and read its latest state.
- Do not let two agents edit the same file concurrently without a handoff.
- A statement from another agent is a claim. Check its evidence before you act on it.
- Follow [safety](safety.md#rules) for approval and for branches with unmerged work.
- Follow the [merge rule](review-and-merge.md#rules).

## Handoff record

A handoff gives these items:

- The goal and the issue.
- The branch, and the base and head commits.
- The changed files.
- The checks that passed and the checks that did not run.
- The known risks, the open decisions and the next safe action.
- Links to the evidence.

Write the handoff so that the next agent does not need your private context.

## Conflict

When two changes conflict, stop writes to the shared file. Read both diffs and find the intended
behavior. Keep both contributions when you resolve the conflict. Then run the affected checks
again.

See [subagents](subagents.md), [safety](safety.md) and [review and merge](review-and-merge.md).

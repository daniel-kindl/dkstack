---
name: recover-work
description: "Use when agent work was interrupted, a tool failed after a possible write, CI is unavailable, or a shared workspace has unexpected changes. Establish state and resume safely."
---

# Recover work

Use [recovery](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/recovery.md) and [agent execution](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/agent-execution.md).

## Steps

1. Record the operation, error, and last confirmed successful step.
2. Inspect the worktree and remote state with read-only operations.
3. Find possible side effects, ownership conflicts, and changed assumptions.
4. Choose resume, repair, or stop. Explain the evidence for the choice.
5. Execute only an authorized and idempotent safe action.
6. Run affected checks. Report PASS, FAIL, and NOT RUN with evidence.
7. Give a handoff with the remaining risk and next safe action.

## Subagents

Do not start write-capable subagents during recovery. Independent read-only checks are allowed when their source and scope are explicit.

## Boundaries

- Never assume that a timeout means a remote write failed.
- Never discard unknown changes, force-push, or bypass a safety gate.
- Do not initiate releases, deploys, or infrastructure changes.
- If authority or state cannot be verified, stop and ask the owner.

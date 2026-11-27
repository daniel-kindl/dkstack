# Recovery from interrupted work

Get back to a known state before you try another write.

## Procedure

1. Capture the error and the last confirmed successful action.
2. Inspect branch, status, diff, worktrees, and recent commits without modifying files.
3. Identify which files and remote actions changed before the interruption.
4. Find out if the command failed, or if the operation stopped after a side effect.
5. Resume only after you prove that the action is safe to repeat. Step 5 does not apply to the owner actions below.
6. Re-run checks affected by recovery and report any unresolved uncertainty.

## Failure modes

- A failed build: keep the actual error. Fix its cause without weakening quality gates.
- An unavailable tool or CI: use the local checks. Report the other checks as [quality gates](../coding/quality-gates.md#rules) says.
- An ambiguous network write: read the remote state before retrying creation or deletion.
- A partial migration: stop new writes and read the migration state. Do not resume a production migration. Stop and ask the owner.
- A merge conflict: preserve the two sides and resolve against the specification.
- An unexpected change in the workspace: find its owner before you change it.

Do not resume, retry or roll back a production deploy, a production migration or a release. Stop and ask the owner.
Do not discard the changes of another agent. Follow the hard limits in [safety](safety.md#rules) while you recover.

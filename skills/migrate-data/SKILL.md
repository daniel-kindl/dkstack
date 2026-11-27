---
name: migrate-data
description: "Use when designing or implementing database schema changes, stored-format upgrades, persistent state transitions, or data backfills. Plan safe migrations, test invariants, and assess recovery."
---

# Migrate data

Read [data integrity](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/data-integrity.md).

## Steps

1. Identify old and new schemas, readers, writers, and invariant requirements.
2. Determine backward and forward compatibility, including mixed versions.
3. Choose an atomic, staged, or restartable migration strategy.
4. Define backups, restore evidence, checkpoints, and failure recovery.
5. Write migration tests using old, partial, large, and invalid fixtures.
6. Implement through [tdd-loop](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/tdd-loop/SKILL.md).
7. Test a dry run on a sanitized representative dataset.
8. Verify counts, constraints, compatibility, and rollback or forward recovery.
9. Report irreversible steps, approval needs, and checks not run.

## Boundaries

- Do not run production migrations or change infrastructure without owner approval.
- Never assume that reversing schema DDL restores lost data.
- Do not make a destructive change without tested recovery.
- Prefer non-destructive tests and isolated datasets.

## Subagents

Do not start subagents for this skill. Reason: migration steps depend on one controlled dataset and ordered checkpoints.
See the [subagent guide](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/subagents.md).

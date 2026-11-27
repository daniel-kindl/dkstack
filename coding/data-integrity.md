# Data integrity and migration

Stored data has a longer lifetime than the code that writes it.

## Rules

- Define invariants, ownership, retention, recovery objective, and affected versions.
- Identify readers and writers before changing a schema or persisted format.
- Use transactions where atomicity is required and supported.
- Handle concurrent writers with a documented isolation or conflict policy.
- Design migrations to be restartable or provide a recoverable checkpoint.
- Use expand-migrate-contract for incompatible rolling updates when applicable.
- Back up data before destructive operations. Verify that restoration works.
- Test empty, old, partial, corrupt, and large datasets with safe fixtures.
- Define rollback only if the previous version can still read the new state.
- For irreversible migrations, provide forward recovery and require owner approval.
- Never run a production data migration without owner authorization.

## Verification

Record the initial data version, migration step, invariant checks, row counts or checksums where useful, and restored test result. Run against representative sanitized copies before affecting actual data.

See [data migration testing](../tdd/data-migration-testing.md) and [safety](../workflow/safety.md).

# Data integrity and migration

Stored data has a longer lifetime than the code that writes it.

## Rules

- Define invariants, ownership, retention and affected versions. Also define the time and the data that a restore can lose.
- Identify readers and writers before changing a schema or persisted format.
- Use transactions where atomicity is required and supported.
- Handle concurrent writers with a documented isolation or conflict policy.
- Design migrations to be restartable or provide a recoverable checkpoint.
- For a rolling update, use expand and contract. See [data migration testing](../tdd/data-migration-testing.md#database-migrations).
- Back up data before a destructive operation. Test the backup as [data migration testing](../tdd/data-migration-testing.md#backups) says.
- Define rollback only if the previous version can still read the new state.
- For an irreversible migration, provide forward recovery.

## Production migrations

- Do not run production migrations before you test the rollback and verify a backup.
- After the migration, tell the owner what ran, the result, the rollback test result and the backup check.
- Only the owner starts a production deploy. See [safety](../workflow/safety.md#rules).

## Verification

Record the initial data version, the migration step, the invariant checks and the restore test result. Record row counts or checksums for large tables. Run the migration on sanitized copies before you change real data.

See [data migration testing](../tdd/data-migration-testing.md) and [safety](../workflow/safety.md).

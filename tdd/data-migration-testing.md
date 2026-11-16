# Data and migration testing

Test that the code reads each stored format and schema version that a release wrote. Stored data lives longer than the code that wrote it.

## Stored formats

- Keep one fixture for each old format version. Keep it forever. Do not make it again with the current code. Reason: a new copy shows the current writer, not the old data.
- Test that the code reads each old version.
- Test that the code writes only the current version.
- Test that the code refuses an unknown version or a newer version. Make sure that the file stays unchanged.
- Test that a failed migration leaves the stored data unchanged.
- Stop an atomic write before it ends. Make sure that the old file stays complete and unchanged.
- Where the project keeps a copy of the old file before a migration, keep that copy. Test that it matches the old file.

## Backups

- Test the backup round trip. Make a backup, restore it and compare the result with the original data.
- Keep one fixture for each old backup version. Test that the code restores each one.

## Database migrations

- Run each up migration on a copy of a database with real-shaped data. Real-shaped data has the structure, types and sizes of production data, with invented values.
- Test that the migration keeps the data. Compare the record counts and the important values before and after the migration.
- Test the down migration only if the project supports down migrations.

Run these tests at the [integration level](test-levels.md#integration-tests). For personal data and secrets in fixtures, follow [incidents and regressions](regression-testing.md#incidents-and-regressions).

## Example

A library file stores a list of entries. Version 1 has a `label` field. Version 2 splits `label` into `heading` and `byline`. Version 3 adds a `labels` list.

Good: keep the version 1, 2 and 3 fixtures that the old releases wrote. Test that each one loads into the current model. Test that a save writes version 3 only. Test that a version 4 file gives a clear error and stays unchanged.

Bad: make the old fixtures again with the current writer after each change. Test only version 3. Let a save replace a version 4 file with version 3 data.

Related: [regression testing](regression-testing.md), [test isolation](test-isolation.md), [property testing](property-testing.md).

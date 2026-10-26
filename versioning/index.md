# Versioning

Use semantic versioning (SemVer).

Version numbers communicate the impact of a change.

## Rules

- Format: `MAJOR.MINOR.PATCH`
- Increment MAJOR when you make an incompatible change.
- Increment MINOR when you add functionality in a compatible way.
- Increment PATCH when you make a compatible bug fix.
- Pre-release versions use a hyphen: `1.0.0-alpha.1`.
- Do not change a released version. Release a new version instead.
- Document breaking changes clearly.

## Good example

Current version is `1.2.3`.

- You fix a bug that does not change the public interface. Release `1.2.4`.
- You add a new optional parameter. Release `1.3.0`.
- You remove or rename a required parameter. Release `2.0.0`.

Consumers know what to expect from the number.

## Bad example

You remove a required parameter and release `1.2.4`.

Consumers who update receive a breaking change without a major version bump. Their code breaks unexpectedly.

## Another good example

You add a feature and fix a bug in the same release. You bump the minor version and note both changes.

## Another bad example

You use version numbers that do not follow the rules (for example, incrementing patch for a breaking change, or skipping numbers without reason).

Consumers cannot trust the version number.

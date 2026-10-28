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

## Release dkstack

These steps are for the dkstack repository only. A consumer repository does not use them.

No bot pushes to `v1` or creates a release tag. Only Daniel does this, by hand.

dkstack releases follow [ADR 0001](../docs/adr/0001-how-consumers-follow-versions.md), option C2.

1. At the first release, add a ruleset on `v1` that blocks force-push and deletion.
   Do this before the first push to `v1`.
2. If the release day is not the date in `CHANGELOG.md`, update the date in a pull request.
3. Move `v1` forward to the release commit with a fast-forward push:
   `git push origin <release-sha>:refs/heads/v1`. Do not force-push.
4. Create the fixed `vX.Y.Z` tag on the release commit.
5. Run `npx skills add https://github.com/daniel-kindl/dkstack/tree/v1 --list`.
   Make sure that it lists every skill.

## Roll back a dkstack release

1. Revert the change on `main` with a pull request.
2. Release a PATCH. Move `v1` forward again with the release steps.
3. Do not move `v1` back.

As an emergency step, a consumer can pin the last good `vX.Y.Z` tag. It goes back to `v1` after
the fix.

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

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

dkstack releases follow [ADR 0001](../docs/adr/0001-how-consumers-follow-versions.md), option C2.
The `Release` workflow ([release.yml](../.github/workflows/release.yml)) does the full release.

Only Daniel starts the `Release` workflow. When Daniel starts it, he gives his OK for the release
that the workflow works out from the commits. No bot starts it. No bot pushes to `v1` or creates a
release tag in another way. See [workflow/safety.md](../workflow/safety.md).

### One-time setup

The workflow uses only `GITHUB_TOKEN`. It uses no app, no personal token and no ruleset bypass.
Daniel does this step one time, in the repository settings:

- In Settings, Actions, General, Workflow permissions, select "Allow GitHub Actions to create and
  approve pull requests". Keep "Read repository contents and packages permissions" as the default.
  Without this setting, the workflow cannot open the release pull request. The workflow asks for
  its write permissions in the job.

### Start a release

1. In Actions, select `Release`, then "Run workflow". Select the branch `main`.
2. Keep `bump` at `auto`, or select `patch` or `minor`. The input can raise the version. It cannot
   lower it.
3. Start the run. The workflow does the steps below. It stops at the first step that fails.

The workflow steps:

1. It stops if the last release is not complete. See [Finish a release](#finish-a-release).
2. It finds the latest `v1.x.y` tag and the commits on `main` since that tag. If there are no
   commits, it stops.
3. It works out the version. A `feat` commit gives MINOR. All other types give PATCH. A breaking
   change (`!` or `BREAKING CHANGE:`) stops the run, because a major release needs Daniel. The
   workflow never releases `v2`.
4. It moves the `[Unreleased]` notes in `CHANGELOG.md` to `## [X.Y.Z] - YYYY-MM-DD`, with the date
   in Prague. If `[Unreleased]` is empty, it writes entries from the commit titles. It sets
   `version` in `package.json`. Then it runs `npm run check`.
5. It pushes the branch `release/vX.Y.Z` with the commit `chore(release): prepare vX.Y.Z`. It opens
   a pull request to `main`.
6. It starts `validate` on the branch and waits for the result. A pull request that
   `GITHUB_TOKEN` opens starts no workflow, but a `workflow_dispatch` event does. The `validate`
   check of that run reports on the head commit of the pull request. `protect-main` requires this
   check.
7. It makes sure that `main` did not move. Then it squash-merges the pull request.
   `protect-main` applies in full.
8. It makes sure that the merge commit follows the start commit and has the validated files.
9. It creates the annotated tag `vX.Y.Z` on the merge commit.
10. It publishes the GitHub release, with the `CHANGELOG.md` section as the notes.
11. It moves `v1` to the merge commit with a fast-forward push. It never force-pushes.

After the release, you can run `npx skills add https://github.com/daniel-kindl/dkstack/tree/v1 --list`.
Make sure that it lists every skill.

### If a run fails

- A failure before the merge leaves `main`, the tags and `v1` as they were. The release pull
  request and its branch can stay. Close the pull request and delete the branch
  `release/vX.Y.Z`. Then start `Release` again.
- A failure after the merge leaves the release commit on `main`. The run summary says this.
  Finish the release by hand. Until you do, a new run stops at step 1.

### Finish a release

Do these steps in a checkout of dkstack with the latest `main`. Set `V` to the version, for
example `V=1.4.0`. Set `SHA` to the merge commit of the release pull request:
`SHA=$(git log -1 --format=%H --grep "^chore(release): prepare v$V" origin/main)`.

1. If the tag `v$V` does not exist, create it and push it:
   `git tag -a "v$V" "$SHA" -m "v$V"`, then `git push origin "v$V"`.
2. If the GitHub release does not exist, create it:
   `node scripts/release.mjs notes "$V" > notes.md`, then
   `gh release create "v$V" --verify-tag --title "v$V" --notes-file notes.md`.
3. If `v1` does not contain the tag, move `v1` with a fast-forward push:
   `git push origin "v$V^{commit}:refs/heads/v1"`. Do not force-push.

`GITHUB_TOKEN` cannot change workflow files. GitHub can refuse a push of `v1` with
`GITHUB_TOKEN` when the release has a change to a file in `.github/workflows`. Then do step 3 by
hand.

The rulesets stay as they are. `protect-release-tags` blocks deletion and update of `refs/tags/v*`.
`protect-v1` blocks deletion and non-fast-forward pushes on `v1`.

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

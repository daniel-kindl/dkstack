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

Only Daniel starts the `Release` workflow. The workflow has two jobs. The `plan` job is read-only.
It works out the version and shows it in the run summary. The `release` job does all the writes.
It runs in the `release` environment, so it waits until Daniel approves it. Daniel's OK for a
release is two actions: he starts `Release`, and he approves the `release` environment after he
reads the planned version in the run summary. No bot starts the workflow or approves the
environment. No bot pushes to `v1` or creates a release tag in another way. See
[workflow/safety.md](../workflow/safety.md).

### One-time setup

The workflow uses only `GITHUB_TOKEN`. It uses no app, no personal token and no ruleset bypass.
Daniel does these steps one time, in the repository settings:

1. In Settings, Actions, General, Workflow permissions, select "Allow GitHub Actions to create and
   approve pull requests". Keep "Read repository contents and packages permissions" as the
   default. Without this setting, the workflow cannot open the release pull request. The workflow
   asks for its write permissions in the job.
2. In Settings, Environments, create the environment `release`:
   - Required reviewers: `daniel-kindl`.
   - "Prevent self-review": off. Daniel starts the run, so he must be able to approve it.
   - Deployment branches and tags: "Selected branches and tags", with the one branch rule `main`.
   - Add no secrets. The workflow needs none.

The `plan` job reads the environment and stops if it does not have this setup. A job that names
an environment that does not exist gets a new environment with no protection. This check stops
the run before that can occur.

### Start a release

1. In Actions, select `Release`, then "Run workflow". Select the branch `main`.
2. Keep `bump` at `auto`, or select `patch` or `minor`. The input can raise the version. It cannot
   lower it.
3. Start the run.
4. When the `plan` job is done, read the run summary. It shows the version, the previous release
   and the commits.
5. If the version is correct, approve the `release` environment ("Review deployments"). If it is
   not correct, reject it. A rejected run writes nothing.

The `plan` job steps:

1. It stops if the last release is not complete. See [Finish a release](#finish-a-release).
2. It finds the latest `v1.x.y` tag and the commits on `main` since that tag. If there are no
   commits, it stops.
3. It works out the version. A `feat` commit gives MINOR. All other types give PATCH. A breaking
   change (`!` or `BREAKING CHANGE:`) stops the run, because a major release needs Daniel. The
   workflow never releases `v2`.
4. It writes the version and the commits to the run summary.
5. It stops if the `release` environment does not have the one-time setup.

The `release` job starts only after Daniel approves the environment. Its steps:

1. It does the checks of `plan` steps 1 to 3 again. It stops if the version is not the planned
   version.
2. It moves the `[Unreleased]` notes in `CHANGELOG.md` to `## [X.Y.Z] - YYYY-MM-DD`, with the date
   in Prague. If `[Unreleased]` is empty, it writes entries from the commit titles. It sets
   `version` in `package.json`. Then it runs `npm run check`.
3. It pushes the branch `release/vX.Y.Z` with the commit `chore(release): prepare vX.Y.Z`. It opens
   a pull request to `main`.
4. It starts `validate` on the branch by `workflow_dispatch` and waits for the result. When the
   run passes, the job creates the check run `validate` on the head commit of the pull request
   with the Checks API. `protect-main` requires this check. The check run comes from the GitHub
   Actions app, because `GITHUB_TOKEN` creates it. The job creates it only for a passed
   `workflow_dispatch` run of `validate.yml` on that commit. The reasons:
   - The `pull_request` run of `validate` waits for approval, because `github-actions[bot]` is a
     first-time contributor. The pull request shows "workflows awaiting approval". Do not approve
     it. The release does not need it.
   - GitHub does not count the check runs of a `workflow_dispatch` run for a pull request. They
     are not in the status check rollup. Run 43070086329 stopped for this reason.
5. It makes sure that `main` did not move. Then it squash-merges the pull request.
   `protect-main` applies in full.
6. It makes sure that the merge commit follows the start commit and has the validated files.
7. It creates the annotated tag `vX.Y.Z` on the merge commit.
8. It publishes the GitHub release, with the `CHANGELOG.md` section as the notes.
9. It moves `v1` to the merge commit with a fast-forward push. It never force-pushes.

After the release, you can run `npx skills add https://github.com/daniel-kindl/dkstack/tree/v1 --list`.
Make sure that it lists every skill.

### If a run fails

- A failure in `plan`, or a rejected approval, writes nothing.
- A failure before the merge leaves `main`, the tags and `v1` as they were. The job closes the
  release pull request. It deletes the branch `release/vX.Y.Z` if the branch is still at the
  release commit. The run summary says this. If the merge was blocked, the log shows the merge
  state and the checks. Fix the cause, then start `Release` again. If the branch still exists,
  delete it first, or the push of the new release branch fails.
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

`GITHUB_TOKEN` cannot change workflow files. GitHub refuses a push of `v1` with `GITHUB_TOKEN`
when the release has a change to a file in `.github/workflows`. Then the tag and the GitHub
release exist, but `v1` does not move. This is not a bug. Do step 3 by hand.

The next release after the one-click release was added needs step 3 by hand. That change edited
`.github/workflows`, and `v1` is still at `v1.3.0`.

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

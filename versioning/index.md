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

The `release` job does its writes with a token from the GitHub App of dkstack releases. The
token is for dkstack only, with three permissions only. The job uses no personal token and no
ruleset bypass. `GITHUB_TOKEN` only reads. Daniel set up the app on 2026-11-11 (#135). The
setup, for a check or a new app:

1. The GitHub App:
   - Repository permissions: Contents "Read and write", Pull requests "Read and write" and
     Workflows "Read and write". GitHub adds Metadata "Read-only". Give no other permission.
   - Installed on dkstack only ("Only select repositories").
   - The app is in no bypass list. Do not add it to the bypass list of a ruleset. Then
     `protect-main` requires `validate` for the release pull request, as for all pull requests.
2. In Settings, Environments, the environment `release`:
   - Required reviewers: `daniel-kindl`.
   - "Prevent self-review": off. Daniel starts the run, so he must be able to approve it.
   - Deployment branches and tags: "Selected branches and tags", with the one branch rule `main`.
   - Environment secrets: `RELEASE_APP_ID` (the App ID of the app) and `RELEASE_APP_PRIVATE_KEY`
     (a private key of the app, the full `.pem` text). Add them to the environment, not to the
     repository. Then only the `release` job gets them, after Daniel approves it.

The `plan` job reads the environment and stops if it does not have the reviewer and the branch
rule. A job that names an environment that does not exist gets a new environment with no
protection. This check stops the run before that can occur. The `plan` job cannot read the
secrets. If a secret is missing or wrong, the step "Get a token from the release app" fails and
the job writes nothing.

The workflow does not need "Allow GitHub Actions to create and approve pull requests", because
`GITHUB_TOKEN` does not open the pull request.

To change a key: generate a new private key in the app settings, replace
`RELEASE_APP_PRIVATE_KEY` in the `release` environment, then delete the old key in the app
settings.

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
   `version` in `package.json`. Then it runs `npm run check`. This is the last step that runs
   repository code.
3. It gets a token from the release app. The steps that write use this token. They run only
   `git` and `gh`.
4. It pushes the branch `release/vX.Y.Z` with the commit `chore(release): prepare vX.Y.Z`. It opens
   a pull request to `main`. The app opens it, so the normal `pull_request` run of `validate`
   starts.
5. It waits for this run of `validate`. If the run waits for approval, the job stops. It does not
   approve the run. See [If validate waits for approval](#if-validate-waits-for-approval).
6. It makes sure that `main` did not move and that `protect-main` lets the pull request merge.
   Then it squash-merges the pull request, only at the validated commit. `protect-main` applies
   in full.
7. It makes sure that the merge commit follows the start commit and has the validated files.
8. It creates the annotated tag `vX.Y.Z` on the merge commit.
9. It publishes the GitHub release, with the `CHANGELOG.md` section as the notes.
10. It moves `v1` to the merge commit with a fast-forward push. It never force-pushes. The app
    has Workflows "Read and write", so this push also works when the release changes a file in
    `.github/workflows`.

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

### If validate waits for approval

The error is "validate on pull request #N waits for approval". The job closed the pull request.
Nothing was merged or tagged. The job never approves a workflow run, and no agent does.

The setting is in Settings, Actions, General, "Approval for running fork pull request workflows
from contributors". The GitHub documentation puts this setting under "Controlling changes from
forks to workflows in public repositories". The release pull request does not come from a fork,
but GitHub also checks the user that created the pull request. Daniel decides what to do. Then he
starts `Release` again. Do not approve the run of the closed pull request: the job does not merge
it.

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

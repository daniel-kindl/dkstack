# Dependencies

Do not add unjustified dependencies.

## Rules

- Add a dependency only when it provides clear value you cannot reasonably build.
- Prefer the standard library or existing code when it is sufficient.
- Evaluate the cost: maintenance, security, size, and license.
- Remove a dependency when it is no longer needed.
- Pin versions for reproducibility.

## Supply chain rules

Apply these rules to every repository that uses GitHub Actions or a package manager.

- Pin each GitHub Action to a full commit SHA. Put the version in a comment on the same line, for example `uses: actions/checkout@<sha> # v4.2.2`. Reason: a tag can move to other code, but a commit SHA cannot change.
- Add Dependabot for the package ecosystem and for `github-actions`. Reason: pinned versions do not update themselves, so you need a tool that proposes security fixes.
- Run `npm audit`, or the equivalent for your ecosystem, in CI. Make the job fail on high or critical findings. Reason: a known vulnerability must stop the change before it merges.
- Commit the lockfile. Reason: each install then gets the same dependency versions, and a reviewer can see each version change.
- Set `permissions:` to least privilege in every workflow. Reason: if an attacker controls a step, the token can do only what the workflow needs.

## Dependabot auto-merge

The owner decided on 2026-11-12 that his repositories merge a Dependabot patch or minor update
automatically. A major update waits for the owner. Set up each new repository as follows:

1. Ask the owner to turn on "Allow auto-merge" in the repository settings. If the repository
   allows only selected actions, also ask the owner to add `dependabot/fetch-metadata@*` to the
   allowed actions. Without it, the workflow fails at startup on each pull request. Only the owner
   changes a setting. See [workflow/safety.md](../workflow/safety.md).
2. Protect the branch that Dependabot targets with a ruleset or a branch protection rule. Require
   the CI checks. Keep the required approvals at 0, or each Dependabot pull request waits for an
   approval that no person gives.
3. Copy [the auto-merge workflow of dkstack](../.github/workflows/dependabot-auto-merge.yml). Set
   its branch to the branch that Dependabot targets. Do not change the trigger, the actor check,
   the permissions or the update types.
4. Give each Dependabot entry a `commit-message` prefix, for example `ci` for `github-actions`.
   Then each title is a conventional commit.

Rules:

- Turn on auto-merge only for a patch or a minor update. Reason: a major update can change the
  API, so the owner reads it first.
- The required checks gate the merge. The workflow stops with an error when no rule of the base
  branch blocks the merge. Reason: if nothing blocks the merge, `gh pr merge --auto` merges at once,
  before CI passes.
- Start the workflow on `pull_request`, not on `pull_request_target`. Do not check out code. Run
  the job only when `dependabot[bot]` opened the pull request and sent the event. Reason: the job
  has write access, so it must not run code from the pull request or run for a person.
- Give the job only `contents: write` and `pull-requests: write`. Use `github.token`. Do not use
  a secret. Reason: Dependabot runs get a read-only token, and the job permissions give it only
  the access to turn on auto-merge.
- Do not add the workflow or its token to a bypass list. Reason: the merge must pass the same rules
  as each other pull request.
- A merge by `GITHUB_TOKEN` does not start a `push` workflow. So a deploy or a publish on a push
  does not run after a Dependabot merge. The next merge by a person, or a manual run, includes the
  update. Use an app token or another trigger only with the owner's OK. Reason: only the owner
  starts a production deploy.
- A long dependency name can make the title longer than 50 characters. A title check then fails
  and the pull request stays open. The owner then shortens the title.

## Good example

You need date formatting. The standard library already provides it. You use the standard library.

## Bad example

You add a large library for a single simple function that the standard library or ten lines of code can provide.

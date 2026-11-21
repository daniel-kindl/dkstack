# Dependencies

Do not add unjustified dependencies.

## Rules

- Add a dependency only when it provides clear value you cannot reasonably build.
- Prefer the standard library or existing code when it is sufficient.
- Evaluate the cost: maintenance, security, size, and license.
- Remove a dependency when it is no longer needed.
- Pin versions for reproducibility.

## Supply chain rules

Apply these rules to every repository that uses CI or a package manager. The examples use GitHub
Actions, Dependabot and npm. Use the equivalent for your tools.

- Pin each third-party CI action or reusable CI step to a full commit SHA. Put the version in a
  comment on the same line, for example `uses: actions/checkout@<sha> # v4.2.2`. Get the SHA from
  the release tag on the code host. Do not refer to an action by a branch name or a version tag.
  Reason: a tag can move to other code, but a commit SHA cannot change.
- Commit the lockfile of the package manager. Reason: each install then gets the same dependency
  versions, and a reviewer can see each version change.
- In CI, install from the lockfile only. Use the mode that fails when the lockfile does not agree
  with the dependency list, for example `npm ci`. Reason: CI must test the versions in the
  lockfile.
- Run a vulnerability audit of the dependencies in CI on every pull request, for example
  `npm audit`. Make the job fail on high or critical findings. Reason: a known vulnerability must
  stop the change before it merges.
- Turn on automated dependency update proposals and vulnerability alerts, for example Dependabot.
  Cover the package dependencies and the pinned CI actions. Check for updates at least weekly.
  Reason: pinned versions do not update themselves.
- Set the update tool so that its titles pass the title check of the project, for example with a
  `ci` or `build` prefix. Edit a title that is too long before the merge. Reason: an update must
  pass the same checks as each other change.
- Give each CI job the least privilege that it needs. Set the default token permission to
  read-only for the repository contents. Give a write permission only to the job that needs it.
  Reason: if an attacker controls a step, the token can do only what the job needs.

## Good example

You need date formatting. The standard library already provides it. You use the standard library.

## Bad example

You add a large library for a single simple function that the standard library or ten lines of code can provide.

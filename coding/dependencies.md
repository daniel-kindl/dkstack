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

## Good example

You need date formatting. The standard library already provides it. You use the standard library.

## Bad example

You add a large library for a single simple function that the standard library or ten lines of code can provide.

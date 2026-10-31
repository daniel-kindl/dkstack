---
name: bootstrap
description: "Use when you create a new repository or a repository has no commit, branch or version rules yet. Sets up conventional commits, short-lived branches, semver, strict editorconfig, warnings as errors, deterministic checks and supply chain rules."
---

# Bootstrap

Use when you set up a new repository or bring an existing one up to standard.

Apply the rules from version-control, versioning, and coding sections. Steps 7 to 11 apply the supply chain rules in [coding/dependencies.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/dependencies.md).

## Steps

1. Add or update `.editorconfig` with strict settings:
   - `root = true`
   - `charset = utf-8`
   - `end_of_line = lf`
   - `indent_style = space`
   - `trim_trailing_whitespace = true`
   - `insert_final_newline = true`
   - Language-specific indent sizes as needed
   - `trim_trailing_whitespace = false` for Markdown

2. Configure the build so warnings are errors and the build produces zero warnings and zero hints.
   - Set the compiler or build option that treats warnings as errors.
   - If the language has no such option, add a CI check that fails on any warning.

3. Set up CI that:
   - Runs on every push to the default branch and on every pull request
   - Installs dependencies
   - Runs the full check (build, test, lint)
   - Fails if any warning or error appears

4. Document conventional commits and short-lived feature branches in the repo README or AGENTS.md.
   - Point to https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/version-control/index.md

5. Set up semantic versioning.
   - Put the version in the project manifest.
   - Add `CHANGELOG.md`.
   - Point to https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/versioning/index.md

6. Ensure deterministic checks:
   - Pin dependency versions where practical.
   - Make test and build output stable.
   - Fail the build on any non-zero warning count.
   - Follow [coding/naming.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/naming.md).
     Configure naming rules that native tools can check reliably, such as supported Roslyn,
     ESLint or Ruff rules. Run those checks in CI as errors. An `.editorconfig` file alone does
     not enforce naming in every language. Leave unsupported or semantic rules to review.

7. Pin each third-party CI action or reusable CI step to a full commit SHA.
   - Put the version in a comment on the same line.
   - Get the SHA from the release tag on the code host. Do not use the tag itself, because a tag can move to other code.
   - Do not refer to an action by a branch name or a version tag.

8. Give each CI job the least privilege that it needs.
   - Set the default token permission to read-only for the repository contents.
   - Do not give all permissions. Give a write permission only to the one job that needs it.
   - Do not keep credentials in the checked-out code when a later step does not need them.

9. Commit the lockfile of the package manager.
   - Install the dependencies once with the package manager. Then commit the lockfile that it writes.
   - In CI, install from the lockfile only. Use the package manager mode that fails when the lockfile does not agree with the dependency list.

10. Run a vulnerability audit of the dependencies in CI on every pull request.
    - Use the audit command of the package manager, or a dependency audit tool for the ecosystem.
    - Make the job fail on high or critical findings.

11. Turn on automated dependency update proposals and vulnerability alerts.
    - Cover the dependencies of the package manager.
    - Cover the pinned CI actions from step 7, because pinned versions do not update themselves.
    - Check for updates at least weekly.

12. Run the tracker preflight before you change the tracker.
    - Read [preflight.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/preflight.md).
    - Run scripts/preflight.mjs with no arguments. The command discovers the tracker for this
      repository. The default is a dry run.
    - Report each unsupported capability and its fallback. Report each unverified capability. Do not report an unverified capability as unsupported.
    - Run scripts/preflight.mjs --apply to create missing labels. That run creates only the missing catalog labels. It does not change an existing label. It does not remove a label. Do not pass a report file with --apply.
    - Do not change protection, settings or infrastructure.
    - Run scripts/preflight.mjs again with no arguments. The second plan has no new create.

## Rules

- Do not weaken existing quality gates.
- Prefer the smallest change that brings the repo into compliance.
- After bootstrap, the repository must produce a clean build with zero warnings.

See also:
- [version-control/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/version-control/index.md)
- [versioning/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/versioning/index.md)
- [coding/quality-gates.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/quality-gates.md)
- [coding/dependencies.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/dependencies.md)

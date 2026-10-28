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
   - .NET: `<TreatWarningsAsErrors>true</TreatWarningsAsErrors>`
   - Other languages: equivalent flag or CI check that fails on warnings

3. Add a basic CI workflow that:
   - Runs on push and pull request
   - Installs dependencies
   - Runs the full check (build, test, lint)
   - Fails if any warning or error appears

4. Document conventional commits and short-lived feature branches in the repo README or AGENTS.md.
   - Point to https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/version-control/index.md

5. Set up semantic versioning.
   - Add or update `package.json` / equivalent with a version.
   - Add `CHANGELOG.md`.
   - Point to https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/versioning/index.md

6. Ensure deterministic checks:
   - Pin dependency versions where practical.
   - Make test and build output stable.
   - Fail the build on any non-zero warning count.

7. Pin each GitHub Action to a full commit SHA, with the version in a comment.
   - File: each workflow in `.github/workflows/`, for example `.github/workflows/ci.yml` below.
   - Get the SHA of a release tag: `gh api repos/actions/checkout/commits/v7.0.1 --jq .sha`
   - Write it as `uses: actions/checkout@<40-character SHA> # v7.0.1`.

   ```yaml
   # .github/workflows/ci.yml
   name: ci

   on:
     pull_request:
     push:
       branches: [main]

   permissions:
     contents: read

   jobs:
     check:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
           with:
             persist-credentials: false
         - uses: actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1 # v7.1.0
           with:
             node-version: 24
         - run: npm ci
         - run: npm audit --audit-level=high
         - run: npm test
   ```

8. Set `permissions:` to least privilege in every workflow.
   - File: each workflow in `.github/workflows/`.
   - At the top level, set `permissions: contents: read`, as in `.github/workflows/ci.yml` above.
   - Do not use `write-all`. Give a `write` permission only to the one job that needs it.

9. Commit the lockfile.
   - Command: `npm install`, then `git add package-lock.json` and commit it.
   - In CI, install with `npm ci`, as in `.github/workflows/ci.yml` above. `npm ci` fails when the lockfile does not agree with `package.json`.
   - Other ecosystems: commit their lockfile, for example `yarn.lock`, `pnpm-lock.yaml`, `Cargo.lock` or `packages.lock.json`.

10. Run `npm audit` in CI, and fail on high or critical findings.
    - Command: `npm audit --audit-level=high`, as a step in `.github/workflows/ci.yml` above.
    - Other ecosystems: use the equivalent, for example `dotnet list package --vulnerable` or `pip-audit`.

11. Add Dependabot for the package ecosystem and for `github-actions`.
    - File: `.github/dependabot.yml`

    ```yaml
    # .github/dependabot.yml
    version: 2
    updates:
      - package-ecosystem: "npm"
        directory: "/"
        schedule:
          interval: "weekly"
      - package-ecosystem: "github-actions"
        directory: "/"
        schedule:
          interval: "weekly"
    ```

    - Other ecosystems: change `"npm"` to the ecosystem, for example `"nuget"`, `"pip"` or `"cargo"`.

## Rules

- Do not weaken existing quality gates.
- Prefer the smallest change that brings the repo into compliance.
- After bootstrap, the repository must produce a clean build with zero warnings.

See also:
- [version-control/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/version-control/index.md)
- [versioning/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/versioning/index.md)
- [coding/quality-gates.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/quality-gates.md)
- [coding/dependencies.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/dependencies.md)

---
name: bootstrap
description: Bootstrap a repository with conventional commits, short-lived branches, semver, strict editorconfig, warnings-as-errors, and deterministic checks.
---

# Bootstrap

Use when you set up a new repository or bring an existing one up to standard.

Apply the rules from version-control, versioning, and coding sections.

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
   - Point to https://raw.githubusercontent.com/daniel-kindl/dkstack/main/version-control/index.md

5. Set up semantic versioning.
   - Add or update `package.json` / equivalent with a version.
   - Add `CHANGELOG.md`.
   - Point to https://raw.githubusercontent.com/daniel-kindl/dkstack/main/versioning/index.md

6. Ensure deterministic checks:
   - Pin dependency versions where practical.
   - Make test and build output stable.
   - Fail the build on any non-zero warning count.

## Rules

- Do not weaken existing quality gates.
- Prefer the smallest change that brings the repo into compliance.
- After bootstrap, the repository must produce a clean build with zero warnings.

See also:
- [version-control/index.md](../version-control/index.md)
- [versioning/index.md](../versioning/index.md)
- [coding/quality-gates.md](../coding/quality-gates.md)

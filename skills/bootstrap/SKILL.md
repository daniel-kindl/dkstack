---
name: bootstrap
description: "Use when you create a new repository or a repository has no commit, branch or version rules yet. Sets up conventional commits, short-lived branches, semver, strict editorconfig, warnings as errors, deterministic checks and supply chain rules."
---

# Bootstrap

Use when you set up a new repository or bring an existing one up to standard.

Apply the rules from version-control, versioning, and coding sections. Step 7 applies the supply chain rules in [coding/dependencies.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/dependencies.md#supply-chain-rules).

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
   - Follow [brace style](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/brace-style.md).
     For C# tools that read Roslyn settings, add `[*.cs]` with
     `csharp_new_line_before_open_brace = all`. For C and C++ with clang-format, merge
     `BreakBeforeBraces: Allman` into `.clang-format`. Check the result with the selected
     formatter and enforce it in CI. Keep Go on `gofmt` and use the documented exceptions.
     EditorConfig has no standard brace-placement property. If the tool has no supported
     setting, record the preference as documentation only. Keep existing quality gates.
   - Also add `.gitattributes` with `* text=auto eol=lf`, so that each checkout has LF line
     endings. `end_of_line` in `.editorconfig` does not change the files that Git checks out.

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

7. Apply the [supply chain rules](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/dependencies.md#supply-chain-rules).
   - Do not keep credentials in the checked-out code when a later step does not need them.

## Rules

- Do not weaken existing quality gates.
- Prefer the smallest change that brings the repo into compliance.
- After bootstrap, the repository must produce a clean build with zero warnings.

See also:
- [version-control/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/version-control/index.md)
- [versioning/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/versioning/index.md)
- [coding/quality-gates.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/quality-gates.md)
- [coding/dependencies.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/dependencies.md)

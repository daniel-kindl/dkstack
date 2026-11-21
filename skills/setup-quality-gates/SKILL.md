---
name: setup-quality-gates
description: "Use when a repository lets warnings pass, has no CI or has checks that are not deterministic. One building block of bootstrap. Makes warnings errors, sets up CI on every push and pull request, makes the checks deterministic and copies the dkstack format checks."
user-invocable: false
---

# Set up quality gates

A building block of [bootstrap](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/bootstrap/SKILL.md). Use it alone, or as a step of bootstrap. Do not weaken an existing quality gate. See [coding/quality-gates.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/quality-gates.md).

## Steps

1. Configure the build so warnings are errors and the build produces zero warnings and zero hints.
   - Set the compiler or build option that treats warnings as errors.
   - If the language has no such option, add a CI check that fails on any warning.

2. Set up CI that:
   - Runs on every push to the default branch and on every pull request
   - Installs dependencies
   - Runs the full check (build, test, lint)
   - Fails if any warning or error appears

3. Ensure deterministic checks:
   - Pin dependency versions where practical.
   - Make test and build output stable.
   - Fail the build on any non-zero warning count.
   - Follow [coding/naming.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/naming.md).
     Configure naming rules that native tools can check reliably, such as supported Roslyn,
     ESLint or Ruff rules. Run those checks in CI as errors. An `.editorconfig` file alone does
     not enforce naming in every language. Leave unsupported or semantic rules to review.

4. Copy the dkstack format checks:
   - Copy `check-maps.mjs`, `check-context.mjs` and `check-adrs.mjs` into `scripts/` from a fixed dkstack release tag, for example `v1.6.0`. The source URL is `https://raw.githubusercontent.com/daniel-kindl/dkstack/<tag>/scripts/<name>`. Do not copy them from `main`, from `v1` or from a URL at run time. See [ADR 0001](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/docs/adr/0001-how-consumers-follow-versions.md).
   - Write the tag in a comment next to the checks in CI, so that a later update knows the source.
   - Add the three checks to CI. The checks are required. A failed check blocks the merge.
   - The scripts need Node.js and no package. `check-adrs.mjs` compares the change with the default branch, so CI fetches the history of that branch. If the default branch is not `main`, give it with `--base`.
   - A missing `docs/maps/` folder or a missing `CONTEXT.md` is a pass. The repository may not have them yet.
   - Do not change the copied scripts. To update them, copy them again from a newer tag.

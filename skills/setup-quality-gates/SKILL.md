---
name: setup-quality-gates
description: "Use when a repository lets warnings pass, has no CI or has checks that are not deterministic. One block of bootstrap. Makes warnings errors, sets up CI on every push and pull request and makes the checks deterministic."
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

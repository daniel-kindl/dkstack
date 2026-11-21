---
name: bootstrap
description: "Use when you create a new repository or a repository has no commit, branch or version rules yet. Sets up conventional commits, short-lived branches, semver, strict editorconfig, warnings as errors, deterministic checks and supply chain rules."
---

# Bootstrap

Use when you set up a new repository or bring an existing one up to standard.

Apply the rules from version-control, versioning, and coding sections. Step 5 applies the supply chain rules in [coding/dependencies.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/dependencies.md#supply-chain-rules).

## Steps

Do step 1 first. Do each later step with its building block. Each block links the rules and does not copy them.

1. Copy [sample-AGENTS.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/sample-AGENTS.md) into the repository as `AGENTS.md`. Record each project exception to a dkstack rule in its Exceptions section.
2. Set up the editor settings and LF line endings with [setup-editorconfig](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/setup-editorconfig/SKILL.md).
3. Make warnings errors, set up CI, make the checks deterministic and copy the dkstack format checks with [setup-quality-gates](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/setup-quality-gates/SKILL.md).
4. Document the commit and branch rules and set up semantic versioning with [setup-versioning](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/setup-versioning/SKILL.md).
5. Apply the [supply chain rules](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/dependencies.md#supply-chain-rules) with [setup-supply-chain](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/setup-supply-chain/SKILL.md).

## Rules

- Do not weaken existing quality gates.
- Prefer the smallest change that brings the repo into compliance.
- After bootstrap, the repository must produce a clean build with zero warnings.

See also:
- [version-control/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/version-control/index.md)
- [versioning/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/versioning/index.md)
- [coding/quality-gates.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/quality-gates.md)
- [coding/dependencies.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/dependencies.md)

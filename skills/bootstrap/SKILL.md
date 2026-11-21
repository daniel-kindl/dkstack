---
name: bootstrap
description: "Use when you create a new repository or a repository has no commit, branch or version rules yet. Sets up conventional commits, short-lived branches, semver, strict editorconfig, warnings as errors and deterministic checks. Applies the supply chain rules and repository protection, sets up issue labels and adds a README check."
---

# Bootstrap

Use when you set up a new repository or bring an existing one up to standard. To only connect a repository to dkstack, use [setup-dkstack](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/setup-dkstack/SKILL.md).

Apply the rules from version-control, versioning, and coding sections. Then protect the repository, set up the labels and check the README. Step 5 applies the supply chain rules in [coding/dependencies.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/dependencies.md#supply-chain-rules).

## Steps

Do step 1 first. Do steps 2 to 7 each with its building block. Each building block links the rules and does not copy them.

1. Connect the repository to dkstack with [setup-dkstack](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/setup-dkstack/SKILL.md). It adds or merges `AGENTS.md` and records each project exception to a dkstack rule in its Exceptions section.
2. Set up the editor settings and LF line endings with [setup-editorconfig](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/setup-editorconfig/SKILL.md).
3. Make warnings errors, set up CI, make the checks deterministic and copy the dkstack format checks with [setup-quality-gates](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/setup-quality-gates/SKILL.md).
4. Document the commit and branch rules and set up semantic versioning with [setup-versioning](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/setup-versioning/SKILL.md).
5. Apply the [supply chain rules](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/dependencies.md#supply-chain-rules) with [setup-supply-chain](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/setup-supply-chain/SKILL.md).
6. Protect the repository with [setup-repo-protection](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/setup-repo-protection/SKILL.md).
7. Set up the issue labels with [setup-labels](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/setup-labels/SKILL.md).
8. Check the README. It says what the project is and who it is for. It says how to install it and how to run it. It says how to contribute. Add each part that is missing.

## Subagents

If you can start subagents, use them to find what the repository is missing before steps 2 to 7. Do step 1 yourself. Then check the current state for steps 2 to 7 at the same time, each building block in its own subagent. Give each subagent a brief that is complete without your context:

- The repository path.
- The building block of its step, with its link.
- What to report: each setting of the building block that is missing or weaker, with the file or the setting name.
- A word limit, for example 200 words.
- This line: "Report to me only. Do not change files, change settings, commit, push, post, approve or merge."

Start each subagent with the setting below. The [subagent guide](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/subagents.md) maps each tier to a model.

- Each building block check: tier small, effort low.

Then collect the reports. Check each gap at its file or setting before you fix it. Do steps 2 to 8 yourself, in order.

If you cannot start subagents, do the steps one at a time in the order of this skill.

## Rules

- Do not weaken existing quality gates.
- Prefer the smallest change that brings the repo into compliance.
- After bootstrap, the repository must produce a clean build with zero warnings.

See also:
- [version-control/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/version-control/index.md)
- [versioning/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/versioning/index.md)
- [coding/quality-gates.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/quality-gates.md)
- [coding/dependencies.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/dependencies.md)

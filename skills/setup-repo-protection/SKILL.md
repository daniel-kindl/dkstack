---
name: setup-repo-protection
description: "Use when a repository has no branch protection, tag rules, secret scanning or security policy. One building block of bootstrap. Lists the protection settings and asks the owner to apply them."
user-invocable: false
---

# Set up repository protection

A building block of [bootstrap](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/bootstrap/SKILL.md). Use it alone, or as a step of bootstrap. Do not weaken an existing quality gate. See [coding/quality-gates.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/quality-gates.md).

These are settings of the code host. An agent does not change a protection rule or a setting without the owner's OK. See [safety](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/safety.md). Write the list of settings for the owner. The owner applies them, or gives an OK that names them.

## Steps

1. Read the current settings, if you can. List each setting below that is missing or weaker. If [audit-settings.mjs](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/scripts/audit-settings.mjs) supports the code host of the project, the owner can run it to read the settings. The tool changes nothing. It needs Node.js, the command line tool of the code host and a token with admin read rights. Run `node audit-settings.mjs <owner/repo>`. If the release tags do not match `v*`, add `--tag-pattern <glob>`.
2. Default branch rule:
   - A pull request is required for each change.
   - The required checks must pass before a merge.
   - Merge with squash only, and keep a linear history.
   - No force-push and no deletion of the branch.
   - No bypass for administrators.
3. Tag and branch rules:
   - Protect release tags from update and deletion. Only the release process creates them.
   - Protect release branches from force-push and deletion.
4. Security settings:
   - Turn on secret scanning with push protection.
   - Turn on private vulnerability reporting.
   - Add `SECURITY.md` that says how to report a vulnerability.
   - Add a `CODEOWNERS` entry that requires the owner's review for the CI workflow files.
5. Apply the [CI workflow rules](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/security.md#ci-workflows) to each workflow.
6. Give the list to the owner. Record in the issue what the owner applied and what stays open.

## Subagents

Do not start subagents for this skill. Reason: this is one building block. bootstrap can check it in a subagent. The owner applies the settings. See the [subagent guide](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/subagents.md).

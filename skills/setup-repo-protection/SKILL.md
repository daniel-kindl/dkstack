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
   - Turn on secret scanning with push protection. Push protection meets the secret scan rule in the security rules. With it on, the repository needs no secret scan in CI. See [setup-quality-gates](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/setup-quality-gates/SKILL.md).
   - Turn on private vulnerability reporting.
   - Add `SECURITY.md` that says how to report a vulnerability.
   - Add a `CODEOWNERS` entry that requires the owner's review for the CI workflow files.
5. Check whether the owner and the agents use one code host account. If they do, each pull request has that account as its author. The code host does not let the author approve their own pull request. Then:
   - Set required approvals to 0. Do not require a code owner review. A required approval or a required code owner review blocks every pull request.
   - The `CODEOWNERS` entry from step 4 then has no effect. Do not rely on it.
   - Keep all other rules from step 2. The required checks and the linear history still apply.
   - Each pull request still needs an independent review before the merge. See [review and merge](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/review-and-merge.md).
   - Record an exception in `AGENTS.md`. The owner reads each CI workflow change and merges it. The owner writes the review of each CI workflow change in the pull request before the merge. The agent does not merge it. This rests on the merge rules in [safety](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/safety.md), because the settings do not enforce it. For example:

     ```markdown
     - dkstack rule: setup-repo-protection, the `CODEOWNERS` entry that requires the owner's review for the CI workflow files.
     - Project rule: no required approval. The owner reads the diff of each CI workflow change, writes the review in the pull request and merges it.
     - Reason: the owner and the agents use one account. The code host does not let it approve its own pull request.
     ```
6. Apply the [CI workflow rules](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/security.md#ci-workflows) to each workflow.
7. Give the list to the owner. Record in the issue what the owner applied and what stays open.

## Subagents

Do not start subagents for this skill. Reason: this is one building block. bootstrap can check it in a subagent. The owner applies the settings. See the [subagent guide](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/subagents.md).

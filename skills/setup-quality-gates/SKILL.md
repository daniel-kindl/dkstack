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
   - Copy `check-maps.mjs`, `check-context.mjs`, `check-adrs.mjs`, `check-title.mjs`, `check-dashes.mjs` and `check-writing.mjs` into `scripts/` from a fixed dkstack release tag, for example `v1.6.0`. The source URL is `https://raw.githubusercontent.com/daniel-kindl/dkstack/<tag>/scripts/<name>`. Do not copy them from `main`, from `v1` or from a URL at run time. Copy `markdown-files.mjs` too, because `check-dashes.mjs` and `check-writing.mjs` import it. Copy `pr-event.mjs` too, because `check-title.mjs` imports it. See [ADR 0001](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/docs/adr/0001-how-consumers-follow-versions.md).
   - Write the tag in a comment next to the checks in CI, so that a later update knows the source.
   - Add the six checks to CI. The checks are required. A failed check blocks the merge.
   - The scripts need Node.js and no package. Fetch the Git history for the ADR check.
   - On a pull request, run `node scripts/check-adrs.mjs --base "$BASE_SHA"`. Set `BASE_SHA` in the step environment to the target commit.
   - On a push, set `BASE_SHA` to the commit before the push. Use `HEAD~1` if `git cat-file -e "$BASE_SHA^{commit}"` cannot find it. Run the same ADR command.
   - A missing `docs/maps/` folder or a missing `CONTEXT.md` is a pass. The repository may not have them yet.
   - Add the title steps. On a pull request, run `node scripts/check-title.mjs --event`. For each commit of a push, run `node scripts/check-title.mjs -- "<commit title>"`.
   - Run `node scripts/check-dashes.mjs` and `node scripts/check-writing.mjs` in CI.
   - Copy `check-consumer.mjs` and the hash list `dkstack-hashes.json` from the same tag. Run `node scripts/check-consumer.mjs` in CI. It checks the dkstack setup of the repository, and it checks each copied script against the hash list for the tag. It needs no network.
   - Do not change the copied scripts. To update them, copy them again from a newer tag.

5. Secret scanning: follow [coding/security.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/security.md#rules).
   - If the code host has push protection and it is on, add no secret scan to CI. The setting meets the rule. For a repository that has history from before the setting was on, run one scan of the full history with a pinned scanner. Push protection does not find a secret that is already in the history. [setup-repo-protection](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/setup-repo-protection/SKILL.md) turns it on.
   - If it is not on, add a secret scanner to CI. Run it on the full history. Pin the scanner by version and SHA-256.

## Check pull request text in CI

Keep pull request titles, bodies and author logins out of step environments and logs.
Read the event file inside each check. See the [event file example](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/CONTRIBUTING.md#check-pull-request-text-in-ci).

## Subagents

Do not start subagents for this skill. Reason: this is one building block. bootstrap can check it in a subagent. See the [subagent guide](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/subagents.md).

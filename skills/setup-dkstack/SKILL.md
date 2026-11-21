---
name: setup-dkstack
description: "Use when a repository does not point to dkstack yet, or its pointer is broken or out of date. Connects a new or an existing repository to dkstack: adds or merges AGENTS.md, makes each agent client read it, installs the skills with the owner's OK and checks the result. Triggers: set up dkstack, add dkstack, use dkstack here."
---

# Set up dkstack

Use this skill to make a repository a consumer: a repository whose `AGENTS.md` points to dkstack. It works in a new repository and in an existing repository. It changes only the agent instruction files. To set up the commit, version and quality rules too, use [bootstrap](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/bootstrap/SKILL.md). Bootstrap starts with this skill.

## Steps

1. Find the current state. Look for these files at the repository root:
   - `AGENTS.md`, and the dkstack URL in it.
   - `CLAUDE.md`, and what it contains.
   - Other agent instruction files, for example `GEMINI.md`, `.cursorrules`, `.cursor/rules/` or `.github/copilot-instructions.md`.
   - `CONTEXT.md`.
2. Select the version. Use the `v1` URL from [sample-AGENTS.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/sample-AGENTS.md). Pin a `vX.Y.Z` tag only when the owner asks for it. See the [version rule](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/AGENTS.md#version).
3. Write `AGENTS.md`:
   - If the file does not exist, copy [sample-AGENTS.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/sample-AGENTS.md) as `AGENTS.md`. Write the project facts that you can find in the code, for example the test command. Do not invent a fact. If you cannot find a fact, leave the placeholder and tell the owner.
   - If the file exists and has no dkstack URL, merge into it. Add the pointer lines and the Exceptions section of `sample-AGENTS.md` at the top. Move the project text under Project facts. Do not delete project text.
   - If the file has a dkstack URL on a different version or tag, tell the owner. Change the URL only with the owner's OK.
4. Check each project rule in the existing files against dkstack. For each rule that conflicts with a dkstack rule, ask the owner to select one:
   - Remove the project rule. The dkstack rule applies.
   - Keep the project rule as an exception. Record the dkstack rule, the project rule and the reason in the Exceptions section. See [Precedence](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/AGENTS.md#precedence).

   A project rule that conflicts with [safety](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/safety.md) cannot be an exception. Tell the owner, and remove it only with the owner's OK.
5. Make each agent client read `AGENTS.md`. Ask the owner which clients the project uses. Then:
   - Claude Code: if `CLAUDE.md` does not exist, create it with the one line `@AGENTS.md`. If it exists, add the line `@AGENTS.md` at the top. Do not delete or overwrite its text. Apply step 4 to its rules.
   - Another client that does not read `AGENTS.md`: add one line to its file that tells the agent to read and follow `AGENTS.md`. Apply step 4 to its rules.
   - A client that reads `AGENTS.md` directly, for example Codex: no change.
6. Optional: install the skills. Ask the owner first. The command downloads and runs a package. Use the commands in the [README](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/README.md#install-the-skills) on the same version as the URL in `AGENTS.md`. Tell the owner that installed skills do not update by themselves. After a release, run `npx skills update`.
7. Check the result:
   - The dkstack URL in `AGENTS.md` resolves, for example with `curl -fsSI <url>`.
   - Each file from step 5 points to `AGENTS.md`.
   - `AGENTS.md` keeps all project text from before. Compare it with `git diff`.
   - Each relative link in the changed files resolves.
   - Start a new agent session in the repository. Ask it which file or skill it reads first for a task. The answer names the triage skill. If it does not, fix the pointer files and ask again. If you cannot start a session, tell the owner that this check did not run.
8. Commit the change on a branch with the title `docs: set up dkstack`. Follow [start-issue](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/start-issue/SKILL.md) and [feature branches](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/version-control/feature-branches.md).
9. Tell the owner the next step. A new repository often has no commit, version or quality rules. If the repository has none of these rules, continue with [bootstrap](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/bootstrap/SKILL.md) from its step 2.

## Rules

- Do not delete or overwrite project text without the owner's OK.
- Do not change dkstack from the consumer. See [Changes](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/AGENTS.md#changes).
- Do not copy dkstack rules into the consumer. The consumer links to them.
- Record an exception only when the owner approves it.
- A second run of this skill on a set-up repository changes nothing.

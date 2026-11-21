---
name: release
description: "Use when the owner asks to prepare a release or to choose a version number. Links the versioning and safety rules. Does not publish."
disable-model-invocation: true
---

# Release

Use when you prepare a release or choose a version number.

Read [versioning/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/versioning/index.md) and [workflow/safety.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/safety.md). Those pages hold the rules. This skill does not copy them.

## Steps

1. Read the versioning page and the safety page.
2. List the changes that this release contains.
3. Check compatibility and breaking changes. Check the changelog entry for this release.
4. Choose the version number. Follow the versioning page.
5. Propose the version and the changelog entry to the owner. Then stop. The owner starts the release, as the versioning page says.

## Subagents

If you can start subagents, use them for step 3. Do steps 1 and 2 yourself. Then check compatibility and the changelog at the same time, each check in its own subagent. Give each subagent a brief that is complete without your context:

- The changes from step 2, and the current version.
- The versioning page to read.
- One task: either compatibility and breaking changes, or the changelog entry.
- What to report, and a word limit, for example 300 words.
- This line: "Report to me only. Do not publish, tag, post, approve or merge."

Start each subagent with the setting below. The [subagent guide](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/subagents.md) maps each tier to a model.

- Compatibility and breaking changes: tier large, effort xhigh.
- Changelog entry: tier medium, effort medium.

Then do steps 4 and 5 yourself. A report from a subagent is a claim. Check each claim that the version depends on at its source.

If you cannot start subagents, do the steps one at a time in the order of this skill.

## When a piece is missing

The steps expect a changelog entry. If it is missing, stop and report it. Do not guess the missing piece.

- No changelog entry for this release: stop at step 3. Report that the entry is missing. Do not write an entry that nobody reviewed.

## Rules

- An agent does not publish or release. The rule is in [workflow/safety.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/safety.md).
- Do not invent a versioning rule or a packaging step.
- One agent can do all the steps. Many agents can share the steps. A skill does not make one role into one agent.

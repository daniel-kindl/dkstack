---
name: release
description: "Use when you prepare a release or choose a version number. Links the versioning and safety rules. Does not publish."
---

# Release

Use when you prepare a release or choose a version number.

Read [versioning/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/versioning/index.md) and [workflow/safety.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/safety.md). Those pages hold the rules. This skill does not copy them.

## Steps

1. Read the versioning page and the safety page.
2. List the changes that this release contains.
3. Check compatibility and breaking changes. Check the changelog entry for this release.
4. Choose the version number. Follow the versioning page.
5. Follow the release steps on the versioning page. That includes packaging when the page gives packaging steps. Do not invent packaging steps. Obey any limit on which repository those steps are for.
6. Verify the release as the versioning page says. If a check fails, stop.
7. Apply the publish rule. Stop when the rule does not allow the release.

## Subagents

If you can start subagents, use them for step 3. Do steps 1 and 2 yourself. Then check compatibility and the changelog at the same time, each check in its own subagent. Give each subagent a brief that is complete without your context:

- The changes from step 2, and the current version.
- The versioning page to read.
- One task: either compatibility and breaking changes, or the changelog entry.
- What to report, and a word limit, for example 300 words.
- This line: "Report to me only. Do not publish, tag, post, approve or merge."

Then do steps 4 to 7 yourself. A report from a subagent is a claim. Check each claim that the version depends on at its source.

If you cannot start subagents, do the steps one at a time in the order of this skill.

## Rules

- An agent publishes or releases only with the owner's explicit OK for that release. The OK names the exact version. It never covers a production deploy or a project's release workflow.
- Do not invent a versioning rule or a packaging step.
- One agent can do all the steps. Many agents can share the steps. A skill does not make one role into one agent.

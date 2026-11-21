---
name: ui-review
description: "Use when you review a rendered UI change or an existing web, desktop or mobile UI. Checks the rendered result against the UI guidelines and reports through code-review."
---

# UI review

Use the [UI guidelines](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/ui/index.md). For a pull request, use this skill with `code-review`. Report through `code-review`.

## Steps

1. Identify the specification, the changed surfaces, the platform, the project's design system and the evidence.
2. Follow [visual verification](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/ui/visual-verification.md). Check the author's evidence, or run the checks yourself when you can.
3. Check each changed surface against the UI pages that apply to it.
4. Report through [code-review](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md#output). Use its two axes, the [evidence levels](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/verify-claim/SKILL.md#steps) of verify-claim, its [severity table](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md#severity) and its verdict. The UI line in the [standards checklist](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/review-standards/SKILL.md#checklist) maps UI findings to severities.

## Subagents

If you can start subagents, use them for step 3 when the change has two or more surfaces. Do steps 1 and 2 yourself. Then check the surfaces at the same time, each surface in its own subagent. Give each subagent a brief that is complete without your context:

- The surface, the specification and the evidence from step 1.
- The UI pages that apply to the surface, with their links.
- The finding format and the severity table of [code-review](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md#output).
- A word limit, for example 300 words.
- This line: "Report to me only. Do not change files, post, approve or merge."

Start each subagent with the setting below. The [subagent guide](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/subagents.md) maps each tier to a model.

- Each surface: tier medium, effort high.

Check each Blocking and High finding in the rendered result before you report it. Do step 4 yourself.

If you cannot start subagents, do the steps one at a time in the order of this skill.

## Boundaries

- Read-only by default. Do not change files, post approvals or merge unless the existing review workflow allows it.
- Do not enforce a preferred aesthetic over the project's design system.
- Do not give a numeric score for taste.
- Follow the [self-review](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md#self-review) rule in code-review.

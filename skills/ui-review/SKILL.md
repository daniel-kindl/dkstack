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

## Boundaries

- Read-only by default. Do not change files, post approvals or merge unless the existing review workflow allows it.
- Do not enforce a preferred aesthetic over the project's design system.
- Do not give a numeric score for taste.
- Follow the [self-review](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md#self-review) rule in code-review.

---
name: ui-review
description: "Use when reviewing a rendered UI change or assessing an existing web, desktop, or mobile interface. Examine usability, accessibility, responsiveness, visual coherence, and rendered evidence without modifying files."
---

# UI review

Apply the relevant [UI guidelines](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/ui/index.md). When reviewing a PR, use this alongside `code-review`; preserve its separate standards and specification axes.

## Steps

1. Identify the specification, changed surface, supported platform, project design system, and available evidence.
2. Assess specification compliance: flows, interactions, states, responsive targets, and expected content.
3. Assess UI standards: accessibility, layout, hierarchy, consistency, performance, and platform conventions.
4. Follow [visual verification](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/ui/visual-verification.md). Inspect the rendered UI where feasible. If unavailable, record NOT RUN; do not substitute source inspection for rendered evidence.
5. Give each finding a severity from the [code-review severity table](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md#severity). The UI line in the code-review standards axis maps UI findings to it.
6. Separate demonstrated defects from usability hypotheses and aesthetic suggestions. Report both review axes, unavailable checks, and a reasoned verdict through `code-review` when reviewing a PR.

## Boundaries

- Read-only by default. Do not change files, post approvals, or merge unless explicitly authorized under the existing review workflow.
- Do not enforce a preferred aesthetic over a coherent project design system.
- Do not score subjective design with fabricated numeric thresholds.
- A reviewer must not independently approve its own implementation.

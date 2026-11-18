---
name: ui-design
description: "Use when creating or changing a rendered user interface on web, desktop, or mobile. Design and implement accessible, responsive, coherent UI while preserving existing design systems and verifying real rendered output."
---

# UI design

Use the relevant [UI guidelines](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/ui/index.md). For behavior changes, also use `tdd-loop`.

## Steps

1. Inspect the task, users, platform conventions, existing screens, design system, and components. Keep the scope explicit.
2. Follow [conditional visual direction](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/ui/design-systems.md). Preserve an established system; select a reasoned direction only when none exists. Clarify unresolved material branding decisions.
3. Define applicable behavior, accessibility, responsiveness, themes, interaction states, content, and visual acceptance criteria. Include these in `plan-work` for planned changes.
4. Implement in small increments. Reuse existing components and tokens; use `tdd-loop` for behavior. Do not invent frameworks or dependencies.
5. Follow [visual verification](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/ui/visual-verification.md). Inspect rendered output and relevant interactions when tools allow. Fix defects and verify again.
6. Report evidence, affected surfaces, outcomes and limitations. Record unavailable visual checks as NOT RUN.

## Boundaries

- Do not redesign unrelated screens or override the project's visual identity without an explicit task.
- Do not treat screenshots as substitutes for automated behavior tests.
- Do not claim an inaccessible platform was tested.
- Do not require browser-specific tooling for native UIs.

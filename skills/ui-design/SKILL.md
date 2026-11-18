---
name: ui-design
description: "Use when you make or change a rendered UI on the web, desktop or mobile. Builds accessible UI in the project's design system and checks the rendered result."
---

# UI design

Use the [UI guidelines](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/ui/index.md). For behavior changes, also use `tdd-loop`.

## Steps

1. Read the task, the users, the platform conventions, the existing screens, the design system and the components. Write down the scope.
2. Follow [design systems](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/ui/design-systems.md). Keep an existing system. Choose a direction only when none exists. Ask the owner about brand decisions that the requirements do not decide.
3. Write the acceptance criteria for behavior, accessibility, responsive layout, themes, states, content and visual result. For planned work, put them in `plan-work`.
4. Make small increments. Reuse the existing components and tokens. Use `tdd-loop` for behavior. Do not add a framework or a dependency that the task does not need.
5. Follow [visual verification](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/ui/visual-verification.md). Fix the defects and check again.
6. Write the `Visual verification:` line and the `Observability:` line as `write-pr` says.

## Boundaries

- Do not redesign other screens or change the project's visual identity without a task that asks for it.
- Do not claim that you tested a platform that you could not run.
- Do not require browser tools for a native UI.

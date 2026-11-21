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

## Subagents

If you can start subagents, use one as a new viewer in step 5. Do steps 1 to 4 yourself. Then start one subagent that has not seen your code or your context. Give it a brief that is complete without your context:

- The rendered result, or how to open it, and the acceptance criteria from step 3.
- The [visual verification](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/ui/visual-verification.md) page.
- What to report: each defect against an acceptance criterion, with the state, the size and the theme where it shows.
- A word limit, for example 300 words.
- This line: "Report to me only. Do not change files, commit, push, post, approve or merge."

Start each subagent with the setting below. The [subagent guide](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/subagents.md) maps each tier to a model.

- New viewer: tier medium, effort high.

Check each defect in the rendered result yourself before you fix it. Do step 6 yourself.

If you cannot start subagents, do the steps one at a time in the order of this skill.

## Boundaries

- Do not redesign other screens or change the project's visual identity without a task that asks for it.
- Do not claim that you tested a platform that you could not run.
- Do not require browser tools for a native UI.

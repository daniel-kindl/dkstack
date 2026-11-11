---
name: tdd-loop
description: "Use when you add or change behavior in code, or fix a bug. Runs the red, green, refactor cycle with a failing test first."
---

# TDD loop

Use when implementing behavior. Follow the authoritative [TDD guidelines](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/tdd/index.md) for test design, isolation, regression protection, verification and narrowly scoped exceptions.

## Steps

1. Select one observable behavior or regression from the task.
2. Write a focused test for the expected behavior and run it. Confirm it fails for the intended reason; correct invalid setup before continuing.
3. Write only the production code needed to make the test pass.
4. Run the focused test and relevant existing tests. Do not weaken assertions to get green.
5. Refactor while green. If a behavior at risk has no test, add a passing characterization test before refactoring.
6. Repeat for the next behavior. Run the repository's required checks before reporting; mark any unrun check NOT RUN.

## Boundaries

- Do not implement behavior before a relevant failing test.
- Do not claim a red step, a passing test or a check without execution evidence.
- Keep each cycle and refactor within the task scope.
- For non-behavior changes or an approved deviation, follow the boundaries in the [TDD guidelines](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/tdd/index.md).
- Do not restate the detailed testing standards here.

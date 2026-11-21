---
name: tdd-loop
description: "Use when you add or change behavior in code, or fix a bug. Runs the red, green, refactor cycle with a failing test first."
---

# TDD loop

Use when you implement behavior. Follow the [TDD guidelines](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/tdd/index.md) for test design, test isolation, regression tests, verification and exceptions.

## Steps

1. Select one observable behavior or regression from the task.
2. Write a focused test for the expected behavior and run it. Make sure that it fails for the expected reason. If the setup is wrong, fix it before you continue. If the behavior has a [logging contract](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/tdd/test-design.md#logging-contracts), the test checks that event.
3. Write only the production code that makes the test pass.
4. Run the focused test and the relevant existing tests. Do not weaken assertions to make a test pass.
5. Refactor while the tests are green. Review the logging of the behavior against [logging](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/logging.md).
6. Repeat for the next behavior. Run the quality gates of the repository before you report. Mark each check that did not run as NOT RUN.

For behavior that changes a rendered UI, put the presentation logic in code that you can test without a UI. See [presentation logic](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/tdd/ui-testing.md#presentation-logic). Then also do [visual verification](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/ui/visual-verification.md).

## Subagents

Do not start subagents for this skill. Reason: each step depends on the result of the step before it. One agent keeps the test and the code in one context. See the [subagent guide](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/subagents.md).

## Boundaries

- Do not implement behavior before a relevant failing test exists.
- Do not claim a red step, a passing test or a check without evidence that it ran. Use [verify-claim](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/verify-claim/SKILL.md).
- In the refactor step, stay inside the task scope. Do not change unrelated code. Keep every
  existing test green. Do not limit the refactor to code that a test already executes. When no
  test checks a behavior that this refactor can change, write a test for that behavior first.
  That test must pass before you change the code. See
  [stewardship](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/stewardship.md).
- For a change that does not change behavior, follow the boundaries in the [TDD guidelines](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/tdd/index.md). Do the same when you cannot do a test-first red step.
- Do not restate the detailed testing standards here.

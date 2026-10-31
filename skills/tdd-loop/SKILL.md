---
name: tdd-loop
description: "Use when you add or change behavior in code, or fix a bug. Runs the red, green, refactor cycle with a failing test first."
---

# TDD loop

Use when you implement behavior.

Follow the red-green-refactor cycle from [tdd/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/tdd/index.md).

If the feature has an active plan, read its next item that is not blocked first. After you implement and verify the item, record the real evidence, the commit identifier and the status. Follow [feature plans](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/feature-plans.md).

## Steps

1. Write a failing test that describes the desired behavior. Confirm it fails for the right reason.
2. Write the smallest amount of production code that makes the test pass.
3. Confirm the test passes and existing tests still pass.
4. Refactor only while tests are green.
5. Repeat for the next behavior.

## Rules

- Read [claims.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/claims.md).
  Do not implement without a verified claim.
- You must not implement a mapped issue in the session that mapped it. A fresh session does that
  work. See [work.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/work.md).
- In the refactor step, change only the code that the current tests cover. Do not change unrelated
  code. See
  [stewardship](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/stewardship.md).
- Do not write production code before a failing test exists.
- Tests must prove behavior, not implementation details.
- Do not skip the failing step.
- Keep each cycle small.

See also [coding/testing.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/testing.md).

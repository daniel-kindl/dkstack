---
name: tdd-loop
description: Enforce the red-green-refactor cycle when implementing behavior.
---

# TDD loop

Use when you implement behavior.

Follow the red-green-refactor cycle from [tdd/index.md](../../tdd/index.md).

## Steps

1. Write a failing test that describes the desired behavior. Confirm it fails for the right reason.
2. Write the smallest amount of production code that makes the test pass.
3. Confirm the test passes and existing tests still pass.
4. Refactor only while tests are green.
5. Repeat for the next behavior.

## Rules

- Do not write production code before a failing test exists.
- Tests must prove behavior, not implementation details.
- Do not skip the failing step.
- Keep each cycle small.

See also [coding/testing.md](../../coding/testing.md).

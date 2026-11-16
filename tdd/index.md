# Test-driven development

Use test-driven development (TDD) for changes to observable behavior. Write a test that states what the system must do before you change production code. Keep each cycle small, so that you can find the cause of a failure and review the result.

This page lists the testing pages and the core principles. Each rule is on one topic page. [TDD loop](../skills/tdd-loop/SKILL.md) tells agents how to do the cycle. [Testing](../coding/testing.md) points to this page. Follow [quality gates](../coding/quality-gates.md) when a check fails.

## Guidelines

Read only the pages that apply to the task. Read the P0 pages first. The P1 pages cover special techniques. The priority gives the reading order. It does not make a rule optional.

| Priority | Guide | Use |
| --- | --- | --- |
| P0 | [Red, green, refactor](red-green-refactor.md) | Test-first cycle and evidence |
| P0 | [Test design](test-design.md) | Cases, assertions, naming and AAA |
| P0 | [Test isolation](test-isolation.md) | Test doubles, controlled dependencies and fixtures |
| P0 | [Test levels](test-levels.md) | Unit, integration, contract and end-to-end |
| P0 | [Regression testing](regression-testing.md) | Reproducing bugs and keeping them fixed |
| P0 | [Deterministic tests](deterministic-tests.md) | Time, randomness, concurrency and flaky tests |
| P1 | [Coverage](coverage.md) | Line, branch and mutation coverage |
| P1 | [Property testing](property-testing.md) | Parameterized, generated and fuzz inputs |
| P1 | [Performance testing](performance-testing.md) | Benchmarks and performance regressions |
| P1 | [Legacy code](legacy-code.md) | Characterization tests and TDD in code without tests |

## Core principles

- Write an executable test for a behavior before you add or change that behavior.
- Make sure that the test fails for the expected reason.
- Make the smallest production change that makes the test pass.
- Refactor only when the tests pass. Keep the observable behavior the same.
- Test through a public interface. Assert results, state changes, errors and side effects, not private details.
- Keep each test independent, deterministic and focused on one behavior.
- Treat tests as maintained code.

A public interface is the part of the code that callers use. Examples are a public API, a command, an HTTP endpoint and a user interface.

## Red, green, refactor

Follow the cycle and record the evidence as [red, green, refactor](red-green-refactor.md) describes.

## Test design

Choose cases, assertions and names with [test design](test-design.md).

## Isolation and determinism

Control dependencies with [test isolation](test-isolation.md) and remove nondeterminism with [deterministic tests](deterministic-tests.md).

## Verification and kinds of tests

Select the level with [test levels](test-levels.md), and use [regression testing](regression-testing.md), [coverage](coverage.md) and [performance testing](performance-testing.md) as the change needs.

## Examples

Each topic page has a good example and a bad example.

## Boundaries and evidence

TDD applies to new behavior, changed behavior and bug fixes. A refactor keeps behavior the same and needs green tests before and after.

Formatting, documentation and mechanical changes that do not change behavior do not need a failing test. Run the checks that apply to them. You can write a spike to explore a solution. Do not merge spike code without tests. Test generated code through its consumer or test the generator.

When you cannot do a test-first red step, state the constraint and the verification that ran in the pull request. Do not call that work TDD. Do not claim that a check passed unless it ran. Existing code without tests does not permit new behavior without tests.

See also [small steps](../architecture/small-steps.md), [TDD loop](../skills/tdd-loop/SKILL.md) and [quality gates](../coding/quality-gates.md).

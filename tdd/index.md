# Test-driven development

Use test-driven development (TDD) for changes to observable behavior. A test states what the system must do before production code is changed. Keep each cycle small enough to diagnose a failure and review the result.

This page is the authoritative testing standard. [TDD loop](../skills/tdd-loop/SKILL.md) tells agents how to execute it. [Testing](../coding/testing.md) points here rather than defining another set of rules. Follow [quality gates](../coding/quality-gates.md) when a check fails.

## Guidelines

Read only the pages relevant to the task. P0 is foundational; P1 covers specialized techniques. These priorities describe reading order, not an exemption from relevant rules.

| Priority | Guide | Use |
| --- | --- | --- |
| P0 | [Red, green, refactor](red-green-refactor.md) | Test-first cycle and evidence |
| P0 | [Test design](test-design.md) | Cases, assertions, naming and AAA |
| P0 | [Test isolation](test-isolation.md) | Doubles, controlled dependencies and fixtures |
| P0 | [Test levels](test-levels.md) | Unit, integration, contract and end-to-end |
| P0 | [Regression testing](regression-testing.md) | Reproducing and preventing bugs |
| P0 | [Deterministic tests](deterministic-tests.md) | Time, randomness, concurrency and flakes |
| P1 | [Coverage](coverage.md) | Line, branch and mutation coverage |
| P1 | [Property testing](property-testing.md) | Parameterized, generated and fuzz inputs |
| P1 | [Performance testing](performance-testing.md) | Benchmarks and regression measurements |
| P1 | [Legacy code](legacy-code.md) | Characterization and safe introduction of TDD |

## Core principles

- Specify behavior with an executable test before adding or changing that behavior.
- Confirm the test fails for the expected reason. A broken test setup, compilation error unrelated to the intended behavior, or infrastructure outage is not a useful red step.
- Make the smallest production change that makes the test pass. Do not implement speculative requirements.
- Refactor only with passing tests. Preserve externally observable behavior.
- Test through a meaningful public or supported boundary. Assert results, state changes, errors, or side effects, not private implementation details.
- Keep each test independent, deterministic and focused on one behavior. Multiple assertions are fine when they describe the same outcome.
- Treat tests as maintained code. Use clear names, readable setup and no hidden ordering dependencies.

## Red, green, refactor

### Red: state the behavior

1. Choose one requirement, acceptance criterion, boundary case or reported defect.
2. Write the smallest test that demonstrates the expected outcome. Prefer a concrete input and expected result.
3. Run it. Verify that it fails because the behavior is absent or wrong.
4. If it passes unexpectedly, improve the test or choose a genuinely missing case before changing production code.
5. If test infrastructure is broken, fix that problem separately. Do not pretend it proves the requested behavior.

### Green: satisfy the test

1. Implement the minimum behavior needed for the failing test.
2. Run the focused test and relevant nearby tests.
3. Fix failures in production code or incorrect test expectations. Never weaken the assertion simply to get green.
4. Add the next requirement in a new red cycle, not as untested extra production code.

### Refactor: improve structure safely

1. Start from green tests; keep behavior unchanged.
2. Improve names, duplication, separation of concerns or design only where justified by the task.
3. Run relevant tests after each small refactor.
4. If a refactor could change behavior that no test protects, add a characterization test first and confirm it passes.
5. Do not mix an unrelated redesign into a behavior change.

Repeat until acceptance criteria and important failure paths are covered. Before the pull request, run the project's required checks. Report checks that could not run as NOT RUN.

## Test design

- Name tests for behavior and circumstance, for example `ReturnsNotFoundWhenBookIsMissing`. Follow the project's naming convention.
- Arrange inputs and dependencies, act once on the behavior, then assert the outcome. Arrange-Act-Assert and Given-When-Then are both fine.
- Assert specific observable values, exceptions, state transitions or effects. Avoid assertions that always pass or merely restate a mock's configuration.
- Test normal inputs, empty or missing inputs, limits, invalid inputs and error paths where they matter.
- Use parameterized tests for distinct examples of the same rule; use separate tests for distinct behaviors.
- Prefer a small amount of purposeful setup. Extract shared fixtures only when that reduces actual duplication without concealing the test's intent.
- Avoid tests of private methods, exact internal call sequences or incidental formatting unless those are part of the contract.
- A test must detect a plausible wrong implementation. Temporarily introduce a relevant fault where practical and check that it fails; then restore the code.

## Isolation and determinism

- Tests must not require a prior test to run or change shared state left for another test.
- Control time, randomness, environment variables, locale and execution order when they affect results.
- Do not use arbitrary sleeps or timing guesses to synchronize tests. Wait for observable conditions with bounded timeouts when testing asynchronous behavior.
- Prefer real value objects and domain logic. Replace only dependencies whose effects must be controlled, such as a clock, remote service or external I/O.
- Use fakes, stubs or mocks to define a controlled boundary. Do not mock every collaborator or assert call counts unless interaction itself is the contract.
- Clean up files, processes, database records and other resources created by tests.
- Do not rely on public network availability in unit tests. Integration tests may use real services or databases when provisioned and isolated by the project.

## Verification and kinds of tests

Choose the cheapest level that actually proves the requirement:

- **Unit:** a small behavior with controlled dependencies, fast feedback.
- **Integration:** components and real boundaries working together, such as persistence or serialization.
- **Contract:** expectations between independently maintained consumers and providers.
- **End-to-end:** a critical user journey through the assembled system.

Do not force every behavior through every level. Prefer a small number of high-value integration and end-to-end tests over duplicate tests of the same implementation detail.

A bug fix begins with a failing regression test that reproduces the defect. Verify it fails on the defective behavior, then fix the code and keep the test. For legacy code without tests, establish current observable behavior using characterization tests before a risky refactor; add a failing test for the new requirement before changing behavior.

Coverage metrics show what ran, not whether the assertions are correct. Use line and branch coverage to find gaps, not as proof of quality or a universal numeric target. Use mutation testing when available and proportionate to the risk: investigate surviving meaningful mutations, equivalent mutants and untested branches. Do not change thresholds or disable tests to pass a quality gate.

Benchmark performance-sensitive behavior under controlled conditions. Do not use noisy wall-clock assertions as ordinary unit tests; use repeatable benchmarks and project-defined regression criteria.

## Practical examples

### New behavior: good

Requirement: a price calculator rejects negative quantities.

1. **Red:** test `CalculatePrice(quantity: -1)` and expect the documented validation error. Observe that the implementation does not yet reject the value.
2. **Green:** add only the required validation. Confirm the test and existing price tests pass.
3. **Refactor:** clarify the validation logic if necessary, keeping tests green.
4. Repeat for any other specified boundary.

### New behavior: bad

Implement the entire calculator, write tests that mirror its branches, and change expected values until tests pass. There is no evidence the tests drove the behavior or would catch a wrong requirement.

### Bug fix: good

A missing book incorrectly returns the first book. First write a test expecting `NotFound` for an unknown ID and verify it fails with the existing bug. Fix lookup behavior, rerun the test and retain it as regression protection.

### Weak assertion: bad

A mock is configured to return `42`; the test calls the mock and checks that it returned `42`. This verifies the setup, not the system's behavior. Instead call the real operation through its supported interface and assert its observable result.

## Boundaries and evidence

TDD applies to new behavior, bug fixes and behavior-changing refactors. Pure formatting, documentation and mechanical changes with no behavior change do not need an invented failing behavior test, but still require applicable checks. Exploratory spikes may be disposable; do not merge untested spike behavior as production code. Generated code is validated through its consumer behavior or generator tests as appropriate.

For a genuine constraint that prevents test-first work, describe the constraint and the verification performed in the pull request; obtain owner approval for a deviation before relying on it. Do not label a test written after implementation as test-first, and do not claim a check passed unless it ran. Existing uncovered code is not permission to add new untested behavior.

See also [small steps](../architecture/small-steps.md), [TDD loop](../skills/tdd-loop/SKILL.md) and [quality gates](../coding/quality-gates.md).

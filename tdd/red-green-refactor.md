# Red, green, refactor

Use this cycle for each new or changed observable behavior. A cycle ends with working code and a test that specifies the behavior.

## Red: prove the gap

1. Select one acceptance criterion, boundary case or reported defect.
2. Write the smallest test that shows the expected result through a [public interface](index.md#core-principles). Test one behavior in each test.
3. Run the smallest set of tests that includes the new test. Make sure that it fails because the behavior is missing or wrong.
4. A wrong setup, a service that is not available or a timeout is not a red step. Fix that problem in a separate change. A compile error is a red step only for a public API that does not exist yet. You must also be able to separate that error from other build errors. Prefer a failing assertion.
5. If the test passes before you change the code, improve the test or select a requirement that no test covers. Do not claim a red step that you did not see.

## Green: make one test pass

- Write the smallest production change that makes the test pass.
- Do not add options, abstractions, error paths or features that the current test does not need.
- Run the focused test and the tests near it.
- Fix the production code, not the expected values. Do not weaken an assertion to make a test pass.
- When you change or delete an existing assertion, state in the pull request which requirement changed. If no requirement changed, fix the production code.
- If other tests fail, find the cause before you continue.
- Add the next requirement in a new red step, not as extra code without a test.

## Refactor: improve safely

- Start and finish with all tests green. Keep the observable behavior and the existing contracts the same.
- Improve names, duplication, boundaries and structure only where the current change needs it.
- Before you refactor behavior that no test checks, add a characterization test. Make sure that it passes.
- Run the relevant tests after each small change.
- Do not mix unrelated cleanup or redesign into the change.

## Evidence and iteration

Keep a record of red and then green when the tools can show it. Examples are test output and a short note in the pull request. A passing test does not prove that the test came first. A test that you write after the code is not test-first. Say so when you did not see the red step.

Repeat the cycle for the next requirement. Run all required checks before you open the pull request. Report each check that did not run as NOT RUN. For a bug, start with [regression testing](regression-testing.md).

## Example

Requirement: a price calculator rejects negative quantities.

- Red: call `CalculatePrice(quantity: -1)` and expect the documented validation error. Make sure that the current code fails that test.
- Green: add only the required validation. Run that test and the existing price tests.
- Refactor: remove duplicated validation code. Keep the tests green.

Bad: write the full calculator first. Then write tests that copy its branches, and change their expected values until they pass. Nothing shows that the tests drove the behavior.

Related: [test design](test-design.md), [small steps](../architecture/small-steps.md).

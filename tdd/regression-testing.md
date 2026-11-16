# Regression testing

A bug fix starts with a test that shows the wrong behavior. Keep that test after the fix.

## Bug-fix cycle

1. Record the symptom, the input, the environment and the expected result.
2. Reproduce the failure through the smallest relevant [public interface](index.md#core-principles).
3. Add a test that fails because of the same defect. Make sure that it does not fail because of an unrelated setup problem.
4. Make the smallest correct fix.
5. Make sure that the new test passes and that the existing tests stay green.
6. Keep the regression test after the fix.

If no automated test reproduces the defect, follow [boundaries and evidence](index.md#boundaries-and-evidence). In the pull request, state the manual verification that ran.

## Scope and risk

- Test the public contract that failed, not the internal line that had the bug.
- Test neighboring boundaries only when the same defect can affect them.
- Do not turn a focused fix into unrelated refactoring.
- Make the new test stable and repeatable, also when the original symptom was intermittent.

## Example

Reported: a search for an unknown book ID returns the first book.

Bad: change the lookup. Then add a test that expects the corrected result.

Good: add a test that expects not found for an unknown ID. Make sure that it fails on the current code. Fix the lookup. Make sure that the tests for a known ID and an unknown ID pass.

## Incidents and regressions

When production data or a migration caused the failure, make a small fixture that represents that data. Do not store personal data or secrets in tests.

Related: [red-green-refactor](red-green-refactor.md), [deterministic tests](deterministic-tests.md).

# Regression testing

A bug fix must demonstrate the incorrect behavior before correcting it, then keep that scenario protected.

## Bug-fix cycle

1. Capture the observed symptom, input, environment and expected result.
2. Reproduce the failure using the smallest relevant public or supported boundary.
3. Add a test that fails for the same defect. Confirm the test is not failing for an unrelated setup problem.
4. Apply the smallest correct fix.
5. Verify that the new test passes, existing tests remain green and adjacent cases are covered.
6. Preserve the regression test after the fix. Do not delete it once the defect is resolved.

If the defect cannot be reproduced in an automated test, document the blocker and the actual manual verification. Do not claim TDD was followed. Seek an owner-approved deviation under [the TDD policy](index.md#boundaries).

## Scope and risk

- Test the visible contract that failed, not the particular internal line that happened to contain the bug.
- Cover neighboring boundaries only when the same defect mechanism makes them relevant.
- Avoid turning a focused fix into unrelated refactoring.
- Make the new case stable and repeatable, even if the original production symptom was intermittent.

## Example

Reported: searching for an unknown book ID returns the first book.

Bad sequence: change the lookup and then add a test expecting the corrected result.

Good sequence: add a test asserting not-found for an unknown ID; confirm it fails on the existing code; fix the lookup; verify both known and unknown ID behavior.

## Incidents and regressions

When production data or a migration caused the failure, sanitize and minimize a representative fixture. Do not store personal information or secrets in tests.

Related: [red-green-refactor](red-green-refactor.md), [deterministic tests](deterministic-tests.md).

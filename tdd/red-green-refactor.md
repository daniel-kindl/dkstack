# Red, green, refactor

Use this cycle for every new or changed observable behavior. A cycle ends with working code and an executable specification, not merely a passing build.

## Red: prove the gap

1. Select one acceptance criterion or boundary behavior.
2. Describe the expected result through a public or supported interface. Prefer one behavior per test.
3. Run the smallest relevant test selection. Check that the failure is caused by missing or incorrect behavior.
4. Distinguish expected assertion failures from compilation problems, wrong setup, unavailable services, and timeouts.
5. If the test unexpectedly passes, improve the test or select an uncovered requirement. Do not claim an unobserved red step.

A compile failure caused by referencing an intentionally not-yet-created public API can be a useful red signal only when the project can clearly isolate that failure from unrelated build errors. Prefer an executable failing assertion when possible.

## Green: make one test pass

- Write the smallest production change that satisfies the test and contract.
- Avoid speculative options, abstractions, error paths or feature branches not required yet.
- Run the focused test and nearby tests. Do not change expected values to match an incorrect implementation.
- If other tests fail, investigate the regression before continuing.

## Refactor: improve safely

- Start and finish with tests green. Preserve observable behavior and existing contracts.
- Improve naming, duplication, boundaries and structure only where the current change warrants it.
- Add characterization tests before refactoring unprotected behavior that could change.
- Run relevant tests after each small structural change.
- Do not combine unrelated cleanup with the feature.

## Evidence and iteration

Keep a trace of red then green when the tools support it, for example test output or a brief pull request note. A passing test alone does not prove test-first order. State honestly when the sequence was not observed.

Repeat with the next requirement. Run all required checks before proposing a merge. For a bug, start with the [regression testing](regression-testing.md) flow.

## Example

Requirement: a price calculation rejects negative quantities.

- Red: call the supported calculator with quantity `-1` and assert the documented validation error. Confirm the current code fails that assertion.
- Green: add the required validation, then run that test and existing price tests.
- Refactor: simplify duplicated validation without changing the result.

Bad: implement an entire calculator first, then create tests that mirror its branches and adjust their assertions until they pass.

Related: [test design](test-design.md), [small steps](../architecture/small-steps.md).

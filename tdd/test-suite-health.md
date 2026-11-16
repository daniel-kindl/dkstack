# Test suite health

Keep the test suite fast, reliable and current. People stop running a suite that is slow or that fails at random.

## Location

- Put tests where the project convention says.
- Mirror the source structure, so that a reader can find the tests for each source file.

## Speed

- State the expected run time of the unit suite in the project docs.
- Treat a slow unit test as a defect. Make it faster, or move it to a higher [test level](test-levels.md).

## Order and parallel runs

- Run the suite in random order where the framework supports it.
- Treat a failure in random order or in parallel as an isolation defect. Fix it as [test isolation](test-isolation.md) describes.

## Maintenance

- Delete or rewrite a test that no longer proves a requirement. State the requirement that changed, as [green](red-green-refactor.md#green-make-one-test-pass) describes.
- For skipped tests and focus markers, follow [flaky tests](deterministic-tests.md#flaky-tests).

## CI

- Make CI run the same test command as a local run. Reason: a different command can hide a failure.
- Put the command in one place, such as a project script. Call it from CI and from a local run.

## Example

Good: the project docs say that the unit suite runs in less than one minute. The suite runs in random order. CI calls the same script that a local run uses.

Bad: the CI file has its own list of test commands. A test reads a file that an earlier test writes, so it fails in random order. Someone skips the test and opens no issue.

Related: [test isolation](test-isolation.md), [deterministic tests](deterministic-tests.md), [test levels](test-levels.md).

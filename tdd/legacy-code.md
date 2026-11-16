# TDD with legacy code

Legacy code often has weak seams, global state or no tests. Add test protection in small steps. Do not invent evidence of test-first work.

## Before changing behavior

1. Identify the [public interface](index.md#core-principles) and the affected callers.
2. Run the existing checks and record the baseline, including known failures.
3. Add characterization tests for the current behavior at the nearest stable boundary. These tests pass from the start, because they record the current behavior.
4. Where possible, add a narrow seam for time, I/O or state. Do not change observable behavior. Keep the characterization tests green.
5. Add a failing test for the new requirement or the reported defect.
6. Make the smallest change. Make sure that the tests pass. Then refactor in small steps.

Characterization tests record what the code does now. They do not make wrong behavior correct. For a known bug, the regression test states the correct behavior and fails before the fix.

## Difficult dependencies

For hardware, old frameworks, user interfaces or services that are not available, select the nearest useful boundary. Use component tests, protocol fixtures or controlled fakes. Add integration or manual verification where possible.

A test with only mocks does not prove that a physical device works. For hardware verification, record the platform, the equipment and the paths that no test verified.

## Limited testability

When you cannot do a test-first red step, follow [boundaries and evidence](index.md#boundaries-and-evidence). Also state the remaining risk in the pull request.

## Example

A legacy device adapter has no tests and reads the hardware directly.

Good:

1. Record the current protocol framing in characterization tests.
2. Add a transport seam that tests can replace.
3. Add a failing test for the payload of the new command.
4. Implement the command.
5. Verify on real hardware when it is available.

Bad: rewrite the adapter and make mocks that copy the new implementation. Record no baseline and do not verify the device path.

Related: [regression testing](regression-testing.md), [test isolation](test-isolation.md), [red-green-refactor](red-green-refactor.md).

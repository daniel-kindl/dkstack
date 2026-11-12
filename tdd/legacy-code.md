# TDD with legacy code

Legacy code often has weak seams, global state or missing tests. Improve protection incrementally without inventing evidence of test-first work.

## Before changing behavior

1. Identify the public or supported behavior and affected callers.
2. Run existing checks and capture the baseline, including known failures.
3. Add characterization tests for current behavior at the nearest stable boundary. These tests start green because they document existing behavior.
4. When practical, introduce a narrow seam for time, I/O or state without changing observable behavior. Keep characterization tests green.
5. Add a failing test for the new requirement or reported defect.
6. Implement the smallest change, verify green and refactor cautiously.

Characterization tests describe what code does today. They do not automatically endorse incorrect behavior. For a known bug, the regression test must state the intended corrected behavior and fail before the fix.

## Difficult dependencies

For hardware, old frameworks, user interfaces or unavailable services, select the closest useful boundary. Use component tests, protocol fixtures or carefully controlled fakes, backed by integration or manual validation where possible.

Do not claim that a mock-only test proves a physical device. Record the platform and equipment used for any hardware verification, plus unverified paths.

## Limited testability

If a meaningful automated red step is genuinely impossible, document why, what verification was run and the residual risk. Obtain owner approval for a deviation before relying on it. Do not silently omit tests or classify tests written afterward as TDD.

## Example

A legacy device adapter has no tests and directly reads hardware.

Good: capture existing protocol framing in characterization tests; introduce an injectable transport seam; add a failing test for the new command's expected payload; implement it; verify on actual hardware when available.

Bad: rewrite the adapter and create mocks that reproduce the new implementation, with no baseline or device-path validation.

Related: [regression testing](regression-testing.md), [test isolation](test-isolation.md), [red-green-refactor](red-green-refactor.md).

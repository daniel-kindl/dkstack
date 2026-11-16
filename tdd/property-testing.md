# Property, parameterized and fuzz testing

Example tests prove specified cases. Property tests and fuzz tests check stated invariants over many inputs.

## Parameterized tests

Use one parameterized test for many concrete inputs that share one behavior and one assertion. Include the boundary values. Use separate tests for different behaviors. Do not hide separate requirements in one large parameter table.

## Property-based tests

1. State an invariant from the public contract.
2. Generate valid or invalid inputs within stated limits.
3. Assert the invariant for each generated input.
4. When a run fails, keep the seed and the minimized counterexample.
5. Add a focused regression test for each defect that you find.

Useful invariants include:

- Round-trip serialization.
- Monotonic output, where the contract promises it.
- Idempotence, where the contract specifies it.
- Sorted output is ordered and has the same elements as the input.

Do not assume a property that the contract does not promise.

## Fuzz testing

Use fuzzing for parsers, binary formats, untrusted input and complex state transitions. Define what a failure is: a crash, a hang, unsafe resource growth or a contract violation.

Set limits for resources and duration. Keep the minimized failure cases and make them repeatable. Fuzzing adds to the acceptance tests of the [red, green, refactor](red-green-refactor.md) cycle. It does not replace them.

## Example

An encoder and a decoder promise lossless round trips. Test `decode(encode(value)) == value` over generated valid values. When a Unicode edge case fails, keep that value as a regression test.

Bad: generate random bytes and assert only that a function returns something. Ignore exceptions and do not check the documented error contract.

Related: [test design](test-design.md), [deterministic tests](deterministic-tests.md).

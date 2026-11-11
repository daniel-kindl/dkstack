# Property, parameterized and fuzz testing

Example-based tests prove specified cases. Property-based and fuzz tests explore a broader input space using stated invariants.

## Parameterized tests

Use several concrete inputs when they share one behavior and assertion. Include boundary values deliberately. Do not hide separate requirements inside one large parameter table.

## Property-based tests

1. State an invariant derived from the public contract.
2. Generate valid or invalid inputs within clearly described constraints.
3. Assert the invariant for every generated example.
4. Preserve the seed and minimized counterexample when a run fails.
5. Add a focused regression example for a discovered defect.

Useful invariants include round-trip serialization, monotonicity where promised, idempotence where specified, and sorted output remaining ordered. Do not assume a property the contract does not promise.

## Fuzz testing

Use fuzzing for parsers, binary formats, untrusted inputs and complex state transitions where random or mutated input can reveal defects. Define what counts as failure: crashes, hangs, unsafe resource growth or contract violations.

Set resource and duration limits. Retain minimized failure cases and reproduce them deterministically. Fuzzing complements, rather than replaces, specific red-green-refactor acceptance tests.

## Example

For an encoder and decoder that promise lossless round trips, test `decode(encode(value)) == value` over generated supported values. When a Unicode edge case fails, retain that value as a regression test.

Bad: generate arbitrary bytes, assert only that a function returns something, and ignore exceptions without checking the documented error contract.

Related: [test design](test-design.md), [deterministic tests](deterministic-tests.md).

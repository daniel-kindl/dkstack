# Performance testing

Performance tests check measurable contracts and find performance regressions. They are different from correctness tests.

## Choosing the workload

- Identify the measured behavior and realistic inputs, including boundary sizes.
- Measure throughput, latency, allocations or resource use only when the requirement needs it.
- Compare against a baseline from a previous version on the same hardware and configuration.
- Warm up runtime compilation and caches when the benchmark tool needs it.
- Run enough samples to see the variation. Report the environment, the sample size, the method and the measured distribution.

## Regression criteria

Use thresholds only when the project documents targets or an agreed budget. Compare the same workload in the same environment. Find the cause of noise before you report a regression or an improvement.

Do not assert exact durations, such as `operation < 10 ms`, in unit tests that run in CI. Hardware, scheduling, heat and background work make them unreliable. If performance is a functional service-level requirement, test it with a defined environment and workload.

## Correctness first

Keep functional tests for the same behavior. A benchmark that does not check the output does not prove correctness. Do not give up correctness or disable checks to get a faster benchmark.

## Example

Good: benchmark UTF-8 parsing over documented input sizes. Compare the median latency and the allocations on the same runner. Test the parse results and errors in separate tests.

Bad: time one call on a developer laptop and assert that it takes less than a random limit. Then call that a regression test.

Related: [test levels](test-levels.md), [deterministic tests](deterministic-tests.md).

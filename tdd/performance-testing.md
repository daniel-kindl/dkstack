# Performance testing

Performance tests support measurable contracts and regression detection. They are distinct from ordinary correctness tests.

## Choosing the workload

- Identify the measured behavior and representative real-world inputs, including boundary sizes.
- Measure throughput, latency, allocations or resource use only where relevant to the requirement.
- Establish a baseline against an appropriate previous version on comparable hardware and configuration.
- Warm up runtime compilation and caches when required by the benchmark harness.
- Run enough samples to understand variation. Report environment, sample size, methodology and measured distribution.

## Regression criteria

Use thresholds only when a project documents meaningful targets or an agreed budget. Compare the same workload and environment. Investigate noise before declaring a regression or a win.

Avoid exact wall-clock assertions such as `operation < 10 ms` in general CI unit tests. Hardware, scheduling, thermal state and background work make them unreliable. If performance is a functional service-level requirement, test it under a defined environment and workload.

## Correctness first

Keep functional tests for the same behavior. A benchmark that executes a function without validating the output does not establish correctness. Do not trade away correctness or disable existing checks for benchmark gains.

## Example

Good: benchmark UTF-8 parsing over documented input sizes, compare median latency and allocations on the same runner, and separately test parse results and errors.

Bad: time a single invocation on a developer laptop, assert the duration is below an arbitrary threshold, and call that a regression test.

Related: [test levels](test-levels.md), [deterministic tests](deterministic-tests.md).

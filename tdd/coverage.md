# Coverage and mutation testing

Use coverage to find code that no test runs. Use mutation testing to check that the assertions find wrong results. Coverage does not prove that behavior is correct.

## Code coverage

- Use line and branch coverage to find paths that no test runs.
- When no test checks critical contract behavior, a failure path or a boundary, explain why.
- Do not add tests only to raise a percentage.
- Do not set one coverage target for all projects. Follow the documented gate of the project.
- Do not lower, disable or bypass a coverage gate to make a change pass.

High coverage does not prove strong assertions. A test can run a line and not find a wrong result.

## Mutation testing

A mutation tool makes small changes to production code. Examples are changing `>=` to `>` and replacing a return value with a default. Each changed version is a mutant. A test kills a mutant when the test fails.

1. Run mutation testing on risky code when the project has a mutation tool.
2. Read each surviving mutant. Find the missing assertion or case.
3. Find the equivalent mutants. An equivalent mutant does not change observable behavior, so no test can kill it.
4. Add behavior tests for the other surviving mutants. Do not add assertions that lock unimportant implementation details.
5. Use the mutation score as a signal. Follow the thresholds of the project if they exist. Do not set one required score for all projects.

## Example

A function checks `quantity >= 0`. A test with only `quantity = 1` cannot kill the `quantity > 0` mutant. Add a test for 0 and a test for -1.

## Reporting

When the results affect a change, record the tools and the scope. Also record the important paths that no test runs and the important surviving mutants. Mark each metric that you did not measure as NOT RUN. Do not claim coverage or mutation results without measured evidence.

Related: [test design](test-design.md), [quality gates](../coding/quality-gates.md).

# Coverage and mutation testing

Coverage is a diagnostic, not proof that behavior is correct. Apply it to find untested risks and to evaluate the effectiveness of assertions.

## Code coverage

- Use line and branch coverage to locate unexercised paths.
- Explain why critical contract behavior, failure paths or boundaries are untested.
- Do not add meaningless tests only to raise a percentage.
- Do not require a universal coverage target across all projects. Follow any project-specific, documented gate.
- Do not lower, disable or bypass an existing coverage gate to make a change pass.

High coverage does not prove meaningful assertions. One test that executes a line may fail to detect an incorrect result.

## Mutation testing

Mutation tools deliberately make small production-code changes, such as reversing a comparison or removing a return-value adjustment. A useful test suite kills a relevant mutation by failing.

1. Run mutation testing for risk-bearing code when practical.
2. Inspect surviving mutations: identify missing assertions or cases.
3. Distinguish equivalent mutations, which do not change observable behavior, from genuine survivors.
4. Add behavior-focused tests for genuine gaps. Avoid assertions that freeze unimportant implementation details.
5. Treat mutation score as a signal. Follow project-specific thresholds if defined; do not invent a universal mandatory score.

## Example

A function checks `quantity >= 0`. Tests for only `quantity = 1` may execute the condition but miss an incorrect `quantity > 0` mutation. Add a boundary test for zero if the contract permits zero.

## Reporting

Record tools, scope, relevant uncovered paths and meaningful survivors when results influence a change. Mark unavailable metrics NOT RUN; do not claim coverage or mutation quality without measured evidence.

Related: [test design](test-design.md), [quality gates](../coding/quality-gates.md).

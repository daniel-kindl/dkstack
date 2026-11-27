# Risk-adaptive verification

Select verification by possible damage, not by the size of the diff.

## Assess risk

Consider external consumers, stored data, security boundaries, concurrency, irreversible effects, and platform differences. A tiny change in authentication can have greater impact than a large documentation edit.

## Verification levels

| Risk | Minimum evidence |
| --- | --- |
| Low | Focused checks, relevant existing tests, and a diff inspection |
| Moderate | Low-risk checks plus integration and compatibility checks for touched boundaries |
| High | Moderate checks plus negative paths, rollback or recovery evidence, and independent review |

Do not treat these levels as substitutes for required project gates. Tests that cannot run stay NOT RUN, never PASS. Evaluate the risk again when the implementation changes.

## High-risk signals

Authentication, authorization, secrets, payment, persistent data, public contracts, production infrastructure, concurrent writes, and destructive operations justify deeper verification. Owner-only actions remain forbidden regardless of risk.

See [safety](safety.md), [code review](../skills/code-review/SKILL.md), and [quality gates](../coding/quality-gates.md).

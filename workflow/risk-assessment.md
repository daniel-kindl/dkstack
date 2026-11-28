# Risk-adaptive verification

Select verification by possible damage, not by the size of the diff.

## Assess risk

Consider external consumers, stored data, security boundaries, concurrency, irreversible effects, and platform differences. A tiny change in authentication can have greater impact than a large documentation edit.
To find what a change can break outside the diff, use [review-blast-radius](../skills/review-blast-radius/SKILL.md).

## Verification levels

| Change risk | Minimum evidence |
| --- | --- |
| Low | Focused checks, relevant existing tests, and a diff inspection |
| Moderate | Low-risk checks plus integration and compatibility checks for touched boundaries |
| High | Moderate checks plus negative paths, and rollback or recovery evidence |

Every pull request needs an independent review before merge, at every level. See [review and merge](review-and-merge.md#rules).
The levels change only the evidence that the author gives.

These levels rate the risk of a change. They are not the finding severities in
[code review](../skills/code-review/SKILL.md).

Do not treat these levels as substitutes for required project gates. Report a check that cannot run as NOT RUN, as [quality gates](../coding/quality-gates.md#rules) says. Evaluate the risk again when the implementation changes.

## High-risk signals

Authentication, authorization, secrets, payment, persistent data, public contracts, production infrastructure, concurrent writes, and destructive operations justify deeper verification. No agent does an owner-only action, at any risk level. See [safety](safety.md#rules).

See [safety](safety.md), [code review](../skills/code-review/SKILL.md), and [quality gates](../coding/quality-gates.md).

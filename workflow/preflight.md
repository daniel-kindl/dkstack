# Preflight

Check the tracker before an agent changes it. These rules do not require a named product. Read
[work.md](work.md) for the issue contract. This page does not copy those rules.

The command is `scripts/preflight.mjs`. It prints a plan. It does not change the tracker.

## Capabilities

Report a capability when the tracker does not support it. Use the fallback. Do not invent a
second store in a comment.

- issues: Do not track work in a second store. Report that the tracker has no issues.
- labels: Do not create labels. Do not store the catalog in a comment.
- milestones: Record the milestone as unsupported. Do not invent a milestone in a comment.
- parent/sub-issues: Do not write a hierarchy in a comment. An action that needs a parent or a
  child fails closed.
- blocking links: Do not write a prerequisite in a comment. An action that needs a prerequisite
  fails closed.
- assignment: Do not record an assignee in a comment.
- comments: Do not claim that a comment was stored.
- PRs/reviews: Use the code host record for a pull request and a review. If that record is
  missing, fail closed.
- checks: Report that checks are unsupported. Do not treat a missing check as a pass.
- protection: Do not change protection. A change to protection needs the owner.

## Labels

A managed open issue has one type label and one status label. agent:ready and agent:human-only exclude each other. Priority is optional and an issue has at most one
priority label. `needs:decision` and `needs:clarification` may both be present. Blocked is not a
label. A prerequisite that is not complete makes the issue blocked. See [work.md](work.md).

| Name | Description | Color |
| --- | --- | --- |
| type:feature | A new behavior. | 1F6FEB |
| type:bug | A defect. | D1242F |
| type:refactor | A structure change that keeps the behavior. | 8250DF |
| type:chore | Maintenance work. | 64748B |
| type:docs | A documentation change. | 0E8A93 |
| type:research | A question to answer before a change. | C86B12 |
| status:triage | The issue waits for the first decision. | B6BDC7 |
| status:planning | The scope is being planned. | A371F7 |
| status:ready | The readiness checks can pass. | 238636 |
| status:active | The work has started. | 0969DA |
| status:review | The change is in review. | BF8700 |
| agent:ready | An agent may do the work. | 2DA44E |
| agent:human-only | Only a human does the work. | CF222E |
| priority:p0 | The most urgent work. | B60205 |
| priority:p1 | Urgent work. | E8590C |
| priority:p2 | Normal work. | D4A72C |
| priority:p3 | The least urgent work. | 6F879D |
| needs:decision | The owner must decide. | C69026 |
| needs:clarification | The requirement is not clear. | D876E3 |

`agent:ready` maps to the eligibility value agent in [work.md](work.md). `agent:human-only` maps
to the eligibility value human. The type names and the priority names use the same words as that
page, with a group prefix.

## Migration

The default run is a dry run. Do not create labels on a dry run.

Create a missing catalog label only when the plan mode is apply. Do not change an existing
label color or description. Do not remove a label. A label that is not in the catalog stays.

Run the preflight again after a create. The second plan has no new create.

Do not change protection, settings or infrastructure. A change to those resources needs the
owner. See [safety.md](safety.md).

## Optional mapping

A tracker may store a label as a name, a color and a description. The color is six hexadecimal
digits. The catalog name is the label name.

One such tracker is GitHub. The catalog name, color and description are the label fields. The
portable contract does not require GitHub. Another tracker maps the same three fields to its own
label record.

## Related

[work.md](work.md), [safety.md](safety.md).

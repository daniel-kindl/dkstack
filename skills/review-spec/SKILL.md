---
name: review-spec
description: "Use when a review must check if a change does what its issue or specification asked for. One block of code-review. Finds the specification and reports missing, unasked-for and wrong work."
user-invocable: false
---

# Review the specification

A building block of [code-review](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md). Use it alone, or as step 4 of code-review. Rate each finding with the [severity table](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md#severity). Write each finding in the [finding format](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md#output).

## Sources

Find the specification in this order:

1. Issue references in the pull request and the commits, for example `Closes #12`.
2. A specification path that the requester gives.
3. A specification file in the project docs that matches the branch or the feature.
4. If you find none, ask the requester. If no specification exists, the specification axis reports "no specification available".

## Findings

Report three types of findings. Quote the specification line for each finding.

- Missing or partial: the specification asks for it, and the change does not do it fully.
- Not asked for: the change does something that the specification does not ask for.
- Wrong: the change does it, but the result looks wrong.

If the issue has no acceptance criteria, write assumed criteria from the issue title, body and linked discussion. Put them in the review. Suggest that the issue gets criteria. See [clarify-intent](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/clarify-intent/SKILL.md). If the intent is not clear enough to decide the verdict, ask the issue author or the coordinator. Do not approve on a guess.

## Credit

The source search order comes from the [code-review skill](https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md) by Matt Pocock (MIT).

---
name: write-pr
description: "Use when you write or materially update a pull request body. The body states the change, the evidence and the merge risk. It does not review or merge."
---

# Write a pull request

Use when you write a pull request body, or when a material change makes the body wrong.

This skill governs the text of the pull request. It does not decide who may open the pull
request. It does not give a verdict. It does not merge. Those rules stay in
[code review](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md)
and
[review and merge](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/review-and-merge.md).

Read [writing](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/writing/index.md). Use
[writing-check](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/writing-check/SKILL.md)
on the body.

## When to refresh

Update the body after a material change to the implementation. Update it again before review.

## Sections

Use the sections below. Keep each section as short as the change allows. Remove a section that
would be empty.

The title is a conventional commit of 50 characters or fewer. See
[version control](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/version-control/index.md).
Use one issue for one pull request. Link the issue. See
[review and merge](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/review-and-merge.md).

## Summary

State what changed and why it matters. Name the people who are affected, such as users or
developers. Describe the behavior. Do not describe only the files.

Add a small visual only when it makes the change easier to see. You can use a diff sketch,
pseudocode, a call tree, a file tree, a diagram or a screenshot. Do not require a visual for a
trivial change. A trivial change can omit the visual.

## Evidence

Separate three kinds of statement.

- Verified: you ran the check, or you read a result for this change. Give the result.
- Unverified: you did not run the check. Say so.
- Known risk: a risk that remains. Name it.

Name each required check that did not run as NOT RUN. Do not say that a check passed unless the
result says that it passed.

A documentation-only change can have no test. Say why no test is needed.

When tests prove the behavior, list those tests in Evidence.
[Review and merge](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/review-and-merge.md)
requires that list.

## Risk and rollback

Consider the merge risk for every pull request.

When the risk is low, write one short sentence and name how to undo the change.

When the risk is not low, name the blast radius, compatibility, migration, rollback and
mitigation. Do not use that long form when the risk is low.

## References

Put the issue link in this section. Add any other link the reader needs. If the issue link is
already in another section and you have no other link, remove this section.

## Examples

These examples show the shape. They are not repository facts.

### Small documentation change

Summary: The install page names the current release branch. A reader can follow the branch
without a second document.

Evidence: No test. The change is documentation. The project check is NOT RUN.

Risk and rollback: Low risk. Revert this pull request.

References: Closes #12.

### Tested code fix

Summary: A failed call runs at most three times. Before the change, the call retried with no
limit. Callers receive the error after the third run.

Evidence: Verified: a test failed because the call retried past the third attempt. The same test
passed after the limit. The project check passed. Unverified: this change was not run on a
production host.

Risk and rollback: Low risk. Revert this pull request. The old retry behavior returns.

References: Closes #18.

### High-risk change

Summary: The public client method gains a required argument. Existing callers do not compile
until they pass the argument.

Evidence: Verified: the unit tests passed after the callers in this repository were updated. The
migration check failed on one external example, and the failure is recorded. Unverified: the
project check is NOT RUN. Known risk: callers outside this repository still use the old method.

Risk and rollback: The blast radius is every external caller of the method. Migration: each
caller adds the argument. Rollback: revert this pull request before other projects release a
version that calls the new method. Mitigation: the changelog names the argument and the old call.

References: Closes #24. See the versioning page.

# Lifecycle

This page joins the existing skills into one route. It links the contracts. It does not copy
their rules.

## Route

1. An external request states the outcome, the constraints, the context and the acceptance
   intent. Use the external request template. The author does not decompose the work.
2. Triage reads the issue and classifies it. A missing lifecycle or eligibility does not stop
   triage. Triage runs preflight before a tracker write. See [preflight.md](preflight.md) and
   [work.md](work.md). A verified, explicit owner instruction to implement the issue can authorize completing its missing administrative triage-to-ready transition. Verify the tracker state again after writes. This never waives prerequisites, eligibility conflicts, claims or safety. Check implementation readiness before implementation.
3. When the objective fits one pull request, use plan-work. When it needs more than one pull
   request, use map-work. The map-work session stops before implementation.
4. A fresh session implements a mapped child after the mapping pull request is merged and the
   child passes readiness.
5. An independent reviewer reviews the implementation pull request.
6. The reviewer merges only the reviewed head when the review passes and the required checks
   are green. The reviewer is not the author. The merge method is squash. Branch protection
   allows the merge. See [review-and-merge.md](review-and-merge.md).

`scripts/lifecycle.mjs` records these decisions. It does not copy the linked procedures.

Release follows [the release skill](../skills/release/SKILL.md). That skill links
[safety.md](safety.md). This page does not copy the publish rule.

## Stops

Use the linked page for the procedure. This list only names the stop.

- A claim collision means this session is not the effective claimant. Stop. See
  [claims.md](claims.md).
- A prerequisite is not complete. Stop. See [work.md](work.md).
- A required permission is missing, unverified or inconsistent. Stop. See
  [preflight.md](preflight.md) and [safety.md](safety.md).
- The same session must not implement an issue that it mapped. Stop. See [work.md](work.md).
- An unreviewed pull request is not ready to merge. Do not merge it. See
  [review-and-merge.md](review-and-merge.md).

## Example

This example shows the four fields. It is not a repository fact.

- Outcome: Show the current branch name in the status line.
- Constraints: Leave the release steps unchanged.
- Context: The status line spec is already in the repository.
- Acceptance intent: A reader can see the current branch name in the status line.

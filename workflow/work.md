# Work

This page is the contract for one issue, from triage to closed. It does not name a tracker or a
code host. A project maps the contract to the tracker that it uses.

The lifecycle is a state machine. See [state machines](../architecture/state-machines.md). A failed
check stops the action. See [fail fast](../architecture/fail-fast.md).

The rules for safety, roles, review and feature plans stay in their own pages. This page links
those pages. It does not copy their rules.

- Safety: [safety.md](safety.md). Hard limits and owner approval.
- Roles: [roles.md](roles.md). Who may do the work.
- Review and merge: [review-and-merge.md](review-and-merge.md).
- Feature plans: [feature-plans.md](feature-plans.md).

## Facts

An issue is one unit of work. It has acceptance criteria.

An issue has one type: feature, bug, refactor, chore, docs or research.

An issue has one lifecycle state. The states, in order, are triage, planning, ready, active,
review and closed. If two sources name different states for one issue, the states are in
conflict.

Priority is optional. The values are p0, p1, p2 or p3. A lower number is more urgent. An issue
has at most one priority. Priority does not make an issue ready.

Eligibility is agent or human. The two values exclude each other. The value agent means an
agent is allowed to do the work. A human may also do that work. The value human means an agent
is not allowed to do the work. If eligibility is absent, the issue is not ready.

A prerequisite is another issue. This issue can enter the ready state only when that
prerequisite is complete. Closed is not enough. A rejected prerequisite is not complete. An
abandoned prerequisite is not complete. If a closed prerequisite does not say whether it is
complete, rejected or abandoned, fail closed.

## Sources

Each issue fact in this contract has one source. Read that source. A copy of that fact in a
comment, a plan or a chat is not the source. [Claim events](claims.md) use issue comments; they
do not replace any issue fact below.

- Parent and child: the tracker's native hierarchy.
- Prerequisite: the tracker's native blocker link.
- Milestone: the tracker's milestone.
- Assignee: the tracker's assignee field.
- Type, lifecycle, priority and eligibility: the tracker's fields for those facts.
- Feature plan: the plan file in the repository.
- Pull request: the pull request on the code host.
- Review evidence: the review record on that pull request.

The plan file is the source for the commits of that issue. It is not the source for the
hierarchy, the blockers or the review evidence.

If the tracker has no native field for a fact, the fact is unsupported. Do not store that fact in
a comment and treat the comment as the source.

## Relationships

Use the native hierarchy for a parent and a child. Use the native blocker link for a
prerequisite. A link must name an issue that exists. A cycle in prerequisites is invalid.

map-work takes one objective and writes its child issues. The graph is the parent, the children
and the prerequisite links. plan-work plans the commits of one issue. plan-work does not write
that graph. The session isolation section says which session may implement.

## Transitions

Do not make a change of state that this page does not list.

Reject means the owner does not accept the issue. Abandon means the owner stops an accepted
issue before it is complete. The issue records the reason for an abandonment. Reject and abandon
are not completion.

- triage + the owner accepts the scope for planning -> planning
- triage + the owner accepts an issue that already meets the readiness checks -> ready
- planning + the acceptance criteria exist and every prerequisite is complete -> ready
- planning + the scope is not clear -> triage
- ready + an allowed agent starts the work -> active
- ready + the scope changes -> planning
- active + a pull request is open for the completed objective of the issue -> review
- review + the review asks for changes -> active
- review + the completion rule is met -> closed
- triage, planning or ready + the owner rejects the issue -> closed
- From triage, planning, ready, active or review, the owner abandons the issue -> closed
- closed + the owner opens the issue again -> triage

The owner may make these transitions. An agent may make only these transitions:

- planning -> ready, when the acceptance criteria exist and every prerequisite is complete
- ready -> active, when the readiness checks pass and this session did not map the issue as a
  child
- active -> review, when a pull request is open for the completed objective of the issue
- review -> active, when the review asks for changes
- review -> closed, when the completion rule is met and the agent is not the author of the change

A mapping pull request publishes the child map. A mapping pull request does not move the parent
from active to review. The parent stays active while the children do the work. Children are not
actionable until that mapping pull request has passed independent review and is merged.

An agent does not reject an issue and does not abandon an issue. An agent who authored the
change does not move that issue to closed. This limit does not apply to the owner. The owner may
close the issue when a listed transition allows it.

## Readiness

An issue is ready for an agent only when all of these are true:

- The lifecycle state is ready.
- The eligibility is agent.
- Every prerequisite is complete.
- The acceptance criteria exist.
- The authorization section allows the action that the agent will take.
- No source for these checks is missing, unsupported or in conflict.

If one check fails, the issue is not ready. Stop. Do not start the work.

These checks govern an initial claim. A replacement claimant may resume an active or review
issue only through a valid handoff or owner recovery under [claim events](claims.md). The
replacement claimant checks every readiness fact except the `ready` lifecycle state. It also
checks the current lifecycle state, claim history and authorization. It does not make a new
issue state transition to start the resumed work. If any check fails, stop.

## Authorization

[safety.md](safety.md) and [roles.md](roles.md) hold the hard limits and the role boundaries.
Those rules win over this page.

These actions have their own checks:

- An agent may read an issue.
- An agent may change the lifecycle only through a transition that this page allows for an agent.
- In-scope map-work stays inside the objective and the constraints in the parent issue. That
  mapping follows the repository rules. It does not need a new approval from the owner. The
  agent may write the child issues, the hierarchy links and the blocker links for that mapping.
- A material expansion of that scope adds work that the parent issue does not allow. The owner
  approves that expansion before the agent writes it. A restricted action also needs the owner's
  approval. See [safety.md](safety.md). If that approval is absent, do not write the expansion
  and do not take the restricted action.
- The author of a change does not review or merge that change. See [roles.md](roles.md) and
  [review-and-merge.md](review-and-merge.md).
- A comment, a plan or a message from an agent is not authorization.

## Session isolation

The session that runs map-work must not implement a mapped issue in that same session. A
mapped issue is a child issue in the map. The parent objective is not a mapped issue for this
boundary. The mapping session may work on the parent to create the map. A context-sharing
subagent is the same session. A context-sharing subagent can read this session's
context. After you store the map in the tracker and in the repository, stop. A fresh session
implements the mapped issue only after the mapping pull request has passed independent review
and is merged. That session reads the tracker and the repository. It does not receive the
mapping session's context.

This boundary applies to map-work. It does not apply to plan-work. plan-work plans the commits of
one issue. The same session may implement that issue when that session did not run map-work for it.

## Precedence

Use this order:

1. A rule in [safety.md](safety.md) wins over this page.
2. The role and review rules win over this page for review and merge.
3. For one fact, the source in this page wins over a copy.
4. If two sources for the same fact disagree, fail closed.

## Fail closed

If a required fact, check, transition or authorization is missing, unsupported or in conflict,
fail closed. Stop. Do not guess, and do not take the action.

## Completion

An issue is complete when every acceptance criterion is met and the evidence for those criteria
is in the source that this page names for that evidence.

For a change to the repository, the evidence is the merged pull request. The merge follows
[review-and-merge.md](review-and-merge.md). The author does not merge that pull request.

When the issue asks for a decision, the evidence is the owner's decision recorded in the issue
or in an ADR.

The owner may abandon an issue. Closed means the issue is complete, rejected or abandoned. Do
not treat a rejected issue or an abandoned issue as complete.

## Related

[roles.md](roles.md), [review-and-merge.md](review-and-merge.md),
[feature-plans.md](feature-plans.md), [safety.md](safety.md).

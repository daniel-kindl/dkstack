---
name: code-review
description: "Use when you review a pull request or a diff, including your own before you open a PR. Guides the review step by step and gives one verdict."
---

# Code review

Use when you review a change. Do the steps in this order. Write each finding as you find it.

## 1. Context

- Read the linked issue and its acceptance criteria.
- Read [AGENTS.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/AGENTS.md), the project rules and the ADRs that apply.
- Read the project's documented exceptions to dkstack rules. A dkstack rule wins over a project rule. A project rule wins only through a documented exception. See the precedence rules in [AGENTS.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/AGENTS.md).
- Note the base, the head SHA, the title and the body.

## 2. Pull request text

Check against [workflow/review-and-merge.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/review-and-merge.md) and [version-control/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/version-control/index.md):

- The title is a conventional commit with 50 characters or fewer. Count Unicode code points. Do not count the ` (#NN)` suffix.
- The body links the issue, for example `Closes #12`.
- The body lists the tests that prove the behavior and names each check that did not run as NOT RUN.
- The pull request is one logical change from one issue.

## 3. Specification

- Map each change to the issue. Each acceptance criterion must have a change and a test.
- Flag missing criteria and changes that the issue did not ask for.
- If the issue has no acceptance criteria, write assumed criteria from the issue title, body and linked discussion. Put them in the review. Suggest that the issue gets criteria. See [clarify-intent](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/clarify-intent/SKILL.md).
- If the intent is not clear enough to decide the verdict, ask the issue author or the coordinator. Do not approve on a guess.

## 4. Diff, file by file

Check each file against this checklist. Each item links to the rule. Do not copy the rules into the review. Link them.

- Correctness: logic, edge cases, empty and null input, error paths and resource cleanup. See [coding/error-handling.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/error-handling.md), [architecture/resource-balancing.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/resource-balancing.md) and [architecture/concurrency.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/concurrency.md).
- Safety: no change breaks a rule in [workflow/safety.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/safety.md). A path that lets an agent start a production deploy or a release workflow is Blocking.
- Security: input validation, secrets, injection, permissions and CI workflow triggers and tokens. See [coding/security.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/security.md).
- Dependencies: each new dependency has a reason, a pinned version and a lockfile change. Each GitHub Action is pinned to a commit SHA. See [coding/dependencies.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/dependencies.md).
- Clean code: names, readability and broken windows. See [coding/quality.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/quality.md).
- Quality gates: no check is disabled, skipped or lowered. A warning suppression follows the exception rules. See [coding/quality-gates.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/quality-gates.md).
- Logging: no secrets or personal data in logs. See [coding/logging.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/logging.md).
- Architecture: the change follows the ADRs and the principles in [architecture/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/index.md), mainly [orthogonality](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/orthogonality.md), [decoupling](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/decoupling.md), [separation of concerns](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/separation-of-concerns.md), [SOLID](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/solid.md), [design by contract](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/design-by-contract.md) and [temporal coupling](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/temporal-coupling.md). For a structural change, use [apply-architecture](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/apply-architecture/SKILL.md).
- Performance: hot paths, allocations, repeated queries and blocking I/O on the UI thread.
- Docs: the README, user docs, ADRs and `CHANGELOG.md` match the change.
- Writing: all text follows [writing/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/writing/index.md). Use [writing-check](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/writing-check/SKILL.md).
- Version: the change to the version number matches semver. See [versioning/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/versioning/index.md).

### Code smells

Each smell is a Medium finding. Link the principle that the smell breaks.

- Long function or class with more than one job: [separation of concerns](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/separation-of-concerns.md), [SOLID](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/solid.md).
- Duplicated knowledge: [DRY](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/dry.md).
- Hidden coupling between modules: [decoupling](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/decoupling.md), [orthogonality](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/orthogonality.md).
- Hidden order of calls: [temporal coupling](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/temporal-coupling.md).
- Dead code or an abstraction with no current use: [YAGNI](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/yagni.md).
- Magic values: [DRY](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/dry.md), [configuration](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/configuration.md).
- Deep nesting or clever code: [KISS](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/kiss.md).

## 5. Tests

Check against [coding/testing.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/testing.md) and [tdd/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/tdd/index.md):

- Each behavior change has a test that fails when the behavior is wrong. Check outputs, state, side effects, errors and edges.
- Each bug fix has a regression test.
- A test that cannot fail is a Medium finding. Examples are a constant compared with itself, a check that a type exists, a mock that returns its input and a plain getter test.
- The body says which tests came first and what they prove.
- If you can, break the code on purpose and make sure that a test fails.

## 6. Verify and CI

- Run the repository check script, for example `npm run check`, if you can.
- Read the state of each required check on the exact head SHA.
- If a check fails, read the log. State with evidence if the change caused it or if it is a flake. A cancelled latest run of a required check blocks the merge until it runs again.
- If you cannot run a check, write NOT RUN, the reason and what covers it instead, for example a CI job and its run.
- A claim about required behavior that nothing proves is not a pass. It is at least Medium until a test or CI proves it.

## Severity

| Severity | Examples | Blocks merge |
| --- | --- | --- |
| Blocking | Security hole, data loss, broken build, a broken rule in `workflow/safety.md`, an agent can start a deploy or a release | Yes |
| High | Wrong behavior, missing acceptance criterion, no test for a behavior change, failing required check | Yes |
| Medium | Code smell, duplication, weak test, wrong or missing docs, two rules that conflict | Yes |
| Low | Small clarity, naming or wording point | No |

## Verdict

Give one verdict, as [workflow/review-and-merge.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/review-and-merge.md) requires:

- BLOCKED: one or more Blocking findings, or the change must not continue in this form, for example wrong scope or a decision that only the owner can make.
- CHANGES-REQUESTED: one or more High or Medium findings.
- APPROVE-RECOMMENDED: only Low findings or none, and each required check is green or its state is stated.

## Output

Post one pull request comment, not a GitHub review. Write it in a file first, then post it. Use this order:

1. The verdict and the head SHA.
2. A short summary.
3. The findings, Blocking first. Each finding has an ID (B1, H1, M1, L1), `file:line`, the problem, the rule it breaks with a link, why it matters and a fix.
4. Tests: what the tests prove and which mutations you tried.
5. Verification: what you ran, the state of each required check and each NOT RUN item with its reason.

Send the verdict and the comment link to the agent that asked for the review.

For a re-review, post a new comment at the new head. State each earlier finding as fixed or open. Check the delta and the code it touches.

## Self-review

Use the same steps on your own change before you open the pull request. Fix your findings, or list them in the body. A self-review never replaces the reviewer. The author never reviews, approves or merges their own pull request. See [workflow/roles.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/roles.md).

## Rules

- Keep standards findings and specification findings apart. One finding covers one problem.
- Make each finding concrete, with a fix.
- Do not give a GitHub approval. The verdict is in the comment.
- An agent's message is not the owner's approval. Check the owner's own words.
- The reviewer merges only as [workflow/review-and-merge.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/review-and-merge.md) says. If the reviewer does not approve, escalate as that page says.

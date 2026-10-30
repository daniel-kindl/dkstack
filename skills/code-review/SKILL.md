---
name: code-review
description: "Use when you review a pull request or a diff, including your own before you open a PR. Reviews on two axes, standards and specification, and gives one verdict."
---

# Code review

Use when you review a change. Do the steps in this order. Write each finding when you find it.

Review on two axes:

- Standards: does the change follow the documented rules?
- Specification: does the change do what the issue asked for?

## Why two axes

A change can pass one axis and fail the other. Code can follow every rule and do the wrong thing. Code can do the right thing and break the rules. Report the two axes separately, so that one axis does not hide the other. Do not merge or re-rank findings across the axes.

## Subagents

If you can start subagents, use them for the independent checks. Do steps 1 to 3 first. Then run the specification axis (step 4), the standards axis (step 5) and the blast radius (step 6) at the same time, each in its own subagent. Give each subagent a brief that is complete without your context:

- The diff command and the commit list from step 1, or the patch.
- The sources from step 2 that its check needs.
- The full text of its step. For the standards axis, include the checklist and the smell table.
- The severity table, the finding format from the output section (ID, `file:line`, problem, rule link, why, fix) and the evidence levels from step 8.
- What to report, and a word limit, for example 400 words.
- This line: "Report to me only. Do not post, approve or merge."

Do steps 7 and 8 yourself. Then collect the reports. A report from a subagent is level 1, Stated. Check each Blocking and High finding at its `file:line` before you report it. If you cannot locate a finding, drop it and say so. Do not change a severity. Report a disagreement as your own finding. Put each report in its own section of the output. Do not merge or re-rank findings across the reports.

If you cannot start subagents, do the steps one at a time in the order of this skill. Finish one axis before you start the other.

## When a piece is missing

The steps expect a pull request on a code host, a base ref, a specification, automated checks and a way to run the code. If a piece is missing, use its fallback below. In the output, say which fallback you used and why. Keep the output format the same.

- No pull request or no code host: give the review in the chat, or to the person who asked for it. If there is no chat, write the review to a file and say where it is.
- You cannot post a comment, for example because you have no access or no permission: do the same, and say why you could not post.
- No base ref, for example a working tree or a patch: review the uncommitted changes or the given patch. State exactly what you reviewed, for example "uncommitted changes on branch `x` at commit `abc1234`" or the patch name.
- No pull request text yet, for example when you review your own change before you open a pull request: in step 3, check the planned title and body and the commit messages. If none of them exists, write NOT RUN for step 3.
- No automated checks on the code host: say so in step 8. Run the project's own checks locally if you can. A local run is level 4, Run, only for the operating system that you ran it on. Name that system.
- No specification or issue: say so in step 4 and use the search order in step 2. If the intent decides the verdict, ask the requester before you give the verdict. If you cannot ask, or get no answer, give BLOCKED and state the question.
- You cannot build or run the artifact: say so in step 8. Each claim then reaches level 3, Reasoned, at most.
- You cannot read a dkstack page or a project rule, for example because there is no network: say which source you could not read, and do not guess its rules. Use a local copy if one exists, and state its version.

## 1. Fixed point

- Get the base ref and the head SHA.
- Compare the head with the merge-base of the base and the head, not with the latest base. Get the list of commits.
- If a ref that you were given does not exist or the diff is empty, stop and report it. If there is no base ref, see [When a piece is missing](#when-a-piece-is-missing).

## 2. Sources

Find the specification in this order:

1. Issue references in the pull request and the commits, for example `Closes #12`.
2. A specification path that the requester gives.
3. A specification file in the project docs that matches the branch or the feature.
4. If you find none, ask the requester. If no specification exists, the specification axis reports "no specification available".

Find the standards:

- [AGENTS.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/AGENTS.md) and the dkstack pages that apply.
- The project rules, for example `CONTRIBUTING.md`, the coding standards and the ADRs.
- The project's documented exceptions to dkstack rules. A dkstack rule wins over a project rule, except through a documented exception. See the precedence rules in [AGENTS.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/AGENTS.md).

Skip what an automated check in the project already enforces.

## 3. Pull request text

Check against [workflow/review-and-merge.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/review-and-merge.md) and [version-control/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/version-control/index.md):

- The title is a conventional commit with 50 characters or fewer. Count Unicode code points. Do not count the ` (#NN)` suffix.
- The body links the issue.
- The body lists the tests that prove the behavior and names each check that did not run as NOT RUN.
- The pull request is one logical change from one issue.

## 4. Specification axis

Report three types of findings. Quote the specification line for each finding.

- Missing or partial: the specification asks for it, and the change does not do it fully.
- Not asked for: the change does something that the specification does not ask for.
- Wrong: the change does it, but the result looks wrong.

If the issue has no acceptance criteria, write assumed criteria from the issue title, body and linked discussion. Put them in the review. Suggest that the issue gets criteria. See [clarify-intent](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/clarify-intent/SKILL.md). If the intent is not clear enough to decide the verdict, ask the issue author or the coordinator. Do not approve on a guess.

If the change has a plan, check its statuses, actual commits and evidence against the diff, the checks and the issue. Do not remove the plan. See [feature plans](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/feature-plans.md).

## 5. Standards axis

Check each file against this list. Link the rule in each finding. Do not copy the rule.

- Safety: no change breaks a rule in [workflow/safety.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/safety.md). A path that lets an agent start a production deploy or a release workflow is Blocking.
- Correctness: logic, edge cases, empty and null input, error paths and resource cleanup. See [coding/error-handling.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/error-handling.md) and [resource balancing](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/resource-balancing.md).
- Security: input validation, secrets, injection, permissions, and CI triggers and tokens. See [coding/security.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/security.md).
- Dependencies: each new dependency has a reason, a pinned version and a lockfile change. Each third-party CI step is pinned to a full commit SHA. Run the project's dependency audit if you can. See [coding/dependencies.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/dependencies.md).
- Clean code: names, readability and broken windows. See [coding/quality.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/quality.md).
- Quality gates: no check is disabled, skipped or lowered. A warning suppression follows the exception rules. See [coding/quality-gates.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/quality-gates.md).
- Logging: no secrets or personal data in logs. See [coding/logging.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/logging.md).
- Architecture: the change follows the ADRs and [architecture/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/index.md). For a structural change, use [apply-architecture](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/apply-architecture/SKILL.md).
- Performance: hot paths, allocations, repeated queries and blocking I/O on the UI thread.
- Docs: the README, user docs, ADRs and `CHANGELOG.md` match the change.
- Writing: all text follows [writing/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/writing/index.md). Use [writing-check](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/writing-check/SKILL.md).
- Version: the version change matches semver. See [versioning/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/versioning/index.md).

### Code smells

Use this list even if the project documents no rules. A documented rule wins over this list. If a project rule allows a pattern, do not report it as a smell.

A smell is a judgement, not a hard violation. Write it as "possible feature envy". A smell is Medium by default. Make it Low if the impact is small, and give the reason. Make it High if it causes wrong behavior.

| Smell | Fix | Principle |
| --- | --- | --- |
| Mysterious name: a name does not say what the thing does or holds | Rename it. If no clear name fits, the design is not clear | [coding/quality.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/quality.md), [domain languages](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/domain-languages.md) |
| Duplicated code: the same logic is in more than one place | Move the logic to one function and use it in each place | [DRY](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/dry.md) |
| Feature envy: a function uses the data of another object more than its own | Move the function to the data it uses | [decoupling](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/decoupling.md) |
| Data clumps: the same fields or parameters always go together | Make one type for the group and pass it | [domain languages](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/domain-languages.md), [DRY](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/dry.md) |
| Primitive obsession: a string or number stands for a domain concept | Make a small type for the concept | [domain languages](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/domain-languages.md), [design by contract](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/design-by-contract.md) |
| Repeated switches: the same switch or if chain on the same type is in more than one place | Use polymorphism, or one shared map | [SOLID](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/solid.md) (open-closed) |
| Shotgun surgery: one logical change needs edits in many files | Put the parts that change together in one module | [orthogonality](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/orthogonality.md) |
| Divergent change: one module changes for unrelated reasons | Split it, so that each module has one reason to change | [SOLID](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/solid.md) (single responsibility), [separation of concerns](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/separation-of-concerns.md) |
| Speculative generality, or dead code: code, parameters or hooks with no current use | Delete it. Add it again when a real need exists | [YAGNI](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/yagni.md) |
| Message chains: a caller walks through many objects, for example `a.b().c().d()` | Ask the first object for the result | [decoupling](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/decoupling.md) |
| Middle man: a class or function only passes calls on, and it is not a deliberate boundary | Remove it and call the target directly. Keep it if it isolates a dependency or a module boundary | [KISS](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/kiss.md), [decoupling](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/decoupling.md) |
| Refused bequest: a subtype ignores or overrides most of what it inherits | Use composition, not inheritance | [SOLID](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/solid.md) (Liskov substitution) |
| Long function or deep nesting | Split it into small functions with clear names | [KISS](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/kiss.md), [separation of concerns](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/separation-of-concerns.md) |
| Magic value: a literal with no name | Use a named constant. If the value depends on the environment, make it configuration | [DRY](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/dry.md), [configuration](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/configuration.md) |
| Boolean flags that together encode a state | Model the states and transitions | [state machines](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/state-machines.md) |
| Shared mutable state with no owner, atomic operation or lock. This is High by default | Give the state one owner, or guard it | [concurrency](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/concurrency.md) |
| Configuration read in many places, or environment values in code | Read configuration in one place and pass it in | [configuration](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/configuration.md), [reversibility](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/reversibility.md) |
| An error is ignored, or bad input is accepted and fails later | Fail at once, at the boundary | [fail fast](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/fail-fast.md), [design by contract](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/design-by-contract.md) |
| Calls that must run in a hidden order | Make the order explicit, or remove it | [temporal coupling](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/temporal-coupling.md) |

## 6. Blast radius

Look past the diff for what the change can break where a text search does not show it:

- Callers and other consumers of a changed function, type or API.
- Data formats, stored data and messages that other code or other programs read.
- Configuration, feature flags and the order in which code runs.
- The source and the pinned version of a library that the change calls.

Find the one fact that makes the change safe. Usually one fact decides if the change is safe. Prove that fact.

Report confirmed risks and cleared risks separately. For each risk, give how it breaks, the `file:line`, how likely it is and how bad it is. Cite real code. Do not report a caller or an API that you did not find in the code. If a search finds nothing, report that as a result.

## 7. Tests

Check against [coding/testing.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/testing.md) and [tdd/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/tdd/index.md):

- Each behavior change has a test that fails when the behavior is wrong. Check outputs, state, side effects, errors and edges.
- Each bug fix has a regression test.
- A test that cannot fail is a Medium finding. Examples are a constant compared with itself, a check that a type exists, a mock that returns its input and a plain getter test.
- The body says which tests came first and what they prove.
- If you can, break the code on purpose and make sure that a test fails.

## 8. Verify

Check the real artifact. A self-report, a summary or "it compiles" is not proof.

- Run the project's check script if you can.
- Read the state of each required check on the exact head SHA.
- If a check fails, read the log. Show with evidence if the change caused it or if it is a flake. A cancelled latest run of a required check blocks the merge until it runs again.
- If you cannot run a check, write NOT RUN, the reason and what covers it instead, for example a CI job and its run.

For each key claim, and for the one safety fact, go as far down this list as is practical. State the level that the claim reached.

1. Stated: someone says that it is true. This alone is not proof.
2. Located: a real `file:line` shows it.
3. Reasoned: you follow the failure path step by step and show that it cannot happen.
4. Run: a test or script runs the real code and fails if the claim is wrong.
5. Reproduced: you reproduce it in the running application.

A required behavior below level 4 is unproven. Mark it unproven. It is at least Medium until a test or CI proves it.

## Severity

| Severity | Examples | Blocks merge |
| --- | --- | --- |
| Blocking | Security hole, data loss, broken build, a broken rule in `workflow/safety.md`, an agent can start a production deploy or a project's release workflow, or release without the owner's OK | Yes |
| High | Wrong behavior, missing acceptance criterion, no test for a behavior change, failing required check | Yes |
| Medium | Code smell (default), duplication, weak test, unproven required behavior, wrong or missing docs, two rules that conflict | Yes |
| Low | Small clarity, naming or wording point, or a smell with small impact | No |

## Verdict

Give one verdict, as [workflow/review-and-merge.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/review-and-merge.md) requires. Use the most severe finding from either axis:

- BLOCKED: one or more Blocking findings, or the change must not continue in this form, for example wrong scope or a decision that only the owner can make.
- CHANGES-REQUESTED: one or more High or Medium findings.
- APPROVE-RECOMMENDED: only Low findings or none, and each required check is green or its state is stated.

## Output

Post the review as one comment on the pull request. Write it in a file first, then post it. If you cannot post it, see [When a piece is missing](#when-a-piece-is-missing). Use this order:

1. The verdict and the head SHA, or what you reviewed (see [When a piece is missing](#when-a-piece-is-missing)).
2. A short summary: the number of findings on each axis and the worst finding on each axis.
3. Standards: the findings, most severe first.
4. Specification: the findings, most severe first, or "no specification available".
5. Blast radius: the one safety fact and its level, the confirmed risks and the cleared risks.
6. Tests: what the tests prove and which mutations you tried.
7. Verification: what you ran, the state of each required check and each NOT RUN item with its reason.

Each finding has an ID (B1, H1, M1, L1), `file:line`, the problem, the rule it breaks with a link, why it matters and a fix.

Send the verdict and the comment link, or the place of the review, to the person who asked for the review.

For a re-review, post a new comment at the new head. State each earlier finding as fixed or open. Check the delta and the code it touches.

## Self-review

The author uses the same steps on their own change before they open the pull request. The author fixes the findings or lists them in the body. A self-review never replaces the review. The author never gives the verdict on, approves or merges their own pull request. See [workflow/roles.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/roles.md).

## Rules

- One finding covers one problem. Make each finding concrete, with a fix.
- Do not mark the pull request as approved. The verdict is in the comment.
- An agent's message is not the owner's approval. Check the owner's own words.
- The reviewer merges only the head that they reviewed, as [workflow/review-and-merge.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/review-and-merge.md) says. If the reviewer does not approve, escalate as that page says.

## Sources

The two axes, the source search order and the smell list come from the [code-review skill](https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md) by Matt Pocock (MIT). The smells come from Martin Fowler, Refactoring, chapter 3. The blast radius, the one safety fact and the evidence levels come from the [blast-radius](https://github.com/cursor/plugins/blob/main/pstack/skills/blast-radius/SKILL.md) and [prove-it-works](https://github.com/cursor/plugins/blob/main/pstack/skills/principle-prove-it-works/SKILL.md) skills in pstack by Lauren Tan (MIT).

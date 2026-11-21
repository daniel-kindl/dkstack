---
name: code-review
description: "Use when you review a pull request or a diff, including your own before you open a pull request. Reviews on two axes, standards and specification, and gives one verdict. Triggers: review, review this PR, check my diff."
---

# Code review

Use when you review a change. Do the steps in this order. Write each finding when you find it.

Review on two axes:

- Standards: does the change follow the documented rules?
- Specification: does the change do what the issue asked for?

## Why two axes

A change can pass one axis and fail the other. Code can follow every rule and do the wrong thing. Code can do the right thing and break the rules. Report the two axes separately, so that one axis does not hide the other. Do not merge or re-rank findings across the axes.

## Subagents

If you can start subagents, use them for the independent checks. Do steps 1 to 3 first. Then run steps 4, 5 and 6 at the same time, each in its own subagent. They are the specification axis, the standards axis and the blast radius. Give each subagent a brief that is complete without your context:

- The diff command and the commit list from step 1, or the patch.
- The sources from step 2 that its check needs.
- The building block of its step: [review-spec](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/review-spec/SKILL.md), [review-standards](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/review-standards/SKILL.md) or [review-blast-radius](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/review-blast-radius/SKILL.md). Give the link, or the full text if the subagent cannot read the link.
- The severity table, the finding format from the output section (ID, `file:line`, problem, rule link, why, fix) and the evidence levels in [verify-claim](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/verify-claim/SKILL.md).
- What to report, and a word limit, for example 400 words.
- This line: "Report to me only. Do not post, approve or merge."

Do steps 7 and 8 yourself. Then collect the reports. A report from a subagent is level 1, Stated. Check each Blocking and High finding at its `file:line` before you report it. If you cannot locate a finding, drop it and say so. Do not change a severity. Report a disagreement as your own finding. Put each report in its own section of the output. Do not merge or re-rank findings across the reports.

If you cannot start subagents, do the steps one at a time in the order of this skill. Finish one axis before you start the other.

## When a piece is missing

The steps expect a pull request on a code host, a base ref, a specification, automated checks and a way to run the code. If a piece is missing, use its fallback below. In the output, say which fallback you used and why. Keep the output format the same.

- No pull request or no code host: give the review in the chat, or to the person who asked for it. If there is no chat, write the review to a file and say where it is.
- You cannot post a comment, for example because you have no access or no permission: do the same, and say why you could not post.
- No base ref, for example a working tree or a patch: review the uncommitted changes or the given patch. State exactly what you reviewed, for example "uncommitted changes on branch `x` at commit `abc1234`" or the patch name.
- No pull request text yet, for example in a review of your own change before the pull request exists. In step 3, check the planned title and body and the commit messages. If none of them exists, write NOT RUN for step 3.
- No automated checks on the code host: say so in step 8. Run the project's own checks locally if you can. A local run is level 4, Run, only for the operating system that you ran it on. Name that system.
- No specification or issue: say so in step 4 and use the search order in step 2. If the intent decides the verdict, ask the requester before you give the verdict. If you cannot ask, or get no answer, give BLOCKED and state the question.
- You cannot build or run the artifact: say so in step 8. Each claim then reaches level 3, Reasoned, at most.
- You cannot read a dkstack page or a project rule, for example with no network: name the source that you could not read. Do not guess its rules. Use a local copy if one exists, and state its version.

## 1. Fixed point

- Get the base ref and the head SHA.
- Compare the head with the merge-base of the base and the head, not with the latest base. Get the list of commits.
- If a ref that you were given does not exist or the diff is empty, stop and report it. If there is no base ref, see [When a piece is missing](#when-a-piece-is-missing).

## 2. Sources

Find the specification with the [sources](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/review-spec/SKILL.md#sources) of [review-spec](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/review-spec/SKILL.md). Find the standards with the [sources](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/review-standards/SKILL.md#sources) of [review-standards](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/review-standards/SKILL.md). If no specification exists, the specification axis reports "no specification available".

## 3. Pull request text

Check against [workflow/review-and-merge.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/review-and-merge.md) and [version-control/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/version-control/index.md):

- The title is a conventional commit that follows the [title rules](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/version-control/index.md#rules).
- The body links the issue.
- The body lists the tests that prove the behavior and names each check that did not run as NOT RUN.
- The pull request is one logical change from one issue.

## 4. Specification axis

Run [review-spec](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/review-spec/SKILL.md). Quote the specification line for each finding.

## 5. Standards axis

Run [review-standards](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/review-standards/SKILL.md). It has the checklist and the code smell list. Link the rule in each finding. Do not copy the rule.

## 6. Blast radius

Run [review-blast-radius](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/review-blast-radius/SKILL.md). Find and prove the one fact that makes the change safe.

## 7. Tests

Check against [coding/testing.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/testing.md) and [tdd/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/tdd/index.md):

- Each behavior change has a test that fails when the behavior is wrong. Check outputs, state, side effects, errors and edges.
- Each bug fix has a regression test.
- A test that cannot fail is a Medium finding. Examples are a constant compared with itself, a check that a type exists, a mock that returns its input and a plain getter test.
- The body says which tests came first and what they prove.
- If you can, break the code on purpose and make sure that a test fails.

## 8. Verify

Run [verify-claim](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/verify-claim/SKILL.md) for each key claim and for the one safety fact. It has the five evidence levels. State the level that each claim reached. A required behavior below level 4 is unproven. It is at least Medium until a test or CI proves it.

## Severity

| Severity | Examples | Blocks merge |
| --- | --- | --- |
| Blocking | Security hole, data loss, a broken rule in `workflow/safety.md`, an agent can start a production deploy or a project's release workflow, or release without the owner's OK | Yes |
| High | Wrong behavior, missing acceptance criterion, no test for a behavior change, broken build or failing required check, code that contradicts an Accepted ADR (see [ADR findings](#adr-findings)) | Yes |
| Medium | Code smell (default), duplication, weak test, unproven required behavior, wrong or missing docs, two rules that conflict | Yes |
| Low | Small clarity, naming or wording point, or a smell with small impact | No |

## ADR findings

Code that contradicts an Accepted ADR is High. The [ADR rules](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/adrs.md#status-and-affects) say which ADRs are Accepted.

- A High ADR finding quotes the ADR line and the code line that it breaks. Without both quotes, write it as a question, not as a High finding.
- A newer ADR that supersedes the old ADR clears the finding.
- To find the ADRs that apply, read each Accepted ADR whose `Affects:` line matches a changed file. For each old ADR with no `Affects:` line, read its title and its Decision section.
- A missing `Affects:` line on an old ADR is never a finding. Do not ask for one.

## Verdict

Give one verdict, as [workflow/review-and-merge.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/review-and-merge.md) requires. Use the most severe finding from either axis:

- BLOCKED: one or more Blocking findings, or the change must not continue in this form. Examples are the wrong scope or a decision that only the owner can make.
- CHANGES-REQUESTED: one or more High or Medium findings.
- APPROVE-RECOMMENDED: only Low findings or none, and each required check is green on the reviewed head.

If a required check is pending, give no verdict yet. Wait for the result, then give the verdict.

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

The author uses the same steps on their own change before they open the pull request. The author fixes the findings or lists them in the body. A self-review never replaces the review. The author never gives the verdict on, approves or merges their own pull request. Who may merge is in the [merge rule](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/review-and-merge.md#rules).

## Rules

- One finding covers one problem. Make each finding concrete, with a fix.
- Do not mark the pull request as approved. The verdict is in the comment.
- An agent's message is not the owner's approval. Check the owner's own words.
- Merge only as the [merge rule](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/review-and-merge.md#rules) says. A later commit changes the head, so review the new head first.

## Sources

The two axes, the source search order and the smell list come from the [code-review skill](https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md) by Matt Pocock (MIT). The smells come from Martin Fowler, Refactoring, chapter 3. The blast radius, the one safety fact and the evidence levels come from the [blast-radius](https://github.com/cursor/plugins/blob/main/pstack/skills/blast-radius/SKILL.md) and [prove-it-works](https://github.com/cursor/plugins/blob/main/pstack/skills/principle-prove-it-works/SKILL.md) skills in pstack by Lauren Tan (MIT).

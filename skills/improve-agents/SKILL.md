---
name: improve-agents
description: "Use when the owner asks for a retrospective of a session, a pull request or an issue. Finds changes to the agents' environment, such as checks, routes and rules, not to the product code. Reports to the owner. Triggers: retro, retrospective, improve the agents."
disable-model-invocation: true
---

# Improve the agents

Use when the owner asks what to change so that the next agent session goes better. The target is
the agents' environment: the rules, the triage routes, the checks and the tools. The product code
is not the target.

Only the owner starts this skill. A finding can propose a rule change, and only the owner decides
on a rule.

## Input

- The current session, if the owner names no other input.
- A merged pull request or an issue that the owner names. Read its body, its comments, its
  reviews and its check runs. This record stays and each client can read it.
- A session log only when the client keeps one and the owner names it. Do not require a log.

Do not read a set of sessions. Use one input for each run.

## Steps

1. Read the input completely. Note each event that cost time or caused a mistake. Examples are
   a failed tool call, a failed check, an owner correction, a review finding and a long search.
2. For each event, find the cause in the environment, not in the agent's effort. Use the
   categories below.
3. Read the existing rules and checks before you propose a new one. A check that does not run
   is the finding. A rule with no link from triage is the finding.
4. Grade each finding as the [Evidence](#evidence) section says.
5. Write the report as the [Output](#output) section says. Then stop.

## Categories

- Navigation: the agent did not find a rule or a file in time. Propose a triage route or a link.
- Automated checks: a check could have caught the mistake. Classify the rule first. A
  mechanical rule, for example a banned pattern, a file location or a title format, gets a
  deterministic check. Only a judgement call stays as a written rule. See
  [quality gates](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/quality-gates.md).
- No effect: a rule did not change what the agent did, or two agents read it in different ways.
  Propose to make the rule clear, to make it a check or to remove it.
- Steering size: a file that each session loads, for example `AGENTS.md`, is too long. Propose to
  move the text to a page that triage links.
- Tool cost: a tool call was expensive, for example a large output or a repeated search. Propose a
  smaller call or a script.
- Information access: the agent did not have a fact that it needed, for example a log or a
  setting. Propose a read-only way to get it.

## Evidence

Grade each finding with the levels in
[verify-claim](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/verify-claim/SKILL.md).

- A finding quotes its event from the input, for example the tool call, the error text or the
  owner's words. Give the place of the event.
- A finding with no event is a hypothesis. Label it as a hypothesis and give no proposal for it.
- Do not invent an event, a cost or a cause.

## Output

Give one report to the owner. Put the finding with the most effect first. For each finding, give
the category, the event, the evidence level, the cause and one proposal.

Open no issue and change no file without the owner's OK. With the owner's OK:

- A finding about the current project becomes an issue in that project. Use
  [start-issue](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/start-issue/SKILL.md).
- A finding about a dkstack rule becomes a draft issue for `daniel-kindl/dkstack`. Give the draft
  to the owner. The owner opens it, or tells you to open it. Do not edit dkstack from another
  project. See [Changes](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/AGENTS.md#changes).

## Good example

The owner names a merged pull request. Its first `validate` run failed on the title check: the
title had 58 characters. The author then read the title rule and fixed the title.

> 1. Navigation, level 2, Located. Event: the `validate` run on the first head failed with "the title
>    must have 50 characters or fewer". Cause: the `write-pr` steps do not tell the author to run
>    `npm run check:title` before the push. Proposal: add that step to `write-pr`. This is a draft
>    issue for `daniel-kindl/dkstack`, because the rule is in dkstack.

The finding quotes the event, names its level and gives one proposal. It goes to the owner as a
draft, not as an edit.

## Bad example

> The agent was slow and made some mistakes. Add more rules to `AGENTS.md` so that it is more
> careful. I updated the dkstack title rule to make it stricter.

The report quotes no event and has no evidence level. More text in `AGENTS.md` makes each session
load more and changes nothing that a check could enforce. The agent also edited dkstack without
review.

## Subagents

Do not start subagents for this skill. Reason: the input is in your own context, and a subagent
does not have it. A report from a subagent about a session it did not see is only level 1,
Stated. See the [subagent guide](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/subagents.md).

## Credit

The idea and the categories come from the
[retro skill](https://github.com/mattpocock/skills/blob/main/skills/engineering/retro/SKILL.md) by
Matt Pocock (MIT).

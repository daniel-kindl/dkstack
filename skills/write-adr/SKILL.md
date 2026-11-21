---
name: write-adr
description: "Use when you make a decision that is hard to reverse, surprising without its context and the result of a real trade-off, such as a framework, data store or public contract. Creates an Architecture Decision Record."
---

# Write ADR

Use when a design decision meets the ADR test.

Create an Architecture Decision Record using [architecture/adrs.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/adrs.md).

## Steps

1. Confirm that the decision meets the [ADR test](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/adrs.md#when-to-write-an-adr). If it does not, record it in the map or in the pull request body, and stop.
2. Write a short ADR with:
   - A `Status:` line and an `Affects:` line. See [Status and Affects](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/adrs.md#status-and-affects).
   - Context
   - Options considered
   - Decision
   - Consequences
3. Store it as the [place and name](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/adrs.md#place-and-name) rule says.
4. Do not rewrite old ADRs. To change a decision, follow [Amendments](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/adrs.md#amendments).
5. Before you open a pull request, run `check-adrs` (`scripts/check-adrs.mjs`, copied by [bootstrap](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/bootstrap/SKILL.md)). Fix each finding.

## Subagents

If you can start subagents, use them to research the options. Do step 1 yourself. Then research each option for the "Options considered" section at the same time, each option in its own subagent. Give each subagent a brief that is complete without your context:

- The decision and its context.
- The one option that it researches, and the names of the other options.
- The constraints that you know, for example the components that the decision affects.
- What to report: what the option does, its advantages, its disadvantages and its cost to reverse. Each claim has a source, for example a file path or a link.
- A word limit, for example 300 words.
- This line: "Report to me only. Do not write the ADR, post, approve or merge."

Then collect the reports. Write the ADR yourself in step 2, and do steps 3 to 5 yourself. A report from a subagent is a claim. Check each claim that the decision depends on at its source. If a claim has no source, do not put it in the ADR.

Start each subagent with the setting below. The [subagent guide](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/subagents.md) maps each tier to a model.

- Each option: tier medium, effort high.

If you cannot start subagents, do the steps one at a time in the order of this skill. Research one option fully before you start the next option.

## Rules

- Keep it short.
- State trade-offs.
- Link related principles from architecture/ when useful.
- Add a diagram only when it shows the options or the decision more clearly than the text. Use [make-diagram](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/make-diagram/SKILL.md).

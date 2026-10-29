---
name: write-adr
description: "Use when you make a decision that is durable or hard to reverse, such as a framework, data store or public contract. Creates an Architecture Decision Record."
---

# Write ADR

Use when a design decision is durable or hard to reverse.

Create an Architecture Decision Record using [architecture/adrs.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/adrs.md).

## Steps

1. Confirm the decision is worth recording (affects multiple components or is costly to change).
2. Write a short ADR with:
   - Context
   - Options considered
   - Decision
   - Consequences
3. Store it with the code it affects.
4. Do not rewrite old ADRs. Add a new one if the decision changes.

## Subagents

If you can start subagents, use them to research the options. Do step 1 yourself. Then research each option for the "Options considered" section at the same time, each option in its own subagent. Give each subagent a brief that is complete without your context:

- The decision and its context.
- The one option that it researches, and the names of the other options.
- The constraints that you know, for example the components that the decision affects.
- What to report: what the option does, its advantages, its disadvantages and its cost to reverse. Each claim has a source, for example a file path or a link.
- A word limit, for example 300 words.
- This line: "Report to me only. Do not write the ADR, post, approve or merge."

Then collect the reports. Write the ADR yourself in step 2, and do steps 3 and 4 yourself. A report from a subagent is a claim. Check each claim that the decision depends on at its source. If a claim has no source, do not put it in the ADR.

If you cannot start subagents, do the steps one at a time in the order of this skill. Research one option fully before you start the next option.

## Rules

- Keep it short.
- State trade-offs.
- Link related principles from architecture/ when useful.

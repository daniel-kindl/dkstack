---
name: apply-architecture
description: "Use when a change adds, moves or splits a module, or changes a public interface. Checks the design against the architecture principles in this repository."
---

# Apply architecture

Use when you design or change system structure.

Read the relevant architecture principles and check the change against them.

## Steps

1. Identify the design decisions in the task.
2. Read [architecture/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/index.md) and the specific files that apply (orthogonality, design-by-contract, reversibility, etc.).
3. For each decision, state which principle it follows or violates.
4. Prefer the smallest design that satisfies the principles.
5. If a principle is violated, propose a smaller or more reversible alternative.

## Subagents

If you can start subagents, use them when two or more designs are possible. Do step 1 yourself. Then check each design against the principles at the same time, each design in its own subagent. Give each subagent a brief that is complete without your context:

- The task, the design decisions from step 1 and the full text of the one design that it checks.
- The full text of steps 2 and 3, and the rules of this skill.
- What to report: for each decision, the principle that it follows or violates, with a link to the principle file. Also the trade-offs.
- A word limit, for example 400 words.
- This line: "Report to me only. Do not change code, post, approve or merge."

Then collect the reports. Do steps 4 and 5 yourself. A report from a subagent is a claim. Read each principle file that a report links before you use its result. Compare the designs yourself. Do not select a design only because a report prefers it.

If you cannot start subagents, do the steps one at a time in the order of this skill. Check one design fully before you start the next design.

## Rules

- Do not invent new principles. Use only the files in architecture/.
- State trade-offs when two principles pull in different directions.
- Keep the change reversible when possible. See [reversibility.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/reversibility.md).

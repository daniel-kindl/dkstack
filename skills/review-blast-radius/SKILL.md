---
name: review-blast-radius
description: "Use when you must know what a change can break outside its diff: callers, data formats, configuration, run order and library versions. One block of code-review. Finds the one fact that makes the change safe."
user-invocable: false
---

# Review the blast radius

A building block of [code-review](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md). Use it alone, or as step 6 of code-review. Rate each confirmed risk with the [severity table](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md#severity). Grade the safety fact with [verify-claim](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/verify-claim/SKILL.md).

## Steps

Look past the diff for what the change can break where a text search does not show it:

- Callers and other consumers of a changed function, type or API.
- Data formats, stored data and messages that other code or other programs read.
- Configuration, feature flags and the order in which code runs.
- The source and the pinned version of a library that the change calls.

Find the one fact that makes the change safe. Usually one fact decides if the change is safe. Prove that fact.

Report confirmed risks and cleared risks separately. For each risk, give how it breaks, the `file:line`, how likely it is and how bad it is. Cite real code. Do not report a caller or an API that you did not find in the code. If a search finds nothing, report that as a result.

## Credit

The blast radius and the one safety fact come from the [blast-radius](https://github.com/cursor/plugins/blob/main/pstack/skills/blast-radius/SKILL.md) skills in pstack by Lauren Tan (MIT).

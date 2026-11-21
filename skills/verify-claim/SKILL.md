---
name: verify-claim
description: "Use when you must prove a claim about code, such as 'the tests pass', 'this is safe' or 'the bug is fixed', before you report it. Grades the claim on five evidence levels and checks the real artifact, not a self-report."
user-invocable: false
---

# Verify a claim

A building block of [code-review](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md), [tdd-loop](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/tdd-loop/SKILL.md) and [write-pr](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/write-pr/SKILL.md). Use it before you report a claim as true.

## Steps

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

## Credit

The evidence levels come from the [prove-it-works](https://github.com/cursor/plugins/blob/main/pstack/skills/principle-prove-it-works/SKILL.md) skills in pstack by Lauren Tan (MIT).

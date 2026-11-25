---
name: model-domain
description: "Use when a task designs, models or specifies a domain that has rules. Finds the bounded contexts first, then the aggregates, value objects and events, and writes a Domain model block. Triggers: domain model, ddd, bounded context, aggregate"
---

# Model domain

Use when you design or specify a domain. A person or an agent can start this skill. It applies [domain modeling](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/domain-modeling.md). Do not copy that page. It runs [domain-glossary](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/domain-glossary/SKILL.md) as a building block.

## Steps

1. Decide whether to model. Skip this skill for a CRUD change. Skip this skill for a change that uses the model and does not change it. Then only `domain-glossary` applies. Follow the [when to model](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/domain-modeling.md#when-to-model) rules.
2. Run `domain-glossary`. Read `CONTEXT.md` and use its terms. If a term has two meanings, ask the owner.
3. Find the bounded contexts that the task touches. The owner decides each boundary.
4. Write the context map for the contexts that the task touches. For each relation, name the upstream context, the downstream context and where the data is translated.
5. For each context, find the aggregates. State the invariants of each aggregate and its root.
6. Find the value objects and the rules that each one checks.
7. Find the domain events. Name each in the past tense.
8. Write the Domain model block. Put the block in the issue.
9. When a boundary is hard to reverse and meets the ADR test, use [write-adr](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/write-adr/SKILL.md).

Do steps 3 and 4 before steps 5 to 7. Do not model an aggregate before you know its context.

## Domain model

```markdown
## Domain model
Contexts: <the contexts that the task touches, and the relation of each pair>
Aggregates: <each aggregate, its root and its invariants>
Value objects: <each value object and its rules>
Events: <each event, who raises it and who receives it>
```

Write `none` for a part that the task does not need.

## Subagents

If you can start subagents, use one code reader to map the model that exists, before step 3. The reader does not draw boundaries or write the block. Give it a brief that is complete without your context:

- The task, and the paths where the domain code is.
- What to report: the contexts, aggregates, value objects and events that the code has now, each with file and line. Also each place where one word has two meanings.
- A word limit, for example 400 words.
- This line: "Report to me only. Do not change files, commit, push, post, approve or merge."

Start each subagent with the setting below. The [subagent guide](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/subagents.md) maps each tier to a model.

- Code reader: tier medium, effort medium.

The report is a claim. Check each file and line that you use. The owner decides each boundary.

If you cannot start subagents, do the steps one at a time in the order of this skill.

## Boundaries

- Do not add a repository, a factory or another pattern that the page does not give. See [yagni.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/yagni.md).
- Do not put the model in code before the owner agrees on the contexts.

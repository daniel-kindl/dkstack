---
name: chart-route
description: "Use when the owner asks to chart a route, or when a large, unclear effort needs more than one session and the route is not clear. Keeps a map in docs/maps/, settles one question per session and hands off to plan-work. Plans and never builds. Triggers: chart a route, map this out, find the route."
---

# Chart route

Use when the owner asks for it, or when the work needs more than one session and the route is not clear. If one `clarify-intent` round leaves no open question, stop and use [plan-work](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/plan-work/SKILL.md). A map is not necessary.

The skill keeps one map in `docs/maps/<slug>.md`. It plans and never builds. Production code in a map pull request is a finding.

## Steps

The first session does steps 1 and 2. Each later session does steps 3 to 6 for one question. The last session also does step 7.

1. Name the destination with the owner. Use the [rounds](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/clarify-intent/SKILL.md#rounds) of `clarify-intent`. The destination is what is true when the map is done.
2. Write the map from the [template](#map-template) in `docs/maps/<slug>.md`. Run `check-maps`. Open one docs-only pull request and stop.
3. Take one open question: the question that `Next` names, or else the first frontier question. A frontier question has `Blocked by: none`, or each question that it names is decided.
4. Resolve the question by its type:
   - owner: use the `clarify-intent` rounds. Record the owner's own words. An agent that answers an owner question is a finding.
   - research: find the facts. Cite a source for each fact in Notes. A source is a `file:line` or a link.
   - prototype: try two or three different options on a throwaway branch `prototype/<slug>-q<n>`. The owner picks. Record the options and the pick in `## Prototypes` as text. Tag the prototype commit `prototype/<slug>-q<n>`, so that the commit stays after the branch is deleted. Screenshots stay on the prototype branch or its pull request. They never go on `main`.
   - task: do only the small work that unblocks a decision, or leave it for a later issue.
5. Record each answer once:
   - An [ADR](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/write-adr/SKILL.md), when the decision meets the [ADR test](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/adrs.md#when-to-write-an-adr).
   - A `CONTEXT.md` entry for a term. Use [domain-glossary](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/domain-glossary/SKILL.md).
   - Otherwise, the Decisions line only.

   Move the question to Decisions. The line has `Decided by:` with the owner's name and the date, and a `Record:` link to the ADR or the `CONTEXT.md` entry, or `Record: this line`. Add the new questions that the answer shows. Update `Next`.
6. Run `check-maps`, `check-context` and `check-adrs`. Open one docs-only pull request for the session. It changes only files in `docs/maps/`, `docs/adr/` and `CONTEXT.md`. Then stop. The normal review and merge rules apply.
7. When Open questions and Not yet clear are empty, set `Status: done`. Write the plan with [plan-work](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/plan-work/SKILL.md). Open one issue for each map task with [start-issue](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/start-issue/SKILL.md). Set their relations as [more than one task](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/plan-work/SKILL.md#more-than-one-task) in `plan-work` says. Link the plan and the issues under Hand-off. The map stays in `docs/maps/`. Never delete it.

The checks are `scripts/check-maps.mjs`, `scripts/check-context.mjs` and `scripts/check-adrs.mjs`. [Bootstrap](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/bootstrap/SKILL.md) copies them into the repository.

## Subagents

If you can start subagents, use one for step 4 when the question needs research in the code or the docs. Do steps 1 to 3 yourself. Then start one subagent with a brief that is complete without your context:

- The destination and the one question from step 3.
- What to read, for example the code paths, the ADRs and `CONTEXT.md`.
- What to report: the facts that answer the question, each with its file and line or link, and what stays unknown.
- A word limit, for example 400 words.
- This line: "Report to me only. Do not change files, ask the owner, commit, push, post, approve or merge."

Start each subagent with the setting below. The [subagent guide](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/subagents.md) maps each tier to a model.

- Question research: tier medium, effort high.

Check each fact at its source before you record it. Ask the owner each question that needs a decision. Do steps 5 to 7 yourself.

If you cannot start subagents, do the steps one at a time in the order of this skill.

## Rules

- One question per session.
- `chart-route` owns the changes to a map. Another skill reads the map and does not change it.
- A decided question keeps its Q id and moves to Decisions, so that each `Blocked by` line stays correct.
- Do not answer an owner question. Do not invent a fact, a source or a decision.
- The map has no image links.
- Never merge a prototype branch.
- Obey the hard limits in [safety.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/safety.md).

## Map template

```markdown
# Map: <name>

Status: open | done
Destination: <what is true when this map is done>
Next: <the question for the next session, or none>

## Notes

- <fact>. Source: <file:line or link>

## Decisions

- Q<n> <title>: <one-line answer>. Decided by: <owner>, <YYYY-MM-DD>. Record: <ADR link, CONTEXT.md link, or this line>.

## Open questions

### Q<n>: <title>

Type: owner | research | prototype | task
Blocked by: none | Q<n>, Q<n>

<the question in one to three sentences>

## Not yet clear

- <area that is too vague to ask about yet>

## Out of scope

- <item>. Reason: <one line>

## Prototypes

### Q<n>: <title>

- Options: <option>: <what it changes>.
- Picked: <option>, because <reason>.
- Branch: `prototype/<slug>-q<n>` at `<SHA>`. Tag: `prototype/<slug>-q<n>`. Not merged.

## Hand-off

None yet.

When Status is done: the plan-work plan, and one issue for each map task.
```

## Example

An open map after two sessions:

```markdown
# Map: CSV export

Status: open
Destination: A person can export the whole library as one CSV file.
Next: Q3

## Notes

- The library has no export today. Source: src/library.js:12

## Decisions

- Q1 File format: CSV with a header row. Decided by: Robin Gray, 2026-11-19. Record: [ADR 0004](../adr/0004-csv-export.md).
- Q2 Name of the action: "Export". Decided by: Robin Gray, 2026-11-20. Record: this line.

## Open questions

### Q3: Which fields go in the file?

Type: owner
Blocked by: Q1

Select the fields of a book that the file has.

## Not yet clear

- How a person opens the file on a phone.

## Out of scope

- Import from CSV. Reason: a different feature.

## Prototypes

None yet.

## Hand-off

None yet.
```

## Credit

Inspired by Matt Pocock's grill-me, grill-with-docs and wayfinder skills (MIT), https://github.com/mattpocock/skills. The text is new.

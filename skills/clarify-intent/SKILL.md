---
name: clarify-intent
description: "Use when the task has unclear requirements, unknown domain terms or no acceptance criteria. Clarifies the intent and the domain language before you write code. Triggers: grill me, ask me questions, what is unclear."
---

# Clarify intent

Use before you implement a non-trivial change.

Force clarification of requirements and domain language.

## Steps

1. Restate the request in your own words.
2. List open questions about behavior, edge cases, and constraints.
3. Ask the questions. Do not assume answers.
4. Capture domain terms. Prefer the language of the problem. Check each term against `CONTEXT.md`. See [architecture/domain-languages.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/domain-languages.md).
5. Only after the intent is clear, proceed to design or implementation.

## Subagents

If you can start subagents, use them to answer the open questions that the repository can answer. Do steps 1 and 2 yourself. Then read the code and the docs at the same time, the code in one subagent and the docs in another subagent. Give each subagent a brief that is complete without your context:

- The request, as you restated it in step 1.
- The open questions from step 2.
- What to read: the code, or the docs, for example the README, the ADRs and the glossary.
- What to report: for each question, the answer with its file path and line, or "not found". The domain terms that it finds.
- A word limit, for example 400 words.
- This line: "Report to me only. Do not change files, ask the owner, post, approve or merge."

Start each subagent with the setting below. The [subagent guide](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/subagents.md) maps each tier to a model.

- Code reader: tier medium, effort medium.
- Docs reader: tier small, effort medium.

Then collect the reports. Read each answer at its file path and line yourself. If the code and the docs disagree, keep the question open. Do steps 3 to 5 yourself. Ask only the questions that are still open.

If you cannot start subagents, do the steps one at a time in the order of this skill. Before step 3, read the code and then the docs to answer the questions that they can answer.

## Rounds

Rounds are a mode of step 3. Use them after the subagents, or you, find the facts that the repository can give. Switch to rounds when one of these is true:

- More than 3 questions are still open.
- One question depends on another question.
- The owner asks to be grilled.
- `chart-route` sends a question to this skill.

In each round:

1. Start with a short "Settled so far" summary of about two lines.
2. Ask at most 3 frontier questions. A frontier question depends on no open question. Ask the questions that unblock the most questions first. Say how many questions are still waiting.
3. Write each question as a title, at most two lines of text and one recommended answer. A reply of "yes" accepts the recommended answer.
4. Wait for the owner's answers. Then start the next round.

During the rounds:

- Find the facts in the code, `CONTEXT.md` and the ADRs. Do not ask the owner for a fact that you can find. Never answer a decision that is the owner's.
- When the owner resolves a term, write it to `CONTEXT.md` with [domain-glossary](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/domain-glossary/SKILL.md).
- Offer `write-adr` only when the decision meets the test in [architecture/adrs.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/adrs.md). See [write-adr](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/write-adr/SKILL.md).

The rounds are done when no open question is left and the owner confirms the summary in their own words. Then continue with step 4.

## Rules

- Do not start coding while important questions remain open.
- Prefer fewer, higher-value questions.
- When a new domain term is resolved, add it to `CONTEXT.md` as the [glossary](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/domain-languages.md#glossary) says. Use [domain-glossary](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/domain-glossary/SKILL.md).

---
name: clarify-intent
description: "Use when the task has unclear requirements, unknown domain terms or no acceptance criteria. Clarifies the intent and the domain language before you write code."
---

# Clarify intent

Use before you implement a non-trivial change.

Force clarification of requirements and domain language.

If the feature has a plan, read its open questions and requirements. Record each decision that you clarify in the plan. Do not invent answers. See [feature plans](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/feature-plans.md).

## Steps

1. Restate the request in your own words.
2. List open questions about behavior, edge cases, and constraints.
3. Ask the questions. Do not assume answers.
4. Capture domain terms. Prefer the language of the problem. See [architecture/domain-languages.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/domain-languages.md).
5. Only after the intent is clear, proceed to design or implementation.

## Subagents

If you can start subagents, use them to answer the open questions that the repository can answer. Do steps 1 and 2 yourself. Then read the code and the docs at the same time, the code in one subagent and the docs in another subagent. Give each subagent a brief that is complete without your context:

- The request, as you restated it in step 1.
- The open questions from step 2.
- What to read: the code, or the docs, for example the README, the ADRs and the glossary.
- What to report: for each question, the answer with its file path and line, or "not found". The domain terms that it finds.
- A word limit, for example 400 words.
- This line: "Report to me only. Do not change files, ask the owner, post, approve or merge."

Then collect the reports. Read each answer at its file path and line yourself. If the code and the docs disagree, keep the question open. Do steps 3 to 5 yourself. Ask only the questions that are still open.

If you cannot start subagents, do the steps one at a time in the order of this skill. Before step 3, read the code and then the docs to answer the questions that they can answer.

## Rules

- Do not start coding while important questions remain open.
- Prefer fewer, higher-value questions.
- Update or create a glossary entry if a new domain term appears.

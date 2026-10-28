---
name: clarify-intent
description: "Use when the task has unclear requirements, unknown domain terms or no acceptance criteria. Clarifies the intent and the domain language before you write code."
---

# Clarify intent

Use before you implement a non-trivial change.

Force clarification of requirements and domain language.

## Steps

1. Restate the request in your own words.
2. List open questions about behavior, edge cases, and constraints.
3. Ask the questions. Do not assume answers.
4. Capture domain terms. Prefer the language of the problem. See [architecture/domain-languages.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/domain-languages.md).
5. Only after the intent is clear, proceed to design or implementation.

## Rules

- Do not start coding while important questions remain open.
- Prefer fewer, higher-value questions.
- Update or create a glossary entry if a new domain term appears.

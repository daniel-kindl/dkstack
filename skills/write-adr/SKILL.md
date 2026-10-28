---
name: write-adr
description: "Use when you make a decision that is durable or hard to reverse, such as a framework, data store or public contract. Creates an Architecture Decision Record."
---

# Write ADR

Use when a design decision is durable or hard to reverse.

Create an Architecture Decision Record using [architecture/adrs.md](../../architecture/adrs.md).

## Steps

1. Confirm the decision is worth recording (affects multiple components or is costly to change).
2. Write a short ADR with:
   - Context
   - Options considered
   - Decision
   - Consequences
3. Store it with the code it affects.
4. Do not rewrite old ADRs. Add a new one if the decision changes.

## Rules

- Keep it short.
- State trade-offs.
- Link related principles from architecture/ when useful.

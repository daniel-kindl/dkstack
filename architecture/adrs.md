# Architecture Decision Records

Record durable design decisions.

An ADR captures the context, the decision, and the consequences.

## Rules

- Write an ADR when a decision is hard to reverse or affects multiple components.
- Include the context, the options considered, the decision, and the consequences.
- Keep the ADR short.
- Store ADRs with the code they affect.
- Do not rewrite history. Add a new ADR if the decision changes.

## Good example

```
# ADR: Use message-based communication between components

Context: Components need to stay independent.
Decision: Communicate only through defined messages.
Consequences: Easier to replace components. Requires message versioning.
```

## Bad example

A decision exists only in a chat message or a comment that is later deleted.

Related: [reversibility.md](reversibility.md).

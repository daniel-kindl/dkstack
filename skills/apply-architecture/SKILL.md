---
name: apply-architecture
description: "Use when a change adds, moves or splits a module, or changes a public interface. Checks the design against the architecture principles in this repository."
---

# Apply architecture

Use when you design or change system structure.

Read the relevant architecture principles and check the change against them.

## Steps

1. Identify the design decisions in the task.
2. Read [architecture/index.md](../../architecture/index.md) and the specific files that apply (orthogonality, design-by-contract, reversibility, etc.).
3. For each decision, state which principle it follows or violates.
4. Prefer the smallest design that satisfies the principles.
5. If a principle is violated, propose a smaller or more reversible alternative.

## Rules

- Do not invent new principles. Use only the files in architecture/.
- State trade-offs when two principles pull in different directions.
- Keep the change reversible when possible. See [reversibility.md](../../architecture/reversibility.md).

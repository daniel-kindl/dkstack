# Architecture Decision Records

Record durable design decisions.

An ADR captures the context, the decision, and the consequences.

## When to write an ADR

Write an ADR only when all three are true:

1. The decision is hard to reverse.
2. A new reader would find it surprising without the context.
3. It comes from a real trade-off between options.

Record a smaller decision in the map or in the pull request body.

## Status and Affects

A new ADR has a `Status:` line and an `Affects:` line near the top.

- `Status:` is `Proposed`, `Accepted` or `Superseded by NNNN`. `NNNN` is the number of the ADR
  that replaces it.
- `Affects:` lists the paths or globs of the files that the decision governs, separated by
  commas. Each glob matches at least one file.

Do not add these lines to an old ADR. An old ADR with no `Status:` line counts as Accepted unless a later ADR supersedes it.

A review uses these lines to find the ADRs that a change must follow. See the
[ADR findings](../skills/code-review/SKILL.md#adr-findings) rule.

## Place and name

Store each ADR in `docs/adr/` as `NNNN-short-title.md`. `NNNN` is the next free number, with
four digits. `check-adrs` reads this folder.

## Amendments

Do not rewrite history. Do not change the text of an Accepted ADR.

- If the owner changes or narrows the decision, add a dated amendment. Put a heading
  `### Amendment YYYY-MM-DD` at the end of the Decision section.
- The amendment quotes the owner's words, gives the date and links the issue. It says which
  earlier text it replaces.
- An amendment can also correct a wrong fact in the Context. It quotes the wrong text.
- If the owner replaces the whole decision, write a new ADR. Set the old ADR to
  `Superseded by NNNN`.
- An agent writes an amendment only after the owner decided.

## Rules

- Include the context, the options considered, the decision, and the consequences.
- Keep the ADR short.

## Good example

```
# ADR 0007: Use message-based communication between components

Status: Accepted
Affects: src/components/**

Context: Components need to stay independent.
Decision: Communicate only through defined messages.
Consequences: Easier to replace components. Requires message versioning.
```

## Bad example

A decision exists only in a chat message or a comment that is later deleted.

See the [plain text rule](../coding/practices.md#plain-text) for where to keep decisions.

Related: [reversibility.md](reversibility.md).

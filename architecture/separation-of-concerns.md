# Separation of concerns

Keep different responsibilities in different places.

A component should not mix unrelated concerns.

## Rules

- Separate domain logic from infrastructure.
- Separate presentation from business rules.
- Separate data access from decision making.
- One concern per component or module.

## Good example

Domain rules live in one place. Storage lives in another. The domain does not know how data is stored.

## Bad example

A single component contains business rules, database queries, and user-interface formatting.

Related: [orthogonality.md](orthogonality.md), [domain-languages.md](domain-languages.md).

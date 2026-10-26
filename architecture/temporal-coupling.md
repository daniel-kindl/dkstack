# Temporal coupling

Do not require operations to happen in a specific order unless the order is necessary.

Hidden order dependencies make components hard to use and easy to break.

## Rules

- Make required order explicit in the interface.
- Prefer operations that can be called independently.
- Do not rely on a previous call having set hidden state.
- If order matters, enforce it or document it clearly.

## Good example

Each operation receives all the data it needs. Order of calls does not matter.

## Bad example

You must call `initialize` before `process`, and `process` before `finish`, or the component fails or produces wrong results. The requirement is not visible in the interface.

Related: [design-by-contract.md](design-by-contract.md), [orthogonality.md](orthogonality.md).

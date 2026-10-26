# YAGNI

You aren't gonna need it.

Do not build for requirements that do not exist yet.

## Rules

- Implement only what the current task needs.
- Do not add parameters, options, or abstractions for future cases.
- Add the capability when the real need appears.
- Speculative generality increases cost and coupling.

## Good example

A function that does exactly the required calculation.

## Bad example

A function that accepts a strategy object, a configuration map, and a plugin list for a calculation that currently has one form.

Related: [kiss.md](kiss.md), [tracer-bullets.md](tracer-bullets.md).

# Architecture

Architecture principles and design rules.

## Principles

- [orthogonality.md](orthogonality.md): Keep components independent. Related: [reversibility.md](reversibility.md), [decoupling.md](decoupling.md).
- [solid.md](solid.md): SOLID principles.
- [design.md](design.md): Design choices and trade-offs.
- [fail-fast.md](fail-fast.md): Stop immediately on bad state. Related: [design-by-contract.md](design-by-contract.md).
- [dry.md](dry.md): Do not repeat knowledge.
- [kiss.md](kiss.md): Keep it simple. Related: [yagni.md](yagni.md).
- [yagni.md](yagni.md): Do not build for future requirements.
- [reversibility.md](reversibility.md): Make decisions easy to reverse. Related: [orthogonality.md](orthogonality.md), [adrs.md](adrs.md).
- [tracer-bullets.md](tracer-bullets.md): Build a thin end-to-end path first. Related: [prototype.md](prototype.md).
- [domain-languages.md](domain-languages.md): Express the solution in domain terms.
- [design-by-contract.md](design-by-contract.md): Define preconditions, postconditions, and invariants. Related: [fail-fast.md](fail-fast.md).
- [resource-balancing.md](resource-balancing.md): Pair every resource acquisition with a release.
- [decoupling.md](decoupling.md): Minimize knowledge between components. Related: [orthogonality.md](orthogonality.md).
- [temporal-coupling.md](temporal-coupling.md): Avoid hidden order dependencies.
- [separation-of-concerns.md](separation-of-concerns.md): Keep different responsibilities apart.
- [prototype.md](prototype.md): Prototype to learn, then discard.
- [adrs.md](adrs.md): Record durable decisions.

## Application

Apply these rules when you design or change system structure.

# Actors and blackboards

Use actors or a blackboard to coordinate concurrent work without hidden shared state.

An actor keeps its own state. It communicates only by messages. No other code reads or changes its state.

A blackboard is a shared store. Independent agents post facts to it and read facts from it. Use a blackboard for a workflow that has no fixed order.

In both designs, the actors or agents do not know each other. See [orthogonality.md](orthogonality.md).

## Rules

- Use actors when each part of the work has its own state and a clear set of messages.
- Use a blackboard when many agents post facts and the order of the steps is not known.
- Do not share state between actors. Send a message instead.
- Give the blackboard a clear schema for each kind of fact.
- Guard the blackboard. See [concurrency.md](concurrency.md).
- Log each message and each posted fact, so that you can trace the workflow.

## Trade-offs

- Actors isolate state, and each actor is simple to reason about. Each message has a cost, and a global view of the system is harder to get.
- A blackboard allows a flexible order of steps, and producers do not know consumers. It needs a clear schema and concurrency control. A workflow is harder to trace.

## Good example

A loan application needs a credit check, an identity check, and an income check. The checks finish in any order. Each agent posts its result to the blackboard. A decision agent acts when all facts are present.

## Bad example

Each check calls the next check directly and changes a shared application object. A change to one check breaks the others, and two checks can overwrite the same field.

Related: [concurrency.md](concurrency.md), [decoupling.md](decoupling.md), [state-machines.md](state-machines.md).

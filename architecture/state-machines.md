# State machines

Model event-driven behavior as explicit states and transitions.

Do not track behavior with many boolean flags. Flags allow combinations that must never occur. A state machine has a fixed set of states and a named transition for each allowed event.

## Rules

- List every state that the component can be in.
- Name each transition with the event that causes it.
- Reject an event that has no transition from the current state.
- Write a test for each transition.
- Keep the state in one field, not in many flags.

## Good example

A connection has one state field.

```
states: closed, connecting, open
closed     + connect    -> connecting
connecting + connected  -> open
connecting + failed     -> closed
open       + disconnect -> closed
```

The field cannot store an impossible combination. Each transition has a name and a test.

## Bad example

A connection has three flags.

```
is_connecting = true
is_open = true
is_closed = false
```

The flags say that the connection is connecting and open at the same time. No code stops this combination.

## Other event patterns

- Observer: an object tells its registered listeners when it changes.
- Publish/subscribe: a channel carries events from publishers to subscribers that do not know each other.
- Streams: code processes events as a sequence of values, with operations such as filter and map.

Related: [temporal-coupling.md](temporal-coupling.md), [actors-and-blackboards.md](actors-and-blackboards.md), [design-by-contract.md](design-by-contract.md).

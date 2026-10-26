# Reversibility

Make decisions easy to reverse.

Do not commit to a choice that is costly to change later.

Prefer designs that keep options open.

## Rules

- Isolate decisions behind clear boundaries.
- Prefer configuration or composition over hard-coded choices.
- Do not embed assumptions that are expensive to unwind.
- Choose the option that is cheaper to change when two options are otherwise equal.
- Delay irreversible decisions until you have more information.

## Good example

A component receives its dependency from outside. You can replace the dependency without changing the component.

```
component(dependency)
  use(dependency)

// later: pass a different dependency
component(new_dependency)
```

The choice of dependency stays reversible.

## Bad example

A component creates and owns its dependency inside itself.

```
component()
  dependency = create_specific_dependency()
  use(dependency)
```

Changing the dependency requires editing the component. The choice is hard to reverse.

## Another good example

A limit or behavior is controlled by a single setting. Change the setting to change the behavior.

```
limit = configured_limit

if value > limit
  stop
```

## Another bad example

The same limit is hard-coded in multiple places and the behavior is intertwined with other logic.

Changing the limit or the behavior requires coordinated edits across the system. The decision is effectively permanent.

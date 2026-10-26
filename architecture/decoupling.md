# Decoupling

Minimize what one component knows about another.

Follow the Law of Demeter: talk only to your immediate collaborators.

## Rules

- A component may call methods on itself, on objects it creates, on objects passed to it, and on its direct components.
- Do not chain through multiple objects to reach a distant one.
- Do not reach into the internals of another component.
- Prefer asking for what you need over navigating to it.

## Good example

```
component.do_work(data)
```

## Bad example

```
component.get_part().get_subpart().get_value()
```

Related: [orthogonality.md](orthogonality.md).

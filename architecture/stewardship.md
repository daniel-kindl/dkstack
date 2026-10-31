# Stewardship

Consider the long-term health of the codebase while you do the current task.

This page connects routine work to ease of future change. It does not replace the other
principles. Do not add a phase, a checklist or a report to ordinary work.

## Levels

Use the smallest level that fits the task.

### Awareness

Use awareness on every task. Do not start a separate step.

Consider coherence, coupling, complexity, compatibility and ease of future change. Then do the
task.

### Analysis

Use analysis only when a signal is present, or when a human asks for it.

A signal is one of these:

- A new public interface.
- A changed module boundary or a new dependency.
- A workaround that avoids the current architecture.
- The same knowledge appears again.
- Two principles conflict.
- A trade-off affects compatibility, performance or security.

Examine the consequences and the alternatives. A valid result is to keep the current design.
Analysis does not give permission to change the architecture.

### Intervention

Make the change only as large as the task requires. Do not go outside the authorization.

Prefer a small change that is easy to reverse. Stay inside the authorized scope.

An unrelated problem is not authorization to change it. Propose the problem. Do not change it
in this task.

Ask the owner before a consequential, uncertain or hard-to-reverse decision, and before work
outside the scope. Do not copy those limits here. Read [safety.md](../workflow/safety.md),
[work.md](../workflow/work.md) and [roles.md](../workflow/roles.md).

## Trade-offs

The principles have no fixed rank. Do not treat one principle as always more important than
another.

Name the principles that conflict. Name the facts of this task. Choose the option that is easier
to change. See [index.md](index.md).

[DRY](dry.md) says to put shared knowledge in one place. [Orthogonality](orthogonality.md) and
[decoupling](decoupling.md) say to limit what one component knows. A shared helper can reduce
duplication and increase coupling. Keep the duplication when the parts change for different
reasons. Extract the helper when one change to that knowledge must update every copy.

## Scenarios

### Typo fix

The task corrects a typo in a comment or a string. Use awareness only. Do not analyze the module.

### Normal feature

The task adds behavior inside the current design. No signal is present. Use awareness. Do not
write an architecture report.

### New dependency

The task adds a dependency. That change is a signal. Analyze the coupling and how hard the
dependency is to remove. Do not add the dependency for a future need.

### Public API change

The task changes a public interface. That change is a signal. Analyze compatibility and
reversibility. Ask the owner when other consumers must change, and this task does not include
those consumers.

### Unrelated architectural issue

The task shows a problem outside its scope. Describe the problem. Do not change it in this task.

### Obsolete ADR

An ADR no longer matches the code or the current decision. That difference is a signal. Do not
delete the ADR. Do not change the recorded decision. Ask the owner. See [adrs.md](adrs.md).

### DRY and coupling

Two modules copy a small calculation. The modules change for different reasons. Do not extract
the calculation only because the copies exist. Keep the copies. Extract the calculation when one
change to it must reach both modules.

## Related

[design.md](design.md), [dry.md](dry.md), [kiss.md](kiss.md), [yagni.md](yagni.md),
[orthogonality.md](orthogonality.md), [reversibility.md](reversibility.md),
[safety.md](../workflow/safety.md).

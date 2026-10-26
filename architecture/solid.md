# SOLID

Five principles for maintainable design.

## Single Responsibility

A component has one reason to change.

Good: A component that only validates input.
Bad: A component that validates input, stores data, and sends notifications.

## Open-Closed

Open for extension, closed for modification.

Good: Add a new behavior by adding a new component that follows the same interface.
Bad: Edit an existing component every time a new case appears.

## Liskov Substitution

A subtype must be usable wherever the base type is expected.

Good: A specialized component accepts the same inputs and produces compatible outputs.
Bad: A specialized component requires extra setup or changes the meaning of a result.

## Interface Segregation

Do not force a component to depend on methods it does not use.

Good: Small, focused interfaces.
Bad: One large interface that every component must implement fully.

## Dependency Inversion

Depend on abstractions, not concrete details.

Good: A component receives its dependency from outside.
Bad: A component creates and owns a specific implementation inside itself.

Related: [orthogonality.md](orthogonality.md), [reversibility.md](reversibility.md).

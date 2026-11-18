# User interface and experience

Apply these standards when a task changes a rendered interface, its interaction, or its visual design. They apply to web, mobile, and desktop applications. Read only the topic pages relevant to the change.

## Severity

UI findings use the [code-review severities](../skills/code-review/SKILL.md#severity). The UI line in the [standards axis](../skills/code-review/SKILL.md#5-standards-axis) maps UI findings to them. A visual preference is a requirement only when the specification asks for it.

## Topics

- [Principles](principles.md): Human tasks, scope, and platform conventions.
- [Visual design](visual-design.md): Hierarchy and intentional visual direction.
- [Typography](typography.md): Readable type and text hierarchy.
- [Colors and themes](colors-and-themes.md): Tokens, contrast, and themes.
- [Layout and spacing](layout-and-spacing.md): Structure, alignment, and sizing.
- [Responsive design](responsive-design.md): Width, scaling, and input adaptation.
- [Components](components.md): Reuse and state completeness.
- [Interactions](interactions.md): Controls, navigation, and feedback.
- [Motion](motion.md): Purposeful animation and motion preferences.
- [Accessibility](accessibility.md): Inclusive interaction and testing.
- [Content and localization](content-and-localization.md): Clear language and flexible content.
- [Performance](performance.md): Responsive and efficient UI.
- [Design systems](design-systems.md): Project ownership and visual direction.
- [Visual verification](visual-verification.md): Required evidence and reporting.
- [Scenarios](scenarios.md): Examples of conditional application.

## Boundaries

- The project owns branding, platform choice, design tokens, and component libraries.
- Follow an existing design system unless the task explicitly authorizes a redesign. A project design choice cannot waive a DKSTACK hard rule without the documented exception process in [AGENTS.md](../AGENTS.md).
- Do not demand a CSS library, design tool, image generator, or particular framework.
- Follow [TDD](../tdd/index.md) for behavior tests. Visual inspection complements tests; it does not replace them.
- Backend-only changes do not trigger UI workflows.

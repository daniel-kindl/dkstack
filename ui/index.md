# User interface and experience

Use these pages when a task changes a rendered UI, its interaction or its visual design. They apply to web, mobile and desktop applications. Read only the pages that the change needs.

## Severity

UI findings use the [code-review severities](../skills/code-review/SKILL.md#severity). The UI line in the [standards checklist](../skills/review-standards/SKILL.md#checklist) maps UI findings to them. A visual preference is a requirement only when the specification asks for it.

## Topics

- [Principles](principles.md): User tasks, scope, platform conventions and deceptive patterns.
- [Visual design](visual-design.md): Hierarchy, visual direction and generic patterns.
- [Typography](typography.md): Readable type and a type scale.
- [Colors and themes](colors-and-themes.md): Tokens, contrast and themes.
- [Layout and spacing](layout-and-spacing.md): Structure, alignment and spacing.
- [Responsive design](responsive-design.md): Widths, scaling and input methods.
- [Components](components.md): Reuse, states and icons.
- [Interactions](interactions.md): States, loading, errors and actions.
- [Forms](forms.md): Labels, errors and validation.
- [Motion](motion.md): Motion with a purpose and reduced motion.
- [Accessibility](accessibility.md): WCAG 2.2 AA rules and thresholds.
- [Content and localization](content-and-localization.md): UI copy and translated content.
- [Performance](performance.md): Responsive UI and web targets.
- [Design systems](design-systems.md): Project ownership, visual direction and defaults.
- [Visual verification](visual-verification.md): Required evidence and results.
- [Scenarios](scenarios.md): Examples of when the pages apply.

## Boundaries

- The project owns its brand, platform choice, design tokens and component libraries.
- Follow the project's design system unless the task asks for a redesign.
- A project can differ from a dkstack rule only through a documented [exception](../AGENTS.md#precedence). Safety rules have no exceptions.
- Do not require a CSS library, design tool, image generator or framework.
- The accessibility rules and thresholds are in [accessibility](accessibility.md).
- Follow [TDD](../tdd/index.md) for behavior tests. Do [visual verification](visual-verification.md) for the rendered result.
- Backend-only changes do not use the UI pages or the UI skills.

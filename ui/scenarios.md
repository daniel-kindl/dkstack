# UI application scenarios

## New web page with no established design system

Triage selects UI guidelines and `ui-design`. The agent selects a direction based on the audience, implements tested behavior, inspects narrow and wide rendered layouts, then reports evidence. The agent does not impose a default CSS framework.

## Fix an existing Avalonia form

Preserve the form's current tokens and controls. Use `tdd-loop` for the behavior; verify actual desktop output with the available emulator or application. Check scaling and focus where supported. Do not redesign neighboring views.

## Review a mobile screen

Triage selects `ui-review` in addition to `code-review` for a PR. The reviewer checks both specification and standards, records screenshots or observed states when available, and leaves files unchanged.

## No rendering tools available

Check code and available tests. Record visual verification as NOT RUN and explain which surfaces and states remain unverified. Do not claim PASS based on code inspection.

## Backend-only refactor

No UI skill is selected, no screenshot is demanded, and existing TDD and review skills apply normally.

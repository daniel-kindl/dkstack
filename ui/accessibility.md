# Accessibility

Accessibility is a requirement. This page owns the accessibility rules and thresholds. Other pages link here.

## Scope

- WCAG 2.2 level AA criteria are the test baseline on every platform. Measure them in the units of the platform.
- Native UI never claims formal WCAG conformance.
- [UI testing](../tdd/ui-testing.md#accessibility-checks) says how to test these rules.

## Contrast and color

- Text contrast is at least 4.5:1. Large text contrast is at least 3:1 (1.4.3). Large text is 24 px, or 18.66 px bold.
- Focus indicators, control borders and state cues have a contrast of at least 3:1 against adjacent colors (1.4.11).
- Color is not the only cue (1.4.1). Each color cue also has a text, a shape or an icon.
- Use the WCAG 2.x contrast ratio to measure contrast. APCA is not part of any normative WCAG. Use it only as an extra signal, never in place of the 2.x ratios.

## Focus and keyboard

- A keyboard can reach and use each control. Each keyboard focus is visible (2.4.7).
- A sticky header, a banner or a dialog does not fully hide the focused item (2.4.11).
- On the web, use `:focus-visible` with an outline of at least 2 px and an offset. Do not use `outline: none` without a replacement.
- Focus moves through the controls in a logical order.

## Targets

- On the web, each pointer target is at least 24 by 24 CSS px (2.5.8). A smaller target passes when it has 24 px spacing, when an equivalent control meets the size, when it is inline in text, when the user agent sets its size, or when its size is essential.
- On the web, use at least 44 by 44 CSS px for primary touch controls.
- Each touch target is at least 48 dp on Android or 44 pt on iOS.
- Each drag action has a single-pointer alternative (2.5.7).

## Text and layout

- Content reflows at 320 CSS px wide with no horizontal scroll (1.4.10). Data tables, maps and code are exceptions.
- Text resizes to 200% with no loss of content or function (1.4.4).
- Content works with line height 1.5, paragraph spacing 2 em, letter spacing 0.12 em and word spacing 0.16 em (1.4.12).
- On native UI, the layout works at the largest system text size.

## Content and changes

- Each control has a text label that a screen reader reads.
- Content that shows on hover or focus can be dismissed and hovered. It stays until the user dismisses it (1.4.13).
- Status messages use `role="status"` or `aria-live` (4.1.3). A screen reader announces changes of state and errors.
- Errors are identified in text (3.3.1). The error text says how to fix the error (3.3.3).
- Auto-moving content that plays for more than 5 s has a pause control (2.2.2).
- Nothing flashes more than 3 times a second (2.3.1).

## Structure

- Use one h1 and headings in order. Use landmarks and set `lang` on the html element.
- Give each image alt text. A decorative image has an empty alt.
- Add a skip link on pages with repeated navigation.
- First rule of ARIA: use a native element if one exists. No ARIA is better than wrong ARIA.

References: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/).

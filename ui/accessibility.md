# Accessibility

Accessibility is a requirement. This page owns the accessibility rules and thresholds. Other pages link here.

A number in parentheses names a WCAG 2.2 criterion. "(dkstack rule)" marks a rule that WCAG 2.2 AA does not require. [review-standards](../skills/review-standards/SKILL.md#checklist) gives each kind its severity.

## Scope

- WCAG 2.2 level AA criteria are the test baseline on every platform. Measure them in the units of the platform.
- This page does not list each WCAG 2.2 A and AA criterion. Each one applies, also when this page does not name it. See the [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/).
- Native UI never claims formal WCAG conformance.
- [UI testing](../tdd/ui-testing.md#accessibility-checks) says how to test these rules.

## Contrast and color

- Text contrast is at least 4.5:1. Large text contrast is at least 3:1 (1.4.3). Large text is at least 24 px, or at least 18.66 px bold.
- Focus indicators, control borders and state cues have a contrast of at least 3:1 against adjacent colors (1.4.11).
- Color is not the only cue (1.4.1). Each color cue also has a text, a shape or an icon.
- Use the WCAG 2.x contrast ratio to measure contrast. APCA is not part of any normative WCAG. Use it only as an extra signal, never in place of the 2.x ratios.

## Focus and keyboard

- A keyboard can reach and use each control (2.1.1), and there is no keyboard trap (2.1.2). Each keyboard focus is visible (2.4.7).
- A sticky header, a banner or a dialog does not fully hide the focused item (2.4.11).
- On the web, use `:focus-visible` with an outline of at least 2 px and an offset (dkstack rule). Do not use `outline: none` without a replacement.
- Focus moves through the controls in a logical order (2.4.3).

## Targets

- On the web, each pointer target is at least 24 by 24 CSS px (2.5.8). A smaller target passes in these cases:
  - A 24 CSS px circle centered on the target does not overlap another target or the circle of another target.
  - An equivalent control meets the size.
  - It is inline in text.
  - The user agent sets its size.
  - Its size is essential.
- On the web, use at least 44 by 44 CSS px for primary touch controls (dkstack rule). A primary touch control is the main action of a screen or an item of the main navigation.
- On Android, each touch target is at least 48 by 48 dp (Material Design and Android accessibility guidance) (dkstack rule).
- On iOS, each touch target is at least 44 by 44 pt (Apple Human Interface Guidelines) (dkstack rule).
- Each drag action has a single-pointer alternative (2.5.7).
- Each multipoint or path-based gesture, such as a pinch or a swipe, has a single-pointer alternative with no path (2.5.1).
- A single-pointer action runs on the up event. If it runs on the down event, the user can abort or undo it (2.5.2).
- An action from device motion, such as a shake or a tilt, also has a control. The user can turn off the motion response (2.5.4).

## Text and layout

- Content works in portrait and in landscape. Do not lock the orientation, unless one orientation is essential (1.3.4).
- Content reflows at 320 CSS px wide with no horizontal scroll (1.4.10). Data tables, maps and code are exceptions.
- Text resizes to 200% with no loss of content or function (1.4.4).
- Content works with line height 1.5, paragraph spacing 2 em, letter spacing 0.12 em and word spacing 0.16 em (1.4.12).
- On native UI, the layout works at the largest system text size (dkstack rule).

## Content and changes

- Each control has a text label that a screen reader reads (4.1.2). The accessible name contains the visible label (2.5.3).
- Content that shows on hover or focus can be dismissed and hovered. It stays until the user moves hover or focus away, dismisses it, or the information is no longer valid (1.4.13).
- Status messages use `role="status"` or `aria-live` (4.1.3). A screen reader announces changes of state and errors.
- Errors are identified in text (3.3.1). The error text says how to fix the error (3.3.3). See [forms](forms.md).
- Auto-moving content that plays for more than 5 s has a pause control (2.2.2).
- Nothing flashes more than 3 times a second (2.3.1).

## Structure

- Use one h1 (dkstack rule). Use headings in order (dkstack rule). Use landmarks (dkstack rule). Set `lang` on the html element (3.1.1).
- Give each image alt text (1.1.1). A decorative image has an empty alt.
- Give a way to skip blocks that repeat on each page (2.4.1). On the web, use a skip link as the first focusable element (dkstack rule).
- First rule of ARIA: use a native element if one exists. No ARIA is better than wrong ARIA.

## Native equivalents

Some rules on this page name a web feature. This table gives examples of the same feature on other platforms. The rows are examples, not requirements. Check the API in the version of the framework that the project uses. Test the result with the screen reader of the platform.

| Need | Web | Avalonia | .NET MAUI | Android | iOS |
| --- | --- | --- | --- | --- | --- |
| Live announcement | `role="status"`, `aria-live` | `AutomationProperties.LiveSetting` | `SemanticScreenReader.Announce` | `accessibilityLiveRegion` (Views), `liveRegion` semantics (Compose) | `UIAccessibility.post(notification: .announcement)` (UIKit), `AccessibilityNotification.Announcement` (SwiftUI) |
| Accessible name | `<label>`, `aria-label` | `AutomationProperties.Name` | `SemanticProperties.Description` | `contentDescription` | `accessibilityLabel` |
| Heading | `<h1>` to `<h6>` | `AutomationProperties.HeadingLevel` | `SemanticProperties.HeadingLevel` | `accessibilityHeading` (Views), `heading()` semantics (Compose) | `.header` trait (UIKit), `.isHeader` trait (SwiftUI) |
| Language | `lang` | the app culture | the app culture | `LocaleSpan` (Views), `localeList` in `SpanStyle` (Compose) | `accessibilityLanguage` |
| Theme | `prefers-color-scheme`, `prefers-contrast` | `ActualThemeVariant` | `Application.RequestedTheme` (read), `AppThemeBinding` (set a value for each theme) | `Configuration.uiMode` (Views), `isSystemInDarkTheme()` (Compose) | `userInterfaceStyle` (UIKit), `colorScheme` environment value (SwiftUI) |

References: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/), [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/accessibility), [Material Design](https://m3.material.io/foundations/designing/structure), [Android accessibility](https://developer.android.com/guide/topics/ui/accessibility/apps).

# Interactions

- Every action provides perceivable feedback. Distinguish loading, success, error, and disabled behavior.
- Prefer skeleton placeholders that resemble the incoming content when loading a page, list, or content region with a predictable structure. Preserve approximate dimensions to reduce layout shifts.
- Use a spinner or compact progress indicator for short, localized operations such as submitting a form or updating an action where a content-shaped skeleton would misrepresent the result.
- Do not show invented data, imply progress that cannot be measured, or obscure existing usable content. Expose loading status to assistive technology and respect reduced-motion preferences.
- Preserve keyboard navigation, visible focus, sensible focus restoration, and predictable back or cancel behavior when applicable.
- Labels should describe the action. Destructive operations require appropriate safeguards and recoverability.
- Make errors actionable and place them near the affected control when possible.
- Do not require hover for essential information or actions on touch-capable surfaces.
- Prevent accidental repeated submissions where duplicate actions would harm users.
- Follow established platform navigation patterns unless the approved specification requires a deviation.

# Interactions

## States

- Each action gives feedback that the user can see. Show loading, success, error and disabled in different ways.
- Each interactive element has a different hover, `:focus-visible`, active and disabled state. Add a selected state when the element can be selected. Focus is not the same as hover.
- Do not require hover for essential information or actions. See [responsive design](responsive-design.md).

## Loading

- For a page, a list or a region with a known structure, use skeleton placeholders that look like the content. Keep the size of the content to prevent layout shifts.
- For a short local operation, such as a form submit, use a spinner or a small progress indicator. Use it when a skeleton would show the wrong shape of the result.
- Show a spinner only after about 300 ms, so that it does not flash.
- Set `aria-busy="true"` on the region that loads. Follow the reduced motion rules in [motion](motion.md).
- A skeleton changes to the real content or to an error state. It does not stay.
- Do not show invented data. Do not show progress that you cannot measure. Do not hide usable content.

## Empty, error and success

- An empty state says why it is empty and gives the next action.
- An error state says what happened and how to recover. It keeps the user's input. Put the error near the control.
- Sign-in and access errors follow [security](../coding/security.md#rules). They are the exception to the rule above.
- Do not show an error only in a toast that closes by itself (2.2.1).
- A success message that closes by itself stays for at least 5 s. Announce it with `role="status"`.
- For client logs, follow [logging](../coding/logging.md).

## Actions

- A label says what the action does.
- Explain a disabled control in text near it, or keep it enabled and validate.
- Prefer undo for an action that you can reverse. For an action that you cannot undo, use a confirm dialog that names the object.
- Prevent a repeated submit when a second submit harms the user.
- Keep keyboard navigation and visible focus. Return focus to a logical place after a dialog closes. Back and cancel act as the user expects.
- Follow the navigation patterns of the platform. Differ from them only when the approved specification asks for it.

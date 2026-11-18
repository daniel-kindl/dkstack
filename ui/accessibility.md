# Accessibility

Accessibility is a correctness requirement for applicable interfaces.

- For web interfaces, use WCAG 2.2 Level AA as the default conformance target unless a documented requirement specifies another applicable standard.
- For native platforms, achieve equivalent accessible user outcomes using platform accessibility APIs and conventions. Do not claim WCAG conformance automatically for native interfaces.
- Provide semantics, accessible names, logical reading and focus order, visible focus, adequate contrast, and usable keyboard navigation where supported.
- Check labeling and feedback for forms, errors, statuses, and dynamic changes.
- Verify content at supported text scaling and avoid conveying meaning only through color, sound, location, or motion.
- Use native controls and semantics when possible. Do not use ARIA to replace correct native HTML.
- Automated accessibility scanners are useful but cannot establish full accessibility. Inspect meaningful workflows manually or with an agent.

References: [WCAG](https://www.w3.org/TR/WCAG22/), [WAI-ARIA APG](https://www.w3.org/WAI/ARIA/apg/).

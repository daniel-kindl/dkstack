# Forms

- Give each input a visible label. A placeholder is not a label.
- Show each error in text next to the field. When there are several errors, also show a summary.
- Say how to fix each error. Move focus to the first error or to the summary. See the error rules in [accessibility](accessibility.md#content-and-changes).
- Add `autocomplete` tokens for personal data (1.3.5). Use the correct `type` and `inputmode`.
- Do not ask again for data that the user gave in the same process (3.3.7).
- Sign-in allows paste and password managers. It has no cognitive test (3.3.8).
- Ask for confirmation or give an undo for legal, financial and data-deletion submits (3.3.4).
- Do not disable the submit button to show that the form is not valid (dkstack rule). Keep it enabled and show the errors on submit.
- Validate on blur or on submit, not on each keystroke (dkstack rule).
- Mark required fields in text, not with color or an asterisk alone (dkstack rule).
- Sign-in and access errors follow [security](../coding/security.md#rules).

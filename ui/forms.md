# Forms

- Give each input a visible label. A placeholder is not a label (3.3.2).
- Show each error in text next to the field (3.3.1). When there are several errors, also show a summary (dkstack rule). This page owns where an error goes.
- Say how to fix each error (3.3.3). Move focus to the first error or to the summary (dkstack rule). See the error rules in [accessibility](accessibility.md#content-and-changes).
- Add `autocomplete` tokens for personal data (1.3.5). Use the correct `type` and `inputmode` (dkstack rule).
- Do not ask again for data that the user gave in the same process (3.3.7).
- Sign-in allows paste and password managers. A sign-in step that needs a cognitive function test, such as remembering a password, must also give a help or an alternative. Paste and password managers are a help (3.3.8). Do not use a cognitive test in sign-in, also not object recognition or personal content (dkstack rule).
- Some submits make a legal commitment or a financial transaction, change or delete user data, or send test responses. For each such submit, give an undo, a check of the input with a chance to fix it, or a confirmation step (3.3.4).
- Do not disable the submit button to show that the form is not valid (dkstack rule). Keep it enabled and show the errors on submit.
- Do not show an error while the user types in a field for the first time. Validate a field when it loses focus, and only if the user changed it. After an error shows, check the field again on each input and remove the error when the value is valid. Validate all fields on submit (dkstack rule).
- Do not mark required fields with color alone (1.4.1). Write "required" in the label, not only an asterisk (dkstack rule).
- Sign-in and access errors follow [security](../coding/security.md#rules).

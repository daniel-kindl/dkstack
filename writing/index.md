# Writing

Use Simplified Technical English (ASD-STE100) for all text. See [Scope](#scope).

Write so that a reader with limited English or a non-native speaker can understand the text without ambiguity.

## Scope

ASD-STE100 applies to all text that people or agents read:

- Documentation, code comments, commit messages, pull request text and agent instructions.
- Product copy: UI text, landing pages, product READMEs, release notes, announcements and emails.

Nothing is out of scope.

## Rules

- Write short sentences. One idea per sentence.
- Use active voice.
- Use simple words. Prefer common words over complex ones.
- Use one word for one meaning. Do not use synonyms for the same concept.
- Write steps in imperative form.
- Do not use an em dash or en dash.
- Do not use marketing language or filler.
- Do not imitate common AI prose patterns.
- Do not add generic introductions or conclusions.
- Remove words that do not add meaning.

## Code comments

- [comments.md](comments.md): When and how to write code comments.

## User-facing copy

- [user-facing-copy.md](user-facing-copy.md): Product READMEs, landing pages, release notes, announcements, emails, CLI messages and app store text.

## Good example

```
Check the input. If the input is empty, stop.
```

Short. Active. Clear.

## Bad example

```
It is important to note that one should carefully verify the input data, and in the event that it happens to be empty, it would be advisable to halt processing.
```

Long. Passive. Extra words. Ambiguous.

## Another good example

```
Create a branch. Make the change. Open a pull request.
```

## Another bad example

```
You might want to consider creating a new branch in order to implement the desired modifications before subsequently opening a pull request for review.
```

## Application

Apply these rules to each kind of text in [Scope](#scope).

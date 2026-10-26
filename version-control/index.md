# Version control

Use conventional commits. Keep history clear and machine-readable. Use short-lived feature branches.

## Rules

- Use the format: `type: description`
- Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.
- Write the description in imperative mood. Start with a verb.
- Keep the subject line short (50 characters or fewer).
- Put extra detail in the body when needed.
- One logical change per commit.
- Do not mix unrelated changes in one commit.

## Feature branches

- [feature-branches.md](feature-branches.md): Keep branches short-lived.

## Good example

```
feat: add user login

Accept email and password. Return a session token on success.
```

The type and description are clear. The body adds context.

## Bad example

```
update stuff
```

or

```
Fixed the bug and also cleaned up some files and updated the readme.
```

The intent is unclear. Multiple changes are mixed. Tools cannot parse the message.

## Another good example

```
fix: prevent crash on empty input

Check for empty input before processing. Return an error instead of continuing.
```

## Another bad example

```
wip
```

or a commit that contains both a feature and an unrelated refactor.

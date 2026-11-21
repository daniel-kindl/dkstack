---
name: domain-glossary
description: "Use when a task uses a domain term, when someone asks what a term means, or when a term must be defined, renamed or added to CONTEXT.md. Reads the project glossary, flags a word that conflicts with it and records a resolved term."
---

# Domain glossary

Use when you name a thing, read a request that uses domain words, or resolve the meaning of a term. Follow the [glossary rules](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/domain-languages.md#glossary). Do not restate the format here.

## Steps

1. Read `CONTEXT.md` at the repository root. If it does not exist, continue. Create it only in step 4.
2. Compare the words in the request, the code and the docs with the entries. If a word is on an `_Avoid_:` line, use the term of that entry. If a word gives a term a different meaning, stop and ask the owner which meaning is correct.
3. If a word is vague, for example "account" when the glossary has two kinds of account, propose the exact term and ask.
4. When the owner resolves a term, add or change its entry at that time. Do not wait for the end of the task.
5. If the code uses a different word than the glossary, tell the owner. Do not rename code that is out of scope.

## Boundaries

- Do not define a term yourself when the meaning is the owner's decision. Ask.
- Do not put implementation details, plans or decisions in `CONTEXT.md`. A durable decision goes to [write-adr](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/write-adr/SKILL.md).
- Change `CONTEXT.md` in the same pull request as the change that needs the term.

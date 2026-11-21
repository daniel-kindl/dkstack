# Domain languages

Express the solution in the language of the problem.

Use the terms and concepts of the domain. Do not force the domain into technical vocabulary.

A reader who knows the domain should understand the intent without translation.

## Rules

- Name operations and data after domain concepts.
- Keep domain rules in domain terms.
- Do not leak technical details into domain logic.
- Prefer a small vocabulary that matches how domain experts speak.
- Make the domain language the shared language between people and code.
- Keep the terms in the [glossary](#glossary). Use the glossary term in code, tests, issues and
  docs.

## Good example

An operation that moves money between accounts uses domain words.

```
transfer(from_account, to_account, amount)
```

The name and parameters match the business concept. No technical steps are visible.

## Bad example

The same operation is expressed only in technical steps.

```
update_balance(account_id, delta)
write_ledger_entry(source_id, target_id, value)
```

The domain intent is hidden. A reader must reconstruct what the code means.

## Another good example

A rule that applies a discount is written as the domain rule.

```
if customer is eligible for discount
  apply discount to order
```

## Another bad example

The same rule is written as low-level conditions and field updates.

```
if customer.status == 2 and order.total > 50
  order.total = order.total * 0.9
  order.flag = 1
```

The business meaning is lost. Changing the rule requires understanding the flags and numbers.

## Glossary

Each project keeps its domain terms in one file: `CONTEXT.md` at the repository root. People
and agents read it before they name a thing. The
[domain-glossary](../skills/domain-glossary/SKILL.md) skill keeps it current.

### Rules

- Create `CONTEXT.md` when the first term is resolved. Do not create an empty file.
- Start the file with an H1 that names the project, then one or two sentences that say what the
  project is.
- Put the terms under a `## Language` heading. You can group terms under `###` headings when
  groups occur naturally.
- Write each term as a `**Term**:` line. On the next line, write what the term is in one or two
  sentences.
- When other words exist for the same concept, select one term. List the other words on an
  `_Avoid_:` line under the definition.
- Only terms of the domain. A general programming concept, such as a timeout or a cache, does not
  go in the file.
- No implementation details. The file is not a specification, a plan or a list of decisions.
  Record a decision in an [ADR](adrs.md).
- One term has one meaning. A term must not also appear on an `_Avoid_:` line.
- When the meaning of a term changes, change the entry in the same pull request as the code.

### Good example

```markdown
# Folium

Folium is a personal library of books that stays on one device.

## Language

**Book**:
A saved book with its own local identifier. Two books can share a title and an author.
_Avoid_: Entry, record, item

**Reading status**:
The place of a saved book in the person's reading. The values are to read, reading and finished.
_Avoid_: Progress, state
```

Each entry says what the term is. The `_Avoid_:` lines stop a second word for the same concept.

### Bad example

```markdown
# Glossary

- Book: the `books` table, see `db/schema.sql`
- Item: same as Book
- Timeout: 30 seconds
```

The entries describe the implementation. "Item" is a second word for Book. "Timeout" is not a
domain term.

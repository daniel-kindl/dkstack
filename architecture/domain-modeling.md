# Domain modeling

Model a domain that has rules as bounded contexts first. Then model each context as aggregates,
value objects and domain events.

Write the model in domain terms. See [domain-languages.md](domain-languages.md).

## When to model

- Model the domain when a rule joins two or more facts. An example is "a member can borrow a
  copy only when the member has fewer than 5 active loans".
- Do not model a domain that only stores and shows data, with no rule that joins two or more
  facts. Reason: the model adds structure that no rule uses. See [yagni.md](yagni.md).
- If a change uses the model and does not change it, use the glossary terms only.

## Bounded contexts

A bounded context is a part of the system in which each domain term has one meaning.

- Draw a boundary where one word has two meanings.
- Draw a boundary where a different set of rules or a different team owns the work.
- Do not share one model between two contexts. Translate the data at the boundary.
- Keep the number of contexts small. For most small projects, one context is the correct result.

## Context map

The context map lists each context and the relations between the contexts.

- For each relation, state the upstream context and the downstream context. The upstream
  context supplies the data. The downstream context uses it.
- State where the downstream context translates the upstream terms into its own terms. Keep the
  upstream terms out of the downstream model.
- Refer to a thing in another context by its identifier only.

## Aggregates

An entity is an object with an identity that stays the same when its attributes change. An
aggregate is a group of entities and value objects that changes as one unit. One entity is the
root of the aggregate.

- Put each invariant in the aggregate that holds all the data to check it. See
  [design-by-contract.md](design-by-contract.md).
- Change an aggregate only through its root. The root checks the invariants at each change and
  stops on a violation. See [fail-fast.md](fail-fast.md).
- Keep each aggregate small. Add an object to an aggregate only when an invariant needs it.
- Change one aggregate in one transaction.
- Refer to another aggregate by its identifier, not by the object.
- If a rule must hold at all times, keep all its data in one aggregate. Change the boundary if
  necessary. Reason: if a second aggregate changes later, two changes can both pass the check.
- Use a domain event to update a second aggregate later only when the domain permits the delay.
- Record the choice of boundary in an [ADR](adrs.md) when it meets the ADR test.

## Value objects

A value object is a value with no identity. Two value objects with the same values are equal.

- Use a value object for a domain value that has its own rules, for example a loan period.
- Check the rules of a value object when you create it. Do not create a value object that breaks
  its rules.
- Do not change a value object. Create a new one.

## Domain events

A domain event records a fact that occurred in the domain.

- Name the event in the past tense with domain words, for example `CopyReturned`.
- Use an event to tell another aggregate or another context about a change.
- Put in the event only the data that its receivers need, in domain terms.
- Model the states that the events move an aggregate through as a
  [state machine](state-machines.md).

## Where the model lives

- During design, write the model in the issue or the plan.
- After that, the code and the tests are the record of the model. A test proves each invariant.
- For the domain terms, see the [glossary](domain-languages.md#glossary).
- Record a boundary that is hard to reverse in an [ADR](adrs.md) when it meets the ADR test.

## Good example

A public library uses the word "book" for two things. Each meaning gets its own context.

```
context Catalog
  Book: a title with its authors and an ISBN

context Lending
  Copy: one physical item that a member can borrow
    refers to a Book by book_id only

relation: Catalog is upstream, Lending is downstream
  Lending records the book_id from Catalog on each copy that it owns
```

Each term has one meaning in its context. Lending does not use the fields of a Book.

## Bad example

The library has one model for all the work.

```
Book
  title, authors, isbn
  shelf, condition
  borrowed_by, due_date
```

One object holds the catalog data and the data of one physical item. A library with two copies of
a title must repeat the title or lose the second copy.

## Another good example

Lending enforces two rules. A member has at most 5 active loans. A returned loan cannot be
returned again.

```
aggregate Member (root: Member)
  member_id
  active_loan_ids: at most 5
  borrow(copy_id, period: LoanPeriod)
    precondition: count of active_loan_ids is less than 5
    adds the new loan_id to active_loan_ids
    emits LoanStarted(loan_id, member_id, copy_id, period)

aggregate Loan (root: Loan)
  loan_id, member_id, copy_id
  period: LoanPeriod
  state: active or returned
  return()
    precondition: state is active
    sets state to returned
    emits CopyReturned(loan_id, member_id, copy_id)

value object LoanPeriod
  start, due
  rule: due is after start

on LoanStarted: create Loan(loan_id, member_id, copy_id, period) with state active
on CopyReturned: Member removes loan_id from active_loan_ids
```

Each aggregate holds only the data for its invariants. Each change touches one aggregate and
records its new state before it emits its event. Thus a second borrow sees the new loan, and a
second return stops at the precondition.

The caller creates the LoanPeriod, so `borrow` gets only a period that obeys its rule. After a
borrow, `LoanStarted` creates the Loan. After a return, `CopyReturned` removes the loan_id from
the Member. For a short time after a return, the Member has one loan too many. The domain permits this delay, because the delay can only stop a
borrow. It cannot let a member borrow a sixth copy.

## Another bad example

One `Member` aggregate holds each loan and each copy, to enforce the limit of 5 active loans.

```
aggregate Member
  member_id
  loans: list of Loan, with the full history
    each Loan holds a Copy object
```

The aggregate grows with each loan. To change the condition of a copy, the code must load and lock
the member who borrowed it.

Related: [domain-languages.md](domain-languages.md),
[design-by-contract.md](design-by-contract.md), [state-machines.md](state-machines.md),
[adrs.md](adrs.md).

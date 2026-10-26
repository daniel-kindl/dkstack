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

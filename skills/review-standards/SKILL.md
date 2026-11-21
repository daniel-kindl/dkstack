---
name: review-standards
description: "Use when a review must check a change against the documented rules: safety, correctness, security, dependencies, naming, quality gates, logging, architecture, UI, docs and writing. One building block of code-review. Includes the code smell list."
user-invocable: false
---

# Review the standards

A building block of [code-review](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md). Use it alone, or as step 5 of code-review. Rate each finding with the [severity table](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md#severity). Write each finding in the [finding format](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md#output).

## Sources

Find the standards:

- [AGENTS.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/AGENTS.md) and the dkstack pages that apply.
- The project rules, for example `CONTRIBUTING.md`, the coding standards and the ADRs.
- The project's documented exceptions to dkstack rules. A dkstack rule wins over a project rule, except through a documented exception. See the precedence rules in [AGENTS.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/AGENTS.md).

Skip what an automated check in the project already enforces.
For naming, review the meaning rules in
[coding/naming.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/naming.md).
Check intent, accuracy and domain terms in the changed identifiers. Do not repeat a naming form
check that the project's automated checks reliably enforce. Review forms that have no reliable
automated check.

## Checklist

Check each file against this list. Link the rule in each finding. Do not copy the rule.

- Safety: no change breaks a rule in [workflow/safety.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/safety.md). A path that lets an agent start a production deploy or a project's release workflow, or release without the owner's OK, is Blocking.
- Correctness: logic, edge cases, empty and null input, error paths and resource cleanup. See [coding/error-handling.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/error-handling.md) and [resource balancing](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/resource-balancing.md).
- Security: input validation, secrets, injection, permissions, and CI triggers and tokens. See [coding/security.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/security.md) and its [CI workflows](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/security.md#ci-workflows) rules.
- Dependencies: each new dependency has a reason, a pinned version and a lockfile change. Each third-party CI step is pinned to a full commit SHA. Run the project's dependency audit if you can. See [coding/dependencies.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/dependencies.md).
- Clean code: semantic naming, readability and broken windows. See [coding/quality.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/quality.md) and [coding/naming.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/naming.md).
- Domain language: names in code, tests and docs use the terms in `CONTEXT.md`, if the file exists. See the [glossary](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/domain-languages.md#glossary). A name that uses a word from an `_Avoid_:` line is Low. A name that gives a glossary term a different meaning is Medium. A changed meaning with no change to `CONTEXT.md` is Medium.
- Quality gates: no check is disabled, skipped or lowered. A warning suppression follows the suppression rules. See [coding/quality-gates.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/quality-gates.md).
- Logging: check the changed events and the `Observability:` line against [coding/logging.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/logging.md). A secret or personal data in a log is Blocking. A missing or wrong `Observability:` line in the pull request body is Medium. A duplicate terminal Error is Medium. A missing event is Medium only when you name the diagnostic gap. A wrong level is Low.
- Architecture: the change follows the Accepted ADRs. Code that contradicts one is High under the [ADR findings](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/code-review/SKILL.md#adr-findings) rule. The change also follows [architecture/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/index.md). For a structural change, use [apply-architecture](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/apply-architecture/SKILL.md).
- Sustainability: follow [stewardship](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/stewardship.md) when the change matches a signal on that page. An unrelated refactor is work the specification did not ask for. Do not require a stewardship report for ordinary work.
- Performance: hot paths, allocations, repeated queries and blocking I/O on the UI thread. For UI, see [UI performance](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/ui/performance.md).
- Rendered UI: for a rendered UI change, use [ui-review](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/ui-review/SKILL.md). A failed WCAG 2.2 A or AA criterion on a changed surface is High. A missed dkstack accessibility rule that is not a WCAG criterion is Medium. A missing state that the specification requires is High. A missing or wrong `Visual verification:` line in the pull request body is Medium. An inconsistency with the project's design system is Medium. A visual preference is Low.
- Docs: the README, user docs, ADRs and `CHANGELOG.md` match the change.
- Writing: all text follows [writing/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/writing/index.md). Use [writing-check](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/skills/writing-check/SKILL.md).
- Version: the version change matches semver. See [versioning/index.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/versioning/index.md).

### Code smells

Use this list even if the project documents no rules. A documented rule wins over this list. If a project rule allows a pattern, do not report it as a smell.

A smell is a judgement, not a hard violation. Write it as "possible feature envy". A smell is Medium by default. Make it Low if the impact is small, and give the reason. Make it High if it causes wrong behavior.

| Smell | Fix | Principle |
| --- | --- | --- |
| Mysterious name: a name does not say what the thing does or holds | Rename it. If no clear name fits, the design is not clear | [coding/naming.md](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/coding/naming.md), [domain languages](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/domain-languages.md) |
| Duplicated code: the same logic is in more than one place | Move the logic to one function and use it in each place | [DRY](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/dry.md) |
| Feature envy: a function uses the data of another object more than its own | Move the function to the data it uses | [decoupling](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/decoupling.md) |
| Data clumps: the same fields or parameters always go together | Make one type for the group and pass it | [domain languages](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/domain-languages.md), [DRY](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/dry.md) |
| Primitive obsession: a string or number stands for a domain concept | Make a small type for the concept | [domain languages](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/domain-languages.md), [design by contract](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/design-by-contract.md) |
| Repeated switches: the same switch or if chain on the same type is in more than one place | Use polymorphism, or one shared map | [SOLID](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/solid.md) (open-closed) |
| Shotgun surgery: one logical change needs edits in many files | Put the parts that change together in one module | [orthogonality](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/orthogonality.md) |
| Divergent change: one module changes for unrelated reasons | Split it, so that each module has one reason to change | [SOLID](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/solid.md) (single responsibility), [separation of concerns](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/separation-of-concerns.md) |
| Speculative generality, or dead code: code, parameters or hooks with no current use | Delete it. Add it again when a real need exists | [YAGNI](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/yagni.md) |
| Message chains: a caller walks through many objects, for example `a.b().c().d()` | Ask the first object for the result | [decoupling](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/decoupling.md) |
| Middle man: a class or function only passes calls on, and it is not a deliberate boundary | Remove it and call the target directly. Keep it if it isolates a dependency or a module boundary | [KISS](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/kiss.md), [decoupling](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/decoupling.md) |
| Refused bequest: a subtype ignores or overrides most of what it inherits | Use composition, not inheritance | [SOLID](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/solid.md) (Liskov substitution) |
| Long function or deep nesting | Split it into small functions with clear names | [KISS](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/kiss.md), [separation of concerns](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/separation-of-concerns.md) |
| Magic value: a literal with no name | Use a named constant. If the value depends on the environment, make it configuration | [DRY](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/dry.md), [configuration](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/configuration.md) |
| Boolean flags that together encode a state | Model the states and transitions | [state machines](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/state-machines.md) |
| Shared mutable state with no owner, atomic operation or lock. This is High by default | Give the state one owner, or guard it | [concurrency](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/concurrency.md) |
| Configuration read in many places, or environment values in code | Read configuration in one place and pass it in | [configuration](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/configuration.md), [reversibility](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/reversibility.md) |
| An error is ignored, or bad input is accepted and fails later | Fail at once, at the boundary | [fail fast](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/fail-fast.md), [design by contract](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/design-by-contract.md) |
| Calls that must run in a hidden order | Make the order explicit, or remove it | [temporal coupling](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/architecture/temporal-coupling.md) |

## Subagents

Do not start subagents for this skill. Reason: this is one building block. code-review runs it in its own subagent. See the [subagent guide](https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/workflow/subagents.md).

## Credit

The smell list comes from the [code-review skill](https://github.com/mattpocock/skills/blob/main/skills/engineering/code-review/SKILL.md) by Matt Pocock (MIT). The smells come from Martin Fowler, Refactoring, chapter 3.

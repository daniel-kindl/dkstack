import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, sectionText, flatten } from "./helpers.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const page = () => readFile(join(repoRoot, "architecture", "domain-modeling.md"), "utf8");
const section = (text, heading) => flatten(sectionText(text, heading));

function assertPhrases(text, phrases) {
  for (const phrase of phrases) {
    assert.ok(text.includes(phrase), `missing: ${phrase}`);
  }
}

// Each rule is pinned as a full sentence, with the condition that says when it applies. A key
// phrase alone let a changed condition pass (#340, review M1). A "See" link is not pinned here,
// because the link check covers it.
const rules = {
  "## When to model": [
    'Model the domain when a rule joins two or more facts. An example is "a member can borrow a copy only when the member has fewer than 5 active loans".',
    "Do not model a domain that only stores and shows data, with no rule that joins two or more facts. Reason: the model adds structure that no rule uses.",
    "If a change uses the model and does not change it, use the glossary terms only.",
  ],
  "## Bounded contexts": [
    "Draw a boundary where one word has two meanings.",
    "Draw a boundary where a different set of rules or a different team owns the work.",
    "Do not share one model between two contexts. Translate the data at the boundary.",
    "Keep the number of contexts small. For most small projects, one context is the correct result.",
  ],
  "## Context map": [
    "For each relation, state the upstream context and the downstream context. The upstream context supplies the data. The downstream context uses it.",
    "State where the downstream context translates the upstream terms into its own terms. Keep the upstream terms out of the downstream model.",
    "Refer to a thing in another context by its identifier only.",
  ],
  "## Aggregates": [
    "Put each invariant in the aggregate that holds all the data to check it.",
    "Change an aggregate only through its root. The root checks the invariants at each change and stops on a violation.",
    "Keep each aggregate small. Add an object to an aggregate only when an invariant needs it.",
    "Change one aggregate in one transaction.",
    "Refer to another aggregate by its identifier, not by the object.",
    "If a rule must hold at all times, keep all its data in one aggregate. Change the boundary if necessary. Reason: if a second aggregate changes later, two changes can both pass the check.",
    "Use a domain event to update a second aggregate later only when the domain permits the delay.",
    "Record the choice of boundary in an [ADR](adrs.md) when it meets the ADR test.",
  ],
  "## Value objects": [
    "Use a value object for a domain value that has its own rules, for example a loan period.",
    "Check the rules of a value object when you create it. Do not create a value object that breaks its rules.",
    "Do not change a value object. Create a new one.",
  ],
  "## Domain events": [
    "Name the event in the past tense with domain words, for example `CopyReturned`.",
    "Use an event to tell another aggregate or another context about a change.",
    "Put in the event only the data that its receivers need, in domain terms.",
    "Model the states that the events move an aggregate through as a [state machine](state-machines.md).",
  ],
  "## Where the model lives": [
    "During design, write the model in the issue or the plan.",
    "After that, the code and the tests are the record of the model. A test proves each invariant.",
    "For the domain terms, see the [glossary](domain-languages.md#glossary).",
    "Record a boundary that is hard to reverse in an [ADR](adrs.md) when it meets the ADR test.",
  ],
};

for (const [heading, sentences] of Object.entries(rules)) {
  test(`the ${heading.slice(3).toLowerCase()} section of the domain modeling page has each rule`, async () => {
    assertPhrases(section(await page(), heading), sentences);
  });
}

test("the domain modeling page has no glossary for each context yet", async () => {
  // The glossary is one file. A glossary for each context waits for part 3 of #339.
  const text = section(await page(), "## Bounded contexts");
  assert.ok(!text.includes("its own glossary"), "a glossary for each context is not a rule yet");
});

test("the domain modeling page links the glossary rule and does not repeat it", async () => {
  const text = section(await page(), "## Where the model lives");
  assert.ok(!/Record each domain term in the glossary/.test(text), "the glossary rule is repeated");
});

test("the context map example says what Lending records", async () => {
  assertPhrases(section(await page(), "## Good example"), [
    "Lending records the book_id from Catalog on each copy that it owns",
  ]);
});

test("the aggregate example keeps each invariant at each change", async () => {
  const text = section(await page(), "## Another good example");
  assertPhrases(text, [
    "borrow(copy_id, period: LoanPeriod)",
    "adds the new loan_id to active_loan_ids",
    "on LoanStarted: create Loan",
    "sets state to returned",
  ]);
  // Each change sets its state before it emits its event.
  assert.ok(
    text.indexOf("adds the new loan_id") < text.indexOf("emits LoanStarted"),
    "borrow must record the loan before it emits LoanStarted",
  );
  assert.ok(
    text.indexOf("sets state to returned") < text.indexOf("emits CopyReturned"),
    "return must set the state before it emits CopyReturned",
  );
});

test("the aggregate example names the work of each event", async () => {
  assertPhrases(section(await page(), "## Another good example"), [
    "After a borrow, `LoanStarted` creates the Loan",
    "After a return, `CopyReturned` removes the loan_id from the Member",
  ]);
});

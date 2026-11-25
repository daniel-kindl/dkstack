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

// The key phrases pin each rule, not the full sentences (#340).
test("the domain modeling page says when to model", async () => {
  assertPhrases(section(await page(), "## When to model"), [
    "Model the domain when a rule joins two or more facts",
    "Do not model a domain that only stores and shows data",
    "If a change uses the model and does not change it, use the glossary terms only",
  ]);
});

test("the domain modeling page has the bounded context rules", async () => {
  const text = section(await page(), "## Bounded contexts");
  assertPhrases(text, [
    "Draw a boundary where one word has two meanings",
    "Draw a boundary where a different set of rules or a different team owns the work",
    "Do not share one model between two contexts",
    "Translate the data at the boundary",
    "Keep the number of contexts small",
    "one context is the correct result",
  ]);
  // The glossary is one file. A glossary for each context waits for part 3 of #339.
  assert.ok(!text.includes("its own glossary"), "a glossary for each context is not a rule yet");
});

test("the domain modeling page has the context map rules", async () => {
  assertPhrases(section(await page(), "## Context map"), [
    "state the upstream context and the downstream context",
    "State where the downstream context translates the upstream terms",
    "Keep the upstream terms out of the downstream model",
    "Refer to a thing in another context by its identifier only",
  ]);
});

test("the domain modeling page keeps a strict invariant in one aggregate", async () => {
  assertPhrases(section(await page(), "## Aggregates"), [
    "Put each invariant in the aggregate that holds all the data to check it",
    "Change an aggregate only through its root",
    "The root checks the invariants at each change and stops on a violation",
    "Keep each aggregate small",
    "Add an object to an aggregate only when an invariant needs it",
    "Change one aggregate in one transaction",
    "Refer to another aggregate by its identifier",
    "If a rule must hold at all times, keep all its data in one aggregate",
    "Use a domain event to update a second aggregate later only when the domain permits the delay",
    "Record the choice of boundary in an [ADR](adrs.md)",
  ]);
});

test("the domain modeling page has the value object rules", async () => {
  assertPhrases(section(await page(), "## Value objects"), [
    "Use a value object for a domain value that has its own rules",
    "Check the rules of a value object when you create it",
    "Do not create a value object that breaks its rules",
    "Do not change a value object",
  ]);
});

test("the domain modeling page has the domain event rules", async () => {
  assertPhrases(section(await page(), "## Domain events"), [
    "Name the event in the past tense with domain words",
    "Use an event to tell another aggregate or another context about a change",
    "Put in the event only the data that its receivers need",
    "Model the states that the events move an aggregate through as a [state machine](state-machines.md)",
  ]);
});

test("the domain modeling page links the glossary rule and does not repeat it", async () => {
  const text = section(await page(), "## Where the model lives");
  assertPhrases(text, [
    "During design, write the model in the issue or the plan",
    "the code and the tests are the record of the model",
    "A test proves each invariant",
    "(domain-languages.md#glossary)",
    "Record a boundary that is hard to reverse in an [ADR](adrs.md)",
  ]);
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

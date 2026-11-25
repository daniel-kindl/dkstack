import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const page = () => readFile(join(repoRoot, "architecture", "domain-modeling.md"), "utf8");

// Return the text of one section, up to the next heading of the same or a higher level.
function section(text, heading) {
  const lines = text.split("\n");
  const level = heading.match(/^#+/)[0].length;
  const start = lines.indexOf(heading);
  assert.notEqual(start, -1, `missing heading: ${heading}`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    const match = /^(#+) /.exec(lines[i]);
    if (match && match[1].length <= level) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join(" ").replace(/\s+/g, " ");
}

function assertPhrases(text, phrases) {
  for (const phrase of phrases) {
    assert.ok(text.includes(phrase), `missing: ${phrase}`);
  }
}

// The key phrases pin the rules, not the full sentences (#340).
test("the domain modeling page says when to model", async () => {
  assertPhrases(section(await page(), "## When to model"), [
    "Model the domain when a rule joins two or more facts",
    "Do not model a domain that only stores and shows data",
  ]);
});

test("the domain modeling page has the bounded context rules", async () => {
  const text = section(await page(), "## Bounded contexts");
  assertPhrases(text, [
    "Draw a boundary where one word has two meanings",
    "Do not share one model between two contexts",
    "Translate the data at the boundary",
    "one context is the correct result",
  ]);
  // The glossary is one file. A glossary for each context waits for part 3 of #339.
  assert.ok(!text.includes("its own glossary"), "a glossary for each context is not a rule yet");
});

test("the domain modeling page has the context map rules", async () => {
  assertPhrases(section(await page(), "## Context map"), [
    "state the upstream context and the downstream context",
    "Keep the upstream terms out of the downstream model",
    "Refer to a thing in another context by its identifier only",
  ]);
});

test("the domain modeling page keeps a strict invariant in one aggregate", async () => {
  assertPhrases(section(await page(), "## Aggregates"), [
    "Put each invariant in the aggregate that holds all the data to check it",
    "Change an aggregate only through its root",
    "Change one aggregate in one transaction",
    "Refer to another aggregate by its identifier",
    "If a rule must hold at all times, keep all its data in one aggregate",
    "Use a domain event to update a second aggregate later only when the domain permits the delay",
  ]);
});

test("the domain modeling page has the value object and domain event rules", async () => {
  const text = await page();
  assertPhrases(section(text, "## Value objects"), [
    "Check the rules of a value object when you create it",
    "Do not change a value object",
  ]);
  assertPhrases(section(text, "## Domain events"), [
    "Name the event in the past tense",
    "Put in the event only the data that its receivers need",
  ]);
});

test("the domain modeling page links the glossary rule and does not repeat it", async () => {
  const text = section(await page(), "## Where the model lives");
  assertPhrases(text, ["the code and the tests are the record of the model", "(domain-languages.md#glossary)"]);
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

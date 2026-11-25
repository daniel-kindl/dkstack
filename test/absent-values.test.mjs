import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile, sectionText } from "./helpers.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function text(path) {
  return readFile(join(root, path), "utf8");
}

// Join wrapped lines so that a phrase can span a line break.
function flat(value) {
  return value.replace(/\s+/g, " ");
}

test("coding/absent-values.md states each absent value rule", async () => {
  const page = flat(await text("coding/absent-values.md"));
  for (const part of [
    "# Absent values",
    "Make values present by default.",
    "Turn on the null check of the language and run it in CI as an error.",
    "`strictNullChecks`",
    "`<Nullable>enable</Nullable>`",
    "Show in the type when a value can be absent",
    "Do not use a special value for \"no value\"",
    "`-1`",
    "Check an input at the boundary, where it enters the code.",
    "Convert it once to a type that cannot be absent.",
    "Do not use an absent value to report a failure.",
    "Return an empty collection for \"no items\", not an absent value.",
    "Do not use a non-null assertion",
    "only when a check before it proves that the value is present",
    "(error-handling.md)",
    "(types.md)",
  ]) {
    assert.ok(page.includes(part), `missing ${part}`);
  }
});

test("coding/absent-values.md has a good and a bad example with content", async () => {
  const page = await text("coding/absent-values.md");
  for (const heading of ["## Good example", "## Bad example"]) {
    const body = sectionText(page, heading).split("\n").slice(1).join("\n").trim();
    assert.ok(body.length > 80, `${heading} is empty or too short`);
  }
  assert.ok(flat(sectionText(page, "## Good example")).includes("`findUser(id: UserId): Promise<User | undefined>`"), "good example lost its signature");
  assert.ok(flat(sectionText(page, "## Bad example")).includes("`TypeError`"), "bad example lost its failure");
});

test("coding/index.md lists coding/absent-values.md", async () => {
  assert.ok((await text("coding/index.md")).includes("(absent-values.md)"), "coding/index.md does not list the page");
});

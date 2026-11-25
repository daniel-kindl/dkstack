import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFile, sectionText } from "./helpers.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

async function text(path) {
  return readFile(join(root, path), "utf8");
}

test("tips/index.md has the first tips and no placeholder", async () => {
  const tips = await text("tips/index.md");
  assert.ok(!tips.includes("(None yet."), "placeholder is still there");
  for (const [heading, parts] of [
    ["## Check the exit code of each step", ["last command", "pipefail", "set -e"]],
    ["## Check for a breaking change before you push", ["check-breaking.mjs", "TITLE="]],
    ["## Find worktrees and branches that are left", ["git worktree list", "[gone]", "review-and-merge.md#after-the-merge"]],
  ]) {
    const section = sectionText(tips, heading);
    for (const part of parts) assert.ok(section.includes(part), `${heading}: missing ${part}`);
  }
});

test("AGENTS.md lists tips/index.md", async () => {
  const sections = sectionText(await text("AGENTS.md"), "## Sections");
  assert.ok(sections.includes("(tips/index.md)"), "AGENTS.md does not list tips/index.md");
});

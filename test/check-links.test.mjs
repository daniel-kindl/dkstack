import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { checkLinks } from "../scripts/check-links.mjs";
import { makeTree, removeTree } from "./helpers.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(repoRoot, "scripts", "check-links.mjs");

async function linksFor(files) {
  const root = await makeTree(files);
  try {
    return await checkLinks(root);
  } finally {
    await removeTree(root);
  }
}

test("every relative link in the repository resolves", async () => {
  const result = await checkLinks(repoRoot);
  assert.deepEqual(result.errors, []);
  assert.ok(result.checked > 0, "the check must find links in the repository");
});

test("no link in the repository points to an old flat skill path", async () => {
  const result = await checkLinks(repoRoot);
  const old = result.links.filter((l) => /(^|\/)skills\/(?!index\.md$)[^/]+\.md$/.test(l.resolved));
  assert.deepEqual(old, []);
});

test("a broken relative link is reported with file, line and target", async () => {
  const result = await linksFor({
    "AGENTS.md": "# A\n\nRead [triage](skills/triage.md) first.\n",
    "skills/triage/SKILL.md": "x\n",
  });
  assert.deepEqual(result.errors, ["AGENTS.md:3: broken link skills/triage.md"]);
});

test("links resolve relative to the file that contains them", async () => {
  const result = await linksFor({
    "docs/a/README.md": "[up](../../coding/index.md) [bad](../coding/index.md)\n",
    "coding/index.md": "x\n",
  });
  assert.deepEqual(result.errors, ["docs/a/README.md:1: broken link ../coding/index.md"]);
  assert.equal(result.checked, 2);
});

test("a link with an anchor, a title, an image or a folder target resolves, and a missing file fails", async () => {
  const result = await linksFor({
    "README.md": [
      "[a](docs/x.md#part)",
      '[b](docs/x.md "Title")',
      "![img](docs/pic.png)",
      "[dir](docs/)",
      "[self](#top)",
      "[c](<docs/x.md>)",
      "[gone](docs/missing.md#part)",
    ].join("\n"),
    "docs/x.md": "# Part\n",
    "docs/pic.png": "png",
  });
  assert.deepEqual(result.errors, [
    "README.md:5: missing anchor #top",
    "README.md:7: broken link docs/missing.md#part",
  ]);
});

test("external links and links in code are not checked", async () => {
  const result = await linksFor({
    "README.md": [
      "[web](https://example.com/x.md) [mail](mailto:a@example.com)",
      "`[inline](nope.md)`",
      "```md",
      "[fenced](nope.md)",
      "```",
      "~~~",
      "[tilde](nope.md)",
      "~~~",
    ].join("\n"),
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.checked, 0);
});

test("node_modules and .git are not scanned", async () => {
  const result = await linksFor({
    "node_modules/pkg/README.md": "[x](missing.md)\n",
    ".git/notes.md": "[x](missing.md)\n",
    "README.md": "ok\n",
  });
  assert.deepEqual(result.errors, []);
});

test("the CLI exits 1 for a broken link and 0 for a clean tree", async () => {
  const bad = await makeTree({ "README.md": "[x](missing.md)\n" });
  const good = await makeTree({ "README.md": "[x](other.md)\n", "other.md": "x\n" });
  try {
    const failRun = spawnSync(process.execPath, [script, bad], { encoding: "utf8" });
    assert.equal(failRun.status, 1);
    assert.match(failRun.stderr, /README\.md:1: broken link missing\.md/);
    const passRun = spawnSync(process.execPath, [script, good], { encoding: "utf8" });
    assert.equal(passRun.stderr, "");
    assert.equal(passRun.status, 0);
    assert.equal(passRun.stdout, "1 link(s) resolve.\n");
  } finally {
    await removeTree(bad);
    await removeTree(good);
  }
});

test("a link that leaves the repository fails even when the target exists", async () => {
  const root = await makeTree({
    "outside.md": "x\n",
    "repo/docs/a.md": "[out](../../outside.md) [in](../README.md)\n",
    "repo/README.md": "x\n",
  });
  try {
    const result = await checkLinks(join(root, "repo"));
    assert.deepEqual(result.errors, ["docs/a.md:1: link leaves the repository ../../outside.md"]);
  } finally {
    await removeTree(root);
  }
});

test("percent escapes are decoded, and a bad escape is a broken link, not a crash", async () => {
  const result = await linksFor({
    "README.md": "[a](my%20file.md)\n[b](bad%zz.md)\n[c](no%20file.md)\n",
    "my file.md": "x\n",
  });
  assert.deepEqual(result.errors, [
    "README.md:2: broken link bad%zz.md",
    "README.md:3: broken link no%20file.md",
  ]);
});

test("a fence closes only with the same character and at least the same length", async () => {
  const result = await linksFor({
    "README.md": [
      "~~~",
      "```",
      "[in-tilde](nope.md)",
      "~~~",
      "````",
      "```",
      "[in-long](nope.md)",
      "````",
      "[after](missing.md)",
    ].join("\n"),
  });
  assert.deepEqual(result.errors, ["README.md:9: broken link missing.md"]);
});

test("absolute links to a file in this repository resolve against the local tree", async () => {
  const raw = "https://raw.githubusercontent.com/daniel-kindl/dkstack";
  const gh = "https://github.com/daniel-kindl/dkstack";
  const result = await linksFor({
    "README.md": [
      `[a](${raw}/main/AGENTS.md)`,
      `[b](${raw}/v1/coding/missing.md)`,
      `Read ${raw}/v1.0.0/coding/index.md.`,
      `Read ${raw}/main/coding/gone.md, then stop.`,
      `<${gh}/blob/main/docs/x.md#part>`,
      `[t](${gh}/tree/v1) [s](${gh}/tree/main/skills/) [u](${gh}/tree/main/nope)`,
      `[up](${raw}/main/../outside.md)`,
    ].join("\n"),
    "docs/README.md": `[rel](${raw}/main/AGENTS.md) and ${gh}/blob/main/docs/missing.md`,
    "AGENTS.md": "x\n",
    "coding/index.md": "x\n",
    "docs/x.md": "## Part\n",
    "skills/a/SKILL.md": "x\n",
  });
  assert.deepEqual(result.errors, [
    `README.md:2: broken link ${raw}/v1/coding/missing.md`,
    `README.md:4: broken link ${raw}/main/coding/gone.md`,
    `README.md:6: broken link ${gh}/tree/main/nope`,
    `README.md:7: link leaves the repository ${raw}/main/../outside.md`,
    `docs/README.md:1: broken link ${gh}/blob/main/docs/missing.md`,
  ]);
  assert.equal(result.checked, 11);
});

test("other absolute URLs and repository URLs in code are not checked", async () => {
  const result = await linksFor({
    "README.md": [
      "https://github.com/daniel-kindl/dkstack/issues and https://github.com/daniel-kindl",
      "[i](https://github.com/daniel-kindl/dkstack/issues/3) https://github.com/daniel-kindl/dkstack/pull/18/files",
      "[web](https://example.com/missing.md) https://example.com/missing.md",
      "https://github.com/daniel-kindl/other/blob/main/missing.md",
      "`https://raw.githubusercontent.com/daniel-kindl/dkstack/main/missing.md`",
      "```text",
      "https://raw.githubusercontent.com/daniel-kindl/dkstack/<ref>/missing.md",
      "```",
    ].join("\n"),
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.checked, 0);
});

test("a relative link in a skill folder must stay in that folder", async () => {
  const result = await linksFor({
    "skills/a/SKILL.md": [
      "[own](notes.md) [sub](ref/b.md) [anchor](#x)",
      "[other](../b/SKILL.md) [top](../../coding/index.md) [gone](../../nope.md)",
      "## X",
    ].join("\n"),
    "skills/a/notes.md": "x\n",
    "skills/a/ref/b.md": "[up](../SKILL.md) [out](../../index.md)\n",
    "skills/b/SKILL.md": "x\n",
    "skills/index.md": "[a](a/SKILL.md)\n",
    "coding/index.md": "x\n",
  });
  assert.deepEqual(result.errors, [
    "skills/a/SKILL.md:2: relative link leaves the skill folder ../b/SKILL.md",
    "skills/a/SKILL.md:2: relative link leaves the skill folder ../../coding/index.md",
    "skills/a/SKILL.md:2: relative link leaves the skill folder ../../nope.md",
    "skills/a/ref/b.md:1: relative link leaves the skill folder ../../index.md",
  ]);
});

test("an absolute repository link in a skill must be a raw URL with the ref v1", async () => {
  const raw = "https://raw.githubusercontent.com/daniel-kindl/dkstack";
  const gh = "https://github.com/daniel-kindl/dkstack";
  const result = await linksFor({
    "skills/a/SKILL.md": [
      `[ok](${raw}/v1/coding/index.md) ${raw}/v1/AGENTS.md`,
      `[main](${raw}/main/coding/index.md) ${raw}/v1.0.0/AGENTS.md`,
      `[v2](${raw}/v2/AGENTS.md) [V1](${raw}/V1/AGENTS.md)`,
      `[blob](${gh}/blob/v1/AGENTS.md) ${gh}/tree/v1/coding`,
    ].join("\n"),
    "README.md": `[main](${raw}/main/AGENTS.md)\n`,
    "AGENTS.md": "x\n",
    "coding/index.md": "x\n",
  });
  const fix = `use ${raw}/v1/<path>`;
  assert.deepEqual(result.errors, [
    `skills/a/SKILL.md:2: skill link must ${fix}: ${raw}/main/coding/index.md`,
    `skills/a/SKILL.md:2: skill link must ${fix}: ${raw}/v1.0.0/AGENTS.md`,
    `skills/a/SKILL.md:3: skill link must ${fix}: ${raw}/v2/AGENTS.md`,
    `skills/a/SKILL.md:3: skill link must ${fix}: ${raw}/V1/AGENTS.md`,
    `skills/a/SKILL.md:4: skill link must ${fix}: ${gh}/blob/v1/AGENTS.md`,
    `skills/a/SKILL.md:4: skill link must ${fix}: ${gh}/tree/v1/coding`,
  ]);
});

test("an absolute v1 link in a skill to a path that is not in the repository is broken", async () => {
  const raw = "https://raw.githubusercontent.com/daniel-kindl/dkstack";
  const result = await linksFor({
    "skills/a/SKILL.md": `[gone](${raw}/v1/coding/gone.md)\nRead ${raw}/v1/missing/index.md.\n`,
  });
  assert.deepEqual(result.errors, [
    `skills/a/SKILL.md:1: broken link ${raw}/v1/coding/gone.md`,
    `skills/a/SKILL.md:2: broken link ${raw}/v1/missing/index.md`,
  ]);
});

test("every skill in the repository links to other dkstack files only with v1 raw URLs", async () => {
  const result = await checkLinks(repoRoot);
  const inSkills = result.links.filter((l) => /^skills\/[^/]+\//.test(l.file));
  assert.ok(inSkills.length > 0, "the skills must have links");
  const relativeOut = inSkills.filter((l) => !/^https?:/.test(l.target) && !l.resolved.startsWith(l.file.split("/").slice(0, 2).join("/") + "/"));
  assert.deepEqual(relativeOut, []);
  const wrongRef = inSkills.filter((l) => /^https?:/.test(l.target) && !l.target.startsWith("https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/"));
  assert.deepEqual(wrongRef, []);
});

// FRG-5 and SEN-7 (#154): an anchor must match a heading in the target file.
test("a link to a missing anchor fails and a link to a heading anchor passes", async () => {
  const result = await linksFor({
    "README.md": "[ok](docs/x.md#first-part)\n[bad](docs/x.md#no-such-part)\n",
    "docs/x.md": "# Title\n\n## First part\n",
  });
  assert.deepEqual(result.errors, ["README.md:2: missing anchor docs/x.md#no-such-part"]);
});

test("a duplicate heading gets the -1 suffix, as on GitHub", async () => {
  const result = await linksFor({
    "README.md": "[a](x.md#good-example) [b](x.md#good-example-1) [c](x.md#good-example-2)\n",
    "x.md": "# X\n\n## Good example\n\n## Good example\n",
  });
  assert.deepEqual(result.errors, ["README.md:1: missing anchor x.md#good-example-2"]);
});

test("a heading with code, links or punctuation gives the GitHub anchor", async () => {
  const result = await linksFor({
    "README.md": [
      "[a](x.md#the-v1-branch)",
      "[b](x.md#what-is-in-each-section)",
      "[c](x.md#amendment-2026-11-11)",
      "[d](x.md#release-dkstack)",
      "[e](x.md#step-3-plan--build)",
      "[f](x.md#old-id)",
    ].join("\n"),
    "x.md": [
      "# The `v1` branch",
      "## What is in each section?",
      "## Amendment (2026-11-11)",
      "## [Release](y.md) dkstack ##",
      "## Step 3: plan & build",
      '<a id="old-id"></a>',
      "```md",
      "## In code",
      "```",
    ].join("\n"),
    "y.md": "x\n",
  });
  assert.deepEqual(result.errors, []);
  const inCode = await linksFor({ "README.md": "[a](x.md#in-code)\n", "x.md": "```\n## In code\n```\n" });
  assert.deepEqual(inCode.errors, ["README.md:1: missing anchor x.md#in-code"]);
});

test("a pure anchor is checked against the same file", async () => {
  const result = await linksFor({ "README.md": "# Top\n\n[ok](#top) [bad](#bottom)\n" });
  assert.deepEqual(result.errors, ["README.md:3: missing anchor #bottom"]);
});

test("a repository URL with an anchor is checked against the local file", async () => {
  const base = "https://github.com/daniel-kindl/dkstack/blob/main";
  const result = await linksFor({
    "README.md": `[ok](${base}/x.md#part) [bad](${base}/x.md#gone)\n`,
    "x.md": "## Part\n",
  });
  assert.deepEqual(result.errors, [`README.md:1: missing anchor ${base}/x.md#gone`]);
});

test("a reference definition is checked like a link", async () => {
  const result = await linksFor({
    "README.md": "[a][d] [b][e] [c][f]\n\n[d]: missing.md\n[e]: x.md#part\n[f]: <x.md#gone>\n",
    "x.md": "## Part\n",
  });
  assert.deepEqual(result.errors, [
    "README.md:3: broken link missing.md",
    "README.md:5: missing anchor x.md#gone",
  ]);
});

test("a bare URL followed by ;, :, ! or ? keeps the path without the mark", async () => {
  const base = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1";
  const result = await linksFor({
    "README.md": `See ${base}/x.md; ${base}/x.md: ${base}/x.md! ${base}/x.md?\n`,
    "x.md": "x\n",
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.checked, 4);
});

test("a link to exactly .. leaves the repository", async () => {
  const result = await linksFor({ "README.md": "[up](..)\n" });
  assert.deepEqual(result.errors, ["README.md:1: link leaves the repository .."]);
});

// FRG-6 in #154: gaps of the link parser.
test("an HTML a href is checked like a link", async () => {
  const result = await linksFor({
    "README.md": '# R\n\n<a href="docs/missing.md">x</a> and <a href="LICENSE">y</a>\n',
    "LICENSE": "x\n",
  });
  assert.deepEqual(result.errors, ["README.md:3: broken link docs/missing.md"]);
});

test("a skill can link its own folder with ./", async () => {
  const result = await linksFor({ "skills/s/SKILL.md": "# S\n\nSee [self](./) and [self](.).\n" });
  assert.deepEqual(result.errors, []);
});

test("a link in an indented code block is ignored, and a link in a nested list is checked", async () => {
  const result = await linksFor({
    "README.md": "# R\n\nText.\n\n    [a](missing-code.md)\n\n- item\n\n    [b](missing-list.md)\n",
  });
  assert.deepEqual(result.errors, ["README.md:9: broken link missing-list.md"]);
});

test("a target with balanced parentheses is read whole", async () => {
  const result = await linksFor({
    "README.md": "# R\n\n[a](file_(1).md) and [b](gone_(2).md)\n",
    "file_(1).md": "x\n",
  });
  assert.deepEqual(result.errors, ["README.md:3: broken link gone_(2).md"]);
});

test("a repository URL on a ref with a slash, such as release/v1.5.0, resolves", async () => {
  const result = await linksFor({
    "README.md": "# R\n\n[a](https://github.com/daniel-kindl/dkstack/blob/release/v1.5.0/LICENSE) "
      + "[b](https://github.com/daniel-kindl/dkstack/blob/release/v1.5.0/missing.md)\n",
    "LICENSE": "x\n",
  });
  assert.deepEqual(result.errors, ["README.md:3: broken link https://github.com/daniel-kindl/dkstack/blob/release/v1.5.0/missing.md"]);
});

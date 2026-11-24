import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { makeTree, removeTree } from "./helpers.mjs";

const marker = "privatemarker";
const scripts = new URL("../scripts/", import.meta.url);

async function checkEvent(script, raw, status, message) {
  const root = await makeTree({ "event.json": raw });
  try {
    const result = spawnSync(process.execPath, [fileURLToPath(new URL(script, scripts)), "--event"], {
      encoding: "utf8",
      env: { ...process.env, GITHUB_EVENT_PATH: join(root, "event.json") },
    });
    assert.equal(result.status, status, result.stderr);
    const output = result.stdout + result.stderr;
    assert.match(output, message);
    assert.ok(!output.includes(marker));
  } finally {
    await removeTree(root);
  }
}

const event = (pr) => JSON.stringify({ pull_request: pr });

test("the title CLI prints fixed output for good and bad event titles", async () => {
  await checkEvent("check-title.mjs", event({ title: "fix: add " + marker }), 0, /conventional commit/);
  await checkEvent("check-title.mjs", event({ title: marker + ": add a check" }), 1, /type is not allowed/);
});

test("the body CLI accepts a valid event and skips a bot without naming its login", async () => {
  await checkEvent("check-pr-body.mjs", event({
    body: "Closes #12\n\n## Evidence\n\nObservability: none, " + marker,
    user: { login: marker },
  }), 0, /body is valid/);
  await checkEvent("check-pr-body.mjs", event({ body: null, user: { login: marker + "[bot]" } }),
    0, /body check skipped/);
  await checkEvent("check-pr-body.mjs", event({ body: null, user: { login: marker } }),
    1, /must link an issue/);
});

test("each event CLI fails with a fixed diagnostic for malformed JSON or a missing PR", async () => {
  for (const script of ["check-title.mjs", "check-breaking.mjs", "check-pr-body.mjs"]) {
    await checkEvent(script, '{"pull_request": ' + marker, 2, /Cannot read the pull request event/);
    await checkEvent(script, event(null), 2, /Cannot read the pull request event/);
  }
});

test("validate keeps pull request text out of step environment variables", async () => {
  const { readFile } = await import("./helpers.mjs");
  const workflow = await readFile(new URL("../.github/workflows/validate.yml", import.meta.url), "utf8");
  assert.doesNotMatch(workflow, /github\.event\.pull_request\.(?:title|body|user\.login)\b/);
});

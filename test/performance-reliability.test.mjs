import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");
const flat = (text) => text.replace(/\s+/g, " ");
const RAW = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";

// One key phrase for each acceptance item of issue #387, by page.
const keyPhrases = {
  "coding/performance.md": [
    "Measure as [performance testing](../tdd/performance-testing.md) says.",
    "Profile or trace to find the actual bottleneck.",
    "If you cannot measure a useful baseline, do not claim a speedup.",
    "Set budgets and regression thresholds as [regression criteria](../tdd/performance-testing.md#regression-criteria) says.",
    "Do not trade data integrity or security for speed without an approved requirement.",
    "This page does not require profiling for a change without a performance goal.",
  ],
  "coding/reliability.md": [
    "Propagate cancellation and deadlines across layers.",
    "Retry only errors that are transient and safe to repeat.",
    "Bound retry count, elapsed time, and resource use.",
    "Require idempotency or a deduplication contract before retrying writes.",
    "Fail safely. Do not hide retries that ran out.",
    "## Failure design",
    "This page does not require retries or a circuit breaker for code without such a call.",
  ],
  "coding/observability.md": [
    "Add telemetry only when it answers a named operational question.",
    "Keep label cardinality bounded. Do not label by raw user input, request ID, or secret.",
    "Create spans only at the boundaries that the question needs, not at every function.",
    "Record latency and status without capturing sensitive payloads.",
    "This page does not require metrics or traces for every change.",
  ],
  "coding/networking.md": [
    "Do not assume one read receives a complete message or one write sends it all.",
    "Validate length fields before allocating or decoding.",
    "Bound input length, parsing work, queue capacity, and time spent waiting.",
    "It does not define what a public interface promises.",
  ],
  "coding/concurrency-practices.md": [
    "Give shared state an owner as [concurrency](../architecture/concurrency.md#rules) says.",
    "Do not hold locks across callbacks, blocking I/O or awaited work.",
    "Use stress tests as supporting evidence, not proof of race freedom.",
    "This page does not require locks or parallel work for code without shared state.",
  ],
  "coding/reproducible-builds.md": [
    "- Pin versions and commit lockfiles as [dependencies](dependencies.md) says.",
    "Keep secrets out of build output and dependency metadata.",
    "Validate caches by input identity. A cache hit is not a correctness check.",
  ],
};

for (const [path, phrases] of Object.entries(keyPhrases)) {
  test(`${path} keeps each key rule`, async () => {
    const text = flat(await read(path));
    for (const phrase of phrases) assert.ok(text.includes(phrase), `${path}: ${phrase}`);
  });
}

test("observability forbids each private or unbounded label", async () => {
  const text = flat(await read("coding/observability.md"));
  const labelRules = text.match(/[^.]*\blabel by\b[^.]*\./gi) ?? [];
  assert.ok(labelRules.length > 0, "a label rule exists");
  for (const rule of labelRules) {
    assert.match(rule, /^\s*Do not label by\b/, `label rule must forbid: ${rule.trim()}`);
  }
  for (const field of ["raw user input", "request ID", "secret"]) {
    assert.ok(labelRules.some((rule) => rule.includes(field)), field);
  }
});

test("profile-performance claims no speedup and weakens no gate", async () => {
  const skill = await read("skills/profile-performance/SKILL.md");
  const boundaries = skill.split("## Boundaries")[1].split("\n## ")[0].split("\n");
  for (const line of [
    "- No speedup claim without comparable before and after measurements.",
    "- Do not weaken tests, validation, safety, or resource limits.",
    "- Keep measurements and test input free of secrets and personal data.",
  ]) assert.ok(boundaries.includes(line), line);
  assert.ok(skill.includes("Report each check that did not run as NOT RUN."));
  assert.ok(skill.includes(`6. Implement through [tdd-loop](${RAW}skills/tdd-loop/SKILL.md) when behavior changes.`));
});

test("triage routes each new page to its own owner", async () => {
  const lines = (await read("skills/triage/SKILL.md")).split("\n");
  for (const route of [
    `- Performance question, resource regression, or optimization: [profile-performance](${RAW}skills/profile-performance/SKILL.md)`,
    `- Timeouts, retries or overload: [reliability](${RAW}coding/reliability.md)`,
    `- Network protocol code: [networking](${RAW}coding/networking.md)`,
    `- Shared mutable state or parallel work: [concurrency practices](${RAW}coding/concurrency-practices.md)`,
    `- Metrics or traces: [observability](${RAW}coding/observability.md)`,
  ]) assert.ok(lines.includes(route), route);
  const indexRoutes = lines.filter((line) => /reliab|retr|overload|network|concurren|metric|trace/i.test(line)
    && line.includes(`(${RAW}coding/index.md)`));
  assert.deepEqual(indexRoutes, [], "no reliability route to the coding index");
});

// The eval suite of one skill, from evals/skill-cases.json.
async function evalSuite(skill) {
  const suite = JSON.parse(await read("evals/skill-cases.json"));
  const entry = suite.skills.find((item) => item.skill === skill);
  assert.ok(entry, `${skill} has an eval suite`);
  const positives = entry.queries.filter((q) => q.should_trigger);
  const negatives = entry.queries.filter((q) => !q.should_trigger);
  assert.ok(positives.length >= 2 && negatives.length >= 2, `${skill}: two positive and two negative cases`);
  return { positives, negatives };
}

// The positive case whose assertions match each pattern. Each path needs its own case.
function caseFor(positives, ...patterns) {
  const found = positives.find((q) => patterns.every((p) => p.test(q.assertions.join("\n"))));
  assert.ok(found, `a positive case asserts ${patterns.join(" and ")}`);
  return found.id;
}

test("profile-performance eval cases cover a baseline, an isolated change and the proof", async () => {
  const { positives } = await evalSuite("profile-performance");
  const ids = [
    caseFor(positives, /Records a baseline/, /Claims no speedup without before and after measurements under matching conditions/),
    caseFor(positives, /Changes one factor in each experiment/, /Does not weaken tests, validation, safety or resource limits/),
    caseFor(positives, /distributions of repeated before and after runs/, /NOT RUN/),
  ];
  assert.equal(new Set(ids).size, 3, "each path has its own case");
});

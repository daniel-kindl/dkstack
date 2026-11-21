import assert from "node:assert/strict";
import { readFile } from "./helpers.mjs";
import { test } from "node:test";

const raw = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1";

async function document(path) {
  const text = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
  return text.replaceAll(/\s+/g, " ");
}

function section(text, heading) {
  const start = text.indexOf(`${heading} `);
  assert.notEqual(start, -1, `missing section ${heading}`);
  const level = heading.split(" ")[0];
  const rest = text.slice(start + heading.length);
  const next = rest.search(new RegExp(` #{2,${level.length}} `));
  return next === -1 ? rest : rest.slice(0, next);
}

function line(text, prefix) {
  const start = text.indexOf(prefix);
  assert.notEqual(start, -1, `missing line ${prefix}`);
  const rest = text.slice(start);
  const next = rest.slice(prefix.length).search(/ (- |\d+\. )/);
  return next === -1 ? rest : rest.slice(0, prefix.length + next);
}

test("the entry points link the UI pages and both UI skills", async () => {
  const [agents, readme, index, triage] = await Promise.all([
    document("AGENTS.md"),
    document("README.md"),
    document("skills/index.md"),
    document("skills/triage/SKILL.md"),
  ]);
  assert.match(agents, /\(ui\/index\.md\)/);
  assert.match(readme, /\(ui\/index\.md\)/);
  assert.match(index, /\[ui-design\]\(ui-design\/SKILL\.md\)/);
  assert.match(index, /\[ui-review\]\(ui-review\/SKILL\.md\)/);
  assert.ok(triage.includes(`New or changed rendered UI: [ui-design](${raw}/skills/ui-design/SKILL.md).`));
  assert.ok(triage.includes(`Review of a rendered UI: [ui-review](${raw}/skills/ui-review/SKILL.md).`));
});

test("triage and the UI index skip the UI work for backend-only changes", async () => {
  const sentence = "Backend-only changes do not use the UI pages or the UI skills.";
  const triage = await document("skills/triage/SKILL.md");
  const index = await document("ui/index.md");
  assert.ok(line(section(triage, "## Section map"), "- Rendered UI work:").includes(sentence));
  assert.ok(section(index, "## Boundaries").includes(sentence));
});

test("plan-work step 3 plans the UI checks with no new step or plan field", async () => {
  const plan = await document("skills/plan-work/SKILL.md");
  const step3 = line(section(plan, "## Steps"), "3. ");
  assert.ok(step3.includes(`For an increment that changes a rendered UI, plan the checks in the [minimum evidence](${raw}/ui/visual-verification.md#minimum-evidence). Write them in Verification.`));
  assert.doesNotMatch(plan, /^UI:|\sUI: /m);
});

test("visual verification has four results and NOT RUN is never PASS", async () => {
  const page = await document("ui/visual-verification.md");
  const results = section(page, "## Results");
  for (const status of ["PASS", "FAIL", "NOT RUN", "NOT APPLICABLE"]) {
    assert.ok(results.includes(`- ${status}: `), `missing ${status} result`);
  }
  assert.ok(line(results, "- NOT RUN: ").includes("NOT RUN is never PASS."));
  assert.ok(line(results, "- PASS: ").includes("No check found a Blocking, High or Medium finding on a changed surface."));
  assert.ok(line(results, "- FAIL: ").includes("one or more Blocking, High or Medium findings on a changed surface."));
  assert.ok(results.includes("If you cannot, write NOT RUN and the reason. Do not invent screenshots."));
  assert.ok(section(page, "## Minimum evidence").includes("One screenshot is never PASS."));
});

test("UI findings use the code-review severities and no P scale", async () => {
  const review = await document("skills/review-standards/SKILL.md");
  const uiLine = line(section(review, "## Checklist"), "- Rendered UI:");
  assert.ok(uiLine.includes(`[ui-review](${raw}/skills/ui-review/SKILL.md)`));
  assert.ok(uiLine.includes("A failed WCAG 2.2 A or AA criterion on a changed surface is High."));
  assert.ok(uiLine.includes("A missing or wrong `Visual verification:` line in the PR body is Medium."));
  const pages = ["ui/index.md", "ui/visual-verification.md", "skills/ui-review/SKILL.md", "skills/ui-design/SKILL.md"];
  for (const path of pages) {
    assert.doesNotMatch(await document(path), /\bP[0-2]\b/, `${path} has a P severity`);
  }
});

test("ui-review is read-only and reports through code-review", async () => {
  const skill = await document("skills/ui-review/SKILL.md");
  assert.ok(section(skill, "## Boundaries").includes("Read-only by default. Do not change files, post approvals or merge unless the existing review workflow allows it."));
  const steps = section(skill, "## Steps");
  assert.ok(steps.includes(`[code-review](${raw}/skills/code-review/SKILL.md#output)`));
  assert.ok(steps.includes(`(${raw}/skills/code-review/SKILL.md#severity)`));
  assert.ok(steps.includes(`(${raw}/ui/visual-verification.md)`));
});

test("the UI defaults fill only the areas that the project's design system does not cover", async () => {
  const systems = await document("ui/design-systems.md");
  // IRIS-5 and IRIS-7 in #154: the project's system wins over the Defaults
  // sections only. A default fills an area that the system does not cover.
  const defaults = section(systems, "## Defaults").replace(/\s+/g, " ");
  assert.ok(defaults.includes("The project's system wins over the Defaults sections only."));
  assert.ok(defaults.includes("when the project's system does not cover that area"));
  assert.ok(defaults.includes('"(dkstack rule)"'));
  assert.ok(defaults.includes("[Precedence](../AGENTS.md#precedence)"));
  assert.doesNotMatch(defaults, /always wins/);
  const pages = {
    "ui/typography.md": "## Defaults",
    "ui/colors-and-themes.md": "## Defaults",
    "ui/layout-and-spacing.md": "## Defaults",
    "ui/motion.md": "## Defaults",
    "ui/responsive-design.md": "## Web defaults",
    "ui/performance.md": "## Web defaults",
    "ui/content-and-localization.md": "## Microcopy defaults",
  };
  for (const [path, heading] of Object.entries(pages)) {
    const defaults = section(await document(path), heading);
    assert.match(defaults, /only when the project has (no |none\b)/, `${path} defaults have no condition`);
    assert.match(defaults, /\[design systems\]\(design-systems\.md\)/, `${path} defaults do not link design systems`);
  }
});

test("accessibility owns the thresholds and the testing page links it", async () => {
  const owner = await document("ui/accessibility.md");
  const testing = section(await document("tdd/ui-testing.md"), "## Accessibility checks");
  const scope = section(owner, "## Scope");
  assert.ok(scope.includes("WCAG 2.2 level AA criteria are the test baseline on every platform. Measure them in the units of the platform."));
  assert.ok(scope.includes("Native UI never claims formal WCAG conformance."));
  assert.match(owner, /4\.5:1/);
  assert.match(testing, /\(\.\.\/ui\/accessibility\.md\)/);
  assert.doesNotMatch(testing, /4\.5:1|24 by 24/);
});

test("sign-in and access errors follow the security rules", async () => {
  const errors = section(await document("ui/interactions.md"), "## Empty, error and success");
  assert.ok(errors.includes("Sign-in and access errors follow [security](../coding/security.md#rules)."));
  assert.ok(errors.includes("For client logs, follow [logging](../coding/logging.md)."));
});

test("the minimum evidence list keeps each required item", async () => {
  const evidence = section(await document("ui/visual-verification.md"), "## Minimum evidence");
  const items = [
    "- Screenshots at 320 CSS px wide and at one wide width.",
    "- Screenshots in each supported theme.",
    "- Screenshots of each changed state,",
    "- A keyboard walk-through: focus order, visible focus, focus not hidden and no keyboard trap.",
    "- Text at 200% and the text spacing values.",
    "- Reduced motion, when the change has motion.",
    "- The automated checker output: the tool, its version, the number of violations and its limits.",
    "- The measured contrast ratio of each new or changed color pair.",
  ];
  for (const item of items) {
    assert.ok(evidence.includes(item), `missing evidence item ${item}`);
  }
});

test("the web pointer target size and its spacing exception follow 2.5.8", async () => {
  const targets = section(await document("ui/accessibility.md"), "## Targets");
  assert.ok(targets.includes("On the web, each pointer target is at least 24 by 24 CSS px (2.5.8)."));
  assert.ok(targets.includes("A 24 CSS px circle centered on the target does not overlap another target or the circle of another target."));
});

test("the UI shows no invented data", async () => {
  const content = await document("ui/content-and-localization.md");
  assert.ok(content.includes("- Check empty and partial content. Never invent values to make the screen look complete."));
  const interactions = await document("ui/interactions.md");
  assert.ok(interactions.includes("For invented data, see [content](content-and-localization.md)."));
});

test("code-review rates a missed dkstack accessibility rule as Medium", async () => {
  const review = await document("skills/review-standards/SKILL.md");
  const uiLine = line(section(review, "## Checklist"), "- Rendered UI:");
  assert.ok(uiLine.includes("A missed dkstack accessibility rule that is not a WCAG criterion is Medium."));
});

test("accessibility rules that WCAG 2.2 AA does not require carry the dkstack marker", async () => {
  const owner = await document("ui/accessibility.md");
  const forms = await document("ui/forms.md");
  assert.ok(owner.includes("\"(dkstack rule)\" marks a rule that WCAG 2.2 AA does not require."));
  const marked = [
    [owner, "an outline of at least 2 px and an offset (dkstack rule)."],
    [owner, "at least 44 by 44 CSS px for primary touch controls (dkstack rule)."],
    [forms, "Do not use a cognitive test in sign-in, also not object recognition or personal content (dkstack rule)."],
    [owner, "at least 48 by 48 dp (Material Design and Android accessibility guidance) (dkstack rule)."],
    [owner, "at least 44 by 44 pt (Apple Human Interface Guidelines) (dkstack rule)."],
    [owner, "the largest system text size (dkstack rule)."],
    [owner, "Use one h1 (dkstack rule). Use headings in order (dkstack rule). Use landmarks (dkstack rule)."],
    [owner, "use a skip link as the first focusable element (dkstack rule)."],
    [forms, "to show that the form is not valid (dkstack rule)."],
    [forms, "Validate all fields on submit (dkstack rule)."],
    [forms, "not only an asterisk (dkstack rule)."],
  ];
  for (const [text, rule] of marked) {
    assert.ok(text.includes(rule), `missing marker: ${rule}`);
  }
});

test("FAIL wins over NOT RUN when check results combine", async () => {
  const results = section(await document("ui/visual-verification.md"), "## Results");
  assert.ok(results.includes("When the check results combine, FAIL wins over NOT RUN."));
});

// IRIS-2, IRIS-9, IRIS-13 and IRIS-16 (#154). Key phrases pin each rule (D7).
test("the accessibility page covers each WCAG 2.2 A and AA criterion", async () => {
  const owner = await document("ui/accessibility.md");
  const scope = section(owner, "## Scope");
  assert.ok(scope.includes("This page does not list each WCAG 2.2 A and AA criterion. Each one applies"));
  assert.ok(scope.includes("(https://www.w3.org/WAI/WCAG22/quickref/)"));
  for (const criterion of ["(1.3.4)", "(2.5.1)", "(2.5.2)", "(2.5.4)"]) {
    assert.ok(owner.includes(criterion), `missing ${criterion}`);
  }
  assert.ok(owner.includes("A primary touch control is the main action of a screen or an item of the main navigation."));
});

test("forms state the AA rules of 3.3.8 and 3.3.4", async () => {
  const forms = await document("ui/forms.md");
  assert.ok(forms.includes("must also give a help or an alternative. Paste and password managers are a help (3.3.8)."));
  const submit = line(forms, "- For a submit that makes a legal commitment");
  for (const phrase of ["a financial transaction", "changes or deletes user data", "sends test responses", "(3.3.4)"]) {
    assert.ok(submit.includes(phrase), `missing: ${phrase}`);
  }
});

// IRIS-15 and IRIS-11 in #154: an automated test can assert what causes an
// announcement. Only the manual pass hears the announcement.
test("the UI test rules assert what causes an announcement and the manual pass confirms it", async () => {
  const checks = section(await document("tdd/ui-testing.md"), "## Accessibility checks");
  for (const phrase of ["a live region", "an automation property", "the announcement API of the platform", "`performAccessibilityAudit`"]) {
    assert.ok(checks.includes(phrase), phrase);
  }
  assert.ok(checks.includes("confirms each announcement"));
  assert.ok(checks.includes("(../ui/visual-verification.md#minimum-evidence)"));
  assert.doesNotMatch(checks, /Check that a screen reader announces each error/);
});

// IRIS-11 and IRIS-19 in #154: native UI has examples for the web-only rules,
// and native apps do not copy web breakpoints.
test("the accessibility page gives native examples for each web-only rule", async () => {
  const page = await readFile(new URL("../ui/accessibility.md", import.meta.url), "utf8");
  const table = page.slice(page.indexOf("## Native equivalents\n"), page.indexOf("\nReferences:"));
  assert.match(table, /examples, not requirements/i);
  const header = table.split("\n").find((l) => l.startsWith("| Need |"));
  for (const platform of ["Web", "Avalonia", ".NET MAUI", "Android", "iOS"]) assert.ok(header.includes(platform), platform);
  for (const need of ["Live announcement", "Accessible name", "Heading", "Language", "Theme"]) {
    assert.ok(table.split("\n").some((l) => l.startsWith(`| ${need} |`)), need);
  }
});

test("native apps use the platform's adaptive layout tools, not web breakpoints", async () => {
  const page = (await document("ui/responsive-design.md")).replace(/\s+/g, " ");
  assert.ok(page.includes("Do not copy web breakpoint values into native apps. Use the platform's adaptive layout tools and window size classes."));
});

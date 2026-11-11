#!/usr/bin/env node
// Prepare a dkstack v1 release. The Release workflow runs this script.
// Usage, in the root of a git checkout:
//   node scripts/release.mjs prepare --bump auto|patch|minor --date YYYY-MM-DD
//     Find the latest v1.x.y tag and the commits since it. Work out the next
//     version, write it to package.json and move the [Unreleased] notes in
//     CHANGELOG.md to a new version section. Print "version=" and "previous=".
//   node scripts/release.mjs guard --v1 <ref>
//     Fail if the last release is not complete: the package.json version has
//     no tag, or <ref> does not contain the latest tag.
//   node scripts/release.mjs notes <version>
//     Print the CHANGELOG.md section of <version>, for the GitHub release.
// A breaking change fails: a major release needs Daniel. Never make v2 here.

import { appendFile, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const HEADER = /^([a-z]+)(?:\(([^)]*)\))?(!?):\s*(.*)$/;
const BREAKING_FOOTER = /^BREAKING[ -]CHANGE:/m;
const TAG = /^v1\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const RELEASE_COMMIT = /^chore\(release\):/;
const BUMPS = ["auto", "patch", "minor"];
const HEADINGS = [["feat", "Added"], ["other", "Changed"], ["fix", "Fixed"]];
const REPO = "https://github.com/daniel-kindl/dkstack";

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Return { type, scope, description, breaking }, or null for a title that is not conventional.
export function parseCommit({ subject, body = "" }) {
  const match = HEADER.exec(subject);
  if (!match) return null;
  const [, type, scope, bang, description] = match;
  return { type, scope: scope ?? null, description, breaking: bang === "!" || BREAKING_FOOTER.test(body) };
}

// Return the highest v1.x.y tag by number, or null.
export function latestTag(tags) {
  let best = null;
  for (const tag of tags) {
    const m = TAG.exec(tag);
    if (!m) continue;
    const n = [Number(m[1]), Number(m[2])];
    if (best === null || n[0] > best.n[0] || (n[0] === best.n[0] && n[1] > best.n[1])) best = { tag, n };
  }
  return best && best.tag;
}

const counted = (commits) => commits.filter((c) => !RELEASE_COMMIT.test(c.subject));

// Return the next version after `current` for the commits since its tag.
export function nextVersion(current, commits, bump = "auto") {
  if (!BUMPS.includes(bump)) throw new Error(`the bump must be auto, patch or minor, not "${bump}"`);
  const list = counted(commits);
  if (list.length === 0) throw new Error(`there are no commits since v${current}. There is nothing to release.`);
  let need = "patch";
  for (const commit of list) {
    const parsed = parseCommit(commit);
    if (parsed?.breaking) {
      throw new Error(`breaking change in "${commit.subject}". A major release needs Daniel. ` +
        "This workflow does not release v2.");
    }
    if (parsed?.type === "feat") need = "minor";
  }
  if (bump === "patch" && need === "minor") {
    throw new Error(`the bump "patch" is lower than the commits need ("minor")`);
  }
  const level = bump === "auto" ? need : bump;
  const [major, minor, patch] = current.split(".").map(Number);
  return level === "minor" ? `${major}.${minor + 1}.0` : `${major}.${minor}.${patch + 1}`;
}

// Return Keep a Changelog entries from the commit titles.
function generatedEntries(commits) {
  const groups = new Map(HEADINGS.map(([key]) => [key, []]));
  for (const commit of counted(commits)) {
    const parsed = parseCommit(commit);
    const key = parsed && (parsed.type === "feat" || parsed.type === "fix") ? parsed.type : "other";
    let text = commit.subject;
    if (parsed) {
      const prefix = parsed.type === "feat" || parsed.type === "fix" ? parsed.scope : parsed.type;
      text = prefix ? `${prefix}: ${parsed.description}` : parsed.description;
    }
    groups.get(key).push(`- ${text}`);
  }
  const out = [];
  for (const [key, heading] of HEADINGS) {
    const items = groups.get(key);
    if (items.length > 0) out.push(`### ${heading}`, "", ...items, "");
  }
  return out;
}

// Move the [Unreleased] notes into "## [version] - date" and update the compare links.
export function releaseChangelog(text, { version, previous, date, commits }) {
  const lines = text.split("\n");
  const start = lines.indexOf("## [Unreleased]");
  if (start === -1) throw new Error('CHANGELOG.md has no "## [Unreleased]" section');
  if (new RegExp(`^## \\[${escape(version)}\\](?:\\s|$)`, "m").test(text)) {
    throw new Error(`CHANGELOG.md already has a "## [${version}]" section`);
  }
  let end = lines.findIndex((line, i) => i > start && /^## /.test(line));
  if (end === -1) end = lines.findIndex((line, i) => i > start && /^\[[^\]]+\]: /.test(line));
  if (end === -1) end = lines.length;
  let notes = lines.slice(start + 1, end);
  while (notes.length > 0 && notes[0].trim() === "") notes.shift();
  while (notes.length > 0 && notes[notes.length - 1].trim() === "") notes.pop();
  notes = notes.length > 0 ? [...notes, ""] : generatedEntries(commits);
  const out = [...lines.slice(0, start + 1), "", `## [${version}] - ${date}`, "", ...notes, ...lines.slice(end)];
  const unreleased = out.findIndex((line) => line.startsWith("[Unreleased]: "));
  if (unreleased !== -1) {
    out.splice(unreleased, 1,
      `[Unreleased]: ${REPO}/compare/v${version}...HEAD`,
      `[${version}]: ${REPO}/compare/v${previous}...v${version}`);
  }
  return out.join("\n");
}

// Return the body of the "## [version]" section, without its heading.
export function releaseNotes(text, version) {
  const lines = text.split("\n");
  const start = lines.findIndex((line) => new RegExp(`^## \\[${escape(version)}\\](?:\\s|$)`).test(line));
  if (start === -1) throw new Error(`CHANGELOG.md has no "## [${version}]" section`);
  let end = lines.findIndex((line, i) => i > start && (/^## /.test(line) || /^\[[^\]]+\]: /.test(line)));
  if (end === -1) end = lines.length;
  const body = lines.slice(start + 1, end);
  while (body.length > 0 && body[0].trim() === "") body.shift();
  while (body.length > 0 && body[body.length - 1].trim() === "") body.pop();
  return `${body.join("\n")}\n`;
}

// Change only the "version" value. Keep the rest of package.json as it is.
export function setPackageVersion(text, version) {
  const pattern = /^(\s*"version"\s*:\s*)"[^"]*"/m;
  if (!pattern.test(text)) throw new Error("package.json: the version field is missing");
  return text.replace(pattern, `$1"${version}"`);
}

function git(...args) {
  const r = spawnSync("git", args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} failed: ${r.stderr.trim()}`);
  return r.stdout;
}

const isAncestor = (a, b) => spawnSync("git", ["merge-base", "--is-ancestor", a, b]).status === 0;

function option(args, name) {
  const i = args.indexOf(name);
  if (i === -1 || i + 1 >= args.length) throw new Error(`the option ${name} is missing`);
  return args[i + 1];
}

function commitsSince(tag) {
  const out = git("log", "--format=%s%x1f%b%x1e", `${tag}..HEAD`);
  return out.split("\x1e").map((r) => r.replace(/^\n/, "")).filter((r) => r !== "")
    .map((r) => { const [subject, body = ""] = r.split("\x1f"); return { subject, body }; });
}

function findLatestTag() {
  const tag = latestTag(git("tag", "--list", "v1.*").split("\n"));
  if (!tag) throw new Error("there is no v1.x.y tag");
  return tag;
}

async function prepare(args) {
  const bump = option(args, "--bump");
  const date = option(args, "--date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error(`the date must be YYYY-MM-DD, not "${date}"`);
  const tag = findLatestTag();
  const previous = tag.slice(1);
  const commits = commitsSince(tag);
  const version = nextVersion(previous, commits, bump);
  const changelog = releaseChangelog(await readFile("CHANGELOG.md", "utf8"), { version, previous, date, commits });
  const pkg = setPackageVersion(await readFile("package.json", "utf8"), version);
  await writeFile("CHANGELOG.md", changelog);
  await writeFile("package.json", pkg);
  const out = `version=${version}\nprevious=${previous}\n`;
  process.stdout.write(out);
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, out);
}

async function guard(args) {
  const v1 = option(args, "--v1");
  const { version } = JSON.parse(await readFile("package.json", "utf8"));
  if (git("tag", "--list", `v${version}`).trim() === "") {
    throw new Error(`the package.json version ${version} has no tag v${version}. ` +
      "An earlier release is not complete. Finish it as versioning/index.md says.");
  }
  const tag = findLatestTag();
  if (!isAncestor(`${tag}^{commit}`, v1)) {
    throw new Error(`${v1} does not contain ${tag}. An earlier release is not complete. ` +
      "Finish it as versioning/index.md says.");
  }
  console.log(`The last release ${tag} is complete.`);
}

async function main(argv) {
  const [command, ...args] = argv;
  if (command === "prepare") return prepare(args);
  if (command === "guard") return guard(args);
  if (command === "notes") {
    if (!args[0]) throw new Error("give the version, as in: notes 1.4.0");
    process.stdout.write(releaseNotes(await readFile("CHANGELOG.md", "utf8"), args[0]));
    return;
  }
  throw new Error("use one of: prepare, guard, notes");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    console.error(`release: ${error.message}`);
    process.exitCode = 1;
  }
}

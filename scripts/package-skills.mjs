#!/usr/bin/env node
// Build self-contained skill folders by resolving DKSTACK link dependencies.
import { copyFile, lstat, mkdtemp, mkdir, readFile, readdir, realpath, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, posix, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { linksIn } from "./check-links.mjs";
const LINKS = /https:\/\/raw\.githubusercontent\.com\/daniel-kindl\/dkstack\/v1\/([^\s)\]\x60"'<>]+)/g;
const CODE_FENCE = /(\x60{3}[^]*?\x60{3}|~{3}[^]*?~{3})/g;
const HTML = /<(?:a|img|source)\b[^>]*\b(?:href|src|srcset)=["']([^"']+)["']/gi;
const MAX_DEPS = 1000;
const inside = (root, path) => { const rel = relative(root, path); return rel && rel !== ".." && !rel.startsWith(".." + sep) && !isAbsolute(rel); };
function pathPart(value) {
  const raw = value.split(/[?#]/)[0];
  let decoded;
  try { decoded = decodeURIComponent(raw); } catch { throw Error("Invalid encoded link: " + value); }
  if (!decoded || decoded.startsWith("/") || decoded.includes("\\") || decoded.includes("\0") || decoded.split("/").includes("..")) throw Error("Unsafe link: " + value);
  return decoded;
}
const RAW_PREFIX = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";
function activeTargets(text) {
  const active = new Set([...linksIn(text)].map(x => x.target));
  const clean = text.replace(CODE_FENCE, "").replace(/`[^`\n]*`/g, "");
  for (const line of clean.split(/\r?\n/)) {
    if (!/^ {0,3}<(?:img|source)\b/i.test(line)) continue;
    for (const match of line.matchAll(HTML)) active.add(match[1]);
  }
  return active;
}
function pathsIn(text, origin) {
  const found = new Set();
  for (const value of activeTargets(text)) {
    if (value.startsWith(RAW_PREFIX)) { found.add(pathPart(value.slice(RAW_PREFIX.length))); continue; }
    if (!value || value.startsWith("#") || value.startsWith("/") || /^[a-z][a-z0-9+.-]*:/i.test(value)) continue;
    if (value.includes("{") || value.includes("}")) continue;
    const part = value.split(/[?#]/)[0];
    if (!part) continue;
    const target = posix.normalize(posix.join(posix.dirname(origin), decodeURIComponent(part)));
    if (target === ".." || target.startsWith("../") || target.startsWith("/") || target.includes("\0")) throw Error("Unsafe relative link: " + value);
    found.add(target);
  }
  return found;
}
async function file(root, path) {
  const full = resolve(root, path);
  if (!inside(root, full)) throw Error("Outside source: " + path);
  const entry = await lstat(full);
  if (!entry.isFile() || entry.isSymbolicLink() || !inside(root, await realpath(full))) throw Error("Not a safe file: " + path);
  return full;
}
async function copySkill(source, target, pending) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw Error("Skill has a symlink: " + entry.name);
    const from = join(source, entry.name);
    const to = join(target, entry.name);
    if (entry.isDirectory()) { await mkdir(to, { recursive:true }); await copySkill(from, to, pending); }
    else if (entry.isFile()) { await copyFile(from, to); if (to.endsWith(".md")) pending.push(to); }
    else throw Error("Unsupported skill entry: " + entry.name);
  }
}
async function build(root, name, target) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) throw Error("Invalid skill: " + name);
  const source = resolve(root, "skills", name);
  const entry = await lstat(source);
  if (!entry.isDirectory() || entry.isSymbolicLink()) throw Error("Invalid directory: " + name);
  await file(root, "skills/" + name + "/SKILL.md");
  const pending = [];
  await copySkill(source, target, pending);
  const dependencies = new Set();
  const queue = new Set();
  const rewrite = (text, from) => { const allowed = activeTargets(text); return text.replace(LINKS, (full, raw) => {
    if (!allowed.has(full)) return full;
    const dep = pathPart(raw);
    queue.add(dep);
    const suffix = raw.slice(raw.split(/[?#]/)[0].length);
    return relative(dirname(from), join(target, "references", "dkstack", dep)).split(sep).join("/") + suffix;
  }); };
  for (const original of pending) {
    const text = await readFile(original, "utf8");
    const rel = relative(target, original);
    const origin = ["skills", name, rel.split(sep).join("/")].join("/");
    for (const path of pathsIn(text, origin)) queue.add(path);
    await writeFile(original, rewrite(text, original));
  }
  while (queue.size) {
    const [path] = queue;
    queue.delete(path);
    if (dependencies.has(path)) continue;
    if (dependencies.size >= MAX_DEPS) throw Error("Too many dependencies");
    dependencies.add(path);
    const original = await file(root, path);
    const dest = join(target, "references", "dkstack", path);
    await mkdir(dirname(dest), { recursive:true });
    if (path.endsWith(".md")) {
      const text = await readFile(original, "utf8");
      for (const next of pathsIn(text, path)) queue.add(next);
      await writeFile(dest, rewrite(text, dest));
    } else await copyFile(original, dest);
  }
  return { name, dependencies: dependencies.size };
}
const MARKER = ".dkstack-bundle";
const RELEASED = /^(?:(?:origin\/)?v1|v\d+\.\d+\.\d+)$/;
// Read the commit and the refs of HEAD. A bundle from another ref has rules that are not released.
export async function sourceOf(root) {
  const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  try {
    if (await realpath(git(["rev-parse", "--show-toplevel"])) !== await realpath(root)) throw Error("not the repository root");
    const commit = git(["rev-parse", "HEAD"]);
    const refs = git(["for-each-ref", "--points-at", "HEAD", "--format=%(refname:short)", "refs/heads", "refs/remotes", "refs/tags"]).split("\n").filter(Boolean).sort();
    return { commit, refs, released: refs.some(ref => RELEASED.test(ref)) };
  } catch {
    return { commit: "unknown", refs: [], released: false };
  }
}
// Return true for a folder that an earlier run made. Refuse any other existing path.
async function earlierBundle(output) {
  let entry;
  try { entry = await lstat(output); } catch(e) { if (e.code==="ENOENT") return false; throw e; }
  const marker = entry.isDirectory() && !entry.isSymbolicLink() ? await lstat(join(output,MARKER)).catch(()=>null) : null;
  if (!marker || !marker.isFile()) throw Error("Output already exists: " + output);
  return true;
}
export async function packageSkills(root, output, requested = [], source) {
  root = await realpath(root);
  source ??= await sourceOf(root);
  output = resolve(output);
  if (!inside(root, output)) throw Error("Output must be inside DKSTACK, not at its root");
  const names = requested.length ? requested : (await readdir(join(root,"skills"),{withFileTypes:true})).filter(x=>x.isDirectory()).map(x=>x.name).sort();
  if (!names.length) throw Error("No skills selected");
  await mkdir(dirname(output),{recursive:true});
  const parent = await realpath(dirname(output));
  if (!inside(root, parent)) throw Error("Output parent must stay inside DKSTACK");
  const stage = await mkdtemp(join(parent,".dkstack-stage-"));
  try {
    const result = [];
    for (const name of names) {
      const target = join(stage,name);
      await mkdir(target);
      result.push(await build(root,name,target));
      await writeFile(join(target,"dkstack-source.json"),JSON.stringify(source,null,2)+"\n");
    }
    await writeFile(join(stage,MARKER),"Made by scripts/package-skills.mjs. A new run replaces this folder.\n");
    const old=await earlierBundle(output);
    if (old) { const aside=await mkdtemp(join(parent,".dkstack-old-")); await rename(output,join(aside,"bundle")); await rename(stage,output); await rm(aside,{recursive:true,force:true}); }
    else await rename(stage,output);
    return result;
  } catch(e) { await rm(stage,{recursive:true,force:true}); throw e; }
}
async function main(args) {
  const pos=args.indexOf("--out");
  if (pos<0 || !args[pos+1]) throw Error("Usage: package-skills --out <directory> [skill ...]");
  const out=args.splice(pos,2)[1];
  if (args.some(x=>x.startsWith("-"))) throw Error("Unknown option");
  const root=resolve(".");
  const source=await sourceOf(root);
  if (!source.released) console.error("WARNING: the source is not v1 or a vX.Y.Z tag. The bundle can have rules that are not released. Source commit: " + source.commit);
  const result=await packageSkills(root,out,args,source);
  for (const item of result) console.log(item.name + ": " + item.dependencies + " dependencies");
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1;});

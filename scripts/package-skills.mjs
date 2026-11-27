#!/usr/bin/env node
// Build self-contained skill folders by resolving DKSTACK link dependencies.
import { copyFile, lstat, mkdtemp, mkdir, readFile, readdir, realpath, rename, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, posix, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
const LINKS = /https:\/\/raw\.githubusercontent\.com\/daniel-kindl\/dkstack\/v1\/([^\s)\]\x60"'<>]+)/g;
const MARKDOWN = /!?\[[^\]]*\]\(\s*<?([^\s)>]+)>?(?:\s+"[^"]*")?\s*\)/g;
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
function pathsIn(text, origin) {
  const found = new Set();
  const prose = text.replace(CODE_FENCE, "");
  for (const match of prose.matchAll(LINKS)) found.add(pathPart(match[1]));
  for (const pattern of [MARKDOWN, HTML]) for (const match of prose.matchAll(pattern)) {
    const value = match[1];
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
  const rewrite = (text, from) => text.split(CODE_FENCE).map((part, i) => i % 2 ? part : part.replace(LINKS, (_match, raw) => {
    const dep = pathPart(raw);
    queue.add(dep);
    const suffix = raw.slice(raw.split(/[?#]/)[0].length);
    return relative(dirname(from), join(target, "references", "dkstack", dep)).split(sep).join("/") + suffix;
  })).join("");
  for (const original of pending) {
    const text = await readFile(original, "utf8");
    const rel = relative(target, original);
    const origin = join("skills", name, rel);
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
export async function packageSkills(root, output, requested = []) {
  root = await realpath(root);
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
    for (const name of names) { const target = join(stage,name); await mkdir(target); result.push(await build(root,name,target)); }
    try { await lstat(output); throw Error("Output already exists: " + output); } catch(e) { if(e.code!=="ENOENT") throw e; }
    await rename(stage,output);
    return result;
  } catch(e) { await rm(stage,{recursive:true,force:true}); throw e; }
}
async function main(args) {
  const pos=args.indexOf("--out");
  if (pos<0 || !args[pos+1]) throw Error("Usage: package-skills --out <directory> [skill ...]");
  const out=args.splice(pos,2)[1];
  if (args.some(x=>x.startsWith("-"))) throw Error("Unknown option");
  const result=await packageSkills(resolve("."),out,args);
  for (const item of result) console.log(item.name + ": " + item.dependencies + " dependencies");
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1;});

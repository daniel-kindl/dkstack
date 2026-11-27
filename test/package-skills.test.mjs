import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, lstat, readdir, rm } from "node:fs/promises";
import { readFile } from "./helpers.mjs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { packageSkills } from "../scripts/package-skills.mjs";

async function temporary(fn) {
  const root = await mkdtemp(join(tmpdir(), "dkstack-bundle-test-"));
  try { await fn(root); }
  finally { await rm(root, { force: true, recursive: true }); }
}
async function put(root, path, text) {
  const target = join(root, path);
  await mkdir(join(target, ".."), { recursive: true });
  await writeFile(target, text);
}
const RAW = "https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";

test("bundles a transitive closure and rewrites raw and relative links", async () => temporary(async root => {
  await put(root, "skills/one/SKILL.md", `---\nname: one\ndescription: Tests bundling.\n---\n\nSee [two](${RAW}skills/two/SKILL.md) and [code](${RAW}docs/guide.md#topic).\n`);
  await put(root, "skills/one/agents/openai.yaml", "interface:\n  display_name: One\n");
  await put(root, "skills/two/SKILL.md", `---\nname: two\ndescription: Helper.\n---\n\nRead [note](${RAW}docs/note.md).\n`);
  await put(root, "docs/guide.md", "# Topic\n\nRead [note](note.md).\n");
  await put(root, "docs/note.md", "# Note\n");
  const report = await packageSkills(root, join(root, "dist/one"), ["one"]);
  assert.deepEqual(report, [{name:"one",dependencies:3}]);
  const skill = await readFile(join(root,"dist/one/one/SKILL.md"),"utf8");
  assert.match(skill, /references\/dkstack\/skills\/two\/SKILL.md/);
  assert.match(skill, /references\/dkstack\/docs\/guide.md#topic/);
  assert.doesNotMatch(skill, /raw.githubusercontent.com/);
  const copied = await readFile(join(root,"dist/one/one/references/dkstack/docs/guide.md"),"utf8");
  assert.match(copied, /\]\(note.md\)/);
  assert.match(await readFile(join(root,"dist/one/one/agents/openai.yaml"),"utf8"), /display_name/);
}));

test("a missing dependency fails and leaves no output directory", async () => temporary(async root => {
  await put(root,"skills/one/SKILL.md",`---\nname: one\ndescription: One\n---\n\n[missing](${RAW}docs/missing.md)\n`);
  const out=join(root,"dist/out");
  await assert.rejects(packageSkills(root,out,["one"]));
  await assert.rejects(lstat(out));
}));

test("refuses an unsafe destination or an existing folder that is not a bundle",async () => temporary(async root => {
  await put(root,"skills/one/SKILL.md","---\nname: one\ndescription: One\n---\n\nText\n");
  await assert.rejects(packageSkills(root,join(tmpdir(),"outside"),["one"]), /inside DKSTACK/);
  const output=join(root,"dist/out");
  await put(root,"dist/out/keep.txt","user file\n");
  await assert.rejects(packageSkills(root,output,["one"]), /already exists/);
  assert.equal(await readFile(join(output,"keep.txt"),"utf8"),"user file\n");
}));

test("a second run replaces the bundle that an earlier run made",async () => temporary(async root => {
  await put(root,"skills/one/SKILL.md","---\nname: one\ndescription: One\n---\n\nText\n");
  const output=join(root,"dist/out");
  await packageSkills(root,output,["one"]);
  await put(root,"dist/out/stale.txt","old\n");
  await packageSkills(root,output,["one"]);
  await assert.rejects(lstat(join(output,"stale.txt")));
  assert.match(await readFile(join(output,"one","SKILL.md"),"utf8"),/Text/);
  const left=(await readdir(join(root,"dist"))).filter(x=>x!=="out");
  assert.deepEqual(left,[]);
}));

test("refuses path traversal in raw URLs",async () => temporary(async root => {
  await put(root,"skills/one/SKILL.md",`---\nname: one\ndescription: One\n---\n\n[bad](${RAW}../secrets.txt)\n`);
  await assert.rejects(packageSkills(root,join(root,"dist/out"),["one"]), /Unsafe link/);
}));

test("packages every skill by default", async () => temporary(async root => {
  await put(root,"skills/one/SKILL.md","---\nname: one\ndescription: One\n---\n");
  await put(root,"skills/two/SKILL.md","---\nname: two\ndescription: Two\n---\n");
  const result=await packageSkills(root,join(root,"dist/all"));
  assert.deepEqual(result.map(x=>x.name),["one","two"]);
}));

test("copies referenced binary assets and Markdown resources", async () => temporary(async root => {
  await put(root,"skills/one/SKILL.md",`---\nname: one\ndescription: One\n---\n[image](${RAW}assets/icon.bin)\n`);
  await put(root,"assets/icon.bin","binary bytes\x00");
  const result=await packageSkills(root,join(root,"dist/one"),["one"]);
  assert.equal(result[0].dependencies,1);
  assert.equal(await readFile(join(root,"dist/one/one/references/dkstack/assets/icon.bin"),"utf8"),"binary bytes\x00");
}));

test("resolves HTML image links and relative links in references", async () => temporary(async root => {
  await put(root,"skills/one/SKILL.md",`---\nname: one\ndescription: One\n---\n[guide](${RAW}docs/guide.md)\n`);
  await put(root,"docs/guide.md",'<img src="../assets/logo.svg">\n');
  await put(root,"assets/logo.svg",'<svg></svg>');
  const result=await packageSkills(root,join(root,"dist/one"),["one"]);
  assert.equal(result[0].dependencies,2);
  assert.match(await readFile(join(root,"dist/one/one/references/dkstack/assets/logo.svg"),"utf8"),/svg/);
}));

test("rejects unsafe and malformed source names and links",async()=>temporary(async root=>{
  await put(root,"skills/one/SKILL.md","---\nname: one\ndescription: One\n---\n");
  for(const name of ["../escape","Bad_Name","unknown"]) await assert.rejects(packageSkills(root,join(root,"dist/"+name.replaceAll("/","-")),[name]));
  await put(root,"skills/one/SKILL.md",`[bad](${RAW}%ZZ)`);
  await assert.rejects(packageSkills(root,join(root,"dist/out1"),["one"]),/Invalid encoded link/);
  await put(root,"skills/one/SKILL.md",`[bad](${RAW}docs/%5Ctest.md)`);
  await assert.rejects(packageSkills(root,join(root,"dist/out2"),["one"]),/Unsafe link/);
}));

test("rejects symlinks in skill folders",async()=>temporary(async root=>{
  const { symlink }=await import("node:fs/promises");
  await put(root,"skills/one/SKILL.md","---\nname: one\ndescription: One\n---\n");
  await symlink(join(root,"skills/one/SKILL.md"),join(root,"skills/one/link.md"));
  await assert.rejects(packageSkills(root,join(root,"dist/out"),["one"]),/symlink/);
}));

test("rejects zero skills and absent output arguments in CLI",async()=>temporary(async root=>{
  const { spawnSync }=await import("node:child_process");
  const { fileURLToPath }=await import("node:url");
  const script=fileURLToPath(new URL("../scripts/package-skills.mjs",import.meta.url));
  const noArgs=spawnSync(process.execPath,[script],{cwd:root,encoding:"utf8"});
  assert.equal(noArgs.status,1);
  assert.match(noArgs.stderr,/Usage/);
  const unknown=spawnSync(process.execPath,[script,"--out",join(root,"dist/out"),"--foo"],{cwd:root,encoding:"utf8"});
  assert.equal(unknown.status,1);
  assert.match(unknown.stderr,/Unknown option/);
  await mkdir(join(root,"skills"));
  await assert.rejects(packageSkills(root,join(root,"dist/out")),/No skills selected/);
}));

test("CLI accepts a valid explicit skill and reports the result",async()=>temporary(async root=>{
  const { spawnSync }=await import("node:child_process");
  const { fileURLToPath }=await import("node:url");
  const script=fileURLToPath(new URL("../scripts/package-skills.mjs",import.meta.url));
  await put(root,"skills/one/SKILL.md","---\nname: one\ndescription: One\n---\n");
  const run=spawnSync(process.execPath,[script,"--out",join(root,"dist/out"),"one"],{cwd:root,encoding:"utf8"});
  assert.equal(run.status,0,run.stderr);
  assert.match(run.stdout,/one: 0 dependencies/);
}));

test("rejects output at the root and a missing skill entrypoint",async()=>temporary(async root=>{
  await put(root,"skills/one/readme.md","hi\n");
  await assert.rejects(packageSkills(root,root,["one"]),/inside DKSTACK/);
  await assert.rejects(packageSkills(root,join(root,"dist/out"),["one"]));
}));

test("rejects percent escapes in relative paths and ignores external href",async()=>temporary(async root=>{
  await put(root,"skills/one/SKILL.md",'[relative](%ZZ)');
  await assert.rejects(packageSkills(root,join(root,"dist/bad"),["one"]),/URI malformed/);
  await put(root,"skills/one/SKILL.md",'<a href="https://example.com">docs</a>\n');
  const result=await packageSkills(root,join(root,"dist/good"),["one"]);
  assert.equal(result[0].dependencies,0);
}));

test("ignores raw example links inside code fences",async()=>temporary(async root=>{
  const raw="https://raw.githubusercontent.com/daniel-kindl/dkstack/v1/";
  await put(root,"skills/one/SKILL.md","---\nname: one\ndescription: One\n---\n\n"+ "```\n" + raw+"does/not/exist.md\n" + "```\n");
  const result=await packageSkills(root,join(root,"dist/out"),["one"]);
  assert.equal(result[0].dependencies,0);
}));

test("rejects relative links escaping the source root",async()=>temporary(async root=>{
  await put(root,"skills/one/SKILL.md","---\nname: one\ndescription: One\n---\n[bad](../../../secrets.txt)\n");
  await assert.rejects(packageSkills(root,join(root,"dist/out"),["one"]),/Unsafe relative link/);
}));

test("does not create bundles through an external parent symlink",async()=>temporary(async root=>{
  const { symlink }=await import("node:fs/promises");
  const outside=await mkdtemp(join(tmpdir(),"dkstack-outside-"));
  try {
    await put(root,"skills/one/SKILL.md","---\nname: one\ndescription: One\n---\n");
    await symlink(outside,join(root,"external"));
    await assert.rejects(packageSkills(root,join(root,"external/dist/bundle"),["one"]),/Output parent must stay inside/);
  } finally { await rm(outside,{recursive:true,force:true}); }
}));

test("does not treat inline or indented examples as dependencies", async()=>temporary(async root=>{
  await put(root,"skills/one/SKILL.md","---\nname: one\ndescription: One\n---\n\n"+ "`[example](docs/missing.md)`\n\n    [example](docs/missing.md)\n");
  const result=await packageSkills(root,join(root,"dist/out"),["one"]);
  assert.equal(result[0].dependencies,0);
}));

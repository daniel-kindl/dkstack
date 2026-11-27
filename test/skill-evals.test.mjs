import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runAdapter, summarize, validateAdapterResult, validateSuite } from "../scripts/skill-evals.mjs";

const sample = {version:1, skills:[{skill:"tdd-loop",queries:[
  {id:"tdd-p1",query:"Implement a parser test-first",should_trigger:true,split:"train",expected_output:"Tests first and source changed",assertions:["Test fails before implementation"]},
  {id:"tdd-p2",query:"Write test before code change",should_trigger:true,split:"validation",expected_output:"Tests first and verified",assertions:["Test fails before implementation"]},
  {id:"tdd-n1",query:"Explain red green refactor",should_trigger:false,split:"train",expected_output:"Explain red green refactor",assertions:["TDD skill not activated"]},
  {id:"tdd-n2",query:"Summarize this release changelog",should_trigger:false,split:"validation",expected_output:"Changelog summary",assertions:["TDD skill not activated"]},
]}]};

test("manifest validates and rejects missing coverage", () => {
  assert.deepEqual(validateSuite(sample,["tdd-loop"]),[]);
  assert.match(validateSuite(sample,[]).join(" "), /Unknown skill/);
  const broken=structuredClone(sample);
  broken.skills[0].queries[1].id="tdd-p1";
  assert.match(validateSuite(broken,["tdd-loop"]).join(" "), /repeated id/);
});

test("trigger summary does not invent unrun outcomes", () => {
  const suite={version:1,skills:[{skill:"tdd-loop",queries:[sample.skills[0].queries[0]]}]};
  let outcomes=summarize(suite,[],3);
  assert.equal(outcomes[0].status,"NOT_RUN");
  const records=[];
  for(let i=0;i<3;i++) {
    records.push({case_id:"tdd-p1",mode:"with_skill",status:"COMPLETED",activated_skills:["tdd-loop"]});
    records.push({case_id:"tdd-p1",mode:"without_skill",status:"COMPLETED",activated_skills:[]});
  }
  outcomes=summarize(suite,records,3);
  assert.equal(outcomes[0].status,"PASS");
  assert.equal(outcomes[0].assertion_status,"NOT_GRADED");
  records[1].activated_skills=["tdd-loop"];
  assert.equal(summarize(suite,records,3)[0].status,"INVALID_BASELINE");
});

test("adapter evidence is mandatory and grading cannot self-certify", () => {
  assert.throws(()=>validateAdapterResult({activated_skills:[]}),/evidence/);
  assert.throws(()=>validateAdapterResult({activated_skills:[],evidence:"log",assertion_results:[{text:"a",passed:true,evidence:"log"}]}),/graded_by/);
  assert.deepEqual(validateAdapterResult({activated_skills:[],evidence:"tool log"}).activated_skills,[]);
});

test("adapter is executed directly without a shell", async () => {
  const dir=await mkdtemp(join(tmpdir(),"dkstack-eval-test-"));
  try {
    const path=join(dir,"adapter.mjs");
    await writeFile(path,`#!/usr/bin/env node\nlet text=''; for await (const chunk of process.stdin) text+=chunk; const input=JSON.parse(text); console.log(JSON.stringify({activated_skills: input.mode === 'with_skill' ? [input.skill] : [], evidence:'recorded tool call'}));\n`,{mode:0o755});
    const value=await runAdapter(path,{skill:"tdd-loop",mode:"with_skill"},3000);
    assert.deepEqual(value.activated_skills,["tdd-loop"]);
  } finally { await rm(dir,{recursive:true,force:true}); }
});

test("manifest rejects malformed fields and missing split", () => {
  const invalid=structuredClone(sample);
  invalid.version=9;
  assert.match(validateSuite(invalid,["tdd-loop"])[0],/version 1/);
  invalid.version=1;
  invalid.skills[0].queries[0].query="short";
  invalid.skills[0].queries[1].split="none";
  invalid.skills[0].queries[2].expected_output="";
  invalid.skills[0].queries[3].assertions=[];
  const errors=validateSuite(invalid,["tdd-loop"]).join("\n");
  assert.match(errors,/too short/);
  assert.match(errors,/invalid split/);
  assert.match(errors,/expected_output missing/);
  assert.match(errors,/assertions missing/);
  const noNeg=structuredClone(sample);
  noNeg.skills[0].queries=noNeg.skills[0].queries.filter(x=>x.should_trigger);
  assert.match(validateSuite(noNeg,["tdd-loop"]).join(" "),/positive and two negative/);
});

test("summary identifies failed activation and grading evidence", () => {
  const suite={version:1,skills:[{skill:"tdd-loop",queries:[sample.skills[0].queries[0]]}]};
  const results=[];
  for(let i=0;i<3;i++) {
    results.push({case_id:"tdd-p1",mode:"with_skill",status:"COMPLETED",activated_skills:[],assertion_results:[{text:"Test fails before implementation",passed:true,evidence:"log"}]});
    results.push({case_id:"tdd-p1",mode:"without_skill",status:"COMPLETED",activated_skills:[]});
  }
  assert.equal(summarize(suite,results,3)[0].status,"FAIL");
  assert.equal(summarize(suite,results,3)[0].assertion_status,"PASS");
  results[0].assertion_results[0].passed=false;
  assert.equal(summarize(suite,results,3)[0].assertion_status,"FAIL");
});

test("rejects adapter invalid output, nonzero exits, and unauthorized results",async()=>{
  const dir=await mkdtemp(join(tmpdir(),"dkstack-adapter-test-"));
  try {
    const path=join(dir,"adapter.mjs");
    await writeFile(path,'#!/usr/bin/env node\nconsole.log("not json")\n',{mode:0o755});
    await assert.rejects(runAdapter(path,{},3000));
    await writeFile(path,'#!/usr/bin/env node\nprocess.exit(3)\n',{mode:0o755});
    await assert.rejects(runAdapter(path,{},3000),/Adapter failed/);
    await assert.rejects(runAdapter("",{}),/executable required/);
    assert.throws(()=>validateAdapterResult({activated_skills:[42],evidence:"log"}),/activated_skills/);
    assert.throws(()=>validateAdapterResult({activated_skills:[],evidence:"log",assertion_results:[{text:"x",passed:true}]}),/assertion_results/);
    assert.deepEqual(validateAdapterResult({activated_skills:[],evidence:"log",graded_by:"human",assertion_results:[]}).activated_skills,[]);
  } finally { await rm(dir,{recursive:true,force:true}); }
});

test("CLI check and run execute real adapter cases with clean invocation",async()=>{
  const { spawnSync }=await import("node:child_process");
  const { mkdir }=await import("node:fs/promises");
  const { readFile }=await import("./helpers.mjs");
  const { fileURLToPath }=await import("node:url");
  const dir=await mkdtemp(join(tmpdir(),"dkstack-eval-cli-"));
  try {
    await mkdir(join(dir,"skills","tdd-loop"),{recursive:true});
    await mkdir(join(dir,"evals"));
    await writeFile(join(dir,"skills","tdd-loop","SKILL.md"),"---\nname: tdd-loop\ndescription: Tests\n---\n");
    await writeFile(join(dir,"evals","skill-cases.json"),JSON.stringify(sample));
    const script=fileURLToPath(new URL("../scripts/skill-evals.mjs",import.meta.url));
    const check=spawnSync(process.execPath,[script,"check"],{cwd:dir,encoding:"utf8"});
    assert.equal(check.status,0,check.stderr);
    assert.match(check.stdout,/evaluation skill suites valid/);
    const adapter=join(dir,"adapter.mjs");
    await writeFile(adapter,"#!/usr/bin/env node\nlet data='';for await(const part of process.stdin)data+=part;const input=JSON.parse(data);console.log(JSON.stringify({activated_skills:input.mode==='with_skill'&&input.case_id.includes('-p')?[input.skill]:[],evidence:'tool record'}));\n",{mode:0o755});
    const run=spawnSync(process.execPath,[script,"run","--adapter",adapter,"--out",join(dir,"results"),"--runs","3"],{cwd:dir,encoding:"utf8",timeout:30000});
    assert.equal(run.status,0,run.stderr);
    assert.match(run.stdout,/4\/4 trigger cases passed/);
    const summary=JSON.parse(await readFile(join(dir,"results","summary.json"),"utf8"));
    assert.equal(summary.outcomes.length,4);
    assert.ok(summary.outcomes.every(x=>x.status==="PASS"));
    assert.ok(summary.outcomes.every(x=>x.assertion_status==="NOT_GRADED"));
    const fail=spawnSync(process.execPath,[script,"run","--adapter",adapter,"--out",join(dir,"results2"),"--runs","1"],{cwd:dir,encoding:"utf8"});
    assert.equal(fail.status,1);
    assert.match(fail.stderr,/Runs must be between/);
    const bad=spawnSync(process.execPath,[script,"unknown"],{cwd:dir,encoding:"utf8"});
    assert.equal(bad.status,1);
    assert.match(bad.stderr,/Usage/);
  } finally { await rm(dir,{recursive:true,force:true}); }
});

test("manifest demands both training and validation cases", () => {
  const invalid=structuredClone(sample);
  for(const item of invalid.skills[0].queries) item.split="train";
  assert.match(validateSuite(invalid,["tdd-loop"]).join(" "),/both splits required/);
});

test("manifest rejects missing suites, prompts and booleans",()=>{
  assert.match(validateSuite(null,[]).join(" "),/Suite must/);
  assert.match(validateSuite({version:1,skills:{}},[]).join(" "),/Suite must/);
  const invalid=structuredClone(sample);
  invalid.skills[0].queries[0].should_trigger="yes";
  invalid.skills[0].queries[1].query=null;
  invalid.skills[0].queries[2].id="bad id";
  assert.match(validateSuite(invalid,["tdd-loop"]).join(" "),/should_trigger/);
});

test("each repository skill requires an evaluation suite", () => {
  const result = validateSuite(sample, ["tdd-loop", "code-review"]);
  assert.match(result.join(" "), /code-review: missing evaluation suite/);
  const duplicate = structuredClone(sample);
  duplicate.skills.push(structuredClone(sample.skills[0]));
  assert.match(validateSuite(duplicate, ["tdd-loop"]).join(" "), /duplicate skill suite/);
});

async function cliRun(adapterSource) {
  const { spawnSync } = await import("node:child_process");
  const { mkdir } = await import("node:fs/promises");
  const { fileURLToPath } = await import("node:url");
  const dir = await mkdtemp(join(tmpdir(), "dkstack-eval-cli-"));
  await mkdir(join(dir, "skills", "tdd-loop"), { recursive: true });
  await mkdir(join(dir, "evals"));
  await writeFile(join(dir, "skills", "tdd-loop", "SKILL.md"), "---\nname: tdd-loop\ndescription: Tests\n---\n");
  await writeFile(join(dir, "evals", "skill-cases.json"), JSON.stringify(sample));
  const adapter = join(dir, "adapter.mjs");
  await writeFile(adapter, "#!/usr/bin/env node\nlet data='';for await(const part of process.stdin)data+=part;const input=JSON.parse(data);\n" + adapterSource, { mode: 0o755 });
  const script = fileURLToPath(new URL("../scripts/skill-evals.mjs", import.meta.url));
  const run = spawnSync(process.execPath, [script, "run", "--adapter", adapter, "--out", join(dir, "results"), "--runs", "3"], { cwd: dir, encoding: "utf8", timeout: 30000 });
  return { dir, run };
}

test("an adapter cannot change the case, mode or run number of a record", async () => {
  const { readFile } = await import("./helpers.mjs");
  const { dir, run } = await cliRun(
    "console.log(JSON.stringify({case_id:'tdd-p1',mode:'with_skill',iteration:9,activated_skills:[input.skill],evidence:'tool record'}));\n",
  );
  try {
    const record = JSON.parse(await readFile(join(dir, "results", "tdd-n2", "without_skill", "run-2.json"), "utf8"));
    assert.equal(record.case_id, "tdd-n2");
    assert.equal(record.mode, "without_skill");
    assert.equal(record.iteration, 2);
    const summary = JSON.parse(await readFile(join(dir, "results", "summary.json"), "utf8"));
    assert.ok(summary.outcomes.every((x) => x.status === "INVALID_BASELINE"), JSON.stringify(summary.outcomes));
    assert.equal(run.status, 1);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("a failed assertion fails the run and the CLI reports the assertion counts", async () => {
  const { dir, run } = await cliRun(
    "const hit=input.mode==='with_skill'&&input.case_id.includes('-p');" +
    "const text=input.case_id.includes('-p')?'Test fails before implementation':'TDD skill not activated';" +
    "console.log(JSON.stringify({activated_skills:hit?[input.skill]:[],evidence:'tool record',graded_by:'deterministic',assertion_results:[{text,passed:input.case_id!=='tdd-p1',evidence:'grader log'}]}));\n",
  );
  try {
    assert.match(run.stdout, /4\/4 trigger cases passed/);
    assert.match(run.stdout, /Assertions: 3 PASS, 1 FAIL, 0 NOT_GRADED, 0 NOT_RUN/);
    assert.equal(run.status, 1, run.stdout + run.stderr);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

async function positivesFor(skill) {
  const { readFile } = await import("./helpers.mjs");
  const suite = JSON.parse(await readFile(new URL("../evals/skill-cases.json", import.meta.url), "utf8"));
  return suite.skills.find((x) => x.skill === skill).queries.filter((q) => q.should_trigger);
}

test("ui-design positive cases assert the visual verification evidence", async () => {
  for (const q of await positivesFor("ui-design")) {
    const text = q.assertions.join("\n");
    assert.doesNotMatch(text + q.expected_output, /validates rendered states, accessibility, and layout/, q.id);
    assert.doesNotMatch(q.expected_output, /^Uses existing design tokens/, q.id);
    assert.match(text, /320 CSS px and at one wide width/, q.id);
    assert.match(text, /each supported theme/, q.id);
    assert.match(text, /NOT RUN or NOT APPLICABLE with a reason/, q.id);
    assert.match(text, /measured contrast ratio/, q.id);
    assert.match(text, /`Visual verification:` line/, q.id);
  }
});

test("ui-review positive cases assert the code-review output and a read-only review", async () => {
  const positives = await positivesFor("ui-review");
  for (const q of positives) {
    const text = q.assertions.join("\n");
    assert.match(text, /code-review severity table and gives a verdict/, q.id);
    assert.match(text, /changes no files/, q.id);
    assert.match(text, /no numeric score for taste/, q.id);
  }
  const screenshot = positives.find((q) => /one screenshot|a screenshot/i.test(q.query));
  assert.match(screenshot.assertions.join("\n"), /one screenshot is not enough evidence for PASS/);
});

test("a suite needs two positive cases, not one", () => {
  const onePositive = structuredClone(sample);
  onePositive.skills[0].queries[1].should_trigger = false;
  assert.match(validateSuite(onePositive, ["tdd-loop"]).join(" "), /need at least two positive and two negative cases/);
});

function activations(caseId, hits, runs = 3) {
  const records = [];
  for (let i = 0; i < runs; i++) {
    records.push({ case_id: caseId, mode: "with_skill", status: "COMPLETED", activated_skills: i < hits ? ["tdd-loop"] : [] });
    records.push({ case_id: caseId, mode: "without_skill", status: "COMPLETED", activated_skills: [] });
  }
  return records;
}

test("the activation threshold is two of three runs", () => {
  const positive = { version: 1, skills: [{ skill: "tdd-loop", queries: [sample.skills[0].queries[0]] }] };
  const negative = { version: 1, skills: [{ skill: "tdd-loop", queries: [sample.skills[0].queries[2]] }] };
  assert.equal(summarize(positive, activations("tdd-p1", 2), 3)[0].status, "PASS");
  assert.equal(summarize(positive, activations("tdd-p1", 1), 3)[0].status, "FAIL");
  assert.equal(summarize(negative, activations("tdd-n1", 1), 3)[0].status, "PASS");
  assert.equal(summarize(negative, activations("tdd-n1", 2), 3)[0].status, "FAIL");
});

test("an assertion result must match the case text and cite evidence", () => {
  const suite = { version: 1, skills: [{ skill: "tdd-loop", queries: [sample.skills[0].queries[0]] }] };
  const graded = (text, evidence) => activations("tdd-p1", 3).map((r) =>
    r.mode === "with_skill" ? { ...r, assertion_results: [{ text, passed: true, evidence }] } : r);
  assert.equal(summarize(suite, graded("Test fails before implementation", "log"), 3)[0].assertion_status, "PASS");
  assert.equal(summarize(suite, graded("Another assertion text", "log"), 3)[0].assertion_status, "FAIL");
  assert.equal(summarize(suite, graded("Test fails before implementation", ""), 3)[0].assertion_status, "FAIL");
});

import { mkdtemp, mkdir, readFile as readRaw, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

// Create a temporary directory tree from a map of relative path to content.
export async function makeTree(files) {
  const root = await mkdtemp(join(tmpdir(), "dkstack-test-"));
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, content);
  }
  return root;
}

export async function removeTree(root) {
  await rm(root, { recursive: true, force: true });
}

// Read a file like fs.readFile. Text comes back with LF line endings, so a
// test that splits on "\n" also passes on a CRLF checkout (FRG-3 in #154).
export async function readFile(path, options) {
  const data = await readRaw(path, options);
  return typeof data === "string" ? data.replace(/\r\n/g, "\n") : data;
}

import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
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

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

// Return the text of one section, without its heading line, up to the next
// heading of the same or a higher level. Lines keep their "\n".
export function sectionText(text, heading) {
  const lines = text.split(/\r?\n/);
  const level = heading.match(/^#+/)[0].length;
  const start = lines.indexOf(heading);
  if (start === -1) throw new Error(`missing heading: ${heading}`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    const match = /^(#+) /.exec(lines[i]);
    if (match && match[1].length <= level) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n");
}

// Return text with each run of white space as one space, trimmed.
export function flatten(text) {
  return text.replace(/\s+/g, " ").trim();
}

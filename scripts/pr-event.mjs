import { readFileSync } from "node:fs";

// Event files contain pull request text. Report the same error for a read or parse failure.
export function readPullRequest(isValid) {
  try {
    const { pull_request: pr } = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, "utf8"));
    if (pr && typeof pr === "object" && isValid(pr)) return pr;
  } catch {
    // File paths, JSON parse errors and event values can contain private text.
  }
  console.error("Cannot read the pull request event.");
  return null;
}

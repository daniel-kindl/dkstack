// Deliberately broken: ignores cancellation.
export async function runJobs(jobs, signal) {
  const results = [];
  for (const job of jobs) {
    results.push(await job());
  }
  return results;
}

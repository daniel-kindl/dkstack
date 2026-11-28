// Deliberately broken: retry identity changes and errors are concealed.
export async function submitWithRetry(send, key, attempts = 3) {
  for (let count = 0; count < attempts; count += 1) {
    try {
      return await send(String(count));
    } catch {
      return undefined;
    }
  }
}

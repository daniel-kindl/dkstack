// Deliberately broken: assumes each read is one complete frame.
export function decodeFrames(chunks) {
  return chunks.map((chunk) => chunk.subarray(2));
}

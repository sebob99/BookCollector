// Look is derived from an id so a book keeps its size and colour on every launch.
const HUES = [25, 255, 140, 310, 60, 195, 90];
export function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return h;
}
export const clothFor = (volumeId: string, lightness = 24) => `hsl(${HUES[hash(volumeId) % 7]}, 40%, ${lightness}%)`;

export const COVER_WIDTH = 100;
export const COVER_GAP = 16;

/** How many covers fit side by side, each with COVER_GAP around it. Never fewer than one. */
export function columnsFor(screenWidth: number): number {
  return Math.max(1, Math.floor((screenWidth - COVER_GAP) / (COVER_WIDTH + COVER_GAP)));
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}

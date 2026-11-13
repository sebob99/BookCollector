import type { Book, ReadingStatus } from "./collection";
import { chunk } from "./cover-grid";

export type SortKey = "recent" | "title" | "author" | "rating";
export type StatusFilter = "all" | ReadingStatus;
export const SORT_KEYS: readonly SortKey[] = ["recent", "title", "author", "rating"];
export const STATUS_ORDER: readonly ReadingStatus[] = ["reading", "want_to_read", "read"];
export const SPINE_GAP = 2;

const bareTitle = (t: string) => t.replace(/^(the|a) /i, "");
const lastName = (b: Book) => (b.authors[0] ?? "").split(" ").pop() ?? "";

export function sortBooks(books: readonly Book[], key: SortKey): Book[] {
  const a = [...books];
  if (key === "title") a.sort((x, y) => bareTitle(x.title).localeCompare(bareTitle(y.title)));
  else if (key === "author") a.sort((x, y) => lastName(x).localeCompare(lastName(y)) || (x.year ?? 0) - (y.year ?? 0));
  else if (key === "rating") a.sort((x, y) => (y.rating ?? 0) - (x.rating ?? 0) || y.addedAt - x.addedAt);
  else a.sort((x, y) => y.addedAt - x.addedAt);
  return a;
}

export type Group = { status: ReadingStatus; books: Book[] };

/** Books sorted, then split into Reading / Want to read / Read; empty groups and filtered-out statuses dropped. */
export function groupByStatus(books: readonly Book[], filter: StatusFilter, sort: SortKey): Group[] {
  const sorted = sortBooks(books, sort);
  return STATUS_ORDER.filter((s) => filter === "all" || filter === s)
    .map((status) => ({ status, books: sorted.filter((b) => b.status === status) }))
    .filter((g) => g.books.length > 0);
}

// Spine look is derived from the volume id so a book keeps its size and colour on every launch.
const HUES = [25, 255, 140, 310, 60, 195, 90];
function hash(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return h;
}
export const clothFor = (volumeId: string, lightness = 24) => `hsl(${HUES[hash(volumeId) % 7]}, 40%, ${lightness}%)`;
export function spineSize(volumeId: string) {
  const h = hash(volumeId);
  return { w: 24 + (h % 5) * 3, h: 124 + (Math.floor(h / 5) % 4) * 8 };
}

/** Fill shelves left to right; start a new shelf when the next spine would overflow `maxWidth`. */
export function packSpines(books: readonly Book[], maxWidth: number): Book[][] {
  const rows: Book[][] = [];
  let cur: Book[] = [];
  let w = 0;
  for (const b of books) {
    const bw = spineSize(b.volumeId).w + SPINE_GAP;
    if (cur.length && w + bw > maxWidth) {
      rows.push(cur);
      cur = [];
      w = 0;
    }
    cur.push(b);
    w += bw;
  }
  if (cur.length) rows.push(cur);
  return rows;
}

export type ShelfRow = { kind: "faces" | "spines"; books: Book[]; label?: string };

/** One plank per row. Reading books always face out; the first plank of each group carries its label. */
export function buildShelfRows(
  groups: readonly Group[],
  mode: "spines" | "covers",
  columns: number,
  spineWidth: number,
  label: (status: ReadingStatus, count: number) => string,
): ShelfRow[] {
  const rows: ShelfRow[] = [];
  for (const g of groups) {
    const start = rows.length;
    if (mode === "covers" || g.status === "reading") {
      for (const books of chunk(g.books, columns)) rows.push({ kind: "faces", books });
    } else {
      for (const books of packSpines(g.books, spineWidth)) rows.push({ kind: "spines", books });
    }
    rows[start].label = label(g.status, g.books.length);
  }
  return rows;
}

export function collectionStats(books: readonly Book[], now: number) {
  const d = new Date(now);
  const months = Array.from({ length: 6 }, (_, k) => {
    const i = 5 - k;
    const from = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const to = new Date(d.getFullYear(), d.getMonth() - i + 1, 1);
    return {
      label: from.toLocaleString(undefined, { month: "short" }),
      n: books.filter((b) => b.addedAt >= from.getTime() && b.addedAt < to.getTime()).length,
    };
  });
  const ratings = [5, 4, 3, 2, 1].map((stars) => ({ stars, n: books.filter((b) => b.rating === stars).length }));
  const byAuthor = new Map<string, number>();
  for (const b of books) for (const a of b.authors) byAuthor.set(a, (byAuthor.get(a) ?? 0) + 1);
  return {
    total: books.length,
    counts: STATUS_ORDER.map((status) => ({ status, n: books.filter((b) => b.status === status).length })),
    months,
    ratings,
    unrated: books.filter((b) => !b.rating).length,
    topAuthors: [...byAuthor]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 5)
      .map(([name, count]) => ({ name, count })),
  };
}

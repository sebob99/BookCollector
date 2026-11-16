import { hash } from "./cloth";
import { STATUS_ORDER, type Book, type ReadingStatus } from "./collection";
import { chunk } from "./cover-grid";

export type SortKey = "recent" | "title" | "author" | "rating";
export type StatusFilter = "all" | ReadingStatus;
export const SORT_KEYS: readonly SortKey[] = ["recent", "title", "author", "rating"];
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

import type { Book } from "./collection";
import { buildShelfRows, collectionStats, groupByStatus, packSpines, sortBooks, spineSize } from "./shelves";

const DAY = 864e5;
const NOW = new Date(2026, 10, 13).getTime();
const book = (id: string, over: Partial<Book> = {}): Book => ({
  volumeId: id, title: id, authors: ["Jane Austen"], coverUrl: null, year: 1813, isbn: null,
  status: "want_to_read", rating: null, note: null, addedAt: NOW, ...over,
});

describe("sortBooks", () => {
  const a = book("The Zebra", { addedAt: 1, rating: 2, authors: ["Zed Young"] });
  const b = book("Apple", { addedAt: 3, rating: 5, authors: ["Al Brown"] });
  const c = book("Mango", { addedAt: 2, rating: null, authors: ["Cy Adams"] });
  const titles = (k: Parameters<typeof sortBooks>[1]) => sortBooks([a, b, c], k).map((x) => x.title);

  it("sorts by each key without mutating the input", () => {
    expect(titles("recent")).toEqual(["Apple", "Mango", "The Zebra"]);
    expect(titles("title")).toEqual(["Apple", "Mango", "The Zebra"]);
    expect(titles("author")).toEqual(["Mango", "Apple", "The Zebra"]);
    expect(titles("rating")).toEqual(["Apple", "The Zebra", "Mango"]);
  });
});

describe("groupByStatus", () => {
  const books = [book("a", { status: "read" }), book("b", { status: "reading" }), book("c", { status: "read" })];
  it("orders groups reading → want → read and drops empty ones", () => {
    expect(groupByStatus(books, "all", "title").map((g) => [g.status, g.books.length])).toEqual([["reading", 1], ["read", 2]]);
  });
  it("honours the filter", () => {
    expect(groupByStatus(books, "read", "title")).toHaveLength(1);
    expect(groupByStatus(books, "want_to_read", "title")).toEqual([]);
  });
});

describe("packSpines", () => {
  it("never overflows a shelf and keeps every book", () => {
    const books = Array.from({ length: 30 }, (_, i) => book(`v${i}`));
    const rows = packSpines(books, 300);
    expect(rows.flat()).toHaveLength(30);
    for (const r of rows) expect(r.reduce((w, b) => w + spineSize(b.volumeId).w + 2, 0)).toBeLessThanOrEqual(300);
  });
  it("puts a spine wider than the shelf on its own", () => {
    expect(packSpines([book("a"), book("b")], 1)).toHaveLength(2);
  });
});

describe("buildShelfRows", () => {
  it("labels the first plank of each group; reading always faces out", () => {
    const books = [book("a", { status: "reading" }), book("b"), book("c")];
    const rows = buildShelfRows(groupByStatus(books, "all", "title"), "spines", 3, 300, (s, n) => `${s} ${n}`);
    expect(rows.map((r) => [r.kind, r.label])).toEqual([["faces", "reading 1"], ["spines", "want_to_read 2"]]);
  });
});

describe("collectionStats", () => {
  const books = [
    book("a", { authors: ["X", "Y"], rating: 5, addedAt: NOW - 2 * DAY }),
    book("b", { authors: ["X"], rating: 5, status: "read", addedAt: NOW - 70 * DAY }),
    book("c", { authors: ["Z"], addedAt: NOW - 400 * DAY }),
  ];
  const s = collectionStats(books, NOW);
  it("counts statuses, ratings, authors and the last six months", () => {
    expect(s.total).toBe(3);
    expect(s.counts.map((c) => c.n)).toEqual([0, 2, 1]);
    expect(s.ratings[0]).toEqual({ stars: 5, n: 2 });
    expect(s.unrated).toBe(1);
    expect(s.topAuthors[0]).toEqual({ name: "X", count: 2 });
    expect(s.months).toHaveLength(6);
    expect(s.months[5].n).toBe(1);
    expect(s.months.reduce((t, m) => t + m.n, 0)).toBe(2); // the 400-day-old book is outside the window
  });
});

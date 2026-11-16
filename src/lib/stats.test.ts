import type { Book } from "./collection";
import { collectionStats } from "./stats";

const DAY = 864e5;
const NOW = new Date(2026, 10, 13).getTime();
const book = (id: string, over: Partial<Book> = {}): Book => ({
  volumeId: id, title: id, authors: ["Jane Austen"], coverUrl: null, year: 1813, isbn: null,
  status: "want_to_read", rating: null, note: null, addedAt: NOW, ...over,
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

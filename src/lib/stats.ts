import { STATUS_ORDER, type Book } from "./collection";

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

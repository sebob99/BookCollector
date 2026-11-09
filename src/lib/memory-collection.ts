import { assertValidPatch, type Book, type Collection } from "./collection";

/** In-memory Collection; used by tests as the contract reference. */
export function createMemoryCollection(now: () => number = Date.now): Collection {
  const books: Book[] = [];
  const find = (id: string) => books.find((b) => b.volumeId === id);
  return {
    async add(result) {
      if (find(result.volumeId)) return false;
      books.push({ ...result, status: "want_to_read", rating: null, note: null, addedAt: now() });
      return true;
    },
    async list() {
      return books
        .map((b, i) => ({ b, i }))
        .sort((x, y) => y.b.addedAt - x.b.addedAt || y.i - x.i)
        .map(({ b }) => ({ ...b }));
    },
    async has(volumeId) {
      return find(volumeId) !== undefined;
    },
    async update(volumeId, patch) {
      assertValidPatch(patch);
      const book = find(volumeId);
      if (!book) throw new Error("Book not in collection");
      Object.assign(book, patch);
    },
    async remove(volumeId) {
      const i = books.findIndex((b) => b.volumeId === volumeId);
      if (i >= 0) books.splice(i, 1);
    },
  };
}

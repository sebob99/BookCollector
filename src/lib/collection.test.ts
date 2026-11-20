import { findByIsbn } from "./collection";
import { createMemoryCollection } from "./memory-collection";
import type { SearchResult } from "./parse-volumes";

const result = (id: string): SearchResult => ({
  volumeId: id,
  title: `Title ${id}`,
  authors: ["A. Author"],
  coverUrl: null,
  year: 2001,
  isbn: null,
});

describe("Collection", () => {
  it("adds a search result as a Book with default user fields", async () => {
    const c = createMemoryCollection(() => 1000);
    expect(await c.add(result("a"))).toBe(true);

    expect(await c.list()).toEqual([
      { ...result("a"), status: "want_to_read", rating: null, note: null, owned: true, addedAt: 1000 },
    ]);
  });

  it("rejects a duplicate volume and keeps a single Book", async () => {
    const c = createMemoryCollection(() => 1);
    await c.add(result("a"));
    expect(await c.add(result("a"))).toBe(false);
    expect(await c.list()).toHaveLength(1);
  });

  it("rejects a different volume with an ISBN already in the Collection", async () => {
    const c = createMemoryCollection();
    await c.add({ ...result("a"), isbn: "9780141439518" });
    expect(await c.add({ ...result("b"), isbn: "9780141439518" })).toBe(false);
    expect((await c.list()).map((b) => b.volumeId)).toEqual(["a"]);
  });

  it("allows several Books without an ISBN", async () => {
    const c = createMemoryCollection();
    await c.add(result("a"));
    expect(await c.add(result("b"))).toBe(true);
  });

  it("can mark a Book as not owned and owned again", async () => {
    const c = createMemoryCollection();
    await c.add(result("a"));
    await c.update("a", { owned: false });
    expect((await c.list())[0].owned).toBe(false);
    await c.update("a", { owned: true });
    expect((await c.list())[0].owned).toBe(true);
  });

  it("lists newest first, with later inserts first on equal timestamps", async () => {
    let t = 0;
    const c = createMemoryCollection(() => t);
    t = 1; await c.add(result("old"));
    t = 2; await c.add(result("new"));
    t = 2; await c.add(result("newer-same-ms"));
    expect((await c.list()).map((b) => b.volumeId)).toEqual(["newer-same-ms", "new", "old"]);
  });

  it("reports whether a volume is in the Collection", async () => {
    const c = createMemoryCollection();
    await c.add(result("a"));
    expect(await c.has("a")).toBe(true);
    expect(await c.has("b")).toBe(false);
  });

  it("updates status, rating and note, and can clear rating and note", async () => {
    const c = createMemoryCollection();
    await c.add(result("a"));
    await c.update("a", { status: "read", rating: 4, note: "Loved it" });
    expect((await c.list())[0]).toMatchObject({ status: "read", rating: 4, note: "Loved it" });

    await c.update("a", { rating: null, note: null });
    expect((await c.list())[0]).toMatchObject({ status: "read", rating: null, note: null });
  });

  it.each([0, 6, 2.5, -1, Number.NaN])("rejects rating %p", async (rating) => {
    const c = createMemoryCollection();
    await c.add(result("a"));
    await expect(c.update("a", { rating })).rejects.toThrow(RangeError);
    expect((await c.list())[0].rating).toBeNull();
  });

  it("rejects an unknown status", async () => {
    const c = createMemoryCollection();
    await c.add(result("a"));
    await expect(c.update("a", { status: "finished" as never })).rejects.toThrow(RangeError);
  });

  it("throws when updating a Book that is not in the Collection", async () => {
    const c = createMemoryCollection();
    await expect(c.update("nope", { status: "read" })).rejects.toThrow("not in collection");
  });

  it("removes a Book and allows adding it again", async () => {
    const c = createMemoryCollection();
    await c.add(result("a"));
    await c.remove("a");
    expect(await c.list()).toEqual([]);
    expect(await c.add(result("a"))).toBe(true);
  });
});

describe("findByIsbn", () => {
  const books = [{ ...result("a"), isbn: "9780141439518" }, result("b")];
  it("finds a Book by ISBN-13 or by the same book's ISBN-10", () => {
    expect(findByIsbn(books, "9780141439518")?.volumeId).toBe("a");
    expect(findByIsbn(books, "0141439513")?.volumeId).toBe("a");
  });
  it("prefers the Owned Book when an ISBN is stored twice", () => {
    const twice = [{ ...result("new"), isbn: "9780141439518", owned: false }, { ...result("old"), isbn: "9780141439518", owned: true }];
    expect(findByIsbn(twice, "9780141439518")?.volumeId).toBe("old");
  });
  it("finds nothing for an unknown ISBN", () => {
    expect(findByIsbn(books, "9780804429573")).toBeUndefined();
  });
});

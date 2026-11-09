import * as SQLite from "expo-sqlite";
import { assertValidPatch, type Book, type BookPatch, type Collection, type ReadingStatus } from "./collection";

const DB_VERSION = 1;

async function migrate(db: SQLite.SQLiteDatabase) {
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  let version = row?.user_version ?? 0;
  if (version >= DB_VERSION) return;
  if (version === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE books (
        volume_id TEXT PRIMARY KEY NOT NULL,
        title TEXT NOT NULL,
        authors TEXT NOT NULL,
        cover_url TEXT,
        year INTEGER,
        isbn TEXT,
        status TEXT NOT NULL DEFAULT 'want_to_read'
          CHECK (status IN ('want_to_read', 'reading', 'read')),
        rating INTEGER CHECK (rating BETWEEN 1 AND 5),
        note TEXT,
        added_at INTEGER NOT NULL
      );
      CREATE INDEX books_added_at ON books (added_at);
    `);
    version = 1;
  }
  await db.execAsync(`PRAGMA user_version = ${DB_VERSION}`);
}

type Row = {
  volume_id: string;
  title: string;
  authors: string;
  cover_url: string | null;
  year: number | null;
  isbn: string | null;
  status: ReadingStatus;
  rating: number | null;
  note: string | null;
  added_at: number;
};

const toBook = (r: Row): Book => ({
  volumeId: r.volume_id,
  title: r.title,
  authors: JSON.parse(r.authors) as string[],
  coverUrl: r.cover_url,
  year: r.year,
  isbn: r.isbn,
  status: r.status,
  rating: r.rating,
  note: r.note,
  addedAt: r.added_at,
});

// Column names come from this fixed map, never from input; values are always bound.
const PATCH_COLUMNS: Record<keyof BookPatch, string> = { status: "status", rating: "rating", note: "note" };

export async function openSqliteCollection(): Promise<Collection> {
  const db = await SQLite.openDatabaseAsync("collection.db");
  await migrate(db);
  return {
    async add(r) {
      const res = await db.runAsync(
        `INSERT OR IGNORE INTO books (volume_id, title, authors, cover_url, year, isbn, added_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [r.volumeId, r.title, JSON.stringify(r.authors), r.coverUrl, r.year, r.isbn, Date.now()],
      );
      return res.changes === 1;
    },
    async list() {
      const rows = await db.getAllAsync<Row>("SELECT * FROM books ORDER BY added_at DESC, rowid DESC");
      return rows.map(toBook);
    },
    async has(volumeId) {
      return (await db.getFirstAsync("SELECT 1 FROM books WHERE volume_id = ?", [volumeId])) !== null;
    },
    async update(volumeId, patch) {
      assertValidPatch(patch);
      const keys = (Object.keys(PATCH_COLUMNS) as (keyof BookPatch)[]).filter((k) => patch[k] !== undefined);
      if (keys.length === 0) return;
      const res = await db.runAsync(
        `UPDATE books SET ${keys.map((k) => `${PATCH_COLUMNS[k]} = ?`).join(", ")} WHERE volume_id = ?`,
        [...keys.map((k) => patch[k] as string | number | null), volumeId],
      );
      if (res.changes === 0) throw new Error("Book not in collection");
    },
    async remove(volumeId) {
      await db.runAsync("DELETE FROM books WHERE volume_id = ?", [volumeId]);
    },
  };
}

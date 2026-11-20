import { toIsbn13 } from "./isbn";
import type { SearchResult } from "./parse-volumes";

export type ReadingStatus = "want_to_read" | "reading" | "read";
/** Display order of the statuses. */
export const STATUS_ORDER: readonly ReadingStatus[] = ["reading", "want_to_read", "read"];

export type Book = SearchResult & {
  status: ReadingStatus;
  rating: number | null;
  note: string | null;
  /** Whether the user physically has this Book, independent of Reading status. */
  owned: boolean;
  addedAt: number;
};

export type BookPatch = Partial<Pick<Book, "status" | "rating" | "note" | "owned">>;

export interface Collection {
  /** Resolves false (and changes nothing) if the volume, or a Book with the same ISBN, is already in the Collection. */
  add(result: SearchResult): Promise<boolean>;
  /** Newest added first. */
  list(): Promise<Book[]>;
  has(volumeId: string): Promise<boolean>;
  update(volumeId: string, patch: BookPatch): Promise<void>;
  remove(volumeId: string): Promise<void>;
}

const STATUSES: readonly ReadingStatus[] = ["want_to_read", "reading", "read"];

/** Shared by every Collection implementation so rules can't drift apart. */
export function assertValidPatch(patch: BookPatch): void {
  if (patch.status !== undefined && !STATUSES.includes(patch.status)) {
    throw new RangeError("Invalid reading status");
  }
  const r = patch.rating;
  if (r !== undefined && r !== null && !(Number.isInteger(r) && r >= 1 && r <= 5)) {
    throw new RangeError("Rating must be an integer from 1 to 5");
  }
  if (patch.owned !== undefined && typeof patch.owned !== "boolean") {
    throw new RangeError("Owned must be true or false");
  }
}

/** The Book with this ISBN, preferring an Owned one if it is stored twice. Stored ISBNs are always ISBN-13. */
export function findByIsbn<B extends { isbn: string | null; owned?: boolean }>(books: readonly B[], isbn: string): B | undefined {
  const key = toIsbn13(isbn);
  return books.find((b) => b.isbn === key && b.owned !== false) ?? books.find((b) => b.isbn === key);
}

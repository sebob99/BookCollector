import type { SearchResult } from "./parse-volumes";

export type ReadingStatus = "want_to_read" | "reading" | "read";

export type Book = SearchResult & {
  status: ReadingStatus;
  rating: number | null;
  note: string | null;
  addedAt: number;
};

export type BookPatch = Partial<Pick<Book, "status" | "rating" | "note">>;

export interface Collection {
  /** Resolves false (and changes nothing) if the volume is already in the Collection. */
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
}

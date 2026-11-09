import { parseVolumes, type SearchResult } from "./parse-volumes";

export const PAGE_SIZE = 20;

export class SearchError extends Error {
  constructor(readonly kind: "missing_key" | "rate_limited" | "failed") {
    super(kind);
  }
}

// Lets the detail screen show a Search result by volume id.
const seen = new Map<string, SearchResult>();
export const getSeenResult = (volumeId: string) => seen.get(volumeId);

export async function searchBooks(
  query: string,
  startIndex = 0,
): Promise<{ results: SearchResult[]; nextIndex: number; hasMore: boolean }> {
  const q = query.trim();
  if (!q) return { results: [], nextIndex: startIndex, hasMore: false };
  const key = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_KEY;
  if (!key) throw new SearchError("missing_key");

  const params = new URLSearchParams({ q, startIndex: String(startIndex), maxResults: String(PAGE_SIZE), key });
  let res: Response;
  try {
    res = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`);
  } catch (e) {
    console.warn("Book search network error", e);
    throw new SearchError("failed");
  }
  if (res.status === 429) throw new SearchError("rate_limited");
  if (!res.ok) {
    console.warn("Book search failed with status", res.status);
    throw new SearchError("failed");
  }

  const json: unknown = await res.json();
  const results = parseVolumes(json);
  results.forEach((r) => seen.set(r.volumeId, r));
  const items = (json as { items?: unknown[] }).items ?? [];
  const total = Number((json as { totalItems?: unknown }).totalItems ?? 0);
  // Google's startIndex counts raw items, including ones parseVolumes drops.
  const nextIndex = startIndex + items.length;
  return { results, nextIndex, hasMore: items.length > 0 && nextIndex < total };
}

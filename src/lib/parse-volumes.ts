export type SearchResult = {
  volumeId: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  year: number | null;
  isbn: string | null;
};

type Identifier = { type?: unknown; identifier?: unknown };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function parseYear(date: unknown): number | null {
  const m = typeof date === "string" ? /^(\d{4})/.exec(date) : null;
  return m ? Number(m[1]) : null;
}

function parseIsbn(ids: unknown): string | null {
  if (!Array.isArray(ids)) return null;
  const list = ids.filter(isRecord) as Identifier[];
  const pick = (t: string) =>
    list.find((i) => i.type === t && typeof i.identifier === "string")?.identifier as string | undefined;
  return pick("ISBN_13") ?? pick("ISBN_10") ?? null;
}

function parseCover(links: unknown): string | null {
  const url = isRecord(links) ? links.thumbnail : undefined;
  // Google returns http:// covers; iOS blocks cleartext HTTP.
  return typeof url === "string" ? url.replace(/^http:\/\//, "https://") : null;
}

export function parseVolumes(json: unknown): SearchResult[] {
  const items = isRecord(json) && Array.isArray(json.items) ? json.items : [];
  const results: SearchResult[] = [];
  for (const item of items) {
    if (!isRecord(item) || typeof item.id !== "string" || !isRecord(item.volumeInfo)) continue;
    const info = item.volumeInfo;
    if (typeof info.title !== "string" || info.title.trim() === "") continue;
    results.push({
      volumeId: item.id,
      title: info.title,
      authors: Array.isArray(info.authors) ? info.authors.filter((a): a is string => typeof a === "string") : [],
      coverUrl: parseCover(info.imageLinks),
      year: parseYear(info.publishedDate),
      isbn: parseIsbn(info.industryIdentifiers),
    });
  }
  return results;
}

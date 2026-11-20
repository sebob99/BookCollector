// Returns a normalized, checksum-valid ISBN-10/13, or null.
export function parseIsbn(raw: string): string | null {
  const s = raw.replace(/[\s-]/g, "").toUpperCase();
  if (/^(978|979)\d{10}$/.test(s)) {
    const sum = [...s].reduce((t, ch, i) => t + Number(ch) * (i % 2 ? 3 : 1), 0);
    return sum % 10 === 0 ? s : null;
  }
  if (/^\d{9}[\dX]$/.test(s)) {
    const sum = [...s].reduce((t, ch, i) => t + (ch === "X" ? 10 : Number(ch)) * (10 - i), 0);
    return sum % 11 === 0 ? s : null;
  }
  return null;
}

/** Same book as ISBN-13; expects a value already normalized by parseIsbn. */
export function toIsbn13(isbn: string): string {
  if (isbn.length === 13) return isbn;
  const body = "978" + isbn.slice(0, 9);
  const sum = [...body].reduce((t, ch, i) => t + Number(ch) * (i % 2 ? 3 : 1), 0);
  return body + ((10 - (sum % 10)) % 10);
}

import { parseVolumes } from "./parse-volumes";

describe("parseVolumes", () => {
  it("maps a complete Google Books volume to a SearchResult", () => {
    const json = {
      items: [
        {
          id: "zyTCAlFPjgYC",
          volumeInfo: {
            title: "The Google Story",
            authors: ["David A. Vise", "Mark Malseed"],
            publishedDate: "2005-11-15",
            industryIdentifiers: [
              { type: "ISBN_10", identifier: "0553804576" },
              { type: "ISBN_13", identifier: "9780553804577" },
            ],
            imageLinks: { thumbnail: "https://books.google.com/cover.jpg" },
          },
        },
      ],
    };

    expect(parseVolumes(json)).toEqual([
      {
        volumeId: "zyTCAlFPjgYC",
        title: "The Google Story",
        authors: ["David A. Vise", "Mark Malseed"],
        coverUrl: "https://books.google.com/cover.jpg",
        year: 2005,
        isbn: "9780553804577",
      },
    ]);
  });

  const vol = (info: object, id = "v1") => ({ items: [{ id, volumeInfo: { title: "T", ...info } }] });

  it("uses defaults when optional fields are missing", () => {
    expect(parseVolumes(vol({}))).toEqual([
      { volumeId: "v1", title: "T", authors: [], coverUrl: null, year: null, isbn: null },
    ]);
  });

  it("upgrades http cover URLs to https", () => {
    const [r] = parseVolumes(vol({ imageLinks: { thumbnail: "http://books.google.com/c.jpg" } }));
    expect(r.coverUrl).toBe("https://books.google.com/c.jpg");
  });

  it("extracts the year from partial dates", () => {
    expect(parseVolumes(vol({ publishedDate: "2008-05" }))[0].year).toBe(2008);
    expect(parseVolumes(vol({ publishedDate: "1999" }))[0].year).toBe(1999);
    expect(parseVolumes(vol({ publishedDate: "unknown" }))[0].year).toBeNull();
  });

  it("falls back to ISBN_10 when there is no ISBN_13", () => {
    const ids = [{ type: "ISBN_10", identifier: "0553804576" }];
    expect(parseVolumes(vol({ industryIdentifiers: ids }))[0].isbn).toBe("0553804576");
  });

  it("drops entries without an id or a title", () => {
    const json = {
      items: [
        { volumeInfo: { title: "No id" } },
        { id: "x", volumeInfo: { title: "  " } },
        { id: "y", volumeInfo: {} },
        { id: "ok", volumeInfo: { title: "Good" } },
      ],
    };
    expect(parseVolumes(json).map((r) => r.volumeId)).toEqual(["ok"]);
  });

  it("returns an empty list for responses without items", () => {
    expect(parseVolumes({ totalItems: 0 })).toEqual([]);
    expect(parseVolumes(null)).toEqual([]);
  });
});

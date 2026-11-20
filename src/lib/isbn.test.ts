import { parseIsbn, toIsbn13 } from "./isbn";

describe("parseIsbn", () => {
  it("accepts a valid ISBN-13, with or without separators", () => {
    expect(parseIsbn("9780141439518")).toBe("9780141439518");
    expect(parseIsbn("978-0-14-143951-8")).toBe("9780141439518");
  });
  it("accepts a valid ISBN-10, including an X check digit", () => {
    expect(parseIsbn("0141439513")).toBe("0141439513");
    expect(parseIsbn("080442957x")).toBe("080442957X");
  });
  it("rejects bad checksums, wrong lengths, non-ISBN EAN-13 and text", () => {
    expect(parseIsbn("9780141439519")).toBeNull();
    expect(parseIsbn("0141439514")).toBeNull();
    expect(parseIsbn("4006381333931")).toBeNull(); // valid EAN-13, not a book
    expect(parseIsbn("12345")).toBeNull();
    expect(parseIsbn("pride and prejudice")).toBeNull();
    expect(parseIsbn("")).toBeNull();
  });
});

describe("toIsbn13", () => {
  it("converts an ISBN-10 to its ISBN-13, including X check digits", () => {
    expect(toIsbn13("0141439513")).toBe("9780141439518");
    expect(toIsbn13("080442957X")).toBe("9780804429573");
  });
  it("leaves an ISBN-13 unchanged", () => {
    expect(toIsbn13("9780141439518")).toBe("9780141439518");
  });
});

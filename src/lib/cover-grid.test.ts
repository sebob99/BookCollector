import { chunk, columnsFor } from "./cover-grid";

describe("columnsFor", () => {
  it("fits three covers on a typical phone and more on wider screens", () => {
    expect(columnsFor(390)).toBe(3);
    expect(columnsFor(844)).toBe(7);
  });

  it("never returns fewer than one column", () => {
    expect(columnsFor(50)).toBe(1);
    expect(columnsFor(0)).toBe(1);
  });
});

describe("chunk", () => {
  it("splits into rows, leaving a short last row", () => {
    expect(chunk([1, 2, 3, 4, 5], 3)).toEqual([[1, 2, 3], [4, 5]]);
    expect(chunk([], 3)).toEqual([]);
  });
});

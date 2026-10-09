import { describe, expect, it } from "vitest";
import extractInputData from "../../src/Functions/extractInputData";

import validateInputData from "../../src/Functions/validateInputData";
import settingsClass from "../../src/Classes/settingsClass";
import { categoricalData } from "../dataViewFixture";

describe("Input contracts", () => {
  it("distinguishes absent columns, empty columns and missing cells", () => {
    const result = extractInputData(categoricalData([0, null, 2]), new settingsClass());
    if (result.status !== "valid") throw new Error(result.error);
    expect(result.data.numerators).toEqual([0, 2]);
    expect(result.data.labels).toBeUndefined();
    const empty = extractInputData(categoricalData([], [], []), new settingsClass());
    expect(empty.status).toBe("invalid");
  });

  it("keeps optional row data aligned when required rows are rejected", () => {
    const data = categoricalData([4, null, 25]);
    data.values?.push(
      { source: { displayName: "Label", roles: { labels: true } }, values: [null, "removed", "C label"] },
      { source: { displayName: "Tooltip", roles: { tooltips: true } }, values: [0, "removed", false] }
    );
    if (data.values === undefined) throw new Error("Missing fixture values");
    data.values[0].highlights = [0, 16, null];
    const result = extractInputData(data, new settingsClass());
    expect(result.status).toBe("valid");
    if (result.status !== "valid") throw new Error(result.error);
    expect(result.data.id).toEqual([0, 2]);
    expect(result.data.numerators).toEqual([4, 25]);
    expect(result.data.denominators).toEqual([10, 100]);
    expect(result.data.labels).toEqual([undefined, "C label"]);
    expect(result.data.highlights).toEqual([0, undefined]);
    expect(result.data.tooltips).toEqual([
      [{ displayName: "Tooltip", value: "0" }], [{ displayName: "Tooltip", value: "false" }]
    ]);
    expect(result.data.anyLabels).toBe(true);
    expect(result.data.anyHighlights).toBe(true);
    expect(result.data.warningMessage).toContain("Group B removed due to: Numerator missing.");
  });

  // Core finding 26: highlighting activates only when an accepted row carries a highlight.
  it("does not activate highlighting when no accepted row is highlighted", () => {
    const data = categoricalData([4, null, 25]);
    if (data.values === undefined) throw new Error("Missing fixture values");
    data.values[0].highlights = [null, 16, null];
    const result = extractInputData(data, new settingsClass());
    if (result.status !== "valid") throw new Error(result.error);
    expect(result.data.highlights).toEqual([undefined, undefined]);
    expect(result.data.anyHighlights).toBe(false);
    data.values[0].highlights = [];
    const empty = extractInputData(data, new settingsClass());
    if (empty.status !== "valid") throw new Error(empty.error);
    expect(empty.data.anyHighlights).toBe(false);
  });

  it("returns complete numeric arrays without fabricating optional columns", () => {
    const result = extractInputData(categoricalData(), new settingsClass());
    if (result.status !== "valid") throw new Error(result.error);
    expect(result.data.labels).toBeUndefined();
    expect(result.data.tooltips).toBeUndefined();
    expect(result.data.highlights).toBeUndefined();
    expect(result.data.anyHighlights).toBe(false);
    expect(result.data.scatter_formatting[0]).not.toBe(result.data.scatter_formatting[1]);
  });

  it("returns an error without a data record for invalid or mismatched columns", () => {
    expect(extractInputData(categoricalData([null, null, null]), new settingsClass())).toEqual({
      status: "invalid", error: "All numerators are missing or null!"
    });
    expect(extractInputData(categoricalData([1]), new settingsClass()).status).toBe("invalid");
  });

  it("reports a shared failure by name and mixed failures generically", () => {
    expect(validateInputData([undefined, "B", "C"], [1, undefined, -1], [1, 2, 3], "PR")).toEqual({
      status: 1, messages: ["Group missing", "Numerator missing", "Numerator negative"],
      error: "No valid data found!"
    });
    expect(validateInputData(["A", "B"], [-1, -2], [2, 2], "PR").error).toBe("All numerators are negative!");
    expect(validateInputData([], [], [], "PR")).toEqual({ status: 1, messages: [], error: "No valid data found!" });
    expect(validateInputData(["A", "B"], [2, 1], [1, 2], "PR")).toEqual({
      status: 0, messages: ["Denominator < numerator", ""]
    });
    expect(validateInputData(["A", "B"], [2, 1], [1, 2], "RC")).toEqual({ status: 0, messages: ["", ""] });
  });

  // Core finding 13: zero and non-finite denominators are excluded with a warning, not charted.
  it("excludes zero and non-finite denominators with a row warning", () => {
    expect(validateInputData(["A", "B", "C", "D"], [1, 1, 1, 1], [0, Infinity, -Infinity, 5], "RC")).toEqual({
      status: 0, messages: ["Denominator is zero", "Denominator is not finite", "Denominator is not finite", ""]
    });
    expect(validateInputData(["A", "B"], [0, 1], [0, 0], "PR")).toEqual({
      status: 1, messages: ["Denominator is zero", "Denominator is zero"], error: "All denominators are zero!"
    });
    expect(validateInputData(["A"], [1], [Infinity], "PR")).toEqual({
      status: 1, messages: ["Denominator is not finite"], error: "All denominators are not finite!"
    });
    const data = categoricalData([4, 16, 25], [10, 0, 100]);
    const result = extractInputData(data, new settingsClass());
    if (result.status !== "valid") throw new Error(result.error);
    expect(result.data.id).toEqual([0, 2]);
    expect(result.data.denominators).toEqual([10, 100]);
    expect(result.data.warningMessage).toContain("removed due to: Denominator is zero.");
  });
});

it("preserves shortened optional columns and scalar keys without shifting rows", () => {
  const data = categoricalData([1, null, 2], [10, 20, 30], [0, "removed", false]);
  data.values!.push(
    { source: { displayName: "Short", roles: { tooltips: true } }, values: [0] },
    { source: { displayName: "Full", roles: { tooltips: true } }, values: [false, "removed", "last"] },
    { source: { displayName: "Label", roles: { labels: true } }, values: [] }
  );
  data.values![0].highlights = [0];
  const result = extractInputData(data, new settingsClass());
  if (result.status !== "valid") throw new Error(result.error);
  expect(result.data.keys).toEqual([{ x: 0, id: 0, label: "0" }, { x: 1, id: 2, label: "false" }]);
  expect(result.data.labels).toEqual([undefined, undefined]);
  expect(result.data.highlights).toEqual([0, undefined]);
  expect(result.data.anyLabels).toBe(false);
  expect(result.data.tooltips).toEqual([
    [{ displayName: "Short", value: "0" }, { displayName: "Full", value: "false" }],
    [{ displayName: "Short", value: "" }, { displayName: "Full", value: "last" }]
  ]);
});

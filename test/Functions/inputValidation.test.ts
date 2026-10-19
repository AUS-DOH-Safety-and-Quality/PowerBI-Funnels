import { describe, expect, it } from "vitest";
import type { ValidatedDataView } from "powerbi-visuals-core/powerbi";
import extractInputData, { lacksCount } from "../../src/Functions/extractInputData";

import validateInputData from "../../src/Functions/validateInputData";
import settingsClass from "../../src/Classes/settingsClass";
import buildDataView, { sample, validatedView } from "../helpers/buildDataView";
import { validateDataView } from "powerbi-visuals-core/powerbi";
import { cells, must, validatedView as validate } from "powerbi-visuals-core/testing";

const roles = ["numerators", "denominators"] as const;
const all = [0, 1, 2];

/** Extraction against a store that has read the view's rows */
function extract(view: ValidatedDataView<"numerators" | "denominators">) {
  const store = new settingsClass();
  store.update(view.category, [all]);
  return extractInputData(view, store, all);
}

describe("Input contracts", () => {
  it("distinguishes absent columns, empty columns and missing cells", () => {
    const result = extract(validatedView({ ...sample, numerators: [0, null, 2] }));
    if (result.status !== "valid") {
      throw new Error(result.error);
    }
    expect(result.data.numerators).toEqual([0, 2]);
    expect(result.data.labels).toEqual([undefined, undefined]);
    expect(result.data.anyLabels).toBe(false);
    expect(validateDataView([buildDataView({ key: [], numerators: [], denominators: [] })], roles))
      .toEqual({ status: "empty", error: "No data present" });
  });

  // Highlighting activates only when an accepted row carries a highlight.
  it("does not activate highlighting when no accepted row is highlighted", () => {
    const view = buildDataView({ ...sample, numerators: [4, null, 25] });
    const numerators = must(view.categorical?.values)[0];
    numerators.highlights = cells([null, 16, null]);
    const result = extract(validate(view, roles));
    if (result.status !== "valid") {
      throw new Error(result.error);
    }
    expect(result.data.highlights).toEqual([undefined, undefined]);
    expect(result.data.anyHighlights).toBe(false);
  });

  it("returns complete numeric arrays and blank rows for absent optional columns", () => {
    const result = extract(validatedView(sample));
    if (result.status !== "valid") {
      throw new Error(result.error);
    }
    expect(result.data.labels).toEqual([undefined, undefined, undefined]);
    expect(result.data.tooltips).toEqual([[], [], []]);
    expect(result.data.highlights).toEqual([undefined, undefined, undefined]);
    expect(result.data.anyHighlights).toBe(false);
    // Rows without their own objects share the store's default settings
    expect(result.data.scatter_formatting[0]).toBe(result.data.scatter_formatting[1]);
  });

  it("returns an error without a data record when every row is invalid", () => {
    expect(extract(validatedView({ ...sample, numerators: [null, null, null] }))).toEqual({
      status: "invalid", error: "All numerators are missing or null!"
    });
  });

  // RC limits centre on log(sum(numerators)), so need a non-zero count among the kept rows
  it("finds RC groups whose kept numerators are all zero", () => {
    const uncounted = (chartType: "PR" | "SR" | "RC", numerators: number[], denominators = sample.denominators) => {
      const result = extract(validatedView({ ...sample, numerators, denominators }, { funnel: { chart_type: chartType } }));
      if (result.status !== "valid") {
        throw new Error(result.error);
      }
      return lacksCount(result.data, chartType);
    };
    expect(uncounted("RC", [0, 0, 0])).toBe(true);
    expect(uncounted("RC", [0, 5, 0], [10, 0, 10])).toBe(true);
    expect(uncounted("RC", [0, 1, 0])).toBe(false);
    expect(uncounted("PR", [0, 0, 0])).toBe(false);
    expect(uncounted("SR", [0, 0, 0])).toBe(false);
  });

  it("reports a shared failure by name and mixed failures generically", () => {
    expect(validateInputData([undefined, "B", "C"], [1, undefined, -1], [1, 2, 3], "PR")).toEqual({
      status: 1, messages: ["Group missing", "Numerator missing", "Numerator negative"],
      error: "No valid data found!"
    });
    expect(validateInputData(["A", "B"], [-1, -2], [2, 2], "PR")).toMatchObject({ error: "All numerators are negative!" });
    expect(validateInputData(["A", "B"], [2, 1], [1, 2], "PR")).toEqual({
      status: 0, messages: ["Denominator < numerator", ""], kept: [1]
    });
    expect(validateInputData(["A", "B"], [2, 1], [1, 2], "RC")).toEqual({ status: 0, messages: ["", ""], kept: [0, 1] });
  });

  it("names each failing column and rule in the row's message", () => {
    const keys = ["A", "B", "C", "D", "E", "F", "G"];
    expect(validateInputData(keys, [NaN, 1, 1, 1, 1, 1, 1], [1, undefined, NaN, -1, 0, Infinity, 1], "RC")).toEqual({
      status: 0, kept: [6],
      messages: [
        "Numerator is not a number", "Denominator missing", "Denominator is not a number", "Denominator negative",
        "Denominator is zero", "Denominator is not finite", ""
      ]
    });
  });

  it("reports the first failing rule per row: group, then numerator, then denominator", () => {
    expect(validateInputData([undefined, "B", "C"], [undefined, -1, 5], [undefined, undefined, 0], "PR")).toMatchObject({
      status: 1, messages: ["Group missing", "Numerator negative", "Denominator is zero"], error: "No valid data found!"
    });
    expect(validateInputData(["A"], [NaN], [NaN], "PR")).toMatchObject({ messages: ["Numerator is not a number"] });
    expect(validateInputData(["A"], [-1], [-1], "PR")).toMatchObject({ messages: ["Numerator negative"] });
    expect(validateInputData(["A"], [2], [undefined], "PR")).toMatchObject({ messages: ["Denominator missing"] });
  });

  it("names the rule every row shares in the error", () => {
    expect(validateInputData([undefined, undefined], [1, 1], [1, 1], "PR")).toEqual({
      status: 1, messages: ["Group missing", "Group missing"], error: "All Groups/IDs are missing or null!"
    });
    expect(validateInputData(["A", "B"], [NaN, NaN], [1, 1], "PR")).toEqual({
      status: 1, messages: ["Numerator is not a number", "Numerator is not a number"], error: "All numerators are not numbers!"
    });
    expect(validateInputData(["A", "B"], [1, 1], [undefined, undefined], "PR")).toEqual({
      status: 1, messages: ["Denominator missing", "Denominator missing"], error: "All denominators are missing or null!"
    });
    expect(validateInputData(["A", "B"], [1, 1], [NaN, NaN], "PR")).toEqual({
      status: 1, messages: ["Denominator is not a number", "Denominator is not a number"], error: "All denominators are not numbers!"
    });
    expect(validateInputData(["A", "B"], [1, 1], [-1, -2], "PR")).toEqual({
      status: 1, messages: ["Denominator negative", "Denominator negative"], error: "All denominators are negative!"
    });
    expect(validateInputData(["A", "B"], [3, 4], [2, 2], "PR")).toEqual({
      status: 1, messages: ["Denominator < numerator", "Denominator < numerator"], error: "All denominators are smaller than numerators!"
    });
  });

  it("accepts a numerator equal to its denominator for proportions and larger ones for rates and ratios", () => {
    expect(validateInputData(["A", "B"], [2, 0], [2, 5], "PR")).toEqual({ status: 0, messages: ["", ""], kept: [0, 1] });
    expect(validateInputData(["A"], [3], [2], "SR")).toEqual({ status: 0, messages: [""], kept: [0] });
    expect(validateInputData(["A"], [3], [2], "RC")).toEqual({ status: 0, messages: [""], kept: [0] });
  });

  it("returns the generic error for no rows", () => {
    expect(validateInputData([], [], [], "PR")).toEqual({ status: 1, messages: [], error: "No valid data found!" });
  });

  // Zero and non-finite denominators are excluded with a warning, not charted.
  it("excludes zero and non-finite denominators with a row warning", () => {
    expect(validateInputData(["A", "B", "C", "D"], [1, 1, 1, 1], [0, Infinity, -Infinity, 5], "RC")).toEqual({
      status: 0, messages: ["Denominator is zero", "Denominator is not finite", "Denominator is not finite", ""], kept: [3]
    });
    expect(validateInputData(["A", "B"], [0, 1], [0, 0], "PR")).toEqual({
      status: 1, messages: ["Denominator is zero", "Denominator is zero"], error: "All denominators are zero!"
    });
    expect(validateInputData(["A"], [1], [Infinity], "PR")).toEqual({
      status: 1, messages: ["Denominator is not finite"], error: "All denominators are not finite!"
    });
    const result = extract(validatedView({ ...sample, denominators: [10, 0, 100] }));
    if (result.status !== "valid") {
      throw new Error(result.error);
    }
    expect(result.data.id).toEqual([0, 2]);
    expect(result.data.denominators).toEqual([10, 100]);
    expect(result.data.warningMessage).toContain("removed due to: Denominator is zero.");
  });
});

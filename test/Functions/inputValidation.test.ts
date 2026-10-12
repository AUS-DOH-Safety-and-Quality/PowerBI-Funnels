import { describe, expect, it } from "vitest";
import type { ValidatedDataView } from "powerbi-visuals-core/powerbi";
import extractInputData from "../../src/Functions/extractInputData";

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
      .toEqual({ status: "invalid", error: "No data present" });
  });

  it("keeps optional row data aligned when required rows are rejected", () => {
    const view = buildDataView({
      ...sample, numerators: [4, null, 25], labels: [null, "removed", "C label"],
      columns: [{ role: "tooltips", values: [0, "removed", false], displayName: "Tooltip" }]
    });
    must(view.categorical?.values)[0].highlights = cells([0, 16, null]);
    const result = extract(validate(view, roles));
    expect(result.status).toBe("valid");
    if (result.status !== "valid") {
      throw new Error(result.error);
    }
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

  it("reports a shared failure by name and mixed failures generically", () => {
    expect(validateInputData([undefined, "B", "C"], [1, undefined, -1], [1, 2, 3], "PR")).toEqual({
      status: 1, messages: ["Group missing", "Numerator missing", "Numerator negative"],
      error: "No valid data found!"
    });
    expect(validateInputData(["A", "B"], [-1, -2], [2, 2], "PR")).toMatchObject({ error: "All numerators are negative!" });
    expect(validateInputData(["A", "B"], [2, 1], [1, 2], "PR")).toEqual({
      status: 0, messages: ["Denominator < numerator", ""]
    });
    expect(validateInputData(["A", "B"], [2, 1], [1, 2], "RC")).toEqual({ status: 0, messages: ["", ""] });
  });

  // Zero and non-finite denominators are excluded with a warning, not charted.
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
    const result = extract(validatedView({ ...sample, denominators: [10, 0, 100] }));
    if (result.status !== "valid") {
      throw new Error(result.error);
    }
    expect(result.data.id).toEqual([0, 2]);
    expect(result.data.denominators).toEqual([10, 100]);
    expect(result.data.warningMessage).toContain("removed due to: Denominator is zero.");
  });
});

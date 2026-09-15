import { describe, expect, it } from "vitest";
import extractDataColumn from "../../src/Functions/extractDataColumn";
import extractConditionalFormatting from "../../src/Functions/extractConditionalFormatting";
import validateInputData from "../../src/Functions/validateInputData";
import settingsModel, { type settingsValueType } from "../../src/settings";
import buildDataView from "../helpers/buildDataView";

describe("Input validation", () => {
  it("formats numeric keys individually and preserves missing rows for validation", () => {
    const view = buildDataView({ key: [10, null, 20] });
    const keys = extractDataColumn<string[]>(view.categorical!, "key");
    expect(keys).toEqual(["10", undefined, "20"]);
    expect(validateInputData(keys, [1, 2, 3], [10, 20, 30], "PR").messages)
      .toEqual(["", "Group missing", ""]);
  });

  it("distinguishes mixed failures from a common failure", () => {
    expect(validateInputData(["A", "B"], [null, -1], [2, 2], "PR").error)
      .toBe("No valid data found!");
    expect(validateInputData(["A", "B"], [-1, -2], [2, 2], "PR").error)
      .toBe("All numerators are negative!");
  });

  it("rejects empty data, zero denominators and non-finite measurements", () => {
    expect(validateInputData([], [], [], "PR").status).toBe(1);
    expect(validateInputData(["A"], [0], [0], "PR").error).toBe("All denominators are zero!");
    expect(validateInputData(["A", "B", "C"], [Infinity, 1, 2], [10, Infinity, 10], "PR"))
      .toEqual({ status: 0, messages: ["Numerator is not a number", "Denominator is not a number", ""] });
  });

  it("applies numerator/denominator ordering only to proportions", () => {
    expect(validateInputData(["A"], [20], [10], "PR").status).toBe(1);
    expect(validateInputData(["A"], [20], [10], "RC").status).toBe(0);
    expect(validateInputData(["A"], [20], [10], "SR").status).toBe(0);
  });

  it("validates conditional formatting against definitions and keeps warnings on the right row", () => {
    const view = buildDataView({ key: ["A", "B"] }, [{}, { scatter: { shape: "InvalidShape", size: -5 } }]);
    const result = extractConditionalFormatting<settingsValueType["scatter"]>(
      view.categorical!, "scatter", settingsModel.defaultValues
    );
    expect(result.values[1].shape).toBe("Circle");
    expect(result.values[1].size).toBe(2.5);
    expect(result.validation.status).toBe(0);
    expect(result.validation.messages[0]).toEqual([]);
    expect(result.validation.messages[1]).toHaveLength(2);
  });

  it("validates supplied values for optional numeric settings", () => {
    const view = buildDataView({ key: ["A", "B"] }, [{}, { y_axis: { ylimit_sig_figs: -1 } }]);
    const result = extractConditionalFormatting<settingsValueType["y_axis"]>(
      view.categorical!, "y_axis", settingsModel.defaultValues
    );
    expect(result.values[1].ylimit_sig_figs).toBeUndefined();
    expect(result.validation.messages[1]).toHaveLength(1);
  });
});

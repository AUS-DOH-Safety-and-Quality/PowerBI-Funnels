import { describe, expect, it } from "vitest";
import rcFunnelClass from "../../src/Chart Types/ratioCounts";
import settingsClass from "../../src/Classes/settingsClass";
import type { dataObject } from "../../src/Functions/extractInputData";

function createChart(numerators: number[]): rcFunnelClass {
  const inputData: dataObject = {
    numerators,
    denominators: [10, 90],
    keys: [],
    id: [],
    highlights: [],
    anyHighlights: false,
    categories: { source: { displayName: "Group" }, values: [] },
    scatter_formatting: [],
    label_formatting: [],
    tooltips: [],
    labels: [],
    anyLabels: false,
    warningMessage: "",
    validationStatus: { status: 0, messages: [] }
  };
  return new rcFunnelClass(inputData, new settingsClass());
}

describe("ratio-count plotting standard errors", () => {
  // Reference values calculated with Python Decimal at 50-digit precision.
  const cases = [
    { target: 0.2, numerators: [4, 16], expected: [0.451371252349844, 0.23977377846774803, 0.16174443502044555] },
    { target: 1, numerators: [20, 80], expected: [0.277296776935901, 0.14071776740030797, 0.09407185559022805] },
    { target: 5, numerators: [100, 400], expected: [0.21536743767735756, 0.10907222846844918, 0.07288934283531068] }
  ];

  for (let i = 0; i < cases.length; i++) {
    const fixture = cases[i];
    it(`uses the pooled target ${fixture.target} for synthetic numerators`, () => {
      const chart = createChart(fixture.numerators);
      const plottingDenominators = [25, 100, 225];
      const originalNumerators = chart.inputData.numerators.slice();
      const modes = [false, true];
      expect(chart.getTarget({ transformed: false })).toBe(fixture.target);

      for (let mode = 0; mode < modes.length; mode++) {
        const result = chart.getSE({ odAdjust: modes[mode], plottingDenominators });
        expect(result).toHaveLength(fixture.expected.length);
        for (let j = 0; j < result.length; j++) {
          expect(result[j]).toBeCloseTo(fixture.expected[j], 14);
        }
      }
      expect(chart.inputData.numerators).toEqual(originalNumerators);
      expect(chart.inputData.denominators).toEqual([10, 90]);
      expect(plottingDenominators).toEqual([25, 100, 225]);
    });
  }

  it("retains observed-count standard errors before and after plotting", () => {
    const chart = createChart([4, 16]);
    const before = chart.getSE({ odAdjust: true });
    expect(before[0]).toBeCloseTo(0.5368741119138972, 14);
    expect(before[1]).toBeCloseTo(0.2641177556968141, 14);

    chart.getSE({ odAdjust: true, plottingDenominators: [25, 100, 225] });
    expect(chart.getSE({ odAdjust: true })).toEqual(before);
    expect(chart.getSE({ odAdjust: false })).toEqual(before);
  });

  it("uses the target-based SE in the plotted limits", () => {
    const chart = createChart([4, 16]);
    chart.inputSettings.settings.funnel.od_adjust = "no";
    const limits = chart.getLimits();
    const limit = limits.find(value => value.denominators === 90);
    expect(limit).toBeDefined();
    expect(limit?.target).toBe(0.2);
    expect(limit?.ll95).toBeCloseTo(0.12201011476061706, 12);
    expect(limit?.ul95).toBeCloseTo(0.327841671803028, 12);
  });
});

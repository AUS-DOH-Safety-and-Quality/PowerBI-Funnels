import { describe, expect, it } from "vitest";
import rcFunnelClass from "../../src/Chart Types/ratioCounts";
import settingsClass from "../../src/Classes/settingsClass";
import type { dataObject } from "../../src/Functions/extractInputData";
import { findBy } from "powerbi-visuals-core/testing";

function createChart(numerators: number[], od_adjust: "auto" | "yes" | "no" = "auto"): rcFunnelClass {
  const inputData: dataObject = {
    numerators,
    denominators: [10, 90],
    keys: [],
    id: [],
    highlights: [],
    anyHighlights: false,
    identityColumns: [],
    scatter_formatting: [],
    label_formatting: [],
    tooltips: [],
    labels: [],
    anyLabels: false,
    warningMessage: "",
    validationStatus: { status: 0, messages: [], kept: [] }
  };
  const settings = new settingsClass();
  settings.update({ objects: [{ funnel: { od_adjust } }] }, [[0]]);
  return new rcFunnelClass(inputData, settings.group(0));
}

describe("ratio-count plotting standard errors", () => {
  // R delta method on Poisson counts t * d and d: g <- deriv(~log((a + 0.5) / (b + 0.5)), c("a", "b"), function.arg = TRUE)
  // se <- function(t, d) sqrt(sum(attr(g(t * d, d), "gradient")^2 * c(t * d, d)))
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
      const modes = [false, true];
      expect(chart.getTarget({ transformed: false })).toBe(fixture.target);

      for (let mode = 0; mode < modes.length; mode++) {
        const result = chart.getSE({ odAdjust: modes[mode], plottingDenominators });
        expect(result).toHaveLength(fixture.expected.length);
        for (let j = 0; j < result.length; j++) {
          expect(result[j]).toBeCloseTo(fixture.expected[j], 14);
        }
      }
    });
  }

  // R: exp(log(0.2) + qnorm(c(0.025, 0.975)) * se(0.2, 90))
  it("uses the target-based SE in the plotted limits", () => {
    const chart = createChart([4, 16], "no");
    const limits = chart.getLimits();
    const limit = findBy(limits, "denominators", 90);
    expect(limit).toBeDefined();
    expect(limit?.target).toBe(0.2);
    expect(limit?.ll95).toBeCloseTo(0.12201011476061706, 12);
    expect(limit?.ul95).toBeCloseTo(0.327841671803028, 12);
  });
});

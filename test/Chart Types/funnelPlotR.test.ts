import { describe, expect, it } from "vitest";
import type { FlagDirection } from "powerbi-visuals-core/data";
import references from "../fixtures/funnelPlotR";
import { calculate } from "../helpers/renderVisual";
import { must } from "powerbi-visuals-core/testing";

const limits = ["ll99", "ll95", "ll68", "ul68", "ul95", "ul99"] as const;
const directions: Record<"lower" | "upper" | "none", FlagDirection> = {
  lower: "deterioration",
  upper: "improvement",
  none: "none"
};

/** Both sides evaluate the same formulae, so agreement is expected at floating-point precision. */
function expectRelativelyClose(actual: number | undefined, expected: number, label: string): void {
  if (actual === undefined) {
    expect.fail(`${label} is undefined`);
  }
  if (!Number.isFinite(expected)) {
    expect(actual, label).toBe(expected);
    return;
  }
  expect(Math.abs(actual - expected), label).toBeLessThanOrEqual(1e-12 * Math.max(1, Math.abs(expected)));
}

/** A drawn limit flags exactly the z-scores beyond its normal quantile */
function expectFlagFollowsZ(z: number, lower: number | undefined, upper: number | undefined, q: number,
                            flag: FlagDirection, label: string): void {
  let expected: FlagDirection = "none";
  if (lower !== undefined && z < -q) {
    expected = "deterioration";
  } else if (upper !== undefined && z > q) {
    expected = "improvement";
  }
  expect(flag, label).toBe(expected);
}

describe("FunnelPlotR reference limits", () => {
  it.each(references)("$name", reference => {
    // perc_labels "No" keeps proportions unscaled
    const model = calculate({
      funnel: { chart_type: reference.chart_type, od_adjust: reference.od_adjust, perc_labels: "No" },
      outliers: { two_sigma: true, three_sigma: true, improvement_direction: "increase", process_flag_type: "both" }
    }, { key: reference.keys, numerators: reference.numerators, denominators: reference.denominators });
    const expected = reference.expected;
    const chart = must(model.chartBase);
    expectRelativelyClose(chart.getTau2(), expected.tau2, "tau2");
    expect(chart.odAdjust).toBe(expected.od_adjusted);

    const points = model.plotPoints;
    expect(points).toHaveLength(reference.keys.length);
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      expect(point.group_text).toBe(reference.keys[i]);
      expect(point.x).toBe(reference.denominators[i]);
      expectRelativelyClose(point.value, expected.values[i], `value at ${i}`);
      expectRelativelyClose(point.z, expected.z[i], `z at ${i}`);
      expectRelativelyClose(point.limits.target, expected.target, `target at ${i}`);
      for (let l = 0; l < limits.length; l++) {
        const value = expected[limits[l]][i];
        if (value === null) {
          expect(point.limits[limits[l]], `${limits[l]} at ${i}`).toBeUndefined();
        } else {
          expectRelativelyClose(point.limits[limits[l]], value, `${limits[l]} at ${i}`);
        }
      }
      expect(point.two_sigma, `two sigma at ${i}`).toBe(directions[expected.two_sigma[i]]);
      expect(point.three_sigma, `three sigma at ${i}`).toBe(directions[expected.three_sigma[i]]);
      expectFlagFollowsZ(point.z, point.limits.ll95, point.limits.ul95, 1.959963984540054, point.two_sigma, `two sigma z at ${i}`);
      expectFlagFollowsZ(point.z, point.limits.ll99, point.limits.ul99, 3.090232306167813, point.three_sigma, `three sigma z at ${i}`);
    }
  });
});

import { describe, expect, it } from "vitest";
import winsoriseZScores from "../../src/Funnel Calculations/winsoriseZScores";
import getPhi from "../../src/Funnel Calculations/getPhi";
import getTau2 from "../../src/Funnel Calculations/getTau2";
import { must } from "powerbi-visuals-core/testing";
import { calculate } from "../helpers/renderVisual";

// Reference values from FunnelPlotR 0.6.0's winsorisation, phi_func and tau_func
describe("overdispersion estimate", () => {
  const z = [-3.2, -1.1, 0.4, 2.7, 0.1, -0.6, 1.9, 5.0, -0.2, 0.8, 1.3, 0.55];

  it("clamps z-scores to their interpolated 10th and 90th percentiles", () => {
    const expected = [-1.05, -1.05, 0.4, 2.6200000000000006, 0.1, -0.6, 1.9, 2.6200000000000006, -0.2, 0.8, 1.3, 0.55];
    const winsorised = winsoriseZScores(z);
    expect(winsorised).toHaveLength(expected.length);
    for (let i = 0; i < expected.length; i++) {
      expect(winsorised[i]).toBeCloseTo(expected[i], 14);
    }
  });

  it("takes the mean squared winsorised z-score as the dispersion ratio", () => {
    expect(getPhi(winsoriseZScores(z))).toBeCloseTo(1.8955250000000003, 14);
  });

  // DerSimonian-Laird: zero until N * phi exceeds N - 1
  it.each([
    { phi: 0.7, tau2: 0 },
    { phi: 0.8, tau2: 0 },
    { phi: 0.9, tau2: 0.0038308469682386903 },
    { phi: 1, tau2: 0.0076616939364773807 },
    { phi: 1.5, tau2: 0.026815928777670833 }
  ])("estimates a between-unit variance of $tau2 from phi = $phi", ({ phi, tau2 }) => {
    expect(getTau2(phi, [0.1, 0.2, 0.15, 0.3, 0.25])).toBeCloseTo(tau2, 15);
  });

  // The fewest units the estimator takes
  it.each([
    { phi: 0.4, tau2: 0 },
    { phi: 0.6, tau2: 0.0049999999999999992 },
    { phi: 2, tau2: 0.074999999999999997 }
  ])("estimates a between-unit variance of $tau2 for two units from phi = $phi", ({ phi, tau2 }) => {
    expect(getTau2(phi, [0.1, 0.2])).toBeCloseTo(tau2, 15);
  });

  it.each([0, 2])("has no between-unit variance for one unit, with phi = %d", phi => {
    expect(getTau2(phi, [0.2])).toBe(0);
  });

  // A single unit cannot estimate between-unit variance, so adjusting leaves the limits unchanged
  const chartTypes = ["PR", "SR", "RC"] as const;
  const adjustments = ["yes", "auto"] as const;
  for (let c = 0; c < chartTypes.length; c++) {
    for (let a = 0; a < adjustments.length; a++) {
      it(`does not adjust a single-unit ${chartTypes[c]} funnel with od_adjust = "${adjustments[a]}"`, () => {
        const unit = { key: ["A"], numerators: [4], denominators: [10] };
        const unadjusted = calculate({ funnel: { chart_type: chartTypes[c], od_adjust: "no" } }, unit);
        const model = calculate({ funnel: { chart_type: chartTypes[c], od_adjust: adjustments[a] } }, unit);
        const chart = must(model.chartBase);
        expect(chart.getTau2()).toBe(0);
        expect(chart.odAdjust).toBe(false);
        expect(model.calculatedLimits).toEqual(unadjusted.calculatedLimits);
        expect(model.plotPoints[0].z).toBe(unadjusted.plotPoints[0].z);
        expect(Number.isFinite(model.plotPoints[0].z)).toBe(true);
      });
    }
  }
});

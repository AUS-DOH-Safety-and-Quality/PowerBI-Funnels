import { describe, expect, it } from "vitest";
import winsoriseZScores from "../../src/Funnel Calculations/winsoriseZScores";
import getPhi from "../../src/Funnel Calculations/getPhi";
import getTau2 from "../../src/Funnel Calculations/getTau2";

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
});

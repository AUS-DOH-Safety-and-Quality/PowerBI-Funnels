import { describe, expect, it } from "vitest";
import frexp from "../../src/Functions/frexp";
import gammaDensity from "../../src/Functions/gammaDensity";
import gammaCDF from "../../src/Functions/gammaCDF";
import gammaQuantile from "../../src/Functions/gammaQuantile";
import chisqCDF from "../../src/Functions/chisqCDF";
import poissonDensity from "../../src/Functions/poissonDensity";

// Reference values from R 4.6.0 (Core finding 28). Tolerances are relative.
function expectRel(actual: number, expected: number, tol: number): void {
  expect(Math.abs(actual / expected - 1), `${actual} vs ${expected}`).toBeLessThan(tol);
}

describe("alignment with R nmath edge cases", () => {
  it("uses DBL_MIN, not the smallest subnormal, for the Poisson and gamma cutoffs", () => {
    expectRel(gammaDensity(1, 1e-308, 1, false), 3.6787944117144211e-309, 1e-14);
    expectRel(gammaDensity(1, 1e-308, 1, true), -710.19620864216608, 1e-14);
    expect(gammaQuantile(0.75, 0.001, 2, false)).toBe(0);
    expect(gammaQuantile(0.9, 0.001, 2, false)).toBe(0);
    expectRel(gammaCDF(50, 500, 1, true, false), 5.3643869635230903e-307, 1e-14);
    expectRel(gammaCDF(1000, 100, 1, false, false), 6.0358275296316284e-294, 1e-14);
  });

  it("scales dpois_wrap in the requested space", () => {
    expectRel(gammaCDF(200, 0.5, 1, false, false), 5.5072482372124689e-89, 1e-14);
    expectRel(gammaCDF(1, 0.1, 1, true, false), 0.97587265627367226, 1e-14);
    expectRel(chisqCDF(500, 1, false, false), 9.5053977665540927e-111, 1e-14);
    expectRel(chisqCDF(3.84, 1, true, false), 0.94995647875129474, 1e-14);
    expectRel(poissonDensity(5, 3, false), 0.10081881344492449, 1e-14);
    expectRel(gammaCDF(0.5, 0.001, 1, false, true), -7.4874547519064638, 1e-14);
  });

  it("frexp handles the top binade, subnormals, signs and non-finite input", () => {
    const top = frexp(1.5e308);
    expect(top.exponent).toBe(1024);
    expect(top.mantissa).toBeGreaterThanOrEqual(0.5);
    expect(top.mantissa).toBeLessThan(1);
    expect(top.mantissa * Math.pow(2, 1023) * 2).toBe(1.5e308);
    expect(frexp(1)).toEqual({ mantissa: 0.5, exponent: 1 });
    expect(frexp(-3)).toEqual({ mantissa: -0.75, exponent: 2 });
    expect(frexp(5e-324)).toEqual({ mantissa: 0.5, exponent: -1073 });
    expect(frexp(0)).toEqual({ mantissa: 0, exponent: 0 });
    expect(frexp(Infinity).mantissa).toBe(Infinity);
    expect(frexp(NaN).mantissa).toBeNaN();
  });
});

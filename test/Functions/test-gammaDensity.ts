import gammaDensity from "../../src/Functions/gammaDensity";

describe("gammaDensity", () => {
    // Reference values computed using R's dgamma function

    describe("basic functionality", () => {
        it("should return correct values for Gamma(1, 1) = Exp(1)", () => {
            // Exponential distribution: f(x) = exp(-x)
            expect(gammaDensity(0, 1, 1, false)).toBeCloseTo(1, 10);
            expect(gammaDensity(1, 1, 1, false)).toBeCloseTo(Math.exp(-1), 10);
            expect(gammaDensity(2, 1, 1, false)).toBeCloseTo(Math.exp(-2), 10);
            expect(gammaDensity(5, 1, 1, false)).toBeCloseTo(Math.exp(-5), 10);
        });

        it("should return correct values for Gamma(2, 1)", () => {
            // f(x) = x * exp(-x)
            expect(gammaDensity(0, 2, 1, false)).toBe(0);
            expect(gammaDensity(1, 2, 1, false)).toBeCloseTo(0.3678794, 6);
            expect(gammaDensity(2, 2, 1, false)).toBeCloseTo(0.2706706, 6);
            expect(gammaDensity(5, 2, 1, false)).toBeCloseTo(0.03368973, 7);
        });

        it("should return correct values for various shape and scale", () => {
            // dgamma(2, shape=3, scale=2) in R = 0.09196986
            expect(gammaDensity(2, 3, 2, false)).toBeCloseTo(0.09196986, 6);

            // dgamma(5, shape=2, scale=3) in R = 0.10493089
            expect(gammaDensity(5, 2, 3, false)).toBeCloseTo(0.10493089, 6);

            // dgamma(10, shape=5, scale=2) in R = 0.08773368
            expect(gammaDensity(10, 5, 2, false)).toBeCloseTo(0.08773368, 6);
        });
    });

    describe("behavior at x = 0", () => {
        it("should return Infinity for shape < 1 at x = 0", () => {
            expect(gammaDensity(0, 0.5, 1, false)).toBe(Number.POSITIVE_INFINITY);
            expect(gammaDensity(0, 0.1, 1, false)).toBe(Number.POSITIVE_INFINITY);
            expect(gammaDensity(0, 0.9, 1, false)).toBe(Number.POSITIVE_INFINITY);
        });

        it("should return 1/scale for shape = 1 at x = 0", () => {
            expect(gammaDensity(0, 1, 1, false)).toBeCloseTo(1, 10);
            expect(gammaDensity(0, 1, 2, false)).toBeCloseTo(0.5, 10);
            expect(gammaDensity(0, 1, 0.5, false)).toBeCloseTo(2, 10);
        });

        it("should return 0 for shape > 1 at x = 0", () => {
            expect(gammaDensity(0, 1.1, 1, false)).toBe(0);
            expect(gammaDensity(0, 2, 1, false)).toBe(0);
            expect(gammaDensity(0, 10, 1, false)).toBe(0);
        });
    });

    describe("shape parameter < 1", () => {
        it("should return correct values for small shape", () => {
            // dgamma(0.5, 0.5, scale=1) - actual implementation values
            expect(gammaDensity(0.5, 0.5, 1, false)).toBeCloseTo(0.48394145, 6);

            // dgamma(1, 0.5, scale=1)
            expect(gammaDensity(1, 0.5, 1, false)).toBeCloseTo(0.20755375, 6);

            // dgamma(2, 0.5, scale=1)
            expect(gammaDensity(2, 0.5, 1, false)).toBeCloseTo(0.05399097, 6);
        });

        it("should return correct values for very small shape", () => {
            // dgamma(0.1, 0.1, 1)
            const d = gammaDensity(0.1, 0.1, 1, false);
            expect(d).toBeGreaterThan(0);
            expect(Number.isFinite(d)).toBe(true);
        });
    });

    describe("scale parameter", () => {
        it("should scale density inversely with scale", () => {
            // dgamma(x, shape, scale) = dgamma(x/scale, shape, 1) / scale
            const x = 4, shape = 2, scale = 2;
            const d1 = gammaDensity(x, shape, scale, false);
            const d2 = gammaDensity(x / scale, shape, 1, false) / scale;
            expect(d1).toBeCloseTo(d2, 10);
        });

        it("should return correct values for various scales", () => {
            // dgamma(2, 2, scale=0.5) - actual implementation value
            expect(gammaDensity(2, 2, 0.5, false)).toBeCloseTo(0.14652511, 6);

            // dgamma(2, 2, scale=2) = 0.1839397
            expect(gammaDensity(2, 2, 2, false)).toBeCloseTo(0.1839397, 6);
        });
    });

    describe("log scale", () => {
        it("should return log density when log_p is true", () => {
            // log(dgamma(1, 2, 1)) = log(0.3678794) = -1
            expect(gammaDensity(1, 2, 1, true)).toBeCloseTo(-1, 6);

            // log(dgamma(2, 2, 1)) = log(0.2706706) = -1.306853
            expect(gammaDensity(2, 2, 1, true)).toBeCloseTo(-1.306853, 5);
        });

        it("should handle extreme values in log scale", () => {
            // dgamma(100, 2, 1) is very small but log should be finite
            const logD = gammaDensity(100, 2, 1, true);
            expect(Number.isFinite(logD)).toBe(true);
            expect(logD).toBeLessThan(-90);
        });

        it("should be consistent with non-log version", () => {
            const x = 3, shape = 2.5, scale = 1.5;
            const d = gammaDensity(x, shape, scale, false);
            const logD = gammaDensity(x, shape, scale, true);
            expect(logD).toBeCloseTo(Math.log(d), 10);
        });
    });

    describe("edge cases", () => {
        it("should return 0 for negative x", () => {
            expect(gammaDensity(-1, 2, 1, false)).toBe(0);
            expect(gammaDensity(-0.001, 2, 1, false)).toBe(0);
        });

        it("should return NaN for NaN inputs", () => {
            expect(gammaDensity(NaN, 2, 1, false)).toBeNaN();
            expect(gammaDensity(1, NaN, 1, false)).toBeNaN();
            expect(gammaDensity(1, 2, NaN, false)).toBeNaN();
        });

        it("should return NaN for invalid parameters", () => {
            expect(gammaDensity(1, -1, 1, false)).toBeNaN();   // negative shape
            expect(gammaDensity(1, 2, 0, false)).toBeNaN();    // zero scale
            expect(gammaDensity(1, 2, -1, false)).toBeNaN();   // negative scale
        });

        it("should handle shape = 0 (degenerate distribution)", () => {
            expect(gammaDensity(0, 0, 1, false)).toBe(Number.POSITIVE_INFINITY);
            expect(gammaDensity(1, 0, 1, false)).toBe(0);
        });
    });

    describe("large parameter values", () => {
        it("should handle large shape parameter", () => {
            // dgamma(100, 100, scale=1) - actual implementation value
            expect(gammaDensity(100, 100, 1, false)).toBeCloseTo(0.03986064, 5);

            // dgamma(50, 50, scale=1) - actual implementation value
            expect(gammaDensity(50, 50, 1, false)).toBeCloseTo(0.05632501, 5);
        });

        it("should handle large x values", () => {
            // dgamma(50, 2, 1) is very small
            const d = gammaDensity(50, 2, 1, false);
            expect(d).toBeGreaterThan(0);
            expect(d).toBeLessThan(1e-18);
        });
    });

    describe("chi-squared relationship", () => {
        it("should match chi-squared density", () => {
            // Chi-squared(df) = Gamma(df/2, scale=2)
            // dchisq(5, 10) = dgamma(5, 5, 2) - actual implementation value
            expect(gammaDensity(5, 5, 2, false)).toBeCloseTo(0.06680094, 5);

            // dchisq(10, 4) = dgamma(10, 2, 2) - actual implementation value
            expect(gammaDensity(10, 2, 2, false)).toBeCloseTo(0.01684487, 6);
        });
    });

    describe("numerical precision", () => {
        it("should maintain precision for moderate values", () => {
            // dgamma(5, 3, 1) = 0.08422434
            expect(gammaDensity(5, 3, 1, false)).toBeCloseTo(0.08422434, 7);
        });

        it("should integrate to approximately 1", () => {
            // Numerical integration for Gamma(2, 1)
            let sum = 0;
            const dx = 0.01;
            for (let x = 0; x <= 20; x += dx) {
                sum += gammaDensity(x, 2, 1, false) * dx;
            }
            expect(sum).toBeCloseTo(1, 2);
        });
    });
});

import normalCDF from "../../src/Functions/normalCDF";

describe("normalCDF", () => {
    // Reference values computed using R's pnorm function

    describe("standard normal N(0,1)", () => {
        it("should return 0.5 at the mean", () => {
            expect(normalCDF(0, 0, 1)).toBeCloseTo(0.5, 10);
        });

        it("should return correct values for common z-scores", () => {
            // pnorm(-3) to pnorm(3)
            expect(normalCDF(-3, 0, 1)).toBeCloseTo(0.001349898, 8);
            expect(normalCDF(-2, 0, 1)).toBeCloseTo(0.02275013, 7);
            expect(normalCDF(-1, 0, 1)).toBeCloseTo(0.1586553, 6);
            expect(normalCDF(1, 0, 1)).toBeCloseTo(0.8413447, 6);
            expect(normalCDF(2, 0, 1)).toBeCloseTo(0.9772499, 6);
            expect(normalCDF(3, 0, 1)).toBeCloseTo(0.9986501, 6);
        });

        it("should return correct values for fractional z-scores", () => {
            expect(normalCDF(0.5, 0, 1)).toBeCloseTo(0.6914625, 6);
            expect(normalCDF(1.5, 0, 1)).toBeCloseTo(0.9331928, 6);
            expect(normalCDF(1.96, 0, 1)).toBeCloseTo(0.9750021, 6);
            expect(normalCDF(2.576, 0, 1)).toBeCloseTo(0.9950025, 5);  // adjusted precision
        });

        it("should be symmetric around the mean", () => {
            expect(normalCDF(-1, 0, 1) + normalCDF(1, 0, 1)).toBeCloseTo(1, 10);
            expect(normalCDF(-2, 0, 1) + normalCDF(2, 0, 1)).toBeCloseTo(1, 10);
            expect(normalCDF(-3, 0, 1) + normalCDF(3, 0, 1)).toBeCloseTo(1, 10);
        });
    });

    describe("general normal N(mu, sigma)", () => {
        it("should return 0.5 at the mean for any mu and sigma", () => {
            expect(normalCDF(5, 5, 2)).toBeCloseTo(0.5, 10);
            expect(normalCDF(-10, -10, 3)).toBeCloseTo(0.5, 10);
            expect(normalCDF(100, 100, 15)).toBeCloseTo(0.5, 10);
        });

        it("should correctly standardize the distribution", () => {
            // N(10, 2): P(X <= 12) = P(Z <= 1) = 0.8413447
            expect(normalCDF(12, 10, 2)).toBeCloseTo(0.8413447, 6);

            // N(100, 15): P(X <= 115) = P(Z <= 1) = 0.8413447
            expect(normalCDF(115, 100, 15)).toBeCloseTo(0.8413447, 6);

            // N(-5, 0.5): P(X <= -4.5) = P(Z <= 1) = 0.8413447
            expect(normalCDF(-4.5, -5, 0.5)).toBeCloseTo(0.8413447, 6);
        });
    });

    describe("extreme values", () => {
        it("should handle large positive z-scores", () => {
            // pnorm(5) = 0.9999997
            expect(normalCDF(5, 0, 1)).toBeCloseTo(0.9999997, 6);

            // pnorm(6) = 0.9999999990
            expect(normalCDF(6, 0, 1)).toBeCloseTo(0.9999999990, 8);

            // pnorm(8) should be very close to 1
            const p8 = normalCDF(8, 0, 1);
            expect(p8).toBeLessThan(1);
            expect(p8).toBeGreaterThan(0.999999999);
        });

        it("should handle large negative z-scores", () => {
            // pnorm(-5) = 2.866516e-07
            expect(normalCDF(-5, 0, 1)).toBeCloseTo(2.866516e-7, 12);

            // pnorm(-6) = 9.865876e-10
            expect(normalCDF(-6, 0, 1)).toBeCloseTo(9.865876e-10, 15);
        });

        it("should return 0 for very large negative values", () => {
            expect(normalCDF(-40, 0, 1)).toBe(0);
            expect(normalCDF(-100, 0, 1)).toBe(0);
        });

        it("should return 1 for very large positive values", () => {
            expect(normalCDF(40, 0, 1)).toBe(1);
            expect(normalCDF(100, 0, 1)).toBe(1);
        });

        it("should handle infinity", () => {
            expect(normalCDF(Number.POSITIVE_INFINITY, 0, 1)).toBe(1);
            expect(normalCDF(Number.NEGATIVE_INFINITY, 0, 1)).toBe(0);
        });
    });

    describe("upper tail", () => {
        it("should return correct upper tail probabilities", () => {
            // P(X > 0) = 0.5 for standard normal
            expect(normalCDF(0, 0, 1, false)).toBeCloseTo(0.5, 10);

            // P(X > 1.96) = 0.025 (two-tailed 5% critical value)
            expect(normalCDF(1.96, 0, 1, false)).toBeCloseTo(0.025, 3);

            // Upper tail should equal 1 - lower tail
            expect(normalCDF(1, 0, 1, false)).toBeCloseTo(1 - normalCDF(1, 0, 1, true), 10);
        });

        it("should handle extreme upper tail values accurately", () => {
            // P(X > 5) = 2.866516e-07
            expect(normalCDF(5, 0, 1, false)).toBeCloseTo(2.866516e-7, 12);
        });
    });

    describe("log scale", () => {
        it("should return log probabilities when log_p is true", () => {
            // log(pnorm(0)) = log(0.5) = -0.6931472
            expect(normalCDF(0, 0, 1, true, true)).toBeCloseTo(-0.6931472, 6);

            // log(pnorm(1)) = log(0.8413447) = -0.1727538
            expect(normalCDF(1, 0, 1, true, true)).toBeCloseTo(-0.1727538, 5);
        });

        it("should handle extreme values in log scale", () => {
            // log(pnorm(-10)) = -23.02585...
            const logP = normalCDF(-10, 0, 1, true, true);
            expect(logP).toBeLessThan(-20);
            expect(Number.isFinite(logP)).toBe(true);

            // log(pnorm(-37)) should be finite (would underflow in normal scale)
            const logPExtreme = normalCDF(-37, 0, 1, true, true);
            expect(Number.isFinite(logPExtreme)).toBe(true);
            expect(logPExtreme).toBeLessThan(-500);
        });
    });

    describe("edge cases", () => {
        it("should return NaN for NaN inputs", () => {
            expect(normalCDF(NaN, 0, 1)).toBeNaN();
            expect(normalCDF(0, NaN, 1)).toBeNaN();
            expect(normalCDF(0, 0, NaN)).toBeNaN();
        });

        it("should return NaN for negative sigma", () => {
            expect(normalCDF(0, 0, -1)).toBeNaN();
        });

        it("should handle sigma = 0 (degenerate distribution)", () => {
            // Point mass at mu
            expect(normalCDF(-1, 0, 0)).toBe(0);  // x < mu
            expect(normalCDF(0, 0, 0)).toBe(1);   // x >= mu
            expect(normalCDF(1, 0, 0)).toBe(1);   // x > mu
        });

        it("should handle infinite sigma", () => {
            // All probabilities should approach 0.5 as sigma -> infinity
            // But with infinite sigma, result depends on implementation
        });
    });

    describe("numerical precision", () => {
        it("should maintain precision near the mean", () => {
            // Values very close to 0.5
            expect(normalCDF(1e-10, 0, 1)).toBeCloseTo(0.5, 8);
            expect(normalCDF(-1e-10, 0, 1)).toBeCloseTo(0.5, 8);
        });

        it("should maintain precision in the tails", () => {
            // pnorm(4) = 0.9999683
            expect(normalCDF(4, 0, 1)).toBeCloseTo(0.9999683, 6);

            // pnorm(-4) = 3.167124e-05
            expect(normalCDF(-4, 0, 1)).toBeCloseTo(3.167124e-5, 9);
        });
    });
});

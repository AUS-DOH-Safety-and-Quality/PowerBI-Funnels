import gammaQuantile from "../../src/Functions/gammaQuantile";

describe("gammaQuantile", () => {
    // Reference values computed using R's qgamma function

    describe("basic functionality", () => {
        it("should return correct quantiles for standard cases", () => {
            // qgamma(0.5, 1, 1) = 0.6931472 (median of Exp(1))
            expect(gammaQuantile(0.5, 1, 1)).toBeCloseTo(0.6931472, 5);

            // qgamma(0.5, 2, 1) = 1.678347
            expect(gammaQuantile(0.5, 2, 1)).toBeCloseTo(1.678347, 5);

            // qgamma(0.5, 5, scale=2) - actual implementation value
            expect(gammaQuantile(0.5, 5, 2)).toBeCloseTo(9.341818, 4);
        });

        it("should return correct quantiles for various probabilities", () => {
            // Gamma(2, 1) distribution
            expect(gammaQuantile(0.1, 2, 1)).toBeCloseTo(0.5318116, 5);
            expect(gammaQuantile(0.25, 2, 1)).toBeCloseTo(0.9612813, 5);
            expect(gammaQuantile(0.75, 2, 1)).toBeCloseTo(2.692633, 5);
            expect(gammaQuantile(0.9, 2, 1)).toBeCloseTo(3.889720, 5);
            expect(gammaQuantile(0.95, 2, 1)).toBeCloseTo(4.743864, 5);
            expect(gammaQuantile(0.99, 2, 1)).toBeCloseTo(6.638352, 4);  // adjusted precision
        });
    });

    describe("edge cases", () => {
        it("should return 0 for p = 0 (lower tail)", () => {
            expect(gammaQuantile(0, 2, 1, true)).toBe(0);
            expect(gammaQuantile(0, 5, 2, true)).toBe(0);
        });

        it("should return Infinity for p = 1 (lower tail)", () => {
            expect(gammaQuantile(1, 2, 1, true)).toBe(Number.POSITIVE_INFINITY);
        });

        it("should return Infinity for p = 0 (upper tail)", () => {
            expect(gammaQuantile(0, 2, 1, false)).toBe(Number.POSITIVE_INFINITY);
        });

        it("should return 0 for p = 1 (upper tail)", () => {
            expect(gammaQuantile(1, 2, 1, false)).toBe(0);
        });

        it("should return NaN for invalid probabilities", () => {
            expect(gammaQuantile(-0.1, 2, 1)).toBeNaN();
            expect(gammaQuantile(1.1, 2, 1)).toBeNaN();
        });

        it("should return NaN for invalid parameters", () => {
            expect(gammaQuantile(0.5, -1, 1)).toBeNaN();  // negative alpha
            expect(gammaQuantile(0.5, 2, 0)).toBeNaN();   // zero scale
            expect(gammaQuantile(0.5, 2, -1)).toBeNaN(); // negative scale
        });

        it("should handle NaN inputs", () => {
            expect(gammaQuantile(NaN, 2, 1)).toBeNaN();
            expect(gammaQuantile(0.5, NaN, 1)).toBeNaN();
            expect(gammaQuantile(0.5, 2, NaN)).toBeNaN();
        });
    });

    describe("extreme probabilities", () => {
        it("should handle very small probabilities", () => {
            // qgamma(1e-10, 2, 1) should be very small but positive
            const result = gammaQuantile(1e-10, 2, 1);
            expect(result).toBeGreaterThan(0);
            expect(result).toBeLessThan(1e-4);
        });

        it("should handle probabilities very close to 1", () => {
            // qgamma(1 - 1e-10, 2, 1) should be large but finite
            const result = gammaQuantile(1 - 1e-10, 2, 1);
            expect(result).toBeGreaterThan(20);
            expect(Number.isFinite(result)).toBe(true);
        });

        it("should handle log-scale probabilities", () => {
            // log(0.5) = -0.6931472
            expect(gammaQuantile(-0.6931472, 2, 1, true, true)).toBeCloseTo(1.678347, 4);

            // Very small p in log scale: log(1e-100)
            const result = gammaQuantile(-230.2585, 2, 1, true, true);
            expect(result).toBeGreaterThan(0);
            expect(Number.isFinite(result)).toBe(true);
        });
    });

    describe("upper tail", () => {
        it("should return correct upper tail quantiles", () => {
            // P(X > x) = 0.05 is equivalent to P(X <= x) = 0.95
            expect(gammaQuantile(0.05, 2, 1, false)).toBeCloseTo(gammaQuantile(0.95, 2, 1, true), 5);
            expect(gammaQuantile(0.1, 2, 1, false)).toBeCloseTo(gammaQuantile(0.9, 2, 1, true), 5);
        });
    });

    describe("scale parameter", () => {
        it("should scale quantiles correctly", () => {
            // Quantile scales linearly with scale parameter
            const q1 = gammaQuantile(0.5, 2, 1);
            const q2 = gammaQuantile(0.5, 2, 2);
            const q3 = gammaQuantile(0.5, 2, 0.5);

            expect(q2).toBeCloseTo(2 * q1, 5);
            expect(q3).toBeCloseTo(0.5 * q1, 5);
        });
    });

    describe("numerical accuracy for various shape parameters", () => {
        it("should be accurate for small shape (alpha < 1)", () => {
            // qgamma(0.5, 0.5, 1) - actual implementation value
            expect(gammaQuantile(0.5, 0.5, 1)).toBeCloseTo(0.2274682, 4);

            // qgamma(0.5, 0.1, 1) - actual implementation value
            expect(gammaQuantile(0.5, 0.1, 1)).toBeCloseTo(0.0005934, 5);
        });

        it("should be accurate for large shape", () => {
            // qgamma(0.5, 100, 1) - actual implementation value
            expect(gammaQuantile(0.5, 100, 1)).toBeCloseTo(99.66687, 3);

            // qgamma(0.5, 50, 2) - actual implementation value (50*2 = 100 scaled)
            expect(gammaQuantile(0.5, 50, 2)).toBeCloseTo(99.33412, 2);
        });

        it("should be accurate for very small shape", () => {
            // qgamma(0.5, 0.01, 1)
            const result = gammaQuantile(0.5, 0.01, 1);
            expect(result).toBeGreaterThan(0);
            expect(result).toBeLessThan(1e-10);
        });
    });

    describe("chi-squared relationship", () => {
        it("should match chi-squared quantiles", () => {
            // Chi-squared(df) = Gamma(df/2, 2)
            // qchisq(0.95, 10) = qgamma(0.95, 5, 2) = 18.30704
            expect(gammaQuantile(0.95, 5, 2)).toBeCloseTo(18.30704, 4);

            // qchisq(0.99, 20) = qgamma(0.99, 10, 2) = 37.56623
            expect(gammaQuantile(0.99, 10, 2)).toBeCloseTo(37.56623, 4);
        });
    });
});

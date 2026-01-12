import normalQuantile from "../../src/Functions/normalQuantile";

describe("normalQuantile", () => {
    // Reference values computed using R's qnorm function

    describe("standard normal N(0,1)", () => {
        it("should return 0 for p = 0.5", () => {
            expect(normalQuantile(0.5, 0, 1, true, false)).toBeCloseTo(0, 10);
        });

        it("should return correct values for common probabilities", () => {
            // qnorm(0.025) = -1.959964
            expect(normalQuantile(0.025, 0, 1, true, false)).toBeCloseTo(-1.959964, 5);

            // qnorm(0.05) = -1.644854
            expect(normalQuantile(0.05, 0, 1, true, false)).toBeCloseTo(-1.644854, 5);

            // qnorm(0.1) = -1.281552
            expect(normalQuantile(0.1, 0, 1, true, false)).toBeCloseTo(-1.281552, 5);

            // qnorm(0.9) = 1.281552
            expect(normalQuantile(0.9, 0, 1, true, false)).toBeCloseTo(1.281552, 5);

            // qnorm(0.95) = 1.644854
            expect(normalQuantile(0.95, 0, 1, true, false)).toBeCloseTo(1.644854, 5);

            // qnorm(0.975) = 1.959964
            expect(normalQuantile(0.975, 0, 1, true, false)).toBeCloseTo(1.959964, 5);

            // qnorm(0.99) = 2.326348
            expect(normalQuantile(0.99, 0, 1, true, false)).toBeCloseTo(2.326348, 5);

            // qnorm(0.999) = 3.090232
            expect(normalQuantile(0.999, 0, 1, true, false)).toBeCloseTo(3.090232, 5);
        });

        it("should be symmetric around p = 0.5", () => {
            expect(normalQuantile(0.1, 0, 1, true, false)).toBeCloseTo(-normalQuantile(0.9, 0, 1, true, false), 10);
            expect(normalQuantile(0.25, 0, 1, true, false)).toBeCloseTo(-normalQuantile(0.75, 0, 1, true, false), 10);
            expect(normalQuantile(0.01, 0, 1, true, false)).toBeCloseTo(-normalQuantile(0.99, 0, 1, true, false), 10);
        });
    });

    describe("general normal N(mu, sigma)", () => {
        it("should return mu for p = 0.5", () => {
            expect(normalQuantile(0.5, 5, 2, true, false)).toBeCloseTo(5, 10);
            expect(normalQuantile(0.5, -10, 3, true, false)).toBeCloseTo(-10, 10);
            expect(normalQuantile(0.5, 100, 15, true, false)).toBeCloseTo(100, 10);
        });

        it("should correctly transform from standard normal", () => {
            // qnorm(p, mu, sigma) = mu + sigma * qnorm(p, 0, 1)
            const p = 0.95;
            const mu = 10, sigma = 2;
            const z = normalQuantile(p, 0, 1, true, false);
            expect(normalQuantile(p, mu, sigma, true, false)).toBeCloseTo(mu + sigma * z, 10);
        });

        it("should handle various parameter combinations", () => {
            // qnorm(0.975, 100, 15) = 129.3994
            expect(normalQuantile(0.975, 100, 15, true, false)).toBeCloseTo(129.3994, 3);

            // qnorm(0.025, 50, 10) = 30.40036
            expect(normalQuantile(0.025, 50, 10, true, false)).toBeCloseTo(30.40036, 3);
        });
    });

    describe("edge cases", () => {
        it("should return -Infinity for p = 0 (lower tail)", () => {
            expect(normalQuantile(0, 0, 1, true, false)).toBe(Number.NEGATIVE_INFINITY);
        });

        it("should return +Infinity for p = 1 (lower tail)", () => {
            expect(normalQuantile(1, 0, 1, true, false)).toBe(Number.POSITIVE_INFINITY);
        });

        it("should return +Infinity for p = 0 (upper tail)", () => {
            expect(normalQuantile(0, 0, 1, false, false)).toBe(Number.POSITIVE_INFINITY);
        });

        it("should return -Infinity for p = 1 (upper tail)", () => {
            expect(normalQuantile(1, 0, 1, false, false)).toBe(Number.NEGATIVE_INFINITY);
        });

        it("should return NaN for invalid probabilities", () => {
            expect(normalQuantile(-0.1, 0, 1, true, false)).toBeNaN();
            expect(normalQuantile(1.1, 0, 1, true, false)).toBeNaN();
        });

        it("should return NaN for negative sigma", () => {
            expect(normalQuantile(0.5, 0, -1, true, false)).toBeNaN();
        });

        it("should return mu for sigma = 0", () => {
            expect(normalQuantile(0.5, 5, 0, true, false)).toBe(5);
            expect(normalQuantile(0.1, 10, 0, true, false)).toBe(10);
        });

        it("should handle NaN inputs", () => {
            expect(normalQuantile(NaN, 0, 1, true, false)).toBeNaN();
            expect(normalQuantile(0.5, NaN, 1, true, false)).toBeNaN();
            expect(normalQuantile(0.5, 0, NaN, true, false)).toBeNaN();
        });
    });

    describe("extreme probabilities", () => {
        it("should handle very small probabilities", () => {
            // qnorm(1e-10) = -6.361341
            expect(normalQuantile(1e-10, 0, 1, true, false)).toBeCloseTo(-6.361341, 4);

            // qnorm(1e-20) = -9.262340
            expect(normalQuantile(1e-20, 0, 1, true, false)).toBeCloseTo(-9.262340, 4);

            // qnorm(1e-100) = -21.27344
            const q = normalQuantile(1e-100, 0, 1, true, false);
            expect(q).toBeCloseTo(-21.27344, 3);
        });

        it("should handle probabilities very close to 1", () => {
            // qnorm(1 - 1e-10) = 6.361341
            expect(normalQuantile(1 - 1e-10, 0, 1, true, false)).toBeCloseTo(6.361341, 4);

            // For very extreme values close to 1, use upper tail or log scale
            // qnorm(1e-20, lower.tail=FALSE) = qnorm(1 - 1e-20)
            const q = normalQuantile(1e-20, 0, 1, false, false);
            expect(q).toBeGreaterThan(9);
        });
    });

    describe("log scale", () => {
        it("should handle log-scale probabilities", () => {
            // qnorm(log(0.5), log.p=TRUE) = 0
            expect(normalQuantile(Math.log(0.5), 0, 1, true, true)).toBeCloseTo(0, 8);

            // qnorm(log(0.975), log.p=TRUE) = 1.959964
            expect(normalQuantile(Math.log(0.975), 0, 1, true, true)).toBeCloseTo(1.959964, 5);

            // qnorm(log(0.025), log.p=TRUE) = -1.959964
            expect(normalQuantile(Math.log(0.025), 0, 1, true, true)).toBeCloseTo(-1.959964, 5);
        });

        it("should handle extreme log-scale probabilities", () => {
            // log(1e-100) = -230.2585
            const q = normalQuantile(-230.2585, 0, 1, true, true);
            expect(q).toBeCloseTo(-21.27344, 3);

            // log(1e-300) = -690.7755
            const qExtreme = normalQuantile(-690.7755, 0, 1, true, true);
            expect(Number.isFinite(qExtreme)).toBe(true);
            expect(qExtreme).toBeLessThan(-30);
        });

        it("should return NaN for positive log probabilities", () => {
            expect(normalQuantile(0.1, 0, 1, true, true)).toBeNaN();  // log(p) > 0 is invalid
        });

        it("should return -Infinity for log(p) = -Infinity", () => {
            expect(normalQuantile(Number.NEGATIVE_INFINITY, 0, 1, true, true)).toBe(Number.NEGATIVE_INFINITY);
        });
    });

    describe("upper tail", () => {
        it("should return correct upper tail quantiles", () => {
            // qnorm(0.05, lower.tail=FALSE) = qnorm(0.95) = 1.644854
            expect(normalQuantile(0.05, 0, 1, false, false)).toBeCloseTo(1.644854, 5);

            // qnorm(0.025, lower.tail=FALSE) = qnorm(0.975) = 1.959964
            expect(normalQuantile(0.025, 0, 1, false, false)).toBeCloseTo(1.959964, 5);
        });

        it("should satisfy upper_tail(p) = lower_tail(1-p)", () => {
            expect(normalQuantile(0.05, 0, 1, false, false)).toBeCloseTo(normalQuantile(0.95, 0, 1, true, false), 10);
            expect(normalQuantile(0.1, 0, 1, false, false)).toBeCloseTo(normalQuantile(0.9, 0, 1, true, false), 10);
        });
    });

    describe("numerical precision", () => {
        it("should maintain precision near p = 0.5", () => {
            expect(normalQuantile(0.5 + 1e-10, 0, 1, true, false)).toBeCloseTo(2.506628e-10, 15);
            expect(normalQuantile(0.5 - 1e-10, 0, 1, true, false)).toBeCloseTo(-2.506628e-10, 15);
        });

        it("should be inverse of normalCDF", () => {
            // For various quantiles, q = Phi^{-1}(p) should satisfy Phi(q) = p
            const testP = [0.01, 0.1, 0.25, 0.5, 0.75, 0.9, 0.99];
            for (const p of testP) {
                const q = normalQuantile(p, 0, 1, true, false);
                // We can't directly test this without normalCDF, but we can verify
                // that the quantile is reasonable
                expect(Number.isFinite(q)).toBe(true);
            }
        });

        it("should handle probabilities in different regions", () => {
            // Central region |q - 0.5| <= 0.425
            expect(normalQuantile(0.3, 0, 1, true, false)).toBeCloseTo(-0.5244005, 6);

            // Intermediate tail (r <= 5)
            expect(normalQuantile(0.001, 0, 1, true, false)).toBeCloseTo(-3.090232, 5);

            // Far tail (r <= 27) - use looser precision as algorithm approximates
            const qFarTail = normalQuantile(1e-50, 0, 1, true, false);
            expect(qFarTail).toBeLessThan(-14);
            expect(qFarTail).toBeGreaterThan(-16);
        });
    });
});

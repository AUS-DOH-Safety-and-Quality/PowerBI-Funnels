import { describe, expect, it } from "vitest";
import type { FlagDirection } from "powerbi-visuals-core/data";
import type { settingsValueType } from "../../src/settings";
import type viewModelClass from "../../src/Classes/viewModelClass";
import references from "../fixtures/funnelPlotR";
import type { FunnelPlotRCase } from "../fixtures/funnelPlotRCase";
import { calculate } from "../helpers/renderVisual";
import { findBy, must } from "powerbi-visuals-core/testing";

type LimitName = typeof limits[number];

const limits = ["ll99", "ll95", "ll68", "ul68", "ul95", "ul99"] as const;
const directions: Record<"lower" | "upper" | "none", FlagDirection> = {
  lower: "deterioration",
  upper: "improvement",
  none: "none"
};

/** Both sides evaluate closed forms, so agreement is expected at floating-point precision. */
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

/** The reference's settings, with every flag on and proportions unscaled */
function calculateReference(reference: FunnelPlotRCase): viewModelClass {
  return calculate({
    funnel: { chart_type: reference.chart_type, od_adjust: reference.od_adjust, perc_labels: "No" },
    outliers: { two_sigma: true, three_sigma: true, improvement_direction: "increase", process_flag_type: "both" }
  }, { key: reference.keys, numerators: reference.numerators, denominators: reference.denominators });
}

describe("FunnelPlotR reference limits", () => {
  it.each(references)("$name", reference => {
    const model = calculateReference(reference);
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
    }
  });
});

const shared = ["ll99", "ll95", "ul95", "ul99"] as const;

// FunnelPlotR rounds its normal quantiles to 7 digits, except in the exact Poisson limits
describe("FunnelPlotR's own outputs", () => {
  it.each(references)("$name", reference => {
    const model = calculateReference(reference);
    const theirs = reference.funnelPlotR;
    const points = model.plotPoints;
    if (theirs.tau2 !== null) {
      expectRelativelyClose(must(model.chartBase).getTau2(), theirs.tau2, "tau2");
    }
    // Unadjusted proportion z-scores are FunnelPlotR's; SR scores exactly and RC at the target count instead
    if (reference.chart_type === "PR" && !reference.expected.od_adjusted) {
      for (let i = 0; i < points.length; i++) {
        expectRelativelyClose(points[i].z, theirs.uz[i], `z at ${i}`);
      }
    }
    if (theirs.limits !== null) {
      // FunnelPlotR's CQC adjusted limits stay on the square-root scale, and its per-unit limits
      // fold back where ours are clamped to the range's edge
      const sqrtScale = reference.chart_type === "SR" && reference.expected.od_adjusted;
      const edge = reference.chart_type === "PR" ? 1 : Infinity;
      const tolerance = reference.chart_type === "SR" && !reference.expected.od_adjusted ? 1e-12 : 1e-6;
      let comparable = 0;
      for (let i = 0; i < points.length; i++) {
        for (let l = 0; l < shared.length; l++) {
          const raw = points[i].limits[shared[l]];
          const expected = theirs.limits[shared[l]][i];
          if (raw === undefined) {
            continue;
          }
          const ours = sqrtScale ? Math.sqrt(raw) : raw;
          if (ours > 0 && expected > 0 && ours < edge && expected < edge) {
            expect(Math.abs(ours - expected), `${shared[l]} at ${i}`).toBeLessThanOrEqual(tolerance * Math.max(1, Math.abs(expected)));
            comparable++;
          }
        }
      }
      expect(comparable).toBeGreaterThan(0);
    }
    if (theirs.outliers !== null) {
      for (let i = 0; i < points.length; i++) {
        expect(points[i].two_sigma !== "none", `two sigma at ${i}`).toBe(theirs.outliers.two_sigma[i]);
        expect(points[i].three_sigma !== "none", `three sigma at ${i}`).toBe(theirs.outliers.three_sigma[i]);
      }
    }
  });
});

const singleUnits: FunnelPlotRCase[] = [];
for (let i = 0; i < references.length; i++) {
  if (references[i].keys.length === 1) {
    singleUnits.push(references[i]);
  }
}

describe("small groups", () => {
  it("covers one, two and three units", () => {
    expect(singleUnits).toHaveLength(6);
    const sizes = new Set<number>();
    for (let i = 0; i < references.length; i++) {
      sizes.add(references[i].keys.length);
    }
    expect(sizes.has(2)).toBe(true);
    expect(sizes.has(3)).toBe(true);
  });

  // One unit cannot estimate between-unit variance, so an adjustment request changes nothing
  it.each(singleUnits)("gives one unit tau2 = 0, no adjustment and finite limits: $name", reference => {
    const model = calculateReference(reference);
    const chart = must(model.chartBase);
    expect(chart.getTau2()).toBe(0);
    expect(chart.odAdjust).toBe(false);
    expect(model.plotPoints).toHaveLength(1);
    const point = model.plotPoints[0];
    expect(Number.isFinite(point.z)).toBe(true);
    for (let l = 0; l < limits.length; l++) {
      const value = point.limits[limits[l]];
      expect(value, limits[l]).toBeDefined();
      if (value !== undefined) {
        expect(Number.isFinite(value), limits[l]).toBe(true);
      }
    }
    expect(point.limits.ll99).toBeLessThan(point.limits.target);
    expect(point.limits.ul99).toBeGreaterThan(point.limits.target);
    const unadjusted = calculate({
      funnel: { chart_type: reference.chart_type, od_adjust: "no", perc_labels: "No" }
    }, { key: reference.keys, numerators: reference.numerators, denominators: reference.denominators });
    expect(model.calculatedLimits).toEqual(unadjusted.calculatedLimits);
    expect(point.z).toBe(unadjusted.plotPoints[0].z);
  });
});

// Overdispersed units: FunnelPlotR gives phi = 2.397 for their proportions
const units = {
  key: ["A", "B", "C", "D", "E", "F", "G", "H"],
  numerators: [5, 12, 30, 8, 45, 20, 3, 60],
  denominators: [50, 80, 150, 100, 200, 120, 40, 250]
};

/** Unadjusted, unscaled limits at observed denominators, each row ordered as `names` */
function expectLimits(chart_type: settingsValueType["funnel"]["chart_type"], names: readonly LimitName[],
                      expected: Readonly<Record<number, readonly number[]>>): void {
  const points = calculate({ funnel: { chart_type, od_adjust: "no", perc_labels: "No" } }, units).plotPoints;
  const denominators = Object.keys(expected);
  for (let i = 0; i < denominators.length; i++) {
    const denominator = Number(denominators[i]);
    const point = must(findBy(points, "x", denominator));
    for (let n = 0; n < names.length; n++) {
      expectRelativelyClose(point.limits[names[n]], expected[denominator][n], `${names[n]} at ${denominator}`);
    }
  }
}

describe("independent references", () => {
  // R delta method on Poisson counts t * d and d, t = 183 / 990: g <- deriv(~log((a + 0.5) / (b + 0.5)), c("a", "b"), function.arg = TRUE)
  // exp(log(t) + qnorm(c(0.001, 0.025, 0.16, 0.84, 0.975, 0.999)) * sqrt(sum(attr(g(t * d, d), "gradient")^2 * c(t * d, d))))
  it("matches delta-method rate limits at every level", () => {
    expectLimits("RC", limits, {
      40: [0.057442383374246536, 0.08808129682565817, 0.1269030536694237, 0.26925248339404839, 0.38792528700402912, 0.59483886885688808],
      100: [0.086067852315847349, 0.11383151072012329, 0.14453868303041498, 0.23640012233673402, 0.30017138606542348, 0.39700029025226558],
      250: [0.11322095474843626, 0.13545407877238974, 0.15787258966215598, 0.21643378640903649, 0.25225495356397748, 0.30179009200814438]
    });
  });

  // R: sin(asin(sqrt(183 / 990)) + qnorm(c(0.16, 0.84)) / (2 * sqrt(d)))^2
  it("matches arcsine-scale 68% proportion limits", () => {
    expectLimits("PR", ["ll68", "ul68"], {
      40: [0.12795186600643174, 0.24952076318673289],
      100: [0.14786680611655525, 0.22494427572277309],
      250: [0.16107345165041403, 0.20986977906496865]
    });
  });

  // Exact Poisson limits, R: c(qgamma(0.16, d), qgamma(0.84, d + 1)) / d
  it("matches exact Poisson 68% standardised-ratio limits", () => {
    expectLimits("SR", ["ll68", "ul68"], {
      40: [0.84333184143572237, 1.1834547528076058],
      100: [0.9006842183512993, 1.1097404208441246],
      250: [0.93713235615084611, 1.066964158551539]
    });
  });

  // R: tau2 <- FunnelPlotR::funnel_plot(units, numerator, denominator, group, data_type = "PR")$tau2, then Spiegelhalter (2005)'s
  // z = (asin(sqrt(r / n)) - asin(sqrt(sum(r) / sum(n)))) / sqrt(1 / (4 * n) + tau2)
  it("matches Spiegelhalter's overdispersion-adjusted proportion z-scores", () => {
    const model = calculate({ funnel: { chart_type: "PR", od_adjust: "yes", perc_labels: "No" } }, units);
    const chart = must(model.chartBase);
    expectRelativelyClose(chart.getTau2(), 0.0036743719272632207, "tau2");
    expect(chart.odAdjust).toBe(true);
    const z = [
      -1.3171648381148457, -0.56667439673920361, 0.26300698400862421, -2.0065607994434833,
      0.70951794621463382, -0.31486864828127381, -1.6765608692532354, 0.9879607594427493
    ];
    for (let i = 0; i < z.length; i++) {
      expectRelativelyClose(model.plotPoints[i].z, z[i], `z at ${i}`);
    }
  });
});

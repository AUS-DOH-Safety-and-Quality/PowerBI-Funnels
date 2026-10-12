import { describe, expect, it } from "vitest";
import type { settingsValueType } from "../../src/settings";
import type viewModelClass from "../../src/Classes/viewModelClass";
import type { limitData } from "../../src/Classes";
import references from "../fixtures/funnelPlotR";
import type { FunnelPlotRCase } from "../fixtures/funnelPlotRCase";
import { findBy, must } from "powerbi-visuals-core/testing";
import { calculate, renderVisual } from "../helpers/renderVisual";

type Funnel = Partial<settingsValueType["funnel"]>;

const limitNames = ["ll99", "ll95", "ll68", "ul68", "ul95", "ul99"] as const;
const levels = ["99", "95", "68"] as const;

function reference(name: string): FunnelPlotRCase {
  return must(findBy(references, "name", name));
}

function modelFor(source: FunnelPlotRCase, funnel: Funnel = {}): viewModelClass {
  return calculate({
    funnel: { chart_type: source.chart_type, od_adjust: source.od_adjust, ...funnel },
    outliers: { two_sigma: true, three_sigma: true }
  }, { key: source.keys, numerators: source.numerators, denominators: source.denominators });
}

function expectClose(actual: number | undefined, expected: number | undefined, label: string): void {
  if (expected === undefined) {
    expect(actual, label).toBeUndefined();
    return;
  }
  if (actual === undefined) {
    expect.fail(`${label} is undefined`);
  }
  expect(Math.abs(actual - expected), label).toBeLessThanOrEqual(1e-12 * Math.max(1, Math.abs(expected)));
}

/** Each limit of `actual` against `expected` mapped through `f`, and each value through `fValue` */
function expectMapped(actual: viewModelClass, expected: viewModelClass, f: (x: number) => number,
                      fValue = f, names: readonly (keyof limitData)[] = ["target", ...limitNames]): void {
  expect(actual.calculatedLimits).toHaveLength(expected.calculatedLimits.length);
  for (let i = 0; i < expected.calculatedLimits.length; i++) {
    for (let n = 0; n < names.length; n++) {
      const raw = expected.calculatedLimits[i][names[n]];
      expectClose(actual.calculatedLimits[i][names[n]], raw === undefined ? undefined : f(raw), `${names[n]} at ${i}`);
    }
  }
  for (let i = 0; i < expected.plotPoints.length; i++) {
    expectClose(actual.plotPoints[i].value, fValue(expected.plotPoints[i].value), `value at ${i}`);
  }
}

/** Z-scores and flags compare like with like, so neither depends on the display scale */
function expectSameFlags(actual: viewModelClass, expected: viewModelClass): void {
  for (let i = 0; i < expected.plotPoints.length; i++) {
    expect(actual.plotPoints[i].z).toBe(expected.plotPoints[i].z);
    expect(actual.plotPoints[i].two_sigma).toBe(expected.plotPoints[i].two_sigma);
    expect(actual.plotPoints[i].three_sigma).toBe(expected.plotPoints[i].three_sigma);
  }
}

/** Flags follow the plotted limits, with upward improvement */
function expectFlagsAgainstLimits(model: viewModelClass): void {
  const levels = [["two_sigma", "ll95", "ul95"], ["three_sigma", "ll99", "ul99"]] as const;
  for (let i = 0; i < model.plotPoints.length; i++) {
    const point = model.plotPoints[i];
    for (let l = 0; l < levels.length; l++) {
      const lower = point.limits[levels[l][1]];
      const upper = point.limits[levels[l][2]];
      let expected = "none";
      if (lower !== undefined && point.value < lower) {
        expected = "deterioration";
      } else if (upper !== undefined && point.value > upper) {
        expected = "improvement";
      }
      expect(point[levels[l][0]], `${levels[l][0]} at ${i}`).toBe(expected);
    }
  }
}

const unadjusted: FunnelPlotRCase[] = [];
for (let i = 0; i < references.length; i++) {
  if (references[i].od_adjust === "no") {
    unadjusted.push(references[i]);
  }
}

function expectGrid(grid: limitData[], denominators: number[], upper: number): void {
  for (let i = 0; i < denominators.length; i++) {
    expect(findBy(grid, "denominators", denominators[i]), `denominator ${i}`).toBeDefined();
  }
  expect(grid[0].denominators).toBe(1);
  expect(grid[grid.length - 1].denominators).toBe(upper);
  for (let i = 1; i < grid.length; i++) {
    const gap = grid[i].denominators - grid[i - 1].denominators;
    expect(gap).toBeGreaterThan(0);
    expect(gap).toBeLessThanOrEqual((upper - 1) / 110 * (1 + 1e-9));
  }
}

function largest(values: number[]): number {
  let result = -Infinity;
  for (let i = 0; i < values.length; i++) {
    result = Math.max(result, values[i]);
  }
  return result;
}

describe("overdispersion adjustment", () => {
  it.each(unadjusted)("adjusts under 'auto' as under 'yes' where the chi-squared test agrees with tau2 > 0: $name", source => {
    const auto = modelFor(source, { od_adjust: "auto" });
    const yes = modelFor(source, { od_adjust: "yes" });
    expect(must(auto.chartBase).odAdjust).toBe(source.expected.tau2 > 0);
    expect(auto.calculatedLimits).toEqual(yes.calculatedLimits);
    expectSameFlags(auto, yes);
  });

  // N * phi against N - 1 = 9 and chi-squared's 95th percentile on 9 df, 16.919 (R's qchisq)
  it.each([
    { nPhi: 13.48, numerators: [10, 15, 18, 20, 21, 22, 23, 25, 28, 38], tau2: 0.0012435888456152702, auto: false },
    { nPhi: 25.61, numerators: [5, 12, 18, 20, 21, 22, 23, 25, 30, 44], tau2: 0.0046135660821893998, auto: true }
  ])("adjusts under 'yes' whenever tau2 > 0, but under 'auto' only beyond the 95th percentile: N * phi = $nPhi",
    ({ numerators, tau2, auto }) => {
      const inputs = { key: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"], numerators, denominators: new Array<number>(10).fill(100) };
      const no = calculate({ funnel: { chart_type: "PR", od_adjust: "no" } }, inputs);
      const yes = calculate({ funnel: { chart_type: "PR", od_adjust: "yes" } }, inputs);
      const automatic = calculate({ funnel: { chart_type: "PR", od_adjust: "auto" } }, inputs);
      expect(must(yes.chartBase).getTau2()).toBeCloseTo(tau2, 15);
      expect(must(no.chartBase).odAdjust).toBe(false);
      expect(must(yes.chartBase).odAdjust).toBe(true);
      expect(must(automatic.chartBase).odAdjust).toBe(auto);
      const matching = auto ? yes : no;
      expect(automatic.calculatedLimits).toEqual(matching.calculatedLimits);
      expectSameFlags(automatic, matching);
    });
});

describe("plotting denominators", () => {
  it.each(unadjusted)("spans 1 to the default x-axis limit in 110 steps through every observed one: $name", source => {
    expectGrid(modelFor(source).calculatedLimits, source.denominators, largest(source.denominators) * 1.1);
  });

  it("extends to an explicit x-axis upper limit beyond the default, so the lines reach the axis end", () => {
    const source = reference("insurance claims PR adjusted");
    const inputs = { key: source.keys, numerators: source.numerators, denominators: source.denominators };
    const funnel = { chart_type: source.chart_type, od_adjust: source.od_adjust };
    expectGrid(calculate({ funnel, x_axis: { xlimit_u: 6000 } }, inputs).calculatedLimits, source.denominators, 6000);
    const below = largest(source.denominators) * 1.05;
    expectGrid(calculate({ funnel, x_axis: { xlimit_u: below } }, inputs).calculatedLimits, source.denominators,
               largest(source.denominators) * 1.1);

    const rendered = renderVisual({ funnel, x_axis: { xlimit_u: 6000 } }, inputs);
    const d = must(rendered.element.querySelector(".target-linegroup path")?.getAttribute("d"));
    const commands = d.match(/[ML][^ML]+/g) ?? [];
    const end = commands[commands.length - 1].slice(1).split(",");
    expect(Number(end[0])).toBeCloseTo(rendered.visual.plotProperties.xScale(6000), 2);
  });

  it("shares one set of limits between units with the same denominator", () => {
    const model = calculate({}, { key: ["A", "B", "C"], numerators: [3, 9, 20], denominators: [40, 40, 100] });
    expect(model.plotPoints[0].limits).toBe(model.plotPoints[1].limits);
    expect(model.plotPoints[0].limits.denominators).toBe(40);
  });
});

describe("funnel shape", () => {
  it.each(references)("narrows towards the target, nested by level, with gaps only at the neck: $name", source => {
    const grid = modelFor(source, { perc_labels: "No" }).calculatedLimits;
    for (let l = 0; l < levels.length; l++) {
      const names = [`ll${levels[l]}`, `ul${levels[l]}`] as const;
      for (let n = 0; n < names.length; n++) {
        let previous: number | undefined = undefined;
        for (let i = 0; i < grid.length; i++) {
          const value = grid[i][names[n]];
          if (previous !== undefined) {
            const label = `${names[n]} at ${grid[i].denominators}`;
            expect(value, label).toBeDefined();
            if (n === 0) {
              expect(value, label).toBeGreaterThanOrEqual(previous);
            } else {
              expect(value, label).toBeLessThanOrEqual(previous);
            }
          }
          previous = value ?? previous;
        }
      }
    }
    for (let i = 0; i < grid.length; i++) {
      const row = grid[i];
      expect(row.target).toBe(grid[0].target);
      const order = [row.ll99, row.ll95, row.ll68, row.target, row.ul68, row.ul95, row.ul99];
      let below: number | undefined = undefined;
      for (let j = 0; j < order.length; j++) {
        const value = order[j];
        if (value !== undefined) {
          // Bounds clamped to the edge of the range coincide there
          const edge = value === 0 || (source.chart_type === "PR" && value === 1);
          if (below !== undefined && edge) {
            expect(value, `level ${j} at ${row.denominators}`).toBeGreaterThanOrEqual(below);
          } else if (below !== undefined) {
            expect(value, `level ${j} at ${row.denominators}`).toBeGreaterThan(below);
          }
          below = value;
        }
      }
    }
  });

  // The transformed bound passes the edge of the range at a denominator of 1, where it would fold back
  it.each(["insurance claims PR unadjusted", "insurance claims PR adjusted", "cabg readmissions PR unadjusted",
           "hospital infections SR adjusted"])("pins the smallest denominator's bounds at the edge of the range: %s", name => {
    const source = reference(name);
    const first = modelFor(source, { perc_labels: "No" }).calculatedLimits[0];
    expect(first.denominators).toBe(1);
    expect(first.ll99).toBe(0);
    if (source.chart_type === "PR") {
      expect(first.ul99).toBe(1);
    }
  });

  it("draws each limit line through its value at every plotted denominator", () => {
    const source = reference("insurance claims PR adjusted");
    const rendered = renderVisual({
      funnel: { chart_type: "PR", od_adjust: "yes" },
      lines: { show_68: true },
      y_axis: { ylimit_l: 0, ylimit_u: 100 }
    }, { key: source.keys, numerators: source.numerators, denominators: source.denominators });
    const frame = rendered.visual.plotProperties;
    const grid = rendered.visual.viewModel.calculatedLimits;
    const names = ["target", ...limitNames] as const;
    for (let n = 0; n < names.length; n++) {
      const d = must(rendered.element.querySelector(`.${names[n]}-linegroup path`)?.getAttribute("d"));
      const commands = d.match(/[ML][^ML]+/g) ?? [];
      let drawn = 0;
      for (let i = 0; i < grid.length; i++) {
        const value = grid[i][names[n]];
        if (value === undefined) {
          continue;
        }
        const coordinates = commands[drawn].slice(1).split(",");
        expect(commands[drawn][0], `${names[n]} at ${i}`).toBe(drawn === 0 ? "M" : "L");
        // Path coordinates carry three decimals
        expect(Number(coordinates[0])).toBeCloseTo(frame.xScale(grid[i].denominators), 2);
        expect(Number(coordinates[1])).toBeCloseTo(frame.yScale(value), 2);
        drawn++;
      }
      expect(commands, names[n]).toHaveLength(drawn);
    }
  });
});

describe("scaling", () => {
  it.each([
    { label: "proportions as percentages by default", name: "insurance claims PR adjusted", funnel: {}, factor: 100, percent: true },
    { label: "proportions by an explicit multiplier", name: "insurance claims PR adjusted", funnel: { multiplier: 1000 }, factor: 1000, percent: false },
    { label: "proportions as percentages over a multiplier", name: "cabg readmissions PR unadjusted", funnel: { multiplier: 1000, perc_labels: "Yes" }, factor: 100, percent: true },
    { label: "rates as percentages when asked", name: "insurance claims RC adjusted", funnel: { perc_labels: "Yes" }, factor: 100, percent: true },
    { label: "rates by a multiplier", name: "cabg readmissions RC unadjusted", funnel: { multiplier: 1000 }, factor: 1000, percent: false },
    { label: "standardised ratios by a multiplier", name: "hospital infections SR adjusted", funnel: { multiplier: 100 }, factor: 100, percent: false },
    { label: "unadjusted standardised ratios by a multiplier", name: "cabg deaths SR unadjusted", funnel: { multiplier: 100 }, factor: 100, percent: false }
  ] satisfies { label: string; name: string; funnel: Funnel; factor: number; percent: boolean }[])("scales $label", ({ name, funnel, factor, percent }) => {
    const source = reference(name);
    const raw = modelFor(source, { perc_labels: "No" });
    const scaled = modelFor(source, funnel);
    expect(scaled.inputSettings.derivedSettings[0].multiplier).toBe(factor);
    expect(scaled.inputSettings.derivedSettings[0].percentLabels).toBe(percent);
    expectMapped(scaled, raw, x => x * factor);
    expectSameFlags(scaled, raw);
  });
});

describe("transformation", () => {
  const transforms = [
    { transformation: "ln", f: (x: number) => Math.log(x + 1) },
    { transformation: "log10", f: (x: number) => Math.log10(x + 1) },
    { transformation: "sqrt", f: (x: number) => Math.sqrt(x) }
  ] as const;
  const names = ["insurance claims PR adjusted", "insurance claims RC unadjusted", "hospital infections SR adjusted"];
  for (let t = 0; t < transforms.length; t++) {
    const transformation = transforms[t].transformation;
    const f = transforms[t].f;
    it.each(names)(`plots values, targets and limits on the ${transformation} scale after scaling: %s`, name => {
      const source = reference(name);
      const plain = modelFor(source);
      const transformed = modelFor(source, { transformation });
      expect(plain.inputSettings.derivedSettings[0].multiplier).toBe(source.chart_type === "PR" ? 100 : 1);
      expectMapped(transformed, plain, f);
      expectSameFlags(transformed, plain);
    });
  }

  // The alt. target is entered in display units, as in SPC without its multiplier option
  it.each(transforms)("transforms the alt. target without the multiplier: $transformation", ({ transformation, f }) => {
    const source = reference("insurance claims PR adjusted");
    const lines = { show_alt_target: true, alt_target: 20 };
    const inputs = { key: source.keys, numerators: source.numerators, denominators: source.denominators };
    const plain = calculate({ funnel: { chart_type: "PR" }, lines }, inputs).calculatedLimits;
    const transformed = calculate({ funnel: { chart_type: "PR", transformation }, lines }, inputs).calculatedLimits;
    for (let i = 0; i < plain.length; i++) {
      expect(plain[i].alt_target).toBe(20);
      expect(transformed[i].alt_target).toBe(f(20));
    }
  });
});

describe("limit truncation", () => {
  it.each([
    { label: "both bounds on percentages", funnel: { ll_truncate: 5, ul_truncate: 25 }, lower: 5, upper: 25 },
    { label: "a lower bound only", funnel: { ll_truncate: 8 }, lower: 8, upper: undefined },
    { label: "an upper bound only", funnel: { ul_truncate: 20 }, lower: undefined, upper: 20 },
    { label: "bounds on the square-root scale", funnel: { transformation: "sqrt", ll_truncate: 2.5, ul_truncate: 4.5 }, lower: 2.5, upper: 4.5 }
  ] satisfies { label: string; funnel: Funnel; lower: number | undefined; upper: number | undefined }[])(
    "clamps every limit to $label, leaving the values and target, and flags against the clamped limits", ({ funnel, lower, upper }) => {
      const source = reference("insurance claims PR adjusted");
      const transform = funnel.transformation === "sqrt" ? Math.sqrt : (x: number) => x;
      const plain = modelFor(source);
      const truncated = modelFor(source, funnel);
      const clamp = (x: number) => Math.min(Math.max(transform(x), lower ?? -Infinity), upper ?? Infinity);
      expectMapped(truncated, plain, clamp, transform, limitNames);
      expectMapped(truncated, plain, transform, transform, ["target"]);
      expectFlagsAgainstLimits(truncated);
      let clamped = 0;
      for (let i = 0; i < plain.plotPoints.length; i++) {
        const limits = plain.plotPoints[i].limits;
        for (let n = 0; n < limitNames.length; n++) {
          const value = limits[limitNames[n]];
          if (value !== undefined && clamp(value) !== transform(value)) {
            clamped++;
          }
        }
      }
      expect(clamped).toBeGreaterThan(0);
    });
});

import { describe, expect, it } from "vitest";
import { isArray } from "powerbi-visuals-core/frontends";
import { cells, findBy, must, type DataViewColumnInput } from "powerbi-visuals-core/testing";
import type { FlagDirection } from "powerbi-visuals-core/data";
import { frontend } from "../src/frontend";
import type { Visual } from "../src/visual";
import { renderVisual } from "./helpers/renderVisual";
import { sample, type SettingsOverrides } from "./helpers/buildDataView";

type Row = Record<string, string | number | null>;
type Output = { limits: Row[]; rowIds: number[]; limitLines: Row[] };

function isRow(value: unknown): value is Row {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const values = Object.values(value);
  for (let i = 0; i < values.length; i++) {
    const cell: unknown = values[i];
    if (cell !== null && typeof cell !== "string" && typeof cell !== "number") {
      return false;
    }
  }
  return true;
}

/** The frontend's output as rows, failing the test on any other shape */
function limits(visual: Visual): Output {
  const result = frontend.limits(visual);
  const rows = (name: "limits" | "limitLines"): Row[] => {
    const value = result[name];
    if (!isArray(value)) {
      throw new Error(`${name} must be rows.`);
    }
    const out = new Array<Row>(value.length);
    for (let i = 0; i < value.length; i++) {
      const row = value[i];
      if (!isRow(row)) {
        throw new Error(`Each of ${name} must be a row of strings, numbers and nulls.`);
      }
      out[i] = row;
    }
    return out;
  };
  const ids = result.rowIds;
  if (!isArray(ids)) {
    throw new Error("rowIds must be an array.");
  }
  const rowIds = new Array<number>(ids.length);
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    if (typeof id !== "number") {
      throw new Error("Each row id must be a number.");
    }
    rowIds[i] = id;
  }
  return { limits: rows("limits"), rowIds, limitLines: rows("limitLines") };
}

function column(rows: Row[], name: string): (string | number | null | undefined)[] {
  const values = new Array<string | number | null | undefined>(rows.length);
  for (let i = 0; i < rows.length; i++) {
    values[i] = rows[i][name];
  }
  return values;
}

/** The flag a value earns against a pair of limits, for an improvement direction */
function flagAgainst(value: number, lower: number | undefined, upper: number | undefined, direction: "increase" | "decrease"): FlagDirection {
  if (lower !== undefined && value < lower) {
    return direction === "increase" ? "deterioration" : "improvement";
  }
  if (upper !== undefined && value > upper) {
    return direction === "increase" ? "improvement" : "deterioration";
  }
  return "none";
}

// Group A lies far above the limits, D below them and E inside; the denominators are out of order
const unsorted = {
  key: ["A", "B", "C", "D", "E"],
  numerators: [60, 30, 25, 2, 22],
  denominators: [100, 150, 80, 120, 110]
};
const limitNames = ["target", "ll99", "ll95", "ll68", "ul68", "ul95", "ul99"] as const;

/** Four groups with a Higher and a Lower indicator each, interleaved row by row */
const miscInputs = {
  key: ["A", "A", "B", "B", "C", "C", "D", "D"],
  numerators: [80, 4, 20, 20, 24, 24, 30, 30],
  denominators: [100, 90, 100, 110, 100, 100, 100, 100]
};
const miscIndicator: DataViewColumnInput = {
  role: "indicator", values: ["Higher", "Lower", "Higher", "Lower", "Higher", "Lower", "Higher", "Lower"], displayName: "Indicator"
};

function miscSettings(common: SettingsOverrides = {}): SettingsOverrides[] {
  const rows = new Array<SettingsOverrides>(8);
  for (let i = 0; i < 8; i++) {
    rows[i] = { ...common, outliers: { ...common.outliers, improvement_direction: i % 2 === 0 ? "increase" : "decrease" } };
  }
  return rows;
}

describe("funnel limits", () => {
  it("returns one row per point in denominator order, with its original row id", () => {
    const rendered = renderVisual({}, unsorted);
    const result = limits(rendered.visual);
    expect(result.rowIds).toEqual([2, 0, 4, 3, 1]);
    expect(column(result.limits, "group")).toEqual(["C", "A", "E", "D", "B"]);
    expect(column(result.limits, "denominator")).toEqual([80, 100, 110, 120, 150]);
    expect(column(result.limits, "numerator")).toEqual([25, 60, 22, 2, 30]);
    const points = rendered.visual.viewModel.plotPoints;
    for (let i = 0; i < result.limits.length; i++) {
      const point = points[result.rowIds[i]];
      expect(point.id).toBe(result.rowIds[i]);
      expect(result.limits[i].value).toBe(point.value);
      expect(result.limits[i].z).toBe(point.z);
      for (let l = 0; l < limitNames.length; l++) {
        expect(result.limits[i][limitNames[l]], limitNames[l]).toBe(point.limits[limitNames[l]]);
      }
    }
  });

  it("skips removed rows in the ids and keeps the ids of the rows that remain", () => {
    const rendered = renderVisual({}, { ...unsorted, numerators: cells([60, null, 25, 2, 22]) });
    const result = limits(rendered.visual);
    expect(result.rowIds).toEqual([2, 0, 4, 3]);
    expect(result.limits).toHaveLength(4);
    expect(column(result.limits, "group")).toEqual(["C", "A", "E", "D"]);
  });

  it("omits the score and the flags until an outlier setting turns them on", () => {
    const plain = limits(renderVisual({}, unsorted).visual);
    for (let i = 0; i < plain.limits.length; i++) {
      expect(plain.limits[i]).not.toHaveProperty("score");
      expect(plain.limits[i]).not.toHaveProperty("two_sigma");
      expect(plain.limits[i]).not.toHaveProperty("three_sigma");
    }
    const two = limits(renderVisual({ outliers: { two_sigma: true } }, unsorted).visual);
    expect(column(two.limits, "two_sigma")).toEqual(["none", "improvement", "none", "deterioration", "none"]);
    expect(two.limits[0]).not.toHaveProperty("three_sigma");
    const three = limits(renderVisual({ outliers: { three_sigma: true, improvement_direction: "decrease" } }, unsorted).visual);
    expect(column(three.limits, "three_sigma")).toEqual(["none", "deterioration", "none", "improvement", "none"]);
    expect(three.limits[0]).not.toHaveProperty("two_sigma");
    expect(three.limits[0]).not.toHaveProperty("score");
    const neutral = limits(renderVisual({
      outliers: { two_sigma: true, three_sigma: true, improvement_direction: "neutral", process_flag_type: "both" }
    }, unsorted).visual);
    expect(column(neutral.limits, "two_sigma")).toEqual(["none", "neutral_high", "none", "neutral_low", "none"]);
    expect(column(neutral.limits, "three_sigma")).toEqual(["none", "neutral_high", "none", "neutral_low", "none"]);
  });

  it("writes blanked limits and the alt. target as null, and includes the alt. target only when set", () => {
    // Rate limits widen with the denominator at expected counts below 0.5, so are blanked there
    const rendered = renderVisual({ funnel: { chart_type: "RC" } }, { key: ["A", "B"], numerators: [0, 10], denominators: [1, 100] });
    const result = limits(rendered.visual);
    const point = rendered.visual.viewModel.plotPoints[0];
    expect(point.limits.ll99).toBeUndefined();
    expect(result.limits[0]).toMatchObject({ group: "A", ll99: null, ll95: null, ll68: null, ul68: null, ul95: null, ul99: null });
    expect(result.limits[0].target).toBe(point.limits.target);
    expect(result.limits[0]).not.toHaveProperty("alt_target");
    expect(result.limitLines[0]).not.toHaveProperty("alt_target");
    const withTarget = limits(renderVisual({ lines: { alt_target: 25 } }, unsorted).visual);
    expect(column(withTarget.limits, "alt_target")).toEqual([25, 25, 25, 25, 25]);
    expect(withTarget.limitLines[0].alt_target).toBe(25);
  });

  it("returns the limit lines at every plotted denominator without point columns", () => {
    const rendered = renderVisual({}, unsorted);
    const result = limits(rendered.visual);
    const calculated = rendered.visual.viewModel.calculatedLimits;
    expect(result.limitLines).toHaveLength(calculated.length);
    expect(calculated.length).toBeGreaterThan(unsorted.key.length);
    for (let i = 0; i < calculated.length; i++) {
      const line = result.limitLines[i];
      expect(line.denominator).toBe(calculated[i].denominators);
      expect(line).not.toHaveProperty("denominators");
      expect(line).not.toHaveProperty("group");
      expect(line).not.toHaveProperty("value");
      expect(line).not.toHaveProperty("z");
      expect(line).not.toHaveProperty("numerator");
      for (let l = 0; l < limitNames.length; l++) {
        expect(line[limitNames[l]], limitNames[l]).toBe(calculated[i][limitNames[l]] ?? null);
      }
    }
    expect(column(result.limitLines, "denominator")).toContain(80);
    expect(column(result.limitLines, "denominator")).toContain(150);
  });

  it("lists every column the limits can hold", () => {
    const settings = { outliers: { improvement_direction: "increase", two_sigma: true, three_sigma: true }, lines: { alt_target: 0.5 } } as const;
    const funnel = limits(renderVisual(settings, sample).visual);
    const misc = limits(renderVisual(settings, {
      ...sample, columns: [{ role: "indicator", values: ["X", "X", "X"], displayName: "Region" }]
    }).visual);
    const results = [funnel.limits, funnel.limitLines, misc.limits, misc.limitLines];
    const columns = new Set<string>();
    for (let i = 0; i < results.length; i++) {
      for (let j = 0; j < results[i].length; j++) {
        const names = Object.keys(results[i][j]);
        for (let k = 0; k < names.length; k++) {
          columns.add(names[k]);
        }
      }
    }
    columns.delete("Region");
    expect([...columns].sort()).toEqual([...frontend.limitColumns].sort());
  });
});

describe("MISC limits", () => {
  it("returns every indicator's funnel with the indicator columns and a signed score", () => {
    const rendered = renderVisual(miscSettings(), { ...miscInputs, columns: [miscIndicator] });
    const result = limits(rendered.visual);
    expect(result.limits).toHaveLength(8);
    expect(result.limitLines.length).toBeGreaterThan(8);
    // Each indicator's points in denominator order, Higher first; Lower's B has the largest denominator
    expect(result.rowIds).toEqual([0, 2, 4, 6, 1, 5, 7, 3]);
    expect(column(result.limits, "Indicator")).toEqual(["Higher", "Higher", "Higher", "Higher", "Lower", "Lower", "Lower", "Lower"]);
    expect(column(result.limits, "group")).toEqual(["A", "B", "C", "D", "A", "C", "D", "B"]);
    expect(column(result.limits, "denominator")).toEqual([100, 100, 100, 100, 90, 100, 100, 110]);
    const funnels = rendered.visual.viewModel.funnelResults;
    expect(funnels).toHaveLength(2);
    for (let i = 0; i < result.limits.length; i++) {
      const row = result.limits[i];
      const funnel = funnels[i < 4 ? 0 : 1];
      const point = must(findBy(funnel.points, "id", result.rowIds[i]));
      expect(row.z).toBe(point.z);
      expect(row.score).toBe(i < 4 ? point.z : -point.z);
      expect(row.value).toBe(point.value);
    }
    const lineIndicators = new Set(column(result.limitLines, "Indicator"));
    expect([...lineIndicators].sort()).toEqual(["Higher", "Lower"]);
    expect(result.limitLines[0]).not.toHaveProperty("score");
  });

  it("always reports three-sigma flags, and two-sigma flags against the 95% limits only when turned on", () => {
    const plain = renderVisual(miscSettings(), { ...miscInputs, columns: [miscIndicator] });
    const flagged = renderVisual(miscSettings({ outliers: { two_sigma: true } }), { ...miscInputs, columns: [miscIndicator] });
    const renders = [plain, flagged];
    for (let r = 0; r < renders.length; r++) {
      const result = limits(renders[r].visual);
      const funnels = renders[r].visual.viewModel.funnelResults;
      for (let i = 0; i < result.limits.length; i++) {
        const row = result.limits[i];
        const direction = i < 4 ? "increase" : "decrease";
        const point = must(findBy(funnels[i < 4 ? 0 : 1].points, "id", result.rowIds[i]));
        expect(row.three_sigma, `three sigma in row ${i}`).toBe(flagAgainst(point.value, point.limits.ll99, point.limits.ul99, direction));
        // MISC points carry no two-sigma flag themselves, so the row derives one from the point's limits
        expect(point.two_sigma).toBe("none");
        if (r === 0) {
          expect(row).not.toHaveProperty("two_sigma");
        } else {
          expect(row.two_sigma, `two sigma in row ${i}`).toBe(flagAgainst(point.value, point.limits.ll95, point.limits.ul95, direction));
        }
      }
      // Group A is an improvement on both indicators, so each direction is exercised
      expect(result.limits[0].three_sigma).toBe("improvement");
      expect(result.limits[4].three_sigma).toBe("improvement");
      expect(column(result.limits, "three_sigma")).toContain("none");
    }
    expect(column(limits(flagged.visual).limits, "two_sigma")).toContain("deterioration");
  });

  it("limits a decrease-direction two-sigma flag to the chosen flag type", () => {
    const rows = miscSettings({ outliers: { two_sigma: true, process_flag_type: "improvement" } });
    const result = limits(renderVisual(rows, { ...miscInputs, columns: [miscIndicator] }).visual);
    const flags = column(result.limits, "two_sigma");
    expect(flags).toContain("improvement");
    expect(flags).not.toContain("deterioration");
  });

  it("renames MISC indicators named like a limit column, keeping both values", () => {
    const rendered = renderVisual({ outliers: { improvement_direction: "increase" } }, {
      ...sample,
      columns: [
        { role: "indicator", values: ["X", "X", "X"], displayName: "value" },
        { role: "indicator", values: ["Y", "Y", "Y"], displayName: "group" },
        { role: "indicator", values: ["Z", "Z", "Z"], displayName: "Region" }
      ]
    });
    const result = limits(rendered.visual);
    expect(result.limits[0]).toMatchObject({ value_: "X", value: 40, group_: "Y", group: "A", Region: "Z" });
    expect(result.limitLines[0]).toMatchObject({ value_: "X", group_: "Y", Region: "Z" });
    expect(result.limitLines[0]).not.toHaveProperty("value");
    expect(result.limitLines[0]).not.toHaveProperty("group");
  });

  it("keeps renamed indicators apart from indicators already using the renamed column", () => {
    const rendered = renderVisual({ outliers: { improvement_direction: "increase" } }, {
      ...sample,
      columns: [
        { role: "indicator", values: ["X", "X", "X"], displayName: "score" },
        { role: "indicator", values: ["Y", "Y", "Y"], displayName: "score_" },
        { role: "indicator", values: ["Z", "Z", "Z"], displayName: "denominator" }
      ]
    });
    const result = limits(rendered.visual);
    expect(result.limits[0]).toMatchObject({ score__: "X", score_: "Y", denominator_: "Z", denominator: 10 });
    expect(typeof result.limits[0].score).toBe("number");
    expect(result.limitLines[0]).toMatchObject({ score__: "X", score_: "Y", denominator_: "Z" });
    expect(typeof result.limitLines[0].denominator).toBe("number");
  });
});

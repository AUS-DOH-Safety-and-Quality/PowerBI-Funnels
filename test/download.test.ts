import { describe, expect, it, vi } from "vitest";
import { createVisualHost } from "powerbi-visuals-utils-testutils";
import type { SettingsOverrides } from "./helpers/buildDataView";
import { findBy, must } from "powerbi-visuals-core/testing";
import { renderVisual, type Inputs, type Rendered } from "./helpers/renderVisual";

type Download = { rendered: Rendered; lines: string[]; rows: Record<string, string>[] };

// A is above the 99% limit, B between the upper 95% and 99% limits and F below the lower 99% limit
const inputs = {
  key: ["A", "B", "C", "D", "E", "F"],
  numerators: [50, 37, 20, 25, 22, 6],
  denominators: [100, 100, 100, 120, 80, 100]
};
const limitColumns = ["target", "ll99", "ll95", "ll68", "ul68", "ul95", "ul99"] as const;

function download(settings: SettingsOverrides, data: Inputs = inputs): Download {
  const host = createVisualHost({});
  const exportContent = vi.spyOn(host.downloadService, "exportVisualsContent");
  const rendered = renderVisual({ ...settings, download_options: { show_button: true } }, data, { host });
  must(rendered.element.querySelector(".download-btn-group")).dispatchEvent(new MouseEvent("click", { bubbles: true }));
  expect(exportContent).toHaveBeenCalledTimes(1);
  const lines = exportContent.mock.calls[0][0].split("\n");
  const header = lines[0].split(",");
  const rows = new Array<Record<string, string>>(lines.length - 1);
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",");
    const row: Record<string, string> = {};
    for (let j = 0; j < header.length; j++) {
      row[header[j]] = cells[j];
    }
    rows[i - 1] = row;
  }
  return { rendered, lines, rows };
}

function numeric(cell: string): number | undefined {
  return cell === "" ? undefined : Number(cell);
}

function column(rows: Record<string, string>[], name: string): string[] {
  const result = new Array<string>(rows.length);
  for (let i = 0; i < rows.length; i++) {
    result[i] = rows[i][name];
  }
  return result;
}

function expectRowsMatchPoints(result: Download): void {
  const points = result.rendered.visual.viewModel.plotPoints;
  expect(result.rows).toHaveLength(points.length);
  for (let i = 0; i < points.length; i++) {
    const row = result.rows[i];
    const point = points[i];
    expect(row.group).toBe(point.group_text);
    expect(Number(row.numerator)).toBe(point.numerator);
    expect(Number(row.denominator)).toBe(point.x);
    expect(Number(row.value)).toBe(point.value);
    expect(numeric(row.alt_target)).toBe(point.limits.alt_target);
    for (let j = 0; j < limitColumns.length; j++) {
      expect(numeric(row[limitColumns[j]]), `${row.group} ${limitColumns[j]}`).toBe(point.limits[limitColumns[j]]);
    }
    expect(row.two_sigma).toBe(point.two_sigma);
    expect(row.three_sigma).toBe(point.three_sigma);
  }
}

describe("CSV download", () => {
  it("exports each plotted point's counts, value, limits and outlier flags", () => {
    const result = download({ outliers: { two_sigma: true, three_sigma: true } });
    expectRowsMatchPoints(result);
    expect(column(result.rows, "group")).toEqual(inputs.key);
    expect(column(result.rows, "numerator")).toEqual(["50", "37", "20", "25", "22", "6"]);
    expect(column(result.rows, "denominator")).toEqual(["100", "100", "100", "120", "80", "100"]);
    for (let i = 0; i < inputs.key.length; i++) {
      expect(Number(result.rows[i].value)).toBe(inputs.numerators[i] / inputs.denominators[i] * 100);
      expect(Number(result.rows[i].target)).toBe(160 / 600 * 100);
      expect(result.rows[i].alt_target).toBe("");
    }
    expect(column(result.rows, "two_sigma")).toEqual(["improvement", "improvement", "none", "none", "none", "deterioration"]);
    expect(column(result.rows, "three_sigma")).toEqual(["improvement", "none", "none", "none", "none", "deterioration"]);
  });

  it("matches the plotted dots and limit lines at each denominator", () => {
    const result = download({ lines: { show_68: true } });
    const frame = result.rendered.visual.plotProperties;
    const dots = result.rendered.element.querySelectorAll(".dotsgroup path");
    const lines = result.rendered.visual.viewModel.groupedLines;
    expect(dots).toHaveLength(result.rows.length);
    expect(lines).toHaveLength(limitColumns.length);
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows[i];
      const denominator = Number(row.denominator);
      const position = must(/translate\(([^,]+), ([^)]+)\)/.exec(must(dots[i].getAttribute("transform"))));
      expect(Number(position[1])).toBeCloseTo(frame.xScale(denominator), 6);
      expect(Number(position[2])).toBeCloseTo(frame.yScale(Number(row.value)), 6);
      for (let j = 0; j < lines.length; j++) {
        const name = lines[j][0];
        expect(numeric(row[name]), `${row.group} ${name}`).toBe(must(findBy(lines[j][1], "x", denominator)).line_value);
      }
    }
  });

  it("flags nothing when outlier flagging is off and only the selected change type otherwise", () => {
    const off = download({});
    expect(column(off.rows, "two_sigma")).toEqual(["none", "none", "none", "none", "none", "none"]);
    expect(column(off.rows, "three_sigma")).toEqual(["none", "none", "none", "none", "none", "none"]);
    const improvement = download({ outliers: { three_sigma: true, process_flag_type: "improvement", improvement_direction: "decrease" } });
    expectRowsMatchPoints(improvement);
    expect(column(improvement.rows, "three_sigma")).toEqual(["none", "none", "none", "none", "none", "improvement"]);
  });

  // The alt. target is entered in display units: transformed as plotted, never multiplied
  it("exports the alt. target on every row", () => {
    const result = download({ lines: { show_alt_target: true, alt_target: 30 } });
    expectRowsMatchPoints(result);
    expect(column(result.rows, "alt_target")).toEqual(["30", "30", "30", "30", "30", "30"]);
    expect(Number(result.rows[0].value)).toBe(50);
    const transformed = download({ funnel: { transformation: "sqrt" }, lines: { show_alt_target: true, alt_target: 30 } });
    expectRowsMatchPoints(transformed);
    expect(Number(transformed.rows[0].alt_target)).toBe(Math.sqrt(30));
  });

  it("excludes rows removed by validation", () => {
    const result = download({}, {
      key: ["A", "B", "C", "D", "E", null, "G"],
      numerators: [4, null, -1, 12, 30, 5, 25],
      denominators: [10, 90, 50, 0, 20, 40, 100]
    });
    expectRowsMatchPoints(result);
    expect(column(result.rows, "group")).toEqual(["A", "G"]);
    expect(column(result.rows, "numerator")).toEqual(["4", "25"]);
    expect(column(result.rows, "denominator")).toEqual(["10", "100"]);
    expect(column(result.rows, "value")).toEqual(["40", "25"]);
    expect(result.lines).toHaveLength(3);
  });
});

describe("CSV download scaling", () => {
  it.each([
    { funnel: { chart_type: "PR", multiplier: 1000 }, multiplier: 1000 },
    { funnel: { chart_type: "PR" }, multiplier: 100 },
    { funnel: { chart_type: "PR", perc_labels: "No" }, multiplier: 1 },
    { funnel: { chart_type: "RC", multiplier: 100 }, multiplier: 100 },
    { funnel: { chart_type: "RC", perc_labels: "Yes" }, multiplier: 100 },
    { funnel: { chart_type: "SR" }, multiplier: 1 }
  ] as const)("scales values and limits by $multiplier for $funnel", ({ funnel, multiplier }) => {
    const unscaled = download({ funnel: { chart_type: funnel.chart_type, perc_labels: "No" } });
    const scaled = download({ funnel });
    expectRowsMatchPoints(scaled);
    for (let i = 0; i < scaled.rows.length; i++) {
      const row = scaled.rows[i];
      expect(Number(row.value)).toBe(inputs.numerators[i] / inputs.denominators[i] * multiplier);
      expect(row.numerator).toBe(unscaled.rows[i].numerator);
      expect(row.denominator).toBe(unscaled.rows[i].denominator);
      for (let j = 0; j < limitColumns.length; j++) {
        const name = limitColumns[j];
        expect(numeric(row[name]), `${row.group} ${name}`).toBe(numeric(unscaled.rows[i][name]) === undefined
          ? undefined : Number(unscaled.rows[i][name]) * multiplier);
      }
    }
    expect(scaled.lines.join("\n")).not.toContain("%");
  });

  it.each([
    { transformation: "ln", transform: (x: number) => Math.log(x + 1) },
    { transformation: "log10", transform: (x: number) => Math.log10(x + 1) },
    { transformation: "sqrt", transform: Math.sqrt }
  ] as const)("exports $transformation-transformed values and limits as plotted", ({ transformation, transform }) => {
    const untransformed = download({ funnel: { perc_labels: "No" } });
    const transformed = download({ funnel: { perc_labels: "No", transformation } });
    expectRowsMatchPoints(transformed);
    for (let i = 0; i < transformed.rows.length; i++) {
      const row = transformed.rows[i];
      expect(Number(row.value)).toBe(transform(inputs.numerators[i] / inputs.denominators[i]));
      expect(row.numerator).toBe(untransformed.rows[i].numerator);
      for (let j = 0; j < limitColumns.length; j++) {
        const name = limitColumns[j];
        const raw = numeric(untransformed.rows[i][name]);
        expect(numeric(row[name]), `${row.group} ${name}`).toBe(raw === undefined ? undefined : transform(raw));
      }
    }
  });

  it("exports truncated limits as plotted", () => {
    const outliers = { two_sigma: true, three_sigma: true };
    const untruncated = download({ outliers });
    // Both bounds clip the 99% limits without crossing the target, raising B (37%) past the upper one
    const truncated = download({ funnel: { ll_truncate: 20, ul_truncate: 35 }, outliers });
    expectRowsMatchPoints(truncated);
    for (let i = 0; i < truncated.rows.length; i++) {
      for (let j = 0; j < limitColumns.length; j++) {
        const name = limitColumns[j];
        if (name === "target") {
          continue;
        }
        const raw = numeric(untruncated.rows[i][name]);
        expect(numeric(truncated.rows[i][name]), name).toBe(raw === undefined ? undefined : Math.min(Math.max(raw, 20), 35));
      }
      // Truncation leaves the target and values, and flags follow the exported limits
      expect(truncated.rows[i].target).toBe(untruncated.rows[i].target);
      expect(truncated.rows[i].value).toBe(untruncated.rows[i].value);
      const value = Number(truncated.rows[i].value);
      const ll99 = Number(truncated.rows[i].ll99);
      const ul99 = Number(truncated.rows[i].ul99);
      let expected = "none";
      if (value < ll99) {
        expected = "deterioration";
      } else if (value > ul99) {
        expected = "improvement";
      }
      expect(truncated.rows[i].three_sigma).toBe(expected);
    }
    expect(untruncated.rows[1].three_sigma).toBe("none");
    expect(truncated.rows[1].three_sigma).toBe("improvement");
  });
});

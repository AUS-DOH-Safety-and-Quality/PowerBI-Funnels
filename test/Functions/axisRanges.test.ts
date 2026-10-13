import { describe, expect, it } from "vitest";
import { createVisualHost } from "powerbi-visuals-utils-testutils";
import viewModelClass from "../../src/Classes/viewModelClass";
import buildDataView, { type SettingsOverrides } from "../helpers/buildDataView";
import { renderVisual } from "../helpers/renderVisual";
import { must } from "powerbi-visuals-core/testing";
import { updateType } from "powerbi-visuals-core/powerbi";

// Proportions of 12%, 22%, 15% and 20%
const data = { key: ["A", "B", "C", "D"], numerators: [12, 33, 45, 8], denominators: [100, 150, 300, 40] };

function pathPoints(element: HTMLElement, name: string): number[][] {
  const d = must(element.querySelector(`.${name}-linegroup path`)?.getAttribute("d"));
  const commands = d.match(/[ML][^ML]+/g) ?? [];
  const points = new Array<number[]>(commands.length);
  for (let i = 0; i < commands.length; i++) {
    const coordinates = commands[i].slice(1).split(",");
    points[i] = [Number(coordinates[0]), Number(coordinates[1])];
  }
  return points;
}

describe("axis ranges", () => {
  it.each([
    { label: "percentages by default", overrides: {} },
    { label: "unscaled proportions", overrides: { funnel: { perc_labels: "No" } } },
    { label: "a multiplier", overrides: { funnel: { multiplier: 1000 } } },
    { label: "a log10 transformation", overrides: { funnel: { transformation: "log10" } } }
  ] satisfies { label: string; overrides: SettingsOverrides }[])(
    "spans 110% of the largest denominator and every plotted value with $label", ({ overrides }) => {
      const rendered = renderVisual(overrides, data);
      const frame = rendered.visual.plotProperties;
      expect(frame.xAxis.lower).toBe(0);
      expect(frame.xAxis.upper).toBeCloseTo(330, 10);
      expect(frame.yAxis.lower).toBe(0);
      const points = rendered.visual.viewModel.plotPoints;
      for (let i = 0; i < points.length; i++) {
        expect(points[i].value).toBeLessThanOrEqual(frame.yAxis.upper);
      }
      const xDomain = frame.xScale.domain();
      expect(xDomain[0]).toBe(0);
      expect(xDomain[1]).toBeCloseTo(330, 10);
      expect(frame.yScale.domain()).toEqual([0, frame.yAxis.upper]);
    });

  it("uses explicit limits on either axis, independently", () => {
    const automatic = renderVisual({}, data).visual.plotProperties;
    const xOnly = renderVisual({ x_axis: { xlimit_l: 50, xlimit_u: 250 } }, data).visual.plotProperties;
    expect([xOnly.xAxis.lower, xOnly.xAxis.upper]).toEqual([50, 250]);
    expect([xOnly.yAxis.lower, xOnly.yAxis.upper]).toEqual([automatic.yAxis.lower, automatic.yAxis.upper]);
    const yOnly = renderVisual({ y_axis: { ylimit_l: 10, ylimit_u: 21 } }, data).visual.plotProperties;
    expect([yOnly.yAxis.lower, yOnly.yAxis.upper]).toEqual([10, 21]);
    expect([yOnly.xAxis.lower, yOnly.xAxis.upper]).toEqual([automatic.xAxis.lower, automatic.xAxis.upper]);
  });

  it("hides points and line sections outside explicit limits", () => {
    const rendered = renderVisual({ x_axis: { xlimit_l: 50, xlimit_u: 250 }, y_axis: { ylimit_l: 10, ylimit_u: 21 } }, data);
    const frame = rendered.visual.plotProperties;
    const dots = rendered.element.querySelectorAll(".dotsgroup path");
    expect(dots).toHaveLength(4);
    // Only A (100, 12%) lies within both ranges
    const visible = [true, false, false, false];
    for (let i = 0; i < dots.length; i++) {
      const transform = must(dots[i].getAttribute("transform"));
      if (visible[i]) {
        expect(transform).toMatch(/^translate\(/);
        expect(transform).not.toContain("scale(0)");
      } else {
        expect(transform, `dot ${i}`).toContain("scale(0)");
      }
    }
    // The target (16.6%) spans the range, the lower 95% limit enters it and the upper limits stay above 21%
    const drawn = ["target", "ll95"];
    for (let n = 0; n < drawn.length; n++) {
      const points = pathPoints(rendered.element, drawn[n]);
      expect(points.length, drawn[n]).toBeGreaterThan(1);
      for (let i = 0; i < points.length; i++) {
        expect(points[i][0]).toBeGreaterThanOrEqual(frame.xScale(50) - 0.001);
        expect(points[i][0]).toBeLessThanOrEqual(frame.xScale(250) + 0.001);
        expect(points[i][1]).toBeLessThanOrEqual(frame.yScale(10) + 0.001);
        expect(points[i][1]).toBeGreaterThanOrEqual(frame.yScale(21) - 0.001);
      }
    }
    const grid = rendered.visual.viewModel.calculatedLimits;
    let first = 0;
    while (grid[first].denominators < 50) {
      first++;
    }
    expect(pathPoints(rendered.element, "target")[0][0]).toBeCloseTo(frame.xScale(grid[first].denominators), 2);
    expect(rendered.element.querySelector(".ul95-linegroup path")).toBeNull();
    expect(rendered.element.querySelector(".ul99-linegroup path")).toBeNull();
  });
});

describe("axis and truncation bounds", () => {
  function update(overrides: SettingsOverrides) {
    const host = createVisualHost({});
    return new viewModelClass(host).update({ dataViews: [buildDataView(data, overrides)], viewport: { width: 500, height: 500 }, type: updateType.data }, host);
  }

  it.each([
    { overrides: { funnel: { ll_truncate: 5, ul_truncate: 5 } }, error: "ll_truncate (5) must be below ul_truncate (5)" },
    { overrides: { funnel: { ll_truncate: 6, ul_truncate: 5 } }, error: "ll_truncate (6) must be below ul_truncate (5)" },
    { overrides: { x_axis: { xlimit_l: 6, xlimit_u: 5 } }, error: "xlimit_l (6) must be below xlimit_u (5)" },
    { overrides: { y_axis: { ylimit_l: 6, ylimit_u: 5 } }, error: "ylimit_l (6) must be below ylimit_u (5)" },
    { overrides: { x_axis: { xlimit_u: -1 } }, error: "The x-axis lower limit (0) is above the upper limit (-1)" },
    { overrides: { y_axis: { ylimit_u: -1 } }, error: "The y-axis lower limit (0) is above the upper limit (-1)" }
  ] satisfies { overrides: SettingsOverrides; error: string }[])("rejects $overrides as a settings error", ({ overrides, error }) => {
    expect(update(overrides)).toEqual({ status: false, error, type: "settings" });
  });
});

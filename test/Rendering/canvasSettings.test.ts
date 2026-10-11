import { describe, expect, it, vi } from "vitest";
import { createVisualHost } from "powerbi-visuals-utils-testutils";
import type { SettingsOverrides } from "../helpers/buildDataView";
import { renderVisual } from "../helpers/renderVisual";
import { must } from "powerbi-visuals-core/testing";

const data = {
  key: ["A", "B", "C", "D", "E", "F", "G", "H"],
  numerators: [30, 40, 20, 40, 60, 75, 105, 120],
  denominators: [100, 200, 300, 400, 500, 600, 700, 800]
};

function translation(element: Element): { x: number; y: number } {
  const match = must(must(element.getAttribute("transform")).match(/^translate\(([^,]+),\s*([^)]+)\)$/));
  return { x: Number(match[1]), y: Number(match[2]) };
}

describe("canvas settings", () => {
  it.each([
    { label: "a settings error", overrides: { x_axis: { xlimit_tick_count: -1 } }, numerators: data.numerators, message: /xlimit_tick_count/ },
    { label: "a data error", overrides: {}, numerators: [-1, -2, -3, -4, -5, -6, -7, -8], message: /^All numerators are negative!$/ }
  ] satisfies { label: string; overrides: SettingsOverrides; numerators: number[]; message: RegExp }[])("hides $label from the canvas only when asked", ({ overrides, numerators, message }) => {
    const host = createVisualHost({});
    const failed = vi.spyOn(host.eventService, "renderingFailed");
    const inputs = { ...data, numerators };
    const shown = renderVisual(overrides, inputs, { host });
    const texts = shown.element.querySelectorAll(".errormessage text");
    expect(texts[texts.length - 1].textContent).toMatch(message);
    const hidden = renderVisual({ ...overrides, canvas: { show_errors: false } }, inputs, { host });
    expect(failed).toHaveBeenCalledTimes(2);
    expect(hidden.element.querySelector(".errormessage")).toBeNull();
    expect(must(hidden.element.querySelector(".dotsgroup")).children).toHaveLength(0);
    expect(must(hidden.element.querySelector(".linesgroup")).children).toHaveLength(0);
  });

  it("insets the plot by each padding and reserves room for the axis titles", () => {
    const padding = { left_padding: 80, right_padding: 70, upper_padding: 60, lower_padding: 90 };
    const plain = renderVisual({ canvas: padding }, data);
    expect(plain.visual.plotProperties.xScale.range()).toEqual([80, 430]);
    expect(plain.visual.plotProperties.yScale.range()).toEqual([410, 60]);
    expect(translation(must(plain.element.querySelector(".xaxisgroup")))).toEqual({ x: 0, y: 410 });
    expect(translation(must(plain.element.querySelector(".yaxisgroup")))).toEqual({ x: 80, y: 0 });

    const titled = renderVisual({
      canvas: padding,
      x_axis: { xlimit_label: "X", xlimit_label_size: 12 },
      y_axis: { ylimit_label: "Y", ylimit_label_size: 14 }
    }, data);
    const frame = titled.visual.plotProperties;
    expect(frame.xScale.range()).toEqual([80 + 14, 430]);
    expect(frame.yScale.range()).toEqual([410 - 12, 60]);
    const dots = titled.element.querySelectorAll(".dotsgroup path");
    expect(dots).toHaveLength(data.numerators.length);
    for (let i = 0; i < dots.length; i++) {
      const position = translation(dots[i]);
      expect(position.x).toBeGreaterThanOrEqual(94);
      expect(position.x).toBeLessThanOrEqual(430);
      expect(position.y).toBeGreaterThanOrEqual(60);
      expect(position.y).toBeLessThanOrEqual(398);
    }
  });

  // Tick labels drawn past the canvas edge push the plot inwards on the next draw
  it("grows a small padding to fit overflowing tick labels", () => {
    const rendered = renderVisual({ canvas: { left_padding: 0, lower_padding: 0 } }, data);
    const frame = rendered.visual.plotProperties;
    expect(frame.xAxis.start_padding).toBeGreaterThan(0);
    expect(frame.yAxis.start_padding).toBeGreaterThan(0);
    expect(frame.xAxis.end_padding).toBe(10);
    expect(frame.yAxis.end_padding).toBe(10);
    // The overflowing labels are pulled flush with the canvas edges
    const drawn = must(rendered.element.querySelector("svg")).getBBox();
    expect(drawn.x).toBeCloseTo(0, 3);
    expect(drawn.y + drawn.height).toBeCloseTo(500, 3);
  });
});

import { describe, expect, it } from "vitest";
import { createVisualHost } from "powerbi-visuals-utils-testutils";
import type { settingsValueType } from "../../src/settings";
import type { SettingsOverrides } from "../helpers/buildDataView";
import { renderVisual } from "../helpers/renderVisual";
import { must } from "powerbi-visuals-core/testing";

type Axis = "x" | "y";

const data = {
  key: ["A", "B", "C", "D", "E", "F", "G", "H"],
  numerators: [30, 40, 20, 40, 60, 75, 105, 120],
  denominators: [100, 200, 300, 400, 500, 600, 700, 800]
};
const axes: Axis[] = ["x", "y"];

/** `<axis>limit_<setting>` overrides for one axis card */
function axisOverrides(axis: Axis, values: Readonly<Record<string, string | number | boolean>>): SettingsOverrides {
  const x: Partial<settingsValueType["x_axis"]> = {};
  const y: Partial<settingsValueType["y_axis"]> = {};
  const card = axis === "x" ? x : y;
  const names = Object.keys(values);
  for (let i = 0; i < names.length; i++) {
    Object.assign(card, { [`${axis}limit_${names[i]}`]: values[names[i]] });
  }
  return { x_axis: x, y_axis: y };
}

function tickTexts(element: HTMLElement, axis: Axis): NodeListOf<SVGTextElement> {
  return element.querySelectorAll<SVGTextElement>(`.${axis}axisgroup .tick text`);
}

function domain(element: HTMLElement, axis: Axis): string {
  return must(must(element.querySelector(`.${axis}axisgroup path.domain`)).getAttribute("d"));
}

function translation(element: Element): { x: number; y: number } {
  const match = must(must(element.getAttribute("transform")).match(/^translate\(([^,]+),\s*([^)]+)\)$/));
  return { x: Number(match[1]), y: Number(match[2]) };
}

describe("axis settings", () => {
  it.each(axes)("styles the %s axis line, ticks, title and gridlines from its settings", axis => {
    const element = renderVisual(axisOverrides(axis, {
      colour: "#112233", tick_font: "Georgia", tick_size: 13, tick_colour: "#445566", tick_rotation: 20,
      label: "Title", label_font: "Verdana", label_size: 15, label_colour: "#778899", label_style: "italic",
      grid_show: true, grid_colour: "#aabbcc", grid_width: 3
    }), data).element;
    expect(must(element.querySelector(`.${axis}axisgroup`)).getAttribute("color")).toBe("#112233");
    const ticks = tickTexts(element, axis);
    expect(ticks.length).toBeGreaterThan(1);
    for (let i = 0; i < ticks.length; i++) {
      expect(ticks[i].style.fontSize).toBe("13px");
      expect(ticks[i].style.fontFamily).toBe("Georgia");
      expect(ticks[i].style.fill).toBe("rgb(68, 85, 102)");
      expect(ticks[i].getAttribute("transform")).toBe("rotate(20)");
    }
    const title = must(element.querySelector<SVGTextElement>(`.${axis}axislabel`));
    expect(title.textContent).toBe("Title");
    expect(title.style.fontFamily).toBe("Verdana");
    expect(title.style.fontSize).toBe("15px");
    expect(title.style.fill).toBe("rgb(119, 136, 153)");
    expect(title.style.fontStyle).toBe("italic");
    const grid = element.querySelectorAll<SVGLineElement>(`.gridgroup .${axis}gridline`);
    expect(grid).toHaveLength(ticks.length);
    for (let i = 0; i < grid.length; i++) {
      expect(grid[i].style.stroke).toBe("rgb(170, 187, 204)");
      expect(grid[i].style.strokeWidth).toBe("3");
    }
    // The other axis keeps its defaults
    const other: Axis = axis === "x" ? "y" : "x";
    expect(must(element.querySelector(`.${other}axisgroup`)).getAttribute("color")).toBe("#000000");
    expect(tickTexts(element, other)[0].getAttribute("transform")).toBe("rotate(0)");
    expect(element.querySelectorAll(`.gridgroup .${other}gridline`)).toHaveLength(0);
  });

  it("draws every axis colour in the high-contrast foreground", () => {
    const host = createVisualHost({});
    Object.assign(host.colorPalette, { isHighContrast: true, foreground: { value: "#abcdef" } });
    const element = renderVisual({
      x_axis: { xlimit_colour: "#112233", xlimit_tick_colour: "#112233", xlimit_label: "X", xlimit_label_colour: "#112233", xlimit_grid_show: true },
      y_axis: { ylimit_colour: "#112233", ylimit_tick_colour: "#112233", ylimit_label: "Y", ylimit_label_colour: "#112233", ylimit_grid_show: true }
    }, data, { host }).element;
    for (let a = 0; a < axes.length; a++) {
      const axis = axes[a];
      expect(must(element.querySelector(`.${axis}axisgroup`)).getAttribute("color"), axis).toBe("#abcdef");
      const ticks = tickTexts(element, axis);
      for (let i = 0; i < ticks.length; i++) {
        expect(ticks[i].style.fill, axis).toBe("rgb(171, 205, 239)");
      }
      expect(must(element.querySelector<SVGTextElement>(`.${axis}axislabel`)).style.fill, axis).toBe("rgb(171, 205, 239)");
      const grid = element.querySelectorAll<SVGLineElement>(`.gridgroup .${axis}gridline`);
      expect(grid.length, axis).toBeGreaterThan(0);
      for (let i = 0; i < grid.length; i++) {
        expect(grid[i].style.stroke, axis).toBe("rgb(171, 205, 239)");
      }
    }
  });

  // Only rotated x labels hang from their end; y labels keep d3's placement
  it.each([
    { rotation: -35, anchor: "end" },
    { rotation: 0, anchor: "middle" },
    { rotation: 35, anchor: "start" }
  ])("anchors x tick labels rotated by $rotation at the $anchor", ({ rotation, anchor }) => {
    const element = renderVisual({ x_axis: { xlimit_tick_rotation: rotation }, y_axis: { ylimit_tick_rotation: rotation } }, data).element;
    const x = tickTexts(element, "x");
    for (let i = 0; i < x.length; i++) {
      expect(x[i].style.textAnchor).toBe(anchor);
    }
    const y = tickTexts(element, "y");
    for (let i = 0; i < y.length; i++) {
      expect(y[i].getAttribute("transform")).toBe(`rotate(${rotation})`);
      expect(getComputedStyle(y[i]).textAnchor).toBe("end");
    }
  });

  it.each(axes)("caps the %s tick count and keeps the axis line when ticks are off", axis => {
    const all = tickTexts(renderVisual({}, data).element, axis).length;
    const capped = tickTexts(renderVisual(axisOverrides(axis, { tick_count: 2 }), data).element, axis).length;
    expect(capped).toBeGreaterThan(0);
    expect(capped).toBeLessThan(all);
    const off = renderVisual(axisOverrides(axis, { ticks: false }), data).element;
    expect(off.querySelectorAll(`.${axis}axisgroup .tick`)).toHaveLength(0);
    expect(off.querySelector(`.${axis}axisgroup path.domain`)).not.toBeNull();
  });

  // Outer tick marks bracket the domain path; without them it is a bare line
  it.each([
    { axis: "x", marked: /^M[\d.]+,6V/, unmarked: /^M[\d.]+,0\.5H[\d.]+$/ },
    { axis: "y", marked: /^M-6,/, unmarked: /^M0\.5,[\d.]+V[\d.]+$/ }
  ] as const)("hides the $axis tick marks, including the outer ones, while keeping the labels", ({ axis, marked, unmarked }) => {
    expect(domain(renderVisual({}, data).element, axis)).toMatch(marked);
    const element = renderVisual(axisOverrides(axis, { tick_marks: false }), data).element;
    expect(domain(element, axis)).toMatch(unmarked);
    const marks = element.querySelectorAll<SVGLineElement>(`.${axis}axisgroup .tick line`);
    expect(marks.length).toBeGreaterThan(0);
    for (let i = 0; i < marks.length; i++) {
      expect(marks[i].style.stroke).toBe("none");
    }
    expect(tickTexts(element, axis)).toHaveLength(marks.length);
  });

  it.each(axes)("removes the %s axis with its title and gridlines when hidden, keeping the other axis", axis => {
    const shown = {
      x_axis: { xlimit_label: "Title", xlimit_grid_show: true },
      y_axis: { ylimit_label: "Title", ylimit_grid_show: true }
    } satisfies SettingsOverrides;
    const rendered = renderVisual(shown, data);
    expect(rendered.element.querySelectorAll(`.${axis}gridline`).length).toBeGreaterThan(0);
    rendered.update({
      x_axis: { ...shown.x_axis, xlimit_show: axis !== "x" },
      y_axis: { ...shown.y_axis, ylimit_show: axis !== "y" }
    });
    const element = rendered.element;
    expect(element.querySelector(`.${axis}axisgroup`)).toBeNull();
    expect(element.querySelector(`.${axis}axislabel`)).toBeNull();
    expect(element.querySelectorAll(`.${axis}gridline`)).toHaveLength(0);
    const other: Axis = axis === "x" ? "y" : "x";
    expect(tickTexts(element, other).length).toBeGreaterThan(1);
    expect(must(element.querySelector(`.${other}axislabel`)).textContent).toBe("Title");
    expect(element.querySelectorAll(`.${other}gridline`)).toHaveLength(tickTexts(element, other).length);
  });

  // Titles are centred between the tick labels and the canvas edge, which overflow fitting moves to fit them
  it("places each title between its axis and the canvas edge, rotating the y title", () => {
    const element = renderVisual({
      x_axis: { xlimit_label: "X", xlimit_label_size: 14, xlimit_tick_size: 16 },
      y_axis: { ylimit_label: "Y", ylimit_label_size: 14, ylimit_tick_size: 16 }
    }, data).element;
    const svg = must(element.querySelector("svg")).getBoundingClientRect();
    const xBottom = must(element.querySelector(".xaxisgroup")).getBoundingClientRect().bottom - svg.top;
    const yLeft = must(element.querySelector(".yaxisgroup")).getBoundingClientRect().left - svg.left;
    const xTitle = must(element.querySelector(".xaxislabel"));
    const yTitle = must(element.querySelector(".yaxislabel"));
    const xBox = xTitle.getBoundingClientRect();
    const yBox = yTitle.getBoundingClientRect();
    expect(xBox.top - svg.top).toBeGreaterThanOrEqual(xBottom - 1e-6);
    expect(xBox.top - svg.top - xBottom).toBeCloseTo(svg.bottom - xBox.bottom, 2);
    expect(yBox.left - svg.left).toBeGreaterThanOrEqual(-1e-6);
    expect(yBox.left - svg.left).toBeCloseTo(yLeft - (yBox.right - svg.left), 6);
    expect(yTitle.getAttribute("transform")).toBe(`rotate(-90, ${yTitle.getAttribute("x")}, ${yTitle.getAttribute("y")})`);
    expect(xTitle.getAttribute("transform")).toBeNull();
  });

  it("anchors left and bottom aligned titles at the start of the plot", () => {
    const rendered = renderVisual({
      x_axis: { xlimit_label: "X", xlimit_label_align: "left" },
      y_axis: { ylimit_label: "Y", ylimit_label_align: "bottom" }
    }, data);
    const frame = rendered.visual.plotProperties;
    const xTitle = must(rendered.element.querySelector<SVGTextElement>(".xaxislabel"));
    const yTitle = must(rendered.element.querySelector<SVGTextElement>(".yaxislabel"));
    expect(xTitle.style.textAnchor).toBe("start");
    expect(Number(xTitle.getAttribute("x"))).toBe(frame.xAxis.start_padding);
    expect(yTitle.style.textAnchor).toBe("start");
    expect(Number(yTitle.getAttribute("y"))).toBe(500 - frame.yAxis.start_padding);
  });

  it("labels x ticks with denominators at their scaled positions", () => {
    const rendered = renderVisual({}, data);
    const ticks = rendered.element.querySelectorAll<SVGGElement>(".xaxisgroup .tick");
    expect(ticks.length).toBeGreaterThan(1);
    for (let i = 0; i < ticks.length; i++) {
      const value = Number(must(ticks[i].querySelector("text")).textContent);
      expect(Number.isFinite(value)).toBe(true);
      // d3 offsets tick groups by half a pixel on low-DPI screens
      expect(Math.abs(translation(ticks[i]).x - rendered.visual.plotProperties.xScale(value))).toBeLessThanOrEqual(0.5);
    }
  });
});

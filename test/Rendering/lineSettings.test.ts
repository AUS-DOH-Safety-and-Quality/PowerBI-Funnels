import { describe, expect, it } from "vitest";
import { createVisualHost } from "powerbi-visuals-utils-testutils";
import { cells, keyedHost, findBy, must } from "powerbi-visuals-core/testing";
import { lineSetting } from "powerbi-visuals-core/settings";
import type { settingsValueType } from "../../src/settings";
import type { standardLineKeys, StandardLineName } from "powerbi-visuals-core/settings";
import type { Visual } from "../../src/visual";
import { renderVisual } from "../helpers/renderVisual";

type Lines = settingsValueType["lines"];
type LineKey = typeof standardLineKeys[StandardLineName];
type LineStyle = { width: number; type: string; colour: string };

const data = {
  key: ["A", "B", "C", "D", "E", "F", "G", "H"],
  numerators: [30, 40, 20, 40, 60, 75, 105, 120],
  denominators: [100, 200, 300, 400, 500, 600, 700, 800]
};

/** Every line group, the lines it draws in drawing order, what makes it drawable and its default style */
const lineGroups: { key: LineKey; names: StandardLineName[]; enable: Partial<Lines>; defaults: LineStyle }[] = [
  { key: "target", names: ["target"], enable: {}, defaults: { width: 1.5, type: "10 0", colour: "#000000" } },
  {
    key: "alt_target", names: ["alt_target"], enable: { show_alt_target: true, alt_target: 18 },
    defaults: { width: 1.5, type: "10 0", colour: "#000000" }
  },
  { key: "99", names: ["ll99", "ul99"], enable: {}, defaults: { width: 2, type: "10 10", colour: "#6495ED" } },
  { key: "95", names: ["ll95", "ul95"], enable: {}, defaults: { width: 2, type: "2 5", colour: "#6495ED" } },
  { key: "68", names: ["ll68", "ul68"], enable: { show_68: true }, defaults: { width: 2, type: "2 5", colour: "#6495ED" } }
];

/** `<setting>_<key>` overrides for one line group */
function lineOverrides(key: LineKey, values: Readonly<Record<string, string | number | boolean>>): Partial<Lines> {
  const result: Partial<Lines> = {};
  const names = Object.keys(values);
  for (let i = 0; i < names.length; i++) {
    Object.assign(result, { [`${names[i]}_${key}`]: values[names[i]] });
  }
  return result;
}

function allLines(): Partial<Lines> {
  const result: Partial<Lines> = {};
  for (let i = 0; i < lineGroups.length; i++) {
    Object.assign(result, lineGroups[i].enable);
  }
  return result;
}

function lineGroup(element: HTMLElement, name: StandardLineName): SVGGElement | null {
  return element.querySelector<SVGGElement>(`.linesgroup > .${name}-linegroup`);
}

function linePath(element: HTMLElement, name: StandardLineName): SVGPathElement {
  return must(lineGroup(element, name)?.querySelector("path"));
}

function labels(element: HTMLElement): NodeListOf<SVGTextElement> {
  return element.querySelectorAll<SVGTextElement>(".linesgroup text");
}

function lastPoint(visual: Visual, name: StandardLineName): { x: number; value: number } {
  const points = must(findBy(visual.viewModel.groupedLines, 0, name))[1];
  const last = points[points.length - 1];
  return { x: last.x, value: must(last.line_value) };
}

describe("line settings", () => {
  it.each(lineGroups)("draws $key lines in their default style", ({ names, enable, defaults }) => {
    const element = renderVisual({ lines: enable }, data).element;
    for (let i = 0; i < names.length; i++) {
      const path = linePath(element, names[i]);
      expect(path.getAttribute("stroke"), names[i]).toBe(defaults.colour);
      expect(path.getAttribute("stroke-width"), names[i]).toBe(String(defaults.width));
      expect(path.getAttribute("stroke-dasharray"), names[i]).toBe(defaults.type);
      expect(path.getAttribute("fill"), names[i]).toBe("none");
    }
  });

  it.each(lineGroups)("draws $key lines with their own width, dash and colour and removes them when hidden", ({ key, names, enable, defaults }) => {
    const type = defaults.type === "2 5" ? "10 10" : "2 5";
    const rendered = renderVisual({
      lines: { ...enable, ...lineOverrides(key, { width: 3.5, type, colour: "#123456", plot_label_show: true }) }
    }, data);
    const drawn = rendered.element.querySelectorAll(".linesgroup > g").length;
    for (let i = 0; i < names.length; i++) {
      const path = linePath(rendered.element, names[i]);
      expect(path.getAttribute("stroke"), names[i]).toBe("#123456");
      expect(path.getAttribute("stroke-width"), names[i]).toBe("3.5");
      expect(path.getAttribute("stroke-dasharray"), names[i]).toBe(type);
    }
    const other: StandardLineName = key === "target" ? "ul99" : "target";
    expect(linePath(rendered.element, other).getAttribute("stroke")).toBe(other === "target" ? "#000000" : "#6495ED");
    expect(labels(rendered.element)).toHaveLength(names.length);

    rendered.update({ lines: { ...enable, ...lineOverrides(key, { show: false, plot_label_show: true }) } });
    for (let i = 0; i < names.length; i++) {
      expect(lineGroup(rendered.element, names[i]), names[i]).toBeNull();
    }
    expect(rendered.element.querySelectorAll(".linesgroup > g")).toHaveLength(drawn - names.length);
    expect(labels(rendered.element)).toHaveLength(0);
  });

  it.each(lineGroups)("fades $key lines to their own unselected opacity while a point is selected", async ({ key, names, enable }) => {
    const rendered = renderVisual({
      lines: { ...enable, ...lineOverrides(key, { opacity: 0.6, opacity_unselected: 0.3 }) }
    }, data, { host: keyedHost() });
    const other: StandardLineName = key === "target" ? "ul99" : "target";
    for (let i = 0; i < names.length; i++) {
      expect(must(lineGroup(rendered.element, names[i])).style.strokeOpacity, names[i]).toBe("0.6");
    }
    expect(must(lineGroup(rendered.element, other)).style.strokeOpacity).toBe("1");

    await rendered.visual.selectionManager.select(rendered.visual.viewModel.plotPoints[2].identity);
    rendered.visual.updateHighlighting();
    for (let i = 0; i < names.length; i++) {
      expect(must(lineGroup(rendered.element, names[i])).style.strokeOpacity, names[i]).toBe("0.3");
    }
    expect(must(lineGroup(rendered.element, other)).style.strokeOpacity).toBe("0.2");
  });

  it("fades every line to its unselected opacity while another visual highlights rows", () => {
    const rendered = renderVisual({ lines: { ...allLines(), opacity_unselected_95: 0.5 } }, data, {
      prepare: dataView => {
        must(dataView.categorical?.values)[0].highlights = cells([null, 40, null, null, null, null, null, null]);
      }
    });
    const groups = rendered.element.querySelectorAll<SVGGElement>(".linesgroup > g");
    expect(groups).toHaveLength(8);
    for (let i = 0; i < groups.length; i++) {
      const fadedTo = groups[i].classList.contains("ll95-linegroup") || groups[i].classList.contains("ul95-linegroup") ? "0.5" : "0.2";
      expect(groups[i].style.strokeOpacity, groups[i].getAttribute("class") ?? "").toBe(fadedTo);
    }
  });

  it("draws no alt. target line or label until it has a value", () => {
    const rendered = renderVisual({ lines: { show_alt_target: true, plot_label_show_alt_target: true } }, data);
    expect(lineGroup(rendered.element, "alt_target")?.querySelector("path")).toBeNull();
    expect(labels(rendered.element)).toHaveLength(0);
    rendered.update({ lines: { show_alt_target: true, alt_target: 18, plot_label_show_alt_target: true } });
    const vertices = must(linePath(rendered.element, "alt_target").getAttribute("d")).split(/[ML]/);
    const y = rendered.visual.plotProperties.yScale(18);
    expect(vertices.length).toBeGreaterThan(2);
    for (let i = 1; i < vertices.length; i++) {
      expect(Number(vertices[i].split(",")[1])).toBeCloseTo(y, 2);
    }
    expect(labels(rendered.element)).toHaveLength(1);
  });

  it("draws every line in the high-contrast foreground colour", () => {
    const host = createVisualHost({});
    Object.assign(host.colorPalette, { isHighContrast: true, foreground: { value: "#abcdef" } });
    const rendered = renderVisual({ lines: allLines() }, data, { host });
    const paths = rendered.element.querySelectorAll(".linesgroup path");
    expect(paths).toHaveLength(8);
    for (let i = 0; i < paths.length; i++) {
      expect(paths[i].getAttribute("stroke")).toBe("#abcdef");
    }
  });
});

describe("line value labels", () => {
  it.each(lineGroups)("labels only the final endpoint of each $key line with its own text settings and placement", ({ key, names, enable }) => {
    const rendered = renderVisual({
      lines: {
        ...enable,
        ...lineOverrides(key, {
          plot_label_show: true, plot_label_position: "above", plot_label_vpad: 4, plot_label_hpad: 6,
          plot_label_font: "Georgia", plot_label_size: 13, plot_label_colour: "#123456", plot_label_prefix: "P: "
        })
      }
    }, data);
    const visual = rendered.visual;
    const drawn = labels(rendered.element);
    expect(drawn).toHaveLength(names.length);
    const width = lineSetting<number>(visual.viewModel.inputSettings.settings[0].lines, "width", key);
    const format = visual.viewModel.inputSettings.derivedSettings[0].formatValue;
    for (let i = 0; i < names.length; i++) {
      const end = lastPoint(visual, names[i]);
      const label = drawn[i];
      expect(label.textContent, names[i]).toBe(`P: ${format(end.value, "value")}`);
      expect(Number(label.getAttribute("x"))).toBeCloseTo(visual.plotProperties.xScale(end.x), 6);
      expect(Number(label.getAttribute("y"))).toBeCloseTo(visual.plotProperties.yScale(end.value), 6);
      expect(label.getAttribute("fill")).toBe("#123456");
      expect(label.getAttribute("font-size")).toBe("13px");
      expect(label.getAttribute("font-family")).toBe("Georgia");
      expect(label.getAttribute("text-anchor")).toBe("end");
      expect(label.getAttribute("dx")).toBe("-6px");
      expect(label.getAttribute("dy")).toBe(`${-4 - width}px`);
    }
  });

  // Outside and inside are relative to the funnel, so each lower limit mirrors its upper; targets act as upper lines
  it.each([
    { position: "outside", upperAbove: true },
    { position: "inside", upperAbove: false }
  ] as const)("places $position labels on the upper and lower limits on opposite sides", ({ position, upperAbove }) => {
    const all = allLines();
    for (let i = 0; i < lineGroups.length; i++) {
      Object.assign(all, lineOverrides(lineGroups[i].key, { plot_label_show: true, plot_label_position: position, plot_label_vpad: 3 }));
    }
    const rendered = renderVisual({ lines: all }, data);
    const drawn = labels(rendered.element);
    const dy: Record<string, number> = {};
    for (let g = 0; g < lineGroups.length; g++) {
      const group = lineGroups[g];
      for (let n = 0; n < group.names.length; n++) {
        const name = group.names[n];
        const end = lastPoint(rendered.visual, name);
        for (let i = 0; i < drawn.length; i++) {
          if (Number(drawn[i].getAttribute("y")) === rendered.visual.plotProperties.yScale(end.value)) {
            dy[name] = parseFloat(must(drawn[i].getAttribute("dy")));
          }
        }
      }
    }
    // Above sits clear of the line width; below drops by the font size (10)
    const above = (width: number): number => -3 - width;
    const below = 3 + 10;
    expect(dy).toEqual({
      target: upperAbove ? above(1.5) : below,
      alt_target: upperAbove ? above(1.5) : below,
      ul99: upperAbove ? above(2) : below,
      ll99: upperAbove ? below : above(2),
      ul95: upperAbove ? above(2) : below,
      ll95: upperAbove ? below : above(2),
      ul68: upperAbove ? above(2) : below,
      ll68: upperAbove ? below : above(2)
    });
  });

  it("labels each line at its last point inside the axis limits without squashing the plot", () => {
    const shown = { plot_label_show_target: true, plot_label_position_target: "above", plot_label_show_99: true, plot_label_position_99: "above" } as const;
    const x_axis = { xlimit_u: 500 };
    const plain = renderVisual({ x_axis }, data).visual.plotProperties;
    const rendered = renderVisual({ x_axis, lines: shown }, data);
    const frame = rendered.visual.plotProperties;
    expect(frame.xScale.range()).toEqual(plain.xScale.range());
    expect(frame.yScale.range()).toEqual(plain.yScale.range());
    const names: StandardLineName[] = ["target", "ll99", "ul99"];
    const drawn = labels(rendered.element);
    expect(drawn).toHaveLength(names.length);
    for (let i = 0; i < names.length; i++) {
      const points = must(findBy(rendered.visual.viewModel.groupedLines, 0, names[i]))[1];
      expect(points[points.length - 1].x).toBeGreaterThan(500);
      const end = must(findBy(points, "x", 500));
      expect(Number(drawn[i].getAttribute("x")), names[i]).toBeCloseTo(frame.xScale(500), 6);
      expect(Number(drawn[i].getAttribute("y")), names[i]).toBeCloseTo(frame.yScale(must(end.line_value)), 6);
    }

    // The lower 99% limit stays below 11% throughout, so it has no label
    const raised = renderVisual({ y_axis: { ylimit_l: 11 }, lines: shown }, data);
    const remaining = labels(raised.element);
    expect(remaining).toHaveLength(2);
    expect(Number(remaining[1].getAttribute("y"))).toBeCloseTo(raised.visual.plotProperties.yScale(lastPoint(raised.visual, "ul99").value), 6);
  });

  it("places below labels under the line end and beside labels after it", () => {
    const below = labels(renderVisual({
      lines: { plot_label_show_99: true, plot_label_position_99: "below", plot_label_vpad_99: 5, plot_label_hpad_99: 7, plot_label_size_99: 12 }
    }, data).element);
    expect(below).toHaveLength(2);
    for (let i = 0; i < below.length; i++) {
      expect(below[i].getAttribute("text-anchor")).toBe("end");
      expect(below[i].getAttribute("dx")).toBe("-7px");
      expect(below[i].getAttribute("dy")).toBe("17px");
    }
    // Beside labels centre on the line by a quarter of their rendered height
    const beside = labels(renderVisual({
      lines: { plot_label_show_99: true, plot_label_vpad_99: 5, plot_label_hpad_99: 7, plot_label_size_99: 12 }
    }, data).element);
    expect(beside).toHaveLength(2);
    for (let i = 0; i < beside.length; i++) {
      expect(beside[i].getAttribute("text-anchor")).toBe("start");
      expect(beside[i].getAttribute("dx")).toBe("7px");
      expect(parseFloat(must(beside[i].getAttribute("dy")))).toBeCloseTo(-5 + beside[i].getBoundingClientRect().height / 4, 6);
    }
  });
});

import { describe, expect, it, vi } from "vitest";
import { symbol, symbolTriangle } from "d3-shape";
import type powerbi from "powerbi-visuals-api";
import { drawValueLabels, trianglePath } from "powerbi-visuals-core/rendering";
import { ChartBuilder } from "./visualBuilder";
import { categoricalData, dataView } from "./dataViewFixture";
import { defaultSettings } from "../src/settings";

function labelledView(labels: powerbi.DataViewObject, values: powerbi.PrimitiveValue[] = ["One", "", "Three"]): powerbi.DataView {
  const categorical = categoricalData();
  if (categorical.categories === undefined || categorical.values === undefined) throw new Error("Missing fixture columns");
  categorical.values.push({ source: { displayName: "Label", roles: { labels: true } }, values });
  categorical.categories[0].objects = [{ labels }, { labels }, { labels }];
  return dataView(categorical);
}

function labelGroups(builder: ChartBuilder): NodeListOf<SVGGElement> {
  return builder.element.querySelectorAll<SVGGElement>(".text-labels .text-group-inner");
}

function attribute(element: Element | null, name: string): number {
  if (element === null) throw new Error(`Missing element for ${name}`);
  return Number(element.getAttribute(name));
}

// Changeset 6: value labels render through Core's shared implementation.
describe("Value labels", () => {
  it("labels points above by default, skips empty labels and anchors the connector at the point", () => {
    const builder = new ChartBuilder(500, 500);
    try {
      builder.update(labelledView({}));
      const groups = labelGroups(builder);
      expect(groups).toHaveLength(2);
      const point = builder.instance.viewModel.plotPoints[0];
      const pointX = builder.instance.plotProperties.xScale(point.x);
      const pointY = builder.instance.plotProperties.yScale(point.value);
      const text = groups[0].querySelector("text");
      expect(text?.textContent).toBe("One");
      expect(attribute(text, "x")).toBeCloseTo(pointX, 6);
      expect(attribute(text, "y")).toBeLessThan(pointY);
      const line = groups[0].querySelector("line");
      expect(attribute(line, "x1")).toBeCloseTo(pointX, 6);
      expect(attribute(line, "y2")).toBeCloseTo(pointY - 10, 6);
      expect(groups[1].querySelector("text")?.textContent).toBe("Three");
    } finally {
      builder.destroy();
    }
  });

  it("labels points below with the bottom placement and honours the vertical offset", () => {
    const builder = new ChartBuilder(500, 500);
    try {
      builder.update(labelledView({ label_position: "bottom", label_y_offset: 40 }));
      const point = builder.instance.viewModel.plotPoints[0];
      const pointY = builder.instance.plotProperties.yScale(point.value);
      const axisY = builder.instance.viewModel.svgHeight - builder.instance.plotProperties.yAxis.start_padding;
      const text = labelGroups(builder)[0].querySelector("text");
      expect(attribute(text, "y")).toBeGreaterThan(pointY);
      expect(attribute(text, "y")).toBeCloseTo(axisY - 40, 6);
    } finally {
      builder.destroy();
    }
  });

  it("applies text, connector and marker styles from the label settings", () => {
    const builder = new ChartBuilder(500, 500);
    try {
      builder.update(labelledView({
        label_size: 13, label_font: "'Arial Black'", label_colour: { solid: { color: "#123456" } },
        label_line_colour: { solid: { color: "#654321" } }, label_line_width: 2, label_line_type: "2 5",
        label_marker_size: 4, label_marker_colour: { solid: { color: "#abcdef" } }
      }));
      const group = labelGroups(builder)[0];
      const text = group.querySelector("text");
      const line = group.querySelector("line");
      const path = group.querySelector("path");
      if (text === null || line === null || path === null) throw new Error("Missing label elements");
      expect(text.style.fontSize).toBe("13px");
      expect(text.style.fontFamily).toContain("Arial Black");
      expect(text.style.fill).toBe("rgb(18, 52, 86)");
      expect(line.style.stroke).toBe("rgb(101, 67, 33)");
      expect(line.style.strokeWidth).toBe("2");
      expect(line.style.strokeDasharray).toMatch(/^2,? 5$/);
      expect(path.style.fill).toBe("rgb(171, 205, 239)");
      expect(path.getAttribute("d")).toBe(symbol().type(symbolTriangle).size(16)());
    } finally {
      builder.destroy();
    }
  });

  // Finding 31: the marker switch is honoured; the connector still ends at the marker position.
  it("omits the marker when the marker switch is off", () => {
    const builder = new ChartBuilder(500, 500);
    try {
      builder.update(labelledView({ label_marker_show: false }));
      const group = labelGroups(builder)[0];
      expect(group.querySelector("path")).toBeNull();
      expect(group.querySelector("line")).not.toBeNull();
      expect(group.querySelector("text")?.textContent).toBe("One");
    } finally {
      builder.destroy();
    }
  });

  // Finding 30: the origin is an ordinary position, not a suppression signal.
  it("renders a label positioned exactly at the origin", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    document.body.appendChild(svg);
    try {
      drawValueLabels(svg, {
        visible: true,
        points: [{ x: 0, value: 0, label: { text_value: "Origin", aesthetics: defaultSettings.labels, angle: 0, distance: 0 } }],
        xScale: () => 0, yScale: () => 0, plotHeight: 400, bottomPadding: 30,
        line: { colour: "#000000", width: 1, type: "10 0" }, interactive: false
      });
      const text = svg.querySelector(".text-labels text");
      expect(text?.textContent).toBe("Origin");
      expect(text?.getAttribute("x")).toBe("0");
      expect(text?.getAttribute("y")).toBe("0");
    } finally {
      svg.remove();
    }
  });

  it("removes and restores labels with the visibility switch and survives repeated redraws", () => {
    const builder = new ChartBuilder(500, 500);
    try {
      builder.update(labelledView({ show_labels: false }));
      expect(builder.element.querySelector(".text-labels")).toBeNull();
      builder.update(labelledView({}));
      expect(labelGroups(builder)).toHaveLength(2);
      builder.instance.drawVisual();
      builder.instance.drawVisual();
      expect(labelGroups(builder)).toHaveLength(2);
      expect(builder.element.querySelectorAll(".text-labels")).toHaveLength(1);
    } finally {
      builder.destroy();
    }
  });

  it("redraws a label at its stored angle and distance", () => {
    const builder = new ChartBuilder(500, 500);
    try {
      builder.update(labelledView({}));
      const point = builder.instance.viewModel.plotPoints[0];
      point.label.angle = 0;
      point.label.distance = 7;
      builder.instance.drawVisual();
      const text = labelGroups(builder)[0].querySelector("text");
      expect(attribute(text, "x")).toBeCloseTo(builder.instance.plotProperties.xScale(point.x) + 7, 6);
      expect(attribute(text, "y")).toBeCloseTo(builder.instance.plotProperties.yScale(point.value), 6);
    } finally {
      builder.destroy();
    }
  });

  it("drags a label in SVG coordinates, updates the point and detaches on pointer up", () => {
    const builder = new ChartBuilder(500, 500);
    const capture = vi.spyOn(Element.prototype, "setPointerCapture").mockImplementation(() => undefined);
    const release = vi.spyOn(Element.prototype, "releasePointerCapture").mockImplementation(() => undefined);
    try {
      builder.update(labelledView({ label_marker_offset: 20 }));
      const svg = builder.element.querySelector("svg");
      if (svg === null) throw new Error("Missing svg");
      const group = labelGroups(builder)[0];
      const point = builder.instance.viewModel.plotPoints[0];
      const pointX = builder.instance.plotProperties.xScale(point.x);
      const pointY = builder.instance.plotProperties.yScale(point.value);
      expect(group.style.touchAction).toBe("none");

      group.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, bubbles: true }));
      expect(capture).toHaveBeenCalledWith(1);
      const rect = svg.getBoundingClientRect();
      const clientX = rect.left + 300;
      const clientY = rect.top + 200;
      const svgPoint = svg.createSVGPoint();
      svgPoint.x = clientX;
      svgPoint.y = clientY;
      const ctm = svg.getScreenCTM();
      if (ctm === null) throw new Error("Missing CTM");
      const expected = svgPoint.matrixTransform(ctm.inverse());
      group.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX, clientY }));
      const expectedAngle = Math.atan2(expected.y - pointY, expected.x - pointX) * 180 / Math.PI;
      expect(point.label.angle).toBeCloseTo(expectedAngle, 6);
      expect(point.label.distance).toBeCloseTo(Math.hypot(expected.x - pointX, expected.y - pointY), 6);
      const text = group.querySelector("text");
      expect(attribute(text, "x")).toBeCloseTo(expected.x, 6);
      expect(attribute(text, "y")).toBeCloseTo(expected.y, 6);
      // Finding 32: the marker keeps the configured offset (20 + font size 10 / 2) while dragging
      const line = group.querySelector("line");
      const radians = expectedAngle * Math.PI / 180;
      expect(attribute(line, "x2")).toBeCloseTo(pointX + 25 * Math.cos(radians), 6);
      expect(attribute(line, "y2")).toBeCloseTo(pointY + 25 * Math.sin(radians), 6);

      group.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
      expect(release).toHaveBeenCalledWith(1);
      group.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: clientX + 50, clientY }));
      expect(point.label.angle).toBeCloseTo(expectedAngle, 6);

      builder.instance.drawVisual();
      const redrawn = labelGroups(builder)[0].querySelector("text");
      expect(attribute(redrawn, "x")).toBeCloseTo(expected.x, 6);
      expect(attribute(redrawn, "y")).toBeCloseTo(expected.y, 6);
    } finally {
      capture.mockRestore();
      release.mockRestore();
      builder.destroy();
    }
  });

  it("attaches no drag handlers when rendering headless", () => {
    const builder = new ChartBuilder(500, 500);
    try {
      builder.instance.update({
        dataViews: [labelledView({})], viewport: builder.viewport, type: 2, headless: true
      } as powerbi.extensibility.visual.VisualUpdateOptions);
      const group = labelGroups(builder)[0];
      expect(group.style.touchAction).toBe("");
      group.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, bubbles: true }));
      group.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 300, clientY: 200 }));
      expect(builder.instance.viewModel.plotPoints[0].label.angle).toBeUndefined();
    } finally {
      builder.destroy();
    }
  });

  it("reproduces d3's triangle marker path", () => {
    const d3Triangle = symbol().type(symbolTriangle);
    for (let size = 0; size <= 400; size += 0.37) {
      expect(trianglePath(size)).toBe(d3Triangle.size(size)());
    }
  });
});

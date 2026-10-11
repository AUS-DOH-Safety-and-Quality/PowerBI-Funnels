import { describe, expect, it, vi } from "vitest";
import type { PrimitiveValue } from "powerbi-visuals-core/powerbi";
import { trianglePath } from "powerbi-visuals-core/rendering";
import { must } from "powerbi-visuals-core/testing";
import buildDataView, { sample, type SettingsOverrides } from "./helpers/buildDataView";
import { renderVisual, type Rendered } from "./helpers/renderVisual";

const viewport = { width: 500, height: 500 };

function labelled(values: PrimitiveValue[] = ["One", "", "Three"]) {
  return { ...sample, labels: values };
}

function render(labels: SettingsOverrides["labels"], values?: PrimitiveValue[], canvas: SettingsOverrides["canvas"] = {}): Rendered {
  return renderVisual({ labels, canvas }, labelled(values));
}

function labelGroups(element: HTMLElement): NodeListOf<SVGGElement> {
  return element.querySelectorAll<SVGGElement>(".text-labels .text-group-inner");
}

function attribute(element: Element | null, name: string): number {
  return Number(must(element).getAttribute(name));
}

// Value labels render through Core's shared implementation.
describe("Value labels", () => {
  it("labels points above by default, skips empty labels and anchors the connector at the point", () => {
    // The labelled point is the maximum, so leave room above it for the default 20px label offset
    const rendered = render({}, undefined, { upper_padding: 40 });
    const groups = labelGroups(rendered.element);
    expect(groups).toHaveLength(2);
    const point = rendered.visual.viewModel.plotPoints[0];
    const pointX = rendered.visual.plotProperties.xScale(point.x);
    const pointY = rendered.visual.plotProperties.yScale(point.value);
    const text = groups[0].querySelector("text");
    expect(text?.textContent).toBe("One");
    expect(attribute(text, "x")).toBeCloseTo(pointX, 6);
    expect(attribute(text, "y")).toBeLessThan(pointY);
    const line = groups[0].querySelector("line");
    expect(attribute(line, "x1")).toBeCloseTo(pointX, 6);
    expect(attribute(line, "y2")).toBeCloseTo(pointY - 10, 6);
    expect(groups[1].querySelector("text")?.textContent).toBe("Three");
  });

  it("labels points below with the bottom placement and honours the vertical offset", () => {
    const rendered = render({ label_position: "bottom", label_y_offset: 40 });
    const point = rendered.visual.viewModel.plotPoints[0];
    const pointY = rendered.visual.plotProperties.yScale(point.value);
    const axisY = rendered.visual.viewModel.svgHeight - rendered.visual.plotProperties.yAxis.start_padding;
    const text = labelGroups(rendered.element)[0].querySelector("text");
    expect(attribute(text, "y")).toBeGreaterThan(pointY);
    expect(attribute(text, "y")).toBeCloseTo(axisY - 40, 6);
  });

  it("applies text, connector and marker styles from the label settings", () => {
    const rendered = render({
      label_size: 13, label_font: "'Arial Black'", label_colour: "#123456",
      label_line_colour: "#654321", label_line_width: 2, label_line_type: "2 5",
      label_marker_size: 4, label_marker_colour: "#abcdef"
    });
    const group = labelGroups(rendered.element)[0];
    const text = must(group.querySelector("text"));
    const line = must(group.querySelector("line"));
    const path = must(group.querySelector("path"));
    expect(text.style.fontSize).toBe("13px");
    expect(text.style.fontFamily).toContain("Arial Black");
    expect(text.style.fill).toBe("rgb(18, 52, 86)");
    expect(line.style.stroke).toBe("rgb(101, 67, 33)");
    expect(line.style.strokeWidth).toBe("2");
    expect(line.style.strokeDasharray).toMatch(/^2,? 5$/);
    expect(path.style.fill).toBe("rgb(171, 205, 239)");
    expect(path.getAttribute("d")).toBe(trianglePath(16));
  });

  // The marker switch is honoured; the connector still ends at the marker position.
  it("omits the marker when the marker switch is off", () => {
    const group = labelGroups(render({ label_marker_show: false }).element)[0];
    expect(group.querySelector("path")).toBeNull();
    expect(group.querySelector("line")).not.toBeNull();
    expect(group.querySelector("text")?.textContent).toBe("One");
  });

  it("removes and restores labels with the visibility switch and survives repeated redraws", () => {
    const rendered = render({ show_labels: false });
    expect(rendered.element.querySelector(".text-labels")).toBeNull();
    rendered.update({ labels: {} });
    expect(labelGroups(rendered.element)).toHaveLength(2);
    rendered.visual.drawVisual();
    rendered.visual.drawVisual();
    expect(labelGroups(rendered.element)).toHaveLength(2);
    expect(rendered.element.querySelectorAll(".text-labels")).toHaveLength(1);
  });

  it("redraws a label at its stored angle and distance", () => {
    const rendered = render({});
    const point = rendered.visual.viewModel.plotPoints[0];
    point.label.angle = 0;
    point.label.distance = 7;
    rendered.visual.drawVisual();
    const text = labelGroups(rendered.element)[0].querySelector("text");
    expect(attribute(text, "x")).toBeCloseTo(rendered.visual.plotProperties.xScale(point.x) + 7, 6);
    expect(attribute(text, "y")).toBeCloseTo(rendered.visual.plotProperties.yScale(point.value), 6);
  });

  it("drags a label in SVG coordinates, updates the point and detaches on pointer up", () => {
    const capture = vi.spyOn(Element.prototype, "setPointerCapture").mockImplementation(() => undefined);
    const release = vi.spyOn(Element.prototype, "releasePointerCapture").mockImplementation(() => undefined);
    try {
      const rendered = render({ label_marker_offset: 20 });
      const svg = must(rendered.element.querySelector("svg"));
      const group = labelGroups(rendered.element)[0];
      const point = rendered.visual.viewModel.plotPoints[0];
      const pointX = rendered.visual.plotProperties.xScale(point.x);
      const pointY = rendered.visual.plotProperties.yScale(point.value);
      expect(group.style.touchAction).toBe("none");

      group.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, bubbles: true }));
      expect(capture).toHaveBeenCalledWith(1);
      const rect = svg.getBoundingClientRect();
      const clientX = rect.left + 300;
      const clientY = rect.top + 200;
      const svgPoint = svg.createSVGPoint();
      svgPoint.x = clientX;
      svgPoint.y = clientY;
      const expected = svgPoint.matrixTransform(must(svg.getScreenCTM()).inverse());
      group.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX, clientY }));
      const expectedAngle = Math.atan2(expected.y - pointY, expected.x - pointX) * 180 / Math.PI;
      expect(point.label.angle).toBeCloseTo(expectedAngle, 6);
      expect(point.label.distance).toBeCloseTo(Math.hypot(expected.x - pointX, expected.y - pointY), 6);
      const text = group.querySelector("text");
      expect(attribute(text, "x")).toBeCloseTo(expected.x, 6);
      expect(attribute(text, "y")).toBeCloseTo(expected.y, 6);
      // The marker keeps the configured offset (20 + font size 10 / 2) while dragging
      const line = group.querySelector("line");
      const radians = expectedAngle * Math.PI / 180;
      expect(attribute(line, "x2")).toBeCloseTo(pointX + 25 * Math.cos(radians), 6);
      expect(attribute(line, "y2")).toBeCloseTo(pointY + 25 * Math.sin(radians), 6);

      group.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
      expect(release).toHaveBeenCalledWith(1);
      group.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: clientX + 50, clientY }));
      expect(point.label.angle).toBeCloseTo(expectedAngle, 6);

      rendered.visual.drawVisual();
      const redrawn = labelGroups(rendered.element)[0].querySelector("text");
      expect(attribute(redrawn, "x")).toBeCloseTo(expected.x, 6);
      expect(attribute(redrawn, "y")).toBeCloseTo(expected.y, 6);
    } finally {
      capture.mockRestore();
      release.mockRestore();
    }
  });

  it("attaches no drag handlers when rendering headless", () => {
    const rendered = render({});
    rendered.visual.update({ dataViews: [buildDataView(labelled())], viewport, type: 2, headless: true });
    const group = labelGroups(rendered.element)[0];
    expect(group.style.touchAction).toBe("");
    group.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, bubbles: true }));
    group.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, clientX: 300, clientY: 200 }));
    expect(rendered.visual.viewModel.plotPoints[0].label.angle).toBeUndefined();
  });
});

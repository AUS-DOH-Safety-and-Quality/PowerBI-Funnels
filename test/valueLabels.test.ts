import { describe, expect, it } from "vitest";
import { must } from "powerbi-visuals-core/testing";
import { sample } from "./helpers/buildDataView";
import { renderVisual } from "./helpers/renderVisual";

function attribute(element: Element | null, name: string): number {
  return Number(must(element).getAttribute(name));
}

// Value labels render through Core's shared implementation, which tests their geometry, styling and dragging
describe("Value labels", () => {
  it("labels points above by default, skips empty labels and anchors the connector at the point", () => {
    // The labelled point is the maximum, so leave room above it for the default 20px label offset
    const rendered = renderVisual({ canvas: { upper_padding: 40 } }, { ...sample, labels: ["One", "", "Three"] });
    const groups = rendered.element.querySelectorAll<SVGGElement>(".text-labels .text-group-inner");
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

  it("draws the connector with the label line type, width and colour", () => {
    const inputs = { ...sample, labels: ["One", "Two", "Three"] };
    const rendered = renderVisual({ canvas: { upper_padding: 40 } }, inputs);
    const lines = rendered.element.querySelectorAll<SVGLineElement>(".text-labels .text-group-inner line");
    expect(lines).toHaveLength(3);
    for (let i = 0; i < lines.length; i++) {
      expect(lines[i].style.strokeDasharray).toBe("10, 0");
      expect(lines[i].style.strokeWidth).toBe("1");
      expect(lines[i].style.stroke).toBe("rgb(0, 0, 0)");
    }
    rendered.update({
      canvas: { upper_padding: 40 },
      labels: { label_line_type: "2 5", label_line_width: 3, label_line_colour: "#123456" }
    });
    const styled = rendered.element.querySelectorAll<SVGLineElement>(".text-labels .text-group-inner line");
    expect(styled).toHaveLength(3);
    for (let i = 0; i < styled.length; i++) {
      expect(styled[i].style.strokeDasharray).toBe("2, 5");
      expect(styled[i].style.strokeWidth).toBe("3");
      expect(styled[i].style.stroke).toBe("rgb(18, 52, 86)");
    }
  });
});

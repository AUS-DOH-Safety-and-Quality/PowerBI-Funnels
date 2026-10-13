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
});

import { describe, expect, it } from "vitest";
import { testDom, createVisualHost } from "powerbi-visuals-utils-testutils";
import { Visual } from "../src/visual";
import { must } from "powerbi-visuals-core/testing";
import buildDataView, { sample } from "./helpers/buildDataView";
import { renderVisual } from "./helpers/renderVisual";
import { updateType } from "powerbi-visuals-core/powerbi";

const viewport = { width: 500, height: 500 };

// Error text, gridlines and tooltip crosshairs render through Core
describe("renderer boundaries", () => {
  it("uses the high-contrast foreground for error text", () => {
    const host = createVisualHost({});
    const palette = host.colorPalette as { isHighContrast: boolean; foreground: { value: string } };
    palette.isHighContrast = true;
    palette.foreground = { value: "#abcdef" };
    const element = testDom("500", "500");
    const visual = new Visual({ element, host });
    visual.update({ dataViews: [buildDataView({ ...sample, numerators: [null, null, null] })], viewport, type: updateType.data });
    const texts = element.querySelectorAll<SVGTextElement>(".errormessage text");
    expect(texts).toHaveLength(1);
    expect(texts[0].style.fill).toBe("rgb(171, 205, 239)");
    element.remove();
  });

  it("draws gridlines at the ticks, hides tick marks and aligns the axis labels", () => {
    const rendered = renderVisual({
      x_axis: { xlimit_grid_show: true, xlimit_tick_marks: false, xlimit_label: "X", xlimit_label_align: "right" },
      y_axis: { ylimit_grid_show: true, ylimit_label: "Y", ylimit_label_align: "top", ylimit_label_style: "italic" }
    }, sample);
    const element = rendered.element;
    const visual = rendered.visual;
    const xTicks = element.querySelectorAll<SVGGElement>(".xaxisgroup .tick");
    const xGrid = element.querySelectorAll<SVGLineElement>(".gridgroup .xgridline");
    expect(xGrid.length).toBeGreaterThan(0);
    expect(xGrid).toHaveLength(xTicks.length);
    for (let i = 0; i < xTicks.length; i++) {
      // d3 offsets tick groups by half a pixel on low-DPI screens
      const tickX = Number((/translate\(([^,]+),/.exec(must(xTicks[i].getAttribute("transform"))))?.[1]);
      expect(Math.abs(Number(xGrid[i].getAttribute("x1")) - tickX)).toBeLessThanOrEqual(0.5);
      expect(xGrid[i].getAttribute("x2")).toBe(xGrid[i].getAttribute("x1"));
    }
    expect(xGrid[0].getAttribute("y1")).toBe(String(500 - visual.plotProperties.yAxis.start_padding));
    expect(xGrid[0].getAttribute("y2")).toBe(String(visual.plotProperties.yAxis.end_padding));
    expect(xGrid[0].style.stroke).toBe("rgb(211, 211, 211)");
    expect(xGrid[0].style.strokeWidth).toBe("1");
    expect(must(element.querySelector<SVGLineElement>(".xaxisgroup .tick line")).style.stroke).toBe("none");
    expect(must(element.querySelector<SVGLineElement>(".yaxisgroup .tick line")).style.stroke).toMatch(/currentcolor/i);
    const yGrid = element.querySelectorAll<SVGLineElement>(".gridgroup .ygridline");
    expect(yGrid).toHaveLength(element.querySelectorAll(".yaxisgroup .tick").length);
    expect(yGrid[0].getAttribute("x1")).toBe(String(visual.plotProperties.xAxis.start_padding));
    expect(yGrid[0].getAttribute("x2")).toBe(String(500 - visual.plotProperties.xAxis.end_padding));
    const xLabel = must(element.querySelector<SVGTextElement>(".xaxislabel"));
    expect(xLabel.style.textAnchor).toBe("end");
    expect(xLabel.getAttribute("x")).toBe(String(500 - visual.plotProperties.xAxis.end_padding));
    const yLabel = must(element.querySelector<SVGTextElement>(".yaxislabel"));
    expect(yLabel.style.textAnchor).toBe("end");
    expect(yLabel.getAttribute("y")).toBe(String(visual.plotProperties.yAxis.end_padding));
    expect(yLabel.style.fontStyle).toBe("italic");
    rendered.update({});
    expect(element.querySelectorAll(".gridgroup .xgridline")).toHaveLength(0);
    expect(element.querySelectorAll(".gridgroup .ygridline")).toHaveLength(0);
    // Centred labels sit over the plot area, not the canvas, under uneven padding
    rendered.update({
      canvas: { left_padding: 90, right_padding: 10, upper_padding: 70, lower_padding: 30 },
      x_axis: { xlimit_label: "X" }, y_axis: { ylimit_label: "Y" }
    });
    const xAxis = visual.plotProperties.xAxis;
    const yAxis = visual.plotProperties.yAxis;
    expect(Number(must(element.querySelector(".xaxislabel")).getAttribute("x"))).toBeCloseTo((xAxis.start_padding + 500 - xAxis.end_padding) / 2, 6);
    expect(Number(must(element.querySelector(".yaxislabel")).getAttribute("y"))).toBeCloseTo((500 - yAxis.start_padding + yAxis.end_padding) / 2, 6);
  });

  it("shows crosshairs at the nearest point on mouse move and hides them on leave", () => {
    const rendered = renderVisual({}, sample);
    const svg = must(rendered.element.querySelector("svg"));
    const visual = rendered.visual;
    const point = visual.viewModel.plotPoints[1];
    const px = visual.plotProperties.xScale(point.x);
    const py = visual.plotProperties.yScale(point.value);
    const rect = svg.getBoundingClientRect();
    svg.dispatchEvent(new MouseEvent("mousemove", { clientX: rect.left + px, clientY: rect.top + py, bubbles: true }));
    const vertical = must(rendered.element.querySelector<SVGLineElement>(".ttip-line-x"));
    const horizontal = must(rendered.element.querySelector<SVGLineElement>(".ttip-line-y"));
    expect(vertical.style.strokeOpacity).toBe("0.4");
    expect(Number(vertical.getAttribute("x1"))).toBeCloseTo(px, 6);
    expect(Number(vertical.getAttribute("x2"))).toBeCloseTo(px, 6);
    expect(vertical.getAttribute("y2")).toBe(String(500 - visual.plotProperties.yAxis.start_padding));
    expect(horizontal.style.strokeOpacity).toBe("0.4");
    expect(Number(horizontal.getAttribute("y1"))).toBeCloseTo(py, 6);
    expect(horizontal.getAttribute("x1")).toBe(String(visual.plotProperties.xAxis.start_padding));
    expect(vertical.getAttribute("stroke")).toBe("black");
    svg.dispatchEvent(new MouseEvent("mouseleave"));
    expect(vertical.style.strokeOpacity).toBe("0");
    expect(horizontal.style.strokeOpacity).toBe("0");
  });
});

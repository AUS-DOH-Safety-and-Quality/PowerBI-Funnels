import { describe, expect, it } from "vitest";
import { testDom, createVisualHost } from "powerbi-visuals-utils-testutils";
import { Visual } from "../src/visual";
import { ChartBuilder } from "./visualBuilder";
import { categoricalData, dataView } from "./dataViewFixture";

function must<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error("Missing element");
  return value;
}

// Changeset 8: line-label placement, error text and tooltip crosshairs render through Core
describe("renderer boundaries", () => {
  it("places line labels through the shared geometry", () => {
    const builder = new ChartBuilder(500, 500);
    const categorical = categoricalData();
    must(categorical.categories)[0].objects = [{ lines: {
      plot_label_show_target: true, plot_label_position_target: "above",
      plot_label_vpad_target: 5, plot_label_hpad_target: 3, width_target: 2,
      plot_label_show_95: true, plot_label_position_95: "beside", plot_label_hpad_95: 4
    } }, {}, {}];
    builder.update(dataView(categorical));
    const labels = builder.element.querySelectorAll(".linesgroup text");
    expect(labels).toHaveLength(3);
    const above = must(builder.element.querySelector(".linesgroup text[text-anchor='end']"));
    expect(above.getAttribute("dx")).toBe("-3px");
    expect(above.getAttribute("dy")).toBe("-7px");
    const beside = builder.element.querySelectorAll(".linesgroup text[text-anchor='start']");
    expect(beside).toHaveLength(2);
    expect(beside[0].getAttribute("dx")).toBe("4px");
    builder.destroy();
  });

  it("draws error text in the host foreground colour with the settings preamble", () => {
    const builder = new ChartBuilder(500, 500);
    const categorical = categoricalData();
    const invalid = { x_axis: { xlimit_tick_count: -1 } };
    must(categorical.categories)[0].objects = [invalid, invalid, invalid];
    builder.update(dataView(categorical));
    const texts = builder.element.querySelectorAll<SVGTextElement>(".errormessage text");
    expect(texts).toHaveLength(2);
    expect(texts[0].textContent).toBe("Invalid settings provided for all observations! First error:");
    expect(Number(texts[0].getAttribute("y"))).toBeCloseTo(500 / 3, 6);
    expect(texts[1].getAttribute("y")).toBe("250");
    expect(texts[1].style.fill).toBe("rgb(51, 51, 51)");
    builder.destroy();
  });

  it("uses the high-contrast foreground for error text", () => {
    const host = createVisualHost({});
    const palette = host.colorPalette as { isHighContrast: boolean; foreground: { value: string } };
    palette.isHighContrast = true;
    palette.foreground = { value: "#abcdef" };
    const element = testDom("500", "500");
    const visual = new Visual({ element, host });
    visual.update({ dataViews: [dataView(categoricalData([null, null, null]))], viewport: { width: 500, height: 500 }, type: 2 });
    const texts = element.querySelectorAll<SVGTextElement>(".errormessage text");
    expect(texts).toHaveLength(1);
    expect(texts[0].style.fill).toBe("rgb(171, 205, 239)");
    element.remove();
  });

  it("shows crosshairs at the nearest point on mouse move and hides them on leave", () => {
    const builder = new ChartBuilder(500, 500);
    builder.update(dataView());
    const svg = must(builder.element.querySelector("svg"));
    const visual = builder.instance;
    const point = visual.viewModel.plotPoints[1];
    const px = visual.plotProperties.xScale(point.x);
    const py = visual.plotProperties.yScale(point.value);
    const rect = svg.getBoundingClientRect();
    svg.dispatchEvent(new MouseEvent("mousemove", { clientX: rect.left + px, clientY: rect.top + py, bubbles: true }));
    const vertical = must(builder.element.querySelector<SVGLineElement>(".ttip-line-x"));
    const horizontal = must(builder.element.querySelector<SVGLineElement>(".ttip-line-y"));
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
    builder.destroy();
  });
});

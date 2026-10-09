import { describe, expect, it, vi } from "vitest";
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

  it("draws gridlines at the ticks, hides tick marks and aligns the axis labels", () => {
    const builder = new ChartBuilder(500, 500);
    const categorical = categoricalData();
    const axes = {
      x_axis: { xlimit_grid_show: true, xlimit_tick_marks: false, xlimit_label: "X", xlimit_label_align: "right" },
      y_axis: { ylimit_grid_show: true, ylimit_label: "Y", ylimit_label_align: "top", ylimit_label_style: "italic" }
    };
    must(categorical.categories)[0].objects = [axes, axes, axes];
    builder.update(dataView(categorical));
    const element = builder.element;
    const visual = builder.instance;
    const xTicks = element.querySelectorAll<SVGGElement>(".xaxisgroup .tick");
    const xGrid = element.querySelectorAll<SVGLineElement>(".gridgroup .xgridline");
    expect(xGrid.length).toBeGreaterThan(0);
    expect(xGrid).toHaveLength(xTicks.length);
    for (let i = 0; i < xTicks.length; i++) {
      // d3 offsets tick groups by half a pixel on low-DPI screens
      const tickX = Number(must(xTicks[i].getAttribute("transform")).match(/translate\(([^,]+),/)?.[1]);
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
    builder.update(dataView(categoricalData()));
    expect(element.querySelectorAll(".gridgroup .xgridline")).toHaveLength(0);
    expect(element.querySelectorAll(".gridgroup .ygridline")).toHaveLength(0);
    // Centred labels sit over the plot area, not the canvas, under uneven padding
    const padded = categoricalData();
    const uneven = {
      canvas: { left_padding: 90, right_padding: 10, upper_padding: 70, lower_padding: 30 },
      x_axis: { xlimit_label: "X" }, y_axis: { ylimit_label: "Y" }
    };
    must(padded.categories)[0].objects = [uneven, uneven, uneven];
    builder.update(dataView(padded));
    const xAxis = visual.plotProperties.xAxis;
    const yAxis = visual.plotProperties.yAxis;
    expect(Number(must(element.querySelector(".xaxislabel")).getAttribute("x"))).toBeCloseTo((xAxis.start_padding + 500 - xAxis.end_padding) / 2, 6);
    expect(Number(must(element.querySelector(".yaxislabel")).getAttribute("y"))).toBeCloseTo((500 - yAxis.start_padding + yAxis.end_padding) / 2, 6);
    builder.destroy();
  });

  it("re-adds hidden axes with ticks and labels, beneath the lines", () => {
    const builder = new ChartBuilder(500, 500);
    builder.update(dataView());
    expect(builder.element.querySelectorAll(".xaxisgroup .tick").length).toBeGreaterThan(0);
    const hidden = categoricalData();
    const off = { x_axis: { xlimit_show: false }, y_axis: { ylimit_show: false } };
    must(hidden.categories)[0].objects = [off, off, off];
    builder.update(dataView(hidden));
    expect(builder.element.querySelector(".xaxisgroup")).toBeNull();
    expect(builder.element.querySelector(".yaxisgroup")).toBeNull();
    builder.update(dataView());
    const lines = must(builder.element.querySelector(".linesgroup"));
    const xGroup = must(builder.element.querySelector(".xaxisgroup"));
    const yGroup = must(builder.element.querySelector(".yaxisgroup"));
    expect(xGroup.querySelectorAll(".tick").length).toBeGreaterThan(0);
    expect(yGroup.querySelectorAll(".tick").length).toBeGreaterThan(0);
    const xLabel = must(builder.element.querySelector(".xaxislabel"));
    expect((xLabel.compareDocumentPosition(lines) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0).toBe(true);
    expect(builder.element.querySelector(".yaxislabel")).not.toBeNull();
    expect((xGroup.compareDocumentPosition(lines) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0).toBe(true);
    expect((yGroup.compareDocumentPosition(lines) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0).toBe(true);
    expect(builder.element.querySelectorAll(".xaxisgroup")).toHaveLength(1);
    builder.destroy();
  });

  it("draws a download link that exports the plotted rows as CSV", () => {
    const host = createVisualHost({});
    const exportVisualsContent = vi.fn();
    Object.assign(host, { downloadService: { exportVisualsContent } });
    const element = testDom("500", "500");
    const visual = new Visual({ element, host });
    const categorical = categoricalData();
    const enabled = { download_options: { show_button: true } };
    must(categorical.categories)[0].objects = [enabled, enabled, enabled];
    visual.update({ dataViews: [dataView(categorical)], viewport: { width: 500, height: 500 }, type: 2 });
    const button = must(element.querySelector<SVGTextElement>(".download-btn-group"));
    expect(button.textContent).toBe("Download");
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(exportVisualsContent).toHaveBeenCalledTimes(1);
    const lines: string[] = exportVisualsContent.mock.calls[0][0].split("\n");
    expect(lines[0]).toBe("group,numerator,denominator,value,target,alt_target,ll99,ll95,ll68,ul68,ul95,ul99,two_sigma,three_sigma");
    expect(lines).toHaveLength(4);
    expect(lines[1].startsWith("A,4,10,40,")).toBe(true);
    visual.update({ dataViews: [dataView(categoricalData())], viewport: { width: 500, height: 500 }, type: 2 });
    expect(element.querySelector(".download-btn-group")).toBeNull();
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

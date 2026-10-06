import { describe, expect, it, vi } from "vitest";
import { ChartBuilder } from "./visualBuilder";
import { categoricalData, dataView } from "./dataViewFixture";
import { defaultSettings } from "../src/settings";

describe("Validated visual rendering", () => {
  const chartTypes = ["PR", "SR", "RC"];
  for (let i = 0; i < chartTypes.length; i++) {
    const chartType = chartTypes[i];
    it(`renders ${chartType} with absent optional columns and visible line labels`, () => {
      const builder = new ChartBuilder(500, 500);
      const failed = vi.spyOn(builder.visualHost.eventService, "renderingFailed");
      const categorical = categoricalData();
      if (categorical.categories === undefined) throw new Error("Missing fixture category");
      categorical.categories[0].objects = [
        { funnel: { chart_type: chartType }, lines: { plot_label_show_target: true, plot_label_show_95: true } }, {}, {}
      ];
      builder.update(dataView(categorical));
      expect(failed).not.toHaveBeenCalled();
      expect(builder.element.querySelector(".errormessage")).toBeNull();
      expect(builder.element.querySelectorAll(".dotsgroup-child")).toHaveLength(3);
      expect(builder.element.querySelectorAll(".linesgroup text").length).toBeGreaterThan(0);
      expect(builder.instance.viewModel.plotPoints[0].tooltip.length).toBeGreaterThan(0);
      builder.destroy();
    });
  }

  // Core finding 18: outside/inside on non-interval lines place labels above/below.
  it("places outside and inside labels on target lines with finite offsets", () => {
    const builder = new ChartBuilder(500, 500);
    const categorical = categoricalData();
    if (categorical.categories === undefined) throw new Error("Missing fixture category");
    categorical.categories[0].objects = [{ lines: {
      plot_label_show_target: true, plot_label_position_target: "outside",
      show_alt_target: true, alt_target: 0.5,
      plot_label_show_alt_target: true, plot_label_position_alt_target: "inside",
      plot_label_show_95: true, plot_label_position_95: "outside"
    } }, {}, {}];
    builder.update(dataView(categorical));
    const labels = builder.element.querySelectorAll(".linesgroup text");
    expect(labels).toHaveLength(4);
    for (let i = 0; i < labels.length; i++) {
      expect(labels[i].getAttribute("dy")).toMatch(/^-?\d+(\.\d+)?px$/);
    }
    builder.destroy();
  });

  it("renders with all lines hidden", () => {
    const builder = new ChartBuilder(500, 500);
    const failed = vi.spyOn(builder.visualHost.eventService, "renderingFailed");
    const categorical = categoricalData();
    if (categorical.categories === undefined) throw new Error("Missing fixture category");
    categorical.categories[0].objects = [{ lines: {
      show_target: false, show_alt_target: false, show_99: false, show_95: false, show_68: false
    } }, {}, {}];
    builder.update(dataView(categorical));
    expect(failed).not.toHaveBeenCalled();
    expect(builder.element.querySelectorAll(".linesgroup path")).toHaveLength(0);
    builder.destroy();
  });

  it("clears invalid data and rebuilds it on a later resize", () => {
    const builder = new ChartBuilder(500, 500);
    builder.update(dataView());
    builder.instance.update({ dataViews: [dataView(categoricalData([null, null, null]))], viewport: builder.viewport, type: 6 });
    expect(builder.instance.viewModel.inputData).toBeUndefined();
    expect(builder.instance.viewModel.plotPoints).toEqual([]);
    const failed = vi.spyOn(builder.visualHost.eventService, "renderingFailed").mockClear();
    builder.instance.update({ dataViews: [dataView()], viewport: builder.viewport, type: 4 });
    expect(failed).not.toHaveBeenCalled();
    expect(builder.element.querySelectorAll(".dotsgroup-child")).toHaveLength(3);
    const chart = builder.instance.viewModel.chartBase;
    builder.instance.update({ dataViews: [dataView()], viewport: builder.viewport, type: 4 });
    expect(builder.instance.viewModel.chartBase).toBe(chart);
    builder.destroy();
  });
});

it("keeps per-point formatting and warnings aligned after an input row is removed", () => {
  const builder = new ChartBuilder(500, 500);
  const failed = vi.spyOn(builder.visualHost.eventService, "renderingFailed");
  const categorical = categoricalData([4, null, 16, 25], [10, 20, 90, 100], ["A", "B", "C", "D"]);
  if (categorical.categories === undefined || categorical.values === undefined) throw new Error("Missing fixture columns");
  categorical.categories[0].objects = [
    { scatter: { size: 1, colour: { solid: { color: "#123456" } } }, labels: { label_size: 11 } },
    { scatter: { size: 90 }, labels: { label_size: 90 } },
    { scatter: { size: 3 }, labels: { label_size: -1 } },
    { scatter: { size: 4 }, labels: { label_size: 14 } }
  ];
  categorical.values.push({ source: { displayName: "Label", roles: { labels: true } }, values: ["One", "Two", "Three", "Four"] });
  try {
    builder.update(dataView(categorical));
    expect(failed).not.toHaveBeenCalled();
    const input = builder.instance.viewModel.inputData;
    if (input === undefined) throw new Error("Missing validated input");
    expect(input.id).toEqual([0, 2, 3]);
    expect(input.scatter_formatting[0].size).toBe(1);
    expect(input.scatter_formatting[0].colour).toBe("#123456");
    expect(input.scatter_formatting[1].size).toBe(3);
    expect(input.scatter_formatting[2].size).toBe(4);
    expect(input.label_formatting[1].label_size).toBe(defaultSettings.labels.label_size);
    expect(input.label_formatting[2].label_size).toBe(14);
    expect(input.warningMessage).toContain("Group B removed due to:");
    expect(input.warningMessage).toContain("Conditional formatting for Group C ignored due to: -1 is not a valid value for label_size");
    expect(input.warningMessage).not.toContain("Conditional formatting for Group A");
    const points = builder.instance.viewModel.plotPoints;
    expect(points[0].aesthetics.size).toBe(1);
    expect(points[1].label.aesthetics.label_size).toBe(defaultSettings.labels.label_size);
    expect(points[2].label.text_value).toBe("Four");
    expect(builder.element.querySelectorAll(".dotsgroup-child")).toHaveLength(3);
  } finally {
    failed.mockRestore();
    builder.destroy();
  }
});

it("preserves a blank tooltip label through settings reading and rendering", () => {
  const builder = new ChartBuilder(500, 500);
  const failed = vi.spyOn(builder.visualHost.eventService, "renderingFailed");
  const categorical = categoricalData();
  if (categorical.categories === undefined) throw new Error("Missing fixture category");
  categorical.categories[0].objects = [{ funnel: { ttip_label_numerator: "" } }, {}, {}];
  try {
    builder.update(dataView(categorical));
    expect(failed).not.toHaveBeenCalled();
    expect(builder.instance.viewModel.inputSettings.settings.funnel.ttip_label_numerator).toBe("");
    expect(builder.instance.viewModel.plotPoints[0].tooltip).toContainEqual({ displayName: "", value: "4" });
    expect(builder.instance.viewModel.inputSettings.validationStatus).toEqual({ status: 0, messages: [[], [], []] });
  } finally {
    failed.mockRestore();
    builder.destroy();
  }
});

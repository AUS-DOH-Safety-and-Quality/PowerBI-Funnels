import type powerbi from "powerbi-visuals-api";
import { testDom, createVisualHost } from "powerbi-visuals-utils-testutils";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Visual } from "../src/visual";
import buildDataView from "./helpers/buildDataView";

const sample = { key: ["A", "B", "C"], numerators: [10, 20, 30], denominators: [100, 120, 140] };

describe("Chart", () => {
  let element: HTMLElement;
  let visual: Visual;
  let host: powerbi.extensibility.visual.IVisualHost;

  beforeEach(() => {
    element = testDom("500", "500");
    host = createVisualHost({});
    visual = new Visual({ element, host });
    vi.spyOn(host.eventService, "renderingFailed");
    vi.spyOn(host.eventService, "renderingFinished");
  });

  afterEach(() => {
    element.remove();
    vi.restoreAllMocks();
  });

  function update(view: powerbi.DataView | undefined, type = 2): void {
    visual.update({ dataViews: view ? [view] : undefined, viewport: { width: 500, height: 500 }, type });
  }

  it.each([
    ["PR", 100 / 6, 10],
    ["RC", 1 / 6, 0.1],
    ["SR", 1, 0.1]
  ])("renders %s calculations and tooltips", (chart_type, target, value) => {
    update(buildDataView(sample, { funnel: { chart_type: chart_type as string } }));
    expect(host.eventService.renderingFailed).not.toHaveBeenCalled();
    expect(host.eventService.renderingFinished).toHaveBeenCalledOnce();
    expect(visual.viewModel.plotPoints).toHaveLength(3);
    expect(visual.viewModel.plotPoints[0].value).toBeCloseTo(value as number, 10);
    const limits = visual.viewModel.calculatedLimits.find(d => d.denominators === 100)!;
    expect(limits.target).toBeCloseTo(target as number, 10);
    expect(limits.ll95).toBeLessThan(limits.target);
    expect(limits.ul95).toBeGreaterThan(limits.target);
    expect(element.querySelectorAll(".dotsgroup path")).toHaveLength(3);
    expect(visual.viewModel.plotPoints[0].tooltip.find(d => d.displayName === "Group")?.value).toBe("A");
  });

  it.each(["PR", "RC", "SR"])("renders %s with overdispersion adjustment", chart_type => {
    update(buildDataView(
      { key: ["A", "B", "C"], numerators: [5, 50, 90], denominators: [100, 100, 100] },
      { funnel: { chart_type, od_adjust: "yes" } }
    ));
    expect(host.eventService.renderingFailed).not.toHaveBeenCalled();
    expect(visual.viewModel.chartBase.odAdjust).toBe(true);
    expect(visual.viewModel.chartBase.getTau2()).toBeGreaterThan(0);
    expect(visual.viewModel.plotPoints.every(d => Number.isFinite(d.z))).toBe(true);
  });

  it("renders a single observation with axes", () => {
    update(buildDataView({ key: ["A"], numerators: [10], denominators: [100] }));
    expect(host.eventService.renderingFailed).not.toHaveBeenCalled();
    expect(visual.plotProperties.displayPlot).toBe(true);
    expect(element.querySelectorAll(".xaxisgroup .tick").length).toBeGreaterThan(0);
    expect(element.querySelector(".xaxisgroup")?.getAttribute("color")).toBe("#000000");
  });

  it("keeps filtered numeric categories, labels and highlights aligned", () => {
    const view = buildDataView({
      key: [10, null, 30], numerators: [10, 20, 30], denominators: [100, 120, 140], labels: ["First", "Removed", "Last"]
    });
    view.categorical!.values![0].highlights = [null, null, 30];
    update(view);
    expect(host.eventService.renderingFailed).not.toHaveBeenCalled();
    expect(visual.viewModel.inputData.id).toEqual([0, 2]);
    expect(visual.viewModel.plotPoints).toMatchObject([
      { group_text: "10", label: { text_value: "First" }, highlighted: false },
      { group_text: "30", label: { text_value: "Last" }, highlighted: true }
    ]);
  });

  it("renders missing-data errors and recovers after valid input", () => {
    const views = [undefined, buildDataView({}), buildDataView({ key: [] }), buildDataView({ key: ["A"] })];
    for (let i = 0; i < views.length; i++) {
      update(views[i]);
      expect(element.querySelector(".errormessage")?.textContent).not.toContain("Internal Error");
      expect(element.querySelector(".errormessage")).not.toBeNull();
      expect(() => visual.plotProperties).toThrow("Plot properties require validated data.");
    }
    vi.mocked(host.eventService.renderingFailed).mockClear();
    update(buildDataView(sample));
    expect(host.eventService.renderingFailed).not.toHaveBeenCalled();
    expect(element.querySelector(".errormessage")).toBeNull();
    expect(element.querySelectorAll(".dotsgroup path")).toHaveLength(3);
  });

  it("shows invalid-data errors through resize and recovers on the next data update", () => {
    update(buildDataView(sample));
    const invalid = buildDataView({ ...sample, numerators: [null, -1, null] });
    update(invalid);
    update(invalid, 4);
    expect(element.querySelector(".errormessage")?.textContent).toBe("No valid data found!");
    expect(() => visual.plotProperties).toThrow("Plot properties require validated data.");
    vi.mocked(host.eventService.renderingFailed).mockClear();
    update(buildDataView(sample));
    expect(host.eventService.renderingFailed).not.toHaveBeenCalled();
    expect(visual.plotProperties.displayPlot).toBe(true);
  });

  it("removes line labels when every line is disabled and restores lines", () => {
    update(buildDataView(sample, { lines: { plot_label_show_target: true } }));
    expect(element.querySelectorAll(".linesgroup text").length).toBeGreaterThan(0);
    update(buildDataView(sample, { lines: {
      show_target: false, show_alt_target: false, show_99: false, show_95: false, show_68: false
    } }));
    expect(host.eventService.renderingFailed).not.toHaveBeenCalled();
    expect(element.querySelectorAll(".linesgroup path, .linesgroup text")).toHaveLength(0);
    update(buildDataView(sample));
    expect(element.querySelectorAll(".linesgroup path").length).toBeGreaterThan(0);
  });

  it("uses chart precision by default and honours explicit axis precision", () => {
    update(buildDataView(sample, { funnel: { sig_figs: 3 } }));
    expect(element.querySelector(".yaxisgroup .tick text")?.textContent).toMatch(/\.\d{3}%$/);
    update(buildDataView(sample, { funnel: { sig_figs: 3 }, y_axis: { ylimit_sig_figs: 0 } }));
    expect(element.querySelector(".yaxisgroup .tick text")?.textContent).toMatch(/^\d+%$/);
  });

  it("honours tick visibility and a zero tick count", () => {
    update(buildDataView(sample, { x_axis: { xlimit_ticks: false }, y_axis: { ylimit_ticks: false } }));
    expect(element.querySelectorAll(".tick")).toHaveLength(0);
    update(buildDataView(sample, { x_axis: { xlimit_tick_count: 0 }, y_axis: { ylimit_tick_count: 0 } }));
    expect(element.querySelectorAll(".tick")).toHaveLength(0);
    update(buildDataView(sample));
    expect(element.querySelectorAll(".tick").length).toBeGreaterThan(0);
  });

  it("uses transformed values for automatic axis bounds", () => {
    update(buildDataView(sample, { funnel: { chart_type: "RC", transformation: "sqrt" } }));
    expect(host.eventService.renderingFailed).not.toHaveBeenCalled();
    expect(visual.plotProperties.yAxis.upper).toBeCloseTo(Math.sqrt(30 / 140), 10);
    expect(visual.viewModel.plotPoints.every(d => d.value <= visual.plotProperties.yAxis.upper)).toBe(true);
  });

  it("preserves missing limits in low-count tooltips", () => {
    update(buildDataView({ key: ["A", "B"], numerators: [0, 10], denominators: [1, 100] }));
    expect(host.eventService.renderingFailed).not.toHaveBeenCalled();
    const limits = visual.viewModel.calculatedLimits.find(d => d.denominators === 1)!;
    expect(limits.ll99).toBeUndefined();
    const tooltip = visual.viewModel.plotPoints[0].tooltip;
    expect(tooltip.find(d => d.displayName === "Lower 99% Limit")?.value).toBe("");
    expect(tooltip.some(d => d.value === "NaN%")).toBe(false);
  });

  it("respects the host's interaction setting", () => {
    const select = vi.spyOn(visual.selectionManager, "select");
    const clear = vi.spyOn(visual.selectionManager, "clear");
    host.hostCapabilities.allowInteractions = false;
    update(buildDataView(sample));
    element.querySelector(".dotsgroup path")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    visual.svg.node()!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(select).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
    host.hostCapabilities.allowInteractions = true;
    element.querySelector(".dotsgroup path")!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(select).toHaveBeenCalledOnce();
  });

  it("does not open a tooltip when no point has a valid position", () => {
    update(buildDataView(sample));
    const show = vi.spyOn(host.tooltipService, "show");
    for (let i = 0; i < visual.viewModel.plotPoints.length; i++) {
      visual.viewModel.plotPoints[i].value = NaN;
    }
    visual.svg.node()!.dispatchEvent(new MouseEvent("mousemove", { clientX: 100, clientY: 100 }));
    expect(show).not.toHaveBeenCalled();
  });
});

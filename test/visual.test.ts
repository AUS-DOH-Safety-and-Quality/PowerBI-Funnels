import type powerbi from "powerbi-visuals-api";
import { testDom, createVisualHost } from "powerbi-visuals-utils-testutils";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Visual } from "../src/visual";
import buildDataView from "./helpers/buildDataView";
import { updateType } from "powerbi-visuals-core/powerbi";
import { must } from "powerbi-visuals-core/testing";

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

  function update(view: powerbi.DataView | undefined, type: powerbi.VisualUpdateType = updateType.data): void {
    visual.update({ dataViews: view ? [view] : [], viewport: { width: 500, height: 500 }, type });
  }

  it.each([
    ["PR", 100 / 6, 10],
    ["RC", 1 / 6, 0.1],
    ["SR", 1, 0.1]
  ] as const)("renders the %s target and values", (chart_type, target, value) => {
    update(buildDataView(sample, { funnel: { chart_type } }));
    expect(host.eventService.renderingFailed).not.toHaveBeenCalled();
    expect(element.querySelectorAll(".dotsgroup path")).toHaveLength(3);
    expect(visual.viewModel.plotPoints[0].value).toBeCloseTo(value, 10);
    expect(visual.viewModel.plotPoints[0].limits.target).toBeCloseTo(target, 10);
  });

  it.each(["PR", "RC", "SR"] as const)("renders %s with overdispersion adjustment", chart_type => {
    update(buildDataView(
      { key: ["A", "B", "C"], numerators: [5, 50, 90], denominators: [100, 100, 100] },
      { funnel: { chart_type, od_adjust: "yes" } }
    ));
    expect(host.eventService.renderingFailed).not.toHaveBeenCalled();
    expect(must(visual.viewModel.chartBase).odAdjust).toBe(true);
    expect(must(visual.viewModel.chartBase).getTau2()).toBeGreaterThan(0);
    const points = visual.viewModel.plotPoints;
    for (let i = 0; i < points.length; i++) {
      expect(Number.isFinite(points[i].z)).toBe(true);
    }
  });

  it("renders a single observation with axes", () => {
    update(buildDataView({ key: ["A"], numerators: [10], denominators: [100] }));
    expect(host.eventService.renderingFailed).not.toHaveBeenCalled();
    expect(visual.plotProperties.displayPlot).toBe(true);
    expect(element.querySelectorAll(".xaxisgroup .tick").length).toBeGreaterThan(0);
    expect(element.querySelector(".xaxisgroup")?.getAttribute("color")).toBe("#000000");
  });

  it("draws empty views blank, missing roles as errors, and recovers after valid input", () => {
    const empty = [undefined, buildDataView({ key: [] })];
    for (let i = 0; i < empty.length; i++) {
      update(buildDataView(sample));
      vi.mocked(host.eventService.renderingFinished).mockClear();
      update(empty[i]);
      expect(element.querySelector(".errormessage")).toBeNull();
      expect(element.querySelectorAll(".dotsgroup path, .linesgroup path, .tick")).toHaveLength(0);
      expect(host.eventService.renderingFinished).toHaveBeenCalledOnce();
    }
    expect(host.eventService.renderingFailed).not.toHaveBeenCalled();
    const missing = [
      [buildDataView({}), "No grouping/ID variable passed!"],
      [buildDataView({ key: ["A"] }), "No numerators passed!"]
    ] as const;
    for (let i = 0; i < missing.length; i++) {
      update(missing[i][0]);
      expect(element.querySelector(".errormessage")?.textContent).toBe(missing[i][1]);
    }
    expect(host.eventService.renderingFailed).toHaveBeenCalledTimes(2);
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
    update(invalid, updateType.resize);
    expect(element.querySelector(".errormessage")?.textContent).toBe("No valid data found!");
    vi.mocked(host.eventService.renderingFailed).mockClear();
    update(buildDataView(sample));
    expect(host.eventService.renderingFailed).not.toHaveBeenCalled();
    expect(visual.plotProperties.displayPlot).toBe(true);
  });

  it("uses chart precision by default and honours explicit axis precision", () => {
    update(buildDataView(sample, { funnel: { sig_figs: 3 } }));
    expect(element.querySelector(".yaxisgroup .tick text")?.textContent).toMatch(/\.\d{3}%$/);
    update(buildDataView(sample, { funnel: { sig_figs: 3 }, y_axis: { ylimit_sig_figs: 0 } }));
    expect(element.querySelector(".yaxisgroup .tick text")?.textContent).toMatch(/^\d+%$/);
  });

  it("uses transformed values for automatic axis bounds", () => {
    update(buildDataView(sample, { funnel: { chart_type: "RC", transformation: "sqrt" } }));
    expect(host.eventService.renderingFailed).not.toHaveBeenCalled();
    const points = visual.viewModel.plotPoints;
    for (let i = 0; i < points.length; i++) {
      expect(points[i].value).toBeLessThanOrEqual(visual.plotProperties.yAxis.upper);
    }
  });

  // Rate limits can widen with the denominator at expected counts below 0.5, so they are dropped there
  it("drops widening rate limits, and their flags, whatever the x-axis range", () => {
    const data = { key: ["A", "B"], numerators: [0, 10], denominators: [1, 100] };
    const upperLimits = [undefined, 200, 1000];
    let reference: number | undefined;
    for (let i = 0; i < upperLimits.length; i++) {
      update(buildDataView(data, { funnel: { chart_type: "RC" }, x_axis: { xlimit_u: upperLimits[i] }, outliers: { two_sigma: true, three_sigma: true } }));
      const low = visual.viewModel.plotPoints[0].table_row;
      expect([low.ll99, low.ll95, low.ll68, low.ul68, low.ul95, low.ul99]).toEqual(new Array(6).fill(undefined));
      expect([low.two_sigma, low.three_sigma]).toEqual(["none", "none"]);
      reference ??= visual.viewModel.plotPoints[1].table_row.ul99;
      expect(visual.viewModel.plotPoints[1].table_row.ul99).toBe(reference);
    }
  });

  it("respects the host's interaction setting", () => {
    const select = vi.spyOn(visual.selectionManager, "select");
    const clear = vi.spyOn(visual.selectionManager, "clear");
    host.hostCapabilities.allowInteractions = false;
    update(buildDataView(sample));
    must(element.querySelector(".dotsgroup path")).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    must(visual.svg.node()).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(select).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
    host.hostCapabilities.allowInteractions = true;
    must(element.querySelector(".dotsgroup path")).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(select).toHaveBeenCalledOnce();
  });
});

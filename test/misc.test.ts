import type powerbi from "powerbi-visuals-api";
import { describe, expect, it, vi } from "vitest";
import { Visual } from "../src/visual";
import viewModelClass from "../src/Classes/viewModelClass";
import { categoricalData, dataView } from "./dataViewFixture";
import { keyedHost } from "powerbi-visuals-core/testing";

function miscView(): powerbi.DataView {
  const categorical = categoricalData([80, 4, 20, 20, 24, 24, 30, 30], Array(8).fill(100), ["A", "A", "B", "B", "C", "C", "D", "D"]);
  categorical.categories!.push({ source: { displayName: "Indicator", roles: { indicator: true } },
    values: ["Higher", "Lower", "Higher", "Lower", "Higher", "Lower", "Higher", "Lower"] });
  categorical.categories![0].objects = new Array(8);
  for (let i = 0; i < 8; i++) categorical.categories![0].objects[i] = {
    outliers: { improvement_direction: i % 2 === 0 ? "increase" : "decrease" }
  };
  categorical.values!.push({ source: { displayName: "Extra", roles: { tooltips: true } }, values: ["A-H", "A-L", "B-H", "B-L", "C-H", "C-L", "D-H", "D-L"] });
  return dataView(categorical);
}

function update(model: viewModelClass, view: powerbi.DataView, host = keyedHost()) {
  return model.update({ dataViews: [view], viewport: { width: 700, height: 400 }, type: 2 }, host);
}

describe("MISC calculations", () => {
  const chartTypes = ["PR", "SR", "RC"] as const;
  for (let c = 0; c < chartTypes.length; c++) {
    const chartType = chartTypes[c];
    it(`uses independent ${chartType} funnels and favourable-direction scores`, () => {
      const host = keyedHost();
      const model = new viewModelClass(host);
      const view = miscView();
      const objects = view.categorical!.categories![0].objects!;
      for (let i = 0; i < objects.length; i++) objects[i].funnel = { chart_type: chartType, od_adjust: "yes" };
      expect(update(model, view, host).status).toBe(true);
      expect(model.miscPoints).toHaveLength(2);
      for (let i = 0; i < 2; i++) {
        const population = categoricalData(i === 0 ? [80, 20, 24, 30] : [4, 20, 24, 30], [100, 100, 100, 100], ["A", "B", "C", "D"]);
        population.categories![0].objects = [{ funnel: { chart_type: chartType, od_adjust: "yes" },
          outliers: { improvement_direction: i === 0 ? "increase" : "decrease", three_sigma: true } }];
        const funnel = new viewModelClass(host);
        expect(update(funnel, dataView(population), host).status).toBe(true);
        expect(model.miscPoints[i].z).toBe(funnel.plotPoints[0].z);
        expect(model.miscPoints[i].score).toBe(funnel.plotPoints[0].z * (i === 0 ? 1 : -1));
        expect(model.miscPoints[i].three_sigma).toBe(funnel.plotPoints[0].three_sigma);
        expect(model.miscPoints[i].tooltip).toContainEqual({ displayName: "Extra", value: i === 0 ? "A-H" : "A-L" });
      }
      expect(model.miscPoints[0].identity.getKey()).toBe("Group[0];Indicator[0];");
      expect(model.miscPoints[1].identity.getKey()).toBe("Group[1];Indicator[1];");
    });
  }

  it("populates and persists a group dropdown without filtering the comparison population", () => {
    const host = keyedHost();
    const model = new viewModelClass(host);
    const view = miscView();
    expect(update(model, view, host).status).toBe(true);
    const settings = model.inputSettings;
    expect(settings.miscGroups.map(item => item.displayName)).toEqual(["A", "B", "C", "D"]);
    const card = settings.getFormattingModel().cards.find(card => card.uid === "misc_card_uid")!;
    expect(card.groups[0].slices![0]).toMatchObject({ control: { type: "Dropdown", properties: {
      descriptor: { objectName: "misc", propertyName: "group" }, items: settings.miscGroups, value: settings.miscGroups[0]
    } } });
    const selected = settings.miscGroups[1].value;
    view.metadata.objects = { misc: { group: selected } };
    expect(update(model, view, host).status).toBe(true);
    expect(model.miscPoints[0].group_text).toBe("B");
    expect(model.miscPoints[0].numerator).toBe(20);
    expect(model.miscPoints[1].numerator).toBe(20);
    expect(model.miscPoints[0].score).toBeLessThan(0);
    expect(model.inputSettings.settings.misc.group).toBe(selected);
  });

  it("keeps raw-row warnings, formatting and highlights aligned across interleaved indicators", () => {
    const view = miscView();
    const categorical = view.categorical!;
    categorical.values![0].values[2] = null;
    categorical.values![0].highlights = [null, 4, null, null, null, null, null, null];
    categorical.categories![0].objects![1].scatter = { colour: { solid: { color: "#123456" } }, opacity_selected: 0.7 };
    categorical.categories![0].objects![5].labels = { label_size: -1 };
    const model = new viewModelClass(keyedHost());
    const status = update(model, view);
    expect(status.status).toBe(true);
    if (!status.status) throw new Error(status.error);
    expect(status.warning).toContain("Higher: Group B removed");
    expect(status.warning).toContain("Lower: Conditional formatting for Group C ignored");
    expect(model.miscPoints[1].highlighted).toBe(true);
    expect(model.miscAnyHighlights).toBe(true);
    expect(model.miscPoints[1].aesthetics.opacity_selected).toBe(0.7);
  });

  it("supports multiple indicator columns and a single indicator", () => {
    const view = miscView();
    view.categorical!.categories!.push({ source: { displayName: "Domain", roles: { indicator: true } }, values: Array(8).fill("Safety") });
    const model = new viewModelClass(keyedHost());
    expect(update(model, view).status).toBe(true);
    expect(model.miscPoints[0].indicator).toBe("Higher / Safety");
    const single = categoricalData();
    single.categories!.push({ source: { displayName: "Indicator", roles: { indicator: true } }, values: ["Only", "Only", "Only"] });
    expect(update(model, dataView(single)).status).toBe(true);
    expect(model.miscPoints).toHaveLength(1);
  });

  it("retains per-indicator chart types and distinct typed group choices", () => {
    const view = miscView();
    const categorical = view.categorical!;
    categorical.categories![0].values = [1, 1, "1", "1", "C", "C", "D", "D"];
    for (let i = 0; i < 8; i++) categorical.categories![0].objects![i].funnel = { chart_type: i % 2 === 0 ? "PR" : "RC" };
    const model = new viewModelClass(keyedHost());
    expect(update(model, view).status).toBe(true);
    const items = model.inputSettings.miscGroups;
    expect(items).toHaveLength(4);
    expect(items[0].displayName).toBe(items[1].displayName);
    expect(items[0].value).not.toBe(items[1].value);
    expect(model.inputSettings.groupSettings[0].funnel.chart_type).toBe("PR");
    expect(model.inputSettings.groupSettings[1].funnel.chart_type).toBe("RC");
    view.metadata.objects = { misc: { group: items[1].value } };
    expect(update(model, view).status).toBe(true);
    expect(model.miscPoints[0].numerator).toBe(20);
    expect(model.miscPoints[0].identity.getKey()).toBe("Group[2];Indicator[2];");
  });

  it("rejects inconsistent directions and stale selections, then recovers", () => {
    const model = new viewModelClass(keyedHost());
    const view = miscView();
    view.categorical!.categories![0].objects![2].outliers = { improvement_direction: "decrease" };
    expect(update(model, view)).toMatchObject({ status: false, type: "settings" });
    expect(model.miscPoints).toEqual([]);
    const valid = miscView();
    valid.metadata.objects = { misc: { group: "missing" } };
    expect(update(model, valid)).toMatchObject({ status: false, type: "settings" });
    valid.metadata.objects = {};
    expect(update(model, valid).status).toBe(true);
    expect(model.miscPoints).toHaveLength(2);
  });

  it("omits indicators with no valid selected group", () => {
    const view = miscView();
    view.categorical!.values![0].values[1] = null;
    const model = new viewModelClass(keyedHost());
    expect(update(model, view).status).toBe(true);
    expect(model.miscPoints).toHaveLength(1);
    expect(model.miscPoints[0].indicator).toBe("Higher");
  });
});

describe("MISC rendering", () => {
  it("honours high contrast, highlighting, context menus and format-only group updates", () => {
    const element = document.createElement("div");
    document.body.append(element);
    const host = keyedHost();
    host.hostCapabilities.allowInteractions = true;
    host.colorPalette.isHighContrast = true;
    const visual = new Visual({ element, host });
    const menu = vi.spyOn(visual.selectionManager, "showContextMenu");
    const view = miscView();
    view.categorical!.values![0].highlights = [null, 4, null, null, null, null, null, null];
    try {
      visual.update({ dataViews: [view], viewport: { width: 700, height: 400 }, type: 2 });
      const bars = element.querySelectorAll(".misc-bar");
      expect(bars[0].getAttribute("fill")).toBe(host.colorPalette.foreground.value);
      expect(bars[0].getAttribute("opacity")).toBe("0.2");
      expect(bars[1].getAttribute("opacity")).toBe("1");
      bars[1].dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 10, clientY: 20 }));
      expect(menu).toHaveBeenCalledWith(visual.viewModel.miscPoints[1].identity, { x: 10, y: 20 });
      view.metadata.objects = { misc: { group: visual.viewModel.inputSettings.miscGroups[1].value } };
      visual.update({ dataViews: [view], viewport: { width: 700, height: 400 }, type: 16 });
      expect(visual.viewModel.miscPoints[0].group_text).toBe("B");
    } finally {
      element.remove();
    }
  });

  it("draws clipped bars and limits, supports interactions, and switches back to a funnel", async () => {
    const element = document.createElement("div");
    document.body.append(element);
    const host = keyedHost();
    host.hostCapabilities.allowInteractions = true;
    const visual = new Visual({ element, host });
    const tooltip = vi.spyOn(host.tooltipService, "show");
    const selected = vi.spyOn(visual.selectionManager, "select");
    const failed = vi.spyOn(host.eventService, "renderingFailed");
    try {
      visual.update({ dataViews: [miscView()], viewport: { width: 700, height: 400 }, type: 2 });
      expect(failed).not.toHaveBeenCalled();
      const bars = element.querySelectorAll<SVGRectElement>(".misc-bar");
      expect(bars).toHaveLength(2);
      expect(element.querySelectorAll(".misc-limit-99")).toHaveLength(2);
      expect(element.textContent).toContain("99.8% Control Limits");
      expect(element.textContent).toContain("Favourable");
      const zero = Number(element.querySelector(".misc-zero-line")!.getAttribute("x1"));
      expect(Number(bars[0].getAttribute("x"))).toBe(zero);
      expect(Number(bars[0].getAttribute("width"))).toBeGreaterThan(0);
      expect(bars[0].getAttribute("fill")).toBe("#00B0F0");
      bars[0].dispatchEvent(new MouseEvent("mouseover", { clientX: 20, clientY: 30, bubbles: true }));
      expect(tooltip).toHaveBeenCalledWith(expect.objectContaining({ dataItems: visual.viewModel.miscPoints[0].tooltip }));
      bars[0].dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      expect(selected).toHaveBeenCalledWith(visual.viewModel.miscPoints[0].identity, false);
      const points = visual.viewModel.miscPoints;
      visual.update({ dataViews: [miscView()], viewport: { width: 800, height: 500 }, type: 4 });
      expect(visual.viewModel.miscPoints).toBe(points);
      visual.update({ dataViews: [dataView()], viewport: { width: 700, height: 400 }, type: 2 });
      expect(element.querySelectorAll(".misc-bar")).toHaveLength(0);
      expect(element.querySelectorAll(".dotsgroup-child")).toHaveLength(3);
      expect(failed).not.toHaveBeenCalled();
    } finally {
      element.remove();
    }
  });
});

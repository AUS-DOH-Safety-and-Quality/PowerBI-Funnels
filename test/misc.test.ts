import type powerbi from "powerbi-visuals-api";
import { describe, expect, it, vi } from "vitest";
import { Visual } from "../src/visual";
import viewModelClass from "../src/Classes/viewModelClass";
import buildDataView, { sample, type Inputs, type SettingsOverrides } from "./helpers/buildDataView";
import { cells, keyedHost, findBy, must, type DataViewColumnInput } from "powerbi-visuals-core/testing";
import type { PrimitiveValue } from "powerbi-visuals-core/powerbi";

type MiscInputs = Inputs & { columns: DataViewColumnInput[] };

/** Four groups with a Higher and a Lower indicator each */
function miscInputs(numerators: PrimitiveValue[] = [80, 4, 20, 20, 24, 24, 30, 30]): MiscInputs {
  return {
    key: ["A", "A", "B", "B", "C", "C", "D", "D"],
    numerators,
    denominators: Array(8).fill(100),
    columns: [
      { role: "indicator", values: ["Higher", "Lower", "Higher", "Lower", "Higher", "Lower", "Higher", "Lower"], displayName: "Indicator" },
      { role: "tooltips", values: ["A-H", "A-L", "B-H", "B-L", "C-H", "C-L", "D-H", "D-L"], displayName: "Extra" }
    ]
  };
}

/** Each indicator's improvement direction, row by row */
function miscSettings(): SettingsOverrides[] {
  const rows = new Array<SettingsOverrides>(8);
  for (let i = 0; i < 8; i++) {
    rows[i] = { outliers: { improvement_direction: i % 2 === 0 ? "increase" : "decrease" } };
  }
  return rows;
}

function miscView(numerators?: PrimitiveValue[], settings = miscSettings(), inputs = miscInputs(numerators)): powerbi.DataView {
  return buildDataView(inputs, settings);
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
      const rows = miscSettings();
      for (let i = 0; i < rows.length; i++) {
        rows[i] = { ...rows[i], funnel: { chart_type: chartType, od_adjust: "yes" } };
      }
      expect(update(model, miscView(undefined, rows), host).status).toBe(true);
      expect(model.miscPoints).toHaveLength(2);
      for (let i = 0; i < 2; i++) {
        const population = buildDataView({
          key: ["A", "B", "C", "D"], numerators: i === 0 ? [80, 20, 24, 30] : [4, 20, 24, 30], denominators: [100, 100, 100, 100]
        }, {
          funnel: { chart_type: chartType, od_adjust: "yes" },
          outliers: { improvement_direction: i === 0 ? "increase" : "decrease", three_sigma: true }
        });
        const funnel = new viewModelClass(host);
        expect(update(funnel, population, host).status).toBe(true);
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
    expect(model.miscGroups).toMatchObject([
      { displayName: "A" },
      { displayName: "B" },
      { displayName: "C" },
      { displayName: "D" }
    ]);
    const card = must(findBy(model.getFormattingModel().cards, "uid", "misc_card_uid"));
    expect(card.groups[0].slices[0]).toMatchObject({ control: { type: "Dropdown", properties: {
      descriptor: { objectName: "misc", propertyName: "group" }, items: model.miscGroups, value: model.miscGroups[0]
    } } });
    const selected = model.miscGroups[1].value;
    view.metadata.objects = { misc: { group: selected } };
    expect(update(model, view, host).status).toBe(true);
    expect(model.miscPoints[0].group_text).toBe("B");
    expect(model.miscPoints[0].numerator).toBe(20);
    expect(model.miscPoints[1].numerator).toBe(20);
    expect(model.miscPoints[0].score).toBeLessThan(0);
    expect(model.inputSettings.settings.misc.group).toBe(selected);
  });

  it("keeps raw-row warnings, formatting and highlights aligned across interleaved indicators", () => {
    const rows = miscSettings();
    rows[1] = { ...rows[1], scatter: { colour: "#123456", opacity_selected: 0.7 } };
    rows[5] = { ...rows[5], labels: { label_size: -1 } };
    const view = miscView([80, 4, null, 20, 24, 24, 30, 30], rows);
    must(view.categorical?.values)[0].highlights = cells([null, 4, null, null, null, null, null, null]);
    const model = new viewModelClass(keyedHost());
    const status = update(model, view);
    expect(status.status).toBe(true);
    if (!status.status) {
      throw new Error(status.error);
    }
    expect(status.warning).toContain("Higher: Group B removed");
    expect(status.warning).toContain("Lower: Conditional formatting for Group C ignored");
    expect(model.miscPoints[1].highlighted).toBe(true);
    expect(model.miscAnyHighlights).toBe(true);
    expect(model.miscPoints[1].aesthetics.opacity_selected).toBe(0.7);
  });

  it("supports multiple indicator columns and a single indicator", () => {
    const inputs = miscInputs();
    inputs.columns.push({ role: "indicator", values: Array(8).fill("Safety"), displayName: "Domain" });
    const model = new viewModelClass(keyedHost());
    expect(update(model, miscView(undefined, undefined, inputs)).status).toBe(true);
    expect(model.miscPoints[0].indicator).toBe("Higher / Safety");
    const single = buildDataView({ ...sample, columns: [{ role: "indicator", values: ["Only", "Only", "Only"], displayName: "Indicator" }] });
    expect(update(model, single).status).toBe(true);
    expect(model.miscPoints).toHaveLength(1);
  });

  it("retains per-indicator chart types and numeric group choices", () => {
    const rows = miscSettings();
    for (let i = 0; i < 8; i++) {
      rows[i] = { ...rows[i], funnel: { chart_type: i % 2 === 0 ? "PR" : "RC" } };
    }
    const view = miscView(undefined, rows, { ...miscInputs(), key: [1, 1, 2, 2, 3, 3, 4, 4] });
    const model = new viewModelClass(keyedHost());
    expect(update(model, view).status).toBe(true);
    const items = model.miscGroups;
    expect(items).toHaveLength(4);
    expect(model.inputSettings.groupSettings[0].funnel.chart_type).toBe("PR");
    expect(model.inputSettings.groupSettings[1].funnel.chart_type).toBe("RC");
    view.metadata.objects = { misc: { group: items[1].value } };
    expect(update(model, view).status).toBe(true);
    expect(model.miscPoints[0].numerator).toBe(20);
    expect(model.miscPoints[0].identity.getKey()).toBe("Group[2];Indicator[2];");
  });

  it("rejects inconsistent directions and stale selections, then recovers", () => {
    const model = new viewModelClass(keyedHost());
    const rows = miscSettings();
    rows[2] = { outliers: { improvement_direction: "decrease" } };
    // The messages name the setting, so they skip the all-observations settings preamble
    expect(update(model, miscView(undefined, rows))).toEqual({
      status: false, type: undefined, error: "Higher: Each MISC indicator must have one improvement direction: increase or decrease."
    });
    expect(model.miscPoints).toEqual([]);
    expect(update(model, miscView([80, null, 20, null, 24, null, 30, null], rows))).toEqual({
      status: false, type: undefined,
      error: "Higher: Each MISC indicator must have one improvement direction: increase or decrease.\nLower: All numerators are missing or null!"
    });
    const valid = miscView();
    valid.metadata.objects = { misc: { group: "missing" } };
    expect(update(model, valid)).toMatchObject({ status: false, type: undefined });
    valid.metadata.objects = {};
    expect(update(model, valid).status).toBe(true);
    expect(model.miscPoints).toHaveLength(2);
  });

  it("omits indicators with no valid selected group", () => {
    const view = miscView([80, null, 20, 20, 24, 24, 30, 30]);
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
    must(view.categorical?.values)[0].highlights = cells([null, 4, null, null, null, null, null, null]);
    try {
      visual.update({ dataViews: [view], viewport: { width: 700, height: 400 }, type: 2 });
      const bars = element.querySelectorAll(".misc-bar");
      expect(bars[0].getAttribute("fill")).toBe(host.colorPalette.foreground.value);
      expect(bars[0].getAttribute("opacity")).toBe("0.2");
      expect(bars[1].getAttribute("opacity")).toBe("1");
      bars[1].dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 10, clientY: 20 }));
      expect(menu).toHaveBeenCalledWith(visual.viewModel.miscPoints[1].identity, { x: 10, y: 20 });
      view.metadata.objects = { misc: { group: visual.viewModel.miscGroups[1].value } };
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
      expect(element.textContent).toContain("99% Control Limits");
      expect(element.textContent).toContain("Favourable");
      const zero = Number(must(element.querySelector(".misc-zero-line")).getAttribute("x1"));
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
      visual.update({ dataViews: [buildDataView(sample)], viewport: { width: 700, height: 400 }, type: 2 });
      expect(element.querySelectorAll(".misc-bar")).toHaveLength(0);
      expect(element.querySelectorAll(".dotsgroup path")).toHaveLength(3);
      expect(failed).not.toHaveBeenCalled();
    } finally {
      element.remove();
    }
  });
});

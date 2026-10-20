import { describe, expect, it, vi } from "vitest";
import { keyedHost, must } from "powerbi-visuals-core/testing";
import { sample } from "./helpers/buildDataView";
import { renderVisual, type Rendered } from "./helpers/renderVisual";

const indicators = { role: "indicator", values: ["X", "X", "X"], displayName: "Indicator" };
// A is above the 99% limit, B between the upper 95% and 99% limits and F below the lower 99% limit
const flagged = { key: ["A", "B", "C", "D", "E", "F"], numerators: [50, 37, 20, 25, 22, 6], denominators: [100, 100, 100, 120, 80, 100] };
const flagLabels: Record<string, string> = { none: "", improvement: "Improvement", deterioration: "Deterioration" };

function headers(rendered: Rendered): (string | null)[] {
  const cells = rendered.element.querySelectorAll(".table-header th text");
  const labels = new Array<string | null>(cells.length);
  for (let i = 0; i < cells.length; i++) {
    labels[i] = cells[i].textContent;
  }
  return labels;
}

function rowTexts(rendered: Rendered, row: number): (string | null)[] {
  const cells = rendered.element.querySelectorAll("tbody tr")[row].querySelectorAll("td");
  const texts = new Array<string | null>(cells.length);
  for (let i = 0; i < cells.length; i++) {
    texts[i] = cells[i].textContent;
  }
  return texts;
}

function tableShown(rendered: Rendered): boolean {
  const div = must(rendered.element.querySelector("div"));
  const svg = must(rendered.element.querySelector("svg"));
  expect(div.style.width).toBe(div.style.height);
  return div.style.width === "100%" && svg.getAttribute("width") === "0";
}

describe("summary table", () => {
  it("opens the context menu for the row of a right-clicked cell", () => {
    const rendered = renderVisual({ summary_table: { show_table: true } }, sample);
    const show = vi.spyOn(rendered.visual.selectionManager, "showContextMenu").mockResolvedValue({});
    const cell = rendered.element.querySelectorAll("tbody tr")[1].querySelectorAll("td")[2];
    cell.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 5, clientY: 6 }));
    expect(show).toHaveBeenLastCalledWith(rendered.visual.viewModel.plotPoints[1].identity, { x: 5, y: 6 });
  });

  it("draws the chart until the table is turned on, then the groups as rows", () => {
    const rendered = renderVisual({}, sample);
    expect(tableShown(rendered)).toBe(false);
    expect(must(rendered.element.querySelector("svg")).getAttribute("width")).toBe("500");

    rendered.update({ summary_table: { show_table: true } });
    expect(tableShown(rendered)).toBe(true);
    expect(headers(rendered)).toEqual([
      "Group", "Value", "Numerator", "Denominator", "Upper 99% Limit", "Upper 95% Limit", "Centerline", "Lower 95% Limit", "Lower 99% Limit"
    ]);
    expect(rendered.element.querySelectorAll("tbody tr")).toHaveLength(3);
    const point = rendered.visual.viewModel.plotPoints[0];
    const format = rendered.visual.viewModel.inputSettings.derivedSettings[0].formatValue;
    expect(rowTexts(rendered, 0)).toEqual([
      "A", "40.00%", "4", "10", format(point.limits.ul99, "value"), format(point.limits.ul95, "value"),
      format(point.limits.target, "value"), format(point.limits.ll95, "value"), format(point.limits.ll99, "value")
    ]);
    const cells = rendered.element.querySelectorAll<HTMLElement>("tbody tr")[0].querySelectorAll<HTMLElement>("td");
    expect(cells[0].style.textAlign).toBe("left");
    expect(cells[1].style.textAlign).toBe("right");
    expect(cells[2].style.textAlign).toBe("right");

    rendered.update({});
    expect(tableShown(rendered)).toBe(false);
    expect(must(rendered.element.querySelector("svg")).getAttribute("width")).toBe("500");
  });

  it("follows the tooltip, line and outlier settings for its columns", () => {
    const rendered = renderVisual({
      summary_table: { show_table: true },
      funnel: { ttip_label_group: "Hospital", ttip_show_numerator: false, ttip_show_denominator: false },
      lines: { show_95: false, show_alt_target: true, alt_target: 30, ttip_label_target: "Mean" },
      outliers: { three_sigma: true, two_sigma: true }
    }, flagged);
    expect(headers(rendered)).toEqual([
      "Hospital", "Value", "Upper 99% Limit", "Mean", "Alt. Target", "Lower 99% Limit", "Three Sigma", "Two Sigma"
    ]);
    const points = rendered.visual.viewModel.plotPoints;
    for (let i = 0; i < points.length; i++) {
      const texts = rowTexts(rendered, i);
      expect(texts[4]).toBe("30.00%");
      expect(texts[6]).toBe(flagLabels[points[i].three_sigma]);
      expect(texts[7]).toBe(flagLabels[points[i].two_sigma]);
    }
    expect(rowTexts(rendered, 0)[6]).toBe("Improvement");
    expect(rowTexts(rendered, 1)[7]).toBe("Improvement");
    expect(rowTexts(rendered, 5)[6]).toBe("Deterioration");
  });

  it.each(["PR", "SR", "RC"] as const)("writes integral %s counts without the reported decimals", chart_type => {
    const counts = [["4", "10"], ["16", "90"], ["25", "100"]];
    const rendered = renderVisual({ summary_table: { show_table: true }, funnel: { chart_type, sig_figs: 3 } }, sample);
    for (let i = 0; i < counts.length; i++) {
      expect(rowTexts(rendered, i).slice(2, 4)).toEqual(counts[i]);
      expect(rowTexts(rendered, i)[1]).toMatch(/\.\d{3}%?$/);
    }
  });

  it.each(["PR", "SR", "RC"] as const)("writes non-integral %s counts with the reported decimals rather than rounding them", chart_type => {
    const rendered = renderVisual({ summary_table: { show_table: true }, funnel: { chart_type, sig_figs: 3 } }, {
      key: ["A", "B", "C"], numerators: [4, 16.5, 25], denominators: [10, 90.25, 100]
    });
    expect(rowTexts(rendered, 0).slice(2, 4)).toEqual(["4", "10"]);
    expect(rowTexts(rendered, 1).slice(2, 4)).toEqual(["16.500", "90.250"]);
  });

  it("selects a row on click and fades the others by the table opacities", async () => {
    const host = keyedHost();
    host.hostCapabilities.allowInteractions = true;
    const rendered = renderVisual({ summary_table: { show_table: true, table_opacity_unselected: 0.4 } }, sample, { host });
    const select = vi.spyOn(rendered.visual.selectionManager, "select");
    const rows = rendered.element.querySelectorAll<HTMLElement>("tbody tr");
    rows[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(select).toHaveBeenCalledWith(rendered.visual.viewModel.plotPoints[1].identity, false);
    await new Promise(resolve => setTimeout(resolve));
    expect(rows[0].style.opacity).toBe("0.4");
    expect(rows[1].style.opacity).toBe("1");
    expect(rows[2].style.opacity).toBe("0.4");
  });

  it("shows rows at the table opacity, then the selected row at its own opacity", async () => {
    const host = keyedHost();
    host.hostCapabilities.allowInteractions = true;
    const opacities = { table_opacity: 0.9, table_opacity_selected: 0.6, table_opacity_unselected: 0.2 };
    const rendered = renderVisual({ summary_table: { show_table: true, ...opacities } }, sample, { host });
    const rows = rendered.element.querySelectorAll<HTMLElement>("tbody tr");
    for (let i = 0; i < rows.length; i++) {
      expect(rows[i].style.opacity).toBe("0.9");
    }
    rows[2].dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve));
    expect(rows[0].style.opacity).toBe("0.2");
    expect(rows[1].style.opacity).toBe("0.2");
    expect(rows[2].style.opacity).toBe("0.6");
    rendered.update({ summary_table: { show_table: true, ...opacities, table_opacity_selected: 0.75 } });
    const updated = rendered.element.querySelectorAll<HTMLElement>("tbody tr");
    expect(updated[2].style.opacity).toBe("0.75");
    expect(updated[0].style.opacity).toBe("0.2");
  });

  it("gives way to the MISC chart when indicators are supplied", () => {
    const rendered = renderVisual({ summary_table: { show_table: true } }, { ...sample, columns: [indicators] });
    expect(tableShown(rendered)).toBe(false);
    expect(rendered.element.querySelector(".misc-root")).not.toBeNull();
  });
});

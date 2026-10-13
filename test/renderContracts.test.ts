import { describe, expect, it, vi } from "vitest";
import { createVisualHost } from "powerbi-visuals-utils-testutils";
import { cells, findBy, must } from "powerbi-visuals-core/testing";
import buildDataView, { sample } from "./helpers/buildDataView";
import { renderVisual } from "./helpers/renderVisual";
import { defaultSettings } from "../src/settings";
import { updateType } from "powerbi-visuals-core/powerbi";

const viewport = { width: 500, height: 500 };

describe("Validated visual rendering", () => {
  it("clears invalid data, rebuilds on the next data update and reuses the chart on a resize", () => {
    const host = createVisualHost({});
    const rendered = renderVisual({}, sample, { host });
    const visual = rendered.visual;
    visual.update({ dataViews: [buildDataView({ ...sample, numerators: [null, null, null] })], viewport, type: updateType.data });
    expect(visual.viewModel.inputData).toBeUndefined();
    expect(visual.viewModel.plotPoints).toEqual([]);
    const failed = vi.spyOn(host.eventService, "renderingFailed").mockClear();
    const valid = buildDataView(sample);
    visual.update({ dataViews: [valid], viewport, type: updateType.data });
    expect(failed).not.toHaveBeenCalled();
    expect(rendered.element.querySelectorAll(".dotsgroup path")).toHaveLength(3);
    const chart = visual.viewModel.chartBase;
    visual.update({ dataViews: [valid], viewport: { width: 600, height: 400 }, type: updateType.resize });
    expect(visual.viewModel.chartBase).toBe(chart);
  });
});

it("keeps per-point formatting, labels, tooltips, highlights and warnings aligned after an input row is removed", () => {
  const host = createVisualHost({});
  const failed = vi.spyOn(host.eventService, "renderingFailed");
  const rendered = renderVisual([
    { scatter: { size: 1, colour: "#123456" }, labels: { label_size: 11 } },
    { scatter: { size: 90 }, labels: { label_size: 90 } },
    { scatter: { size: 3 }, labels: { label_size: -1 } },
    { scatter: { size: 4 }, labels: { label_size: 14 } }
  ], {
    key: ["A", "B", "C", "D"], numerators: [4, null, 16, 25], denominators: [10, 20, 90, 100], labels: ["One", "Two", "Three", "Four"],
    tooltips: ["t-A", "t-B", "t-C", "t-D"]
  }, { host, prepare: dataView => {
    must(dataView.categorical?.values)[0].highlights = cells([null, 20, 16, null]);
  } });
  expect(failed).not.toHaveBeenCalled();
  const input = must(rendered.visual.viewModel.inputData);
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
  const points = rendered.visual.viewModel.plotPoints;
  expect(points[0].aesthetics.size).toBe(1);
  expect(points[1].label.aesthetics.label_size).toBe(defaultSettings.labels.label_size);
  expect(points[2].label.text_value).toBe("Four");
  const highlighted = [false, true, false];
  const tooltips = ["t-A", "t-C", "t-D"];
  for (let i = 0; i < points.length; i++) {
    expect(points[i].highlighted, points[i].group_text).toBe(highlighted[i]);
    expect(findBy(points[i].tooltip, "displayName", "tooltips")?.value).toBe(tooltips[i]);
  }
  expect(rendered.element.querySelectorAll(".dotsgroup path")).toHaveLength(3);
});

it("preserves a blank tooltip label through settings reading and rendering", () => {
  const host = createVisualHost({});
  const failed = vi.spyOn(host.eventService, "renderingFailed");
  const viewModel = renderVisual({ funnel: { ttip_label_numerator: "" } }, sample, { host }).visual.viewModel;
  expect(failed).not.toHaveBeenCalled();
  expect(viewModel.inputSettings.settings[0].funnel.ttip_label_numerator).toBe("");
  expect(viewModel.plotPoints[0].tooltip).toContainEqual({ displayName: "", value: "4" });
  expect(viewModel.inputSettings.validationStatus).toEqual({ status: 0, messages: [[], [], []] });
});

import { describe, expect, it, vi } from "vitest";
import { testDom } from "powerbi-visuals-utils-testutils";
import { Visual } from "../src/visual";
import buildDataView, { sample } from "./helpers/buildDataView";
import { keyedHost, must } from "powerbi-visuals-core/testing";
import { updateType } from "powerbi-visuals-core/powerbi";

const viewport = { width: 500, height: 500 };

function render(element: HTMLElement): Visual {
  const visual = new Visual({ element, host: keyedHost() });
  visual.update({ dataViews: [buildDataView(sample)], viewport, type: updateType.data });
  return visual;
}

function contextMenu(clientX: number, clientY: number): MouseEvent {
  return new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX, clientY });
}

function dotOpacity(element: HTMLElement, index: number): string {
  return element.querySelectorAll<SVGGElement>(".dotsgroup path")[index].style.fillOpacity;
}

// Selection matching by key and the shared context-menu binding.
describe("Selection and context menu", () => {
  it("keeps a selected point highlighted after a data update rebuilds identities", async () => {
    const element = testDom("500", "500");
    const visual = render(element);
    const before = visual.viewModel.plotPoints[1];
    expect(before.identity.getKey()).not.toBe(visual.viewModel.plotPoints[0].identity.getKey());
    await visual.selectionManager.select(before.identity);
    visual.updateHighlighting();
    expect(dotOpacity(element, 1)).toBe(String(before.aesthetics.opacity_selected));
    expect(dotOpacity(element, 0)).toBe(String(before.aesthetics.opacity_unselected));

    visual.update({ dataViews: [buildDataView(sample)], viewport, type: updateType.data });
    const after = visual.viewModel.plotPoints[1];
    expect(after.identity).not.toBe(before.identity);
    expect(after.identity.getKey()).toBe(before.identity.getKey());
    expect(dotOpacity(element, 1)).toBe(String(after.aesthetics.opacity_selected));
    expect(dotOpacity(element, 0)).toBe(String(after.aesthetics.opacity_unselected));
    expect(dotOpacity(element, 2)).toBe(String(after.aesthetics.opacity_unselected));
  });

  it("shows the context menu for points and the background, prevents the default menu and rebinds without duplicates", () => {
    const element = testDom("500", "500");
    const visual = render(element);
    const show = vi.spyOn(visual.selectionManager, "showContextMenu").mockResolvedValue({});
    const svg = must(element.querySelector("svg"));
    const dot = must(element.querySelector(".dotsgroup path"));
    const point = visual.viewModel.plotPoints[0];

    const onPoint = contextMenu(11, 22);
    dot.dispatchEvent(onPoint);
    expect(show).toHaveBeenCalledTimes(1);
    expect(show).toHaveBeenLastCalledWith(point.identity, { x: 11, y: 22 });
    expect(onPoint.defaultPrevented).toBe(true);

    const onBackground = contextMenu(3, 4);
    svg.dispatchEvent(onBackground);
    expect(show).toHaveBeenCalledTimes(2);
    expect(show).toHaveBeenLastCalledWith({}, { x: 3, y: 4 });
    expect(onBackground.defaultPrevented).toBe(true);

    visual.addContextMenu(svg);
    visual.addContextMenu(svg);
    dot.dispatchEvent(contextMenu(5, 6));
    expect(show).toHaveBeenCalledTimes(3);
    expect(show).toHaveBeenLastCalledWith(point.identity, { x: 5, y: 6 });
  });
});

describe("Group text highlighting", () => {
  it("fades group text by its own opacities rather than the marker ones", async () => {
    const element = testDom("500", "500");
    const visual = new Visual({ element, host: keyedHost() });
    const scatter = { use_group_text: true, scatter_text_opacity_selected: 0.9, scatter_text_opacity_unselected: 0.4 };
    visual.update({ dataViews: [buildDataView(sample, { scatter })], viewport, type: updateType.data });
    const texts = element.querySelectorAll<SVGTextElement>(".dotsgroup text");
    expect(texts).toHaveLength(3);
    expect(texts[1].style.fillOpacity).toBe("1");
    await visual.selectionManager.select(visual.viewModel.plotPoints[1].identity);
    visual.updateHighlighting();
    expect(texts[1].style.fillOpacity).toBe("0.9");
    expect(texts[0].style.fillOpacity).toBe("0.4");
  });
});

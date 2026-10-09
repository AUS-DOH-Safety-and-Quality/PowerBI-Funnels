import { describe, expect, it, vi } from "vitest";
import { testDom } from "powerbi-visuals-utils-testutils";
import { Visual } from "../src/visual";
import { dataView } from "./dataViewFixture";
import { keyedHost } from "powerbi-visuals-core/testing";
import addContextMenu from "../src/D3 Plotting Functions/addContextMenu";

function render(): { element: HTMLElement; visual: Visual } {
  const element = testDom("500", "500");
  const visual = new Visual({ element, host: keyedHost() });
  visual.update({ dataViews: [dataView()], viewport: { width: 500, height: 500 }, type: 2 });
  return { element, visual };
}

function dotOpacity(element: HTMLElement, index: number): string {
  return element.querySelectorAll<SVGGElement>(".dotsgroup-child")[index].style.fillOpacity;
}

// Changeset 7: selection matching by key and the shared context-menu binding.
describe("Selection and context menu", () => {
  it("keeps a selected point highlighted after a data update rebuilds identities", async () => {
    const { element, visual } = render();
    const before = visual.viewModel.plotPoints[1];
    expect(before.identity.getKey()).not.toBe(visual.viewModel.plotPoints[0].identity.getKey());
    await visual.selectionManager.select(before.identity);
    visual.updateHighlighting();
    expect(dotOpacity(element, 1)).toBe(String(before.aesthetics.opacity_selected));
    expect(dotOpacity(element, 0)).toBe(String(before.aesthetics.opacity_unselected));

    visual.update({ dataViews: [dataView()], viewport: { width: 500, height: 500 }, type: 2 });
    const after = visual.viewModel.plotPoints[1];
    expect(after.identity).not.toBe(before.identity);
    expect(after.identity.getKey()).toBe(before.identity.getKey());
    expect(dotOpacity(element, 1)).toBe(String(after.aesthetics.opacity_selected));
    expect(dotOpacity(element, 0)).toBe(String(after.aesthetics.opacity_unselected));
    expect(dotOpacity(element, 2)).toBe(String(after.aesthetics.opacity_unselected));
  });

  it("shows the context menu for points and the background, prevents the default menu and rebinds without duplicates", () => {
    const { element, visual } = render();
    const show = vi.fn(() => Promise.resolve({}));
    visual.selectionManager.showContextMenu = show;
    const svg = element.querySelector("svg");
    const dot = element.querySelector(".dotsgroup-child path");
    if (svg === null || dot === null) throw new Error("Missing chart elements");
    const point = visual.viewModel.plotPoints[0];

    const onPoint = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 11, clientY: 22 });
    dot.dispatchEvent(onPoint);
    expect(show).toHaveBeenCalledTimes(1);
    expect(show).toHaveBeenLastCalledWith(point.identity, { x: 11, y: 22 });
    expect(onPoint.defaultPrevented).toBe(true);

    const onBackground = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 3, clientY: 4 });
    svg.dispatchEvent(onBackground);
    expect(show).toHaveBeenCalledTimes(2);
    expect(show).toHaveBeenLastCalledWith({}, { x: 3, y: 4 });
    expect(onBackground.defaultPrevented).toBe(true);

    visual.plotProperties.displayPlot = false;
    visual.svg.call(addContextMenu, visual);
    const disabled = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 1, clientY: 1 });
    dot.dispatchEvent(disabled);
    expect(show).toHaveBeenCalledTimes(2);
    expect(disabled.defaultPrevented).toBe(false);

    visual.plotProperties.displayPlot = true;
    visual.svg.call(addContextMenu, visual);
    visual.svg.call(addContextMenu, visual);
    dot.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 5, clientY: 6 }));
    expect(show).toHaveBeenCalledTimes(3);
    expect(show).toHaveBeenLastCalledWith(point.identity, { x: 5, y: 6 });
  });
});

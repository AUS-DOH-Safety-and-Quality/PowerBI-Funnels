import { describe, expect, it, vi } from "vitest";
import { createVisualHost } from "powerbi-visuals-utils-testutils";
import { sample } from "./helpers/buildDataView";
import { renderVisual } from "./helpers/renderVisual";

// A supplied bound of zero is active; only undefined means "no bound" or "automatic".
describe("zero bounds are active", () => {
  // No events put the target at zero, so a zero upper bound stays clear of it
  it("truncates upper limits at zero when ul_truncate is 0", () => {
    const zeros = { ...sample, numerators: [0, 0, 0] };
    const host = createVisualHost({});
    const failed = vi.spyOn(host.eventService, "renderingFailed");
    const plain = renderVisual({}, zeros).visual.viewModel.calculatedLimits;
    const limits = renderVisual({ funnel: { ul_truncate: 0 } }, zeros, { host }).visual.viewModel.calculatedLimits;
    expect(failed).not.toHaveBeenCalled();
    expect(limits).toHaveLength(plain.length);
    const names = ["ul68", "ul95", "ul99"] as const;
    for (let i = 0; i < limits.length; i++) {
      expect(limits[i].target).toBe(0);
      for (let j = 0; j < names.length; j++) {
        const label = `${names[j]} at ${limits[i].denominators}`;
        expect(plain[i][names[j]], label).toBeGreaterThan(0);
        expect(limits[i][names[j]], label).toBe(0);
      }
    }
  });

  it("uses explicit axis upper limits of 0 below automatic ones", () => {
    const host = createVisualHost({});
    const failed = vi.spyOn(host.eventService, "renderingFailed");
    const frame = renderVisual({ x_axis: { xlimit_l: -10, xlimit_u: 0 }, y_axis: { ylimit_l: -5, ylimit_u: 0 } }, sample, { host })
      .visual.plotProperties;
    expect(failed).not.toHaveBeenCalled();
    expect([frame.xAxis.lower, frame.xAxis.upper]).toEqual([-10, 0]);
    expect([frame.yAxis.lower, frame.yAxis.upper]).toEqual([-5, 0]);
  });
});

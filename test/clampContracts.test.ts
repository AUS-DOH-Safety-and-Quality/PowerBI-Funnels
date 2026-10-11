import { describe, expect, it, vi } from "vitest";
import { createVisualHost } from "powerbi-visuals-utils-testutils";
import { sample } from "./helpers/buildDataView";
import { renderVisual } from "./helpers/renderVisual";

// A supplied bound of zero is active; only undefined means "no bound" or "automatic".
describe("zero bounds are active", () => {
  it("truncates upper limits at zero when ul_truncate is 0", () => {
    const host = createVisualHost({});
    const failed = vi.spyOn(host.eventService, "renderingFailed");
    const rendered = renderVisual({ funnel: { ul_truncate: 0 } }, sample, { host });
    expect(failed).not.toHaveBeenCalled();
    const limits = rendered.visual.viewModel.calculatedLimits;
    expect(limits.length).toBeGreaterThan(0);
    const names = ["ul68", "ul95", "ul99"] as const;
    for (let i = 0; i < limits.length; i++) {
      for (let j = 0; j < names.length; j++) {
        const value = limits[i][names[j]];
        if (value !== undefined) {
          expect(value, `${names[j]} at ${limits[i].denominators}`).toBeLessThanOrEqual(0);
        }
      }
      // Truncation applies to the limits only, as in SPC
      expect(limits[i].target).toBeGreaterThan(0);
    }
  });

  it("uses an explicit x-axis upper limit of 0 and only treats undefined as automatic", () => {
    expect(renderVisual({ x_axis: { xlimit_u: 0 } }, sample).visual.plotProperties.xAxis.upper).toBe(0);
    expect(renderVisual({}, sample).visual.plotProperties.xAxis.upper).toBeCloseTo(110, 10);
  });
});

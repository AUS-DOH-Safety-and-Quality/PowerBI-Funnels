import { describe, expect, it, vi } from "vitest";
import { ChartBuilder } from "./visualBuilder";
import { categoricalData, dataView } from "./dataViewFixture";

// Core finding 12: a supplied bound of zero is active; only undefined means "no bound" or "automatic".
describe("zero bounds are active", () => {
  it("truncates upper limits at zero when ul_truncate is 0", () => {
    const builder = new ChartBuilder(500, 500);
    const failed = vi.spyOn(builder.visualHost.eventService, "renderingFailed");
    const categorical = categoricalData();
    if (categorical.categories === undefined) throw new Error("Missing fixture category");
    categorical.categories[0].objects = [{ funnel: { ul_truncate: 0 } }, {}, {}];
    builder.update(dataView(categorical));
    expect(failed).not.toHaveBeenCalled();
    const limits = builder.instance.viewModel.calculatedLimits;
    expect(limits.length).toBeGreaterThan(0);
    const names = ["target", "ul68", "ul95", "ul99"] as const;
    for (let i = 0; i < limits.length; i++) {
      for (let j = 0; j < names.length; j++) {
        const value = limits[i][names[j]];
        if (value !== undefined) expect(value, `${names[j]} at ${limits[i].denominators}`).toBeLessThanOrEqual(0);
      }
    }
    builder.destroy();
  });

  it("uses an explicit x-axis upper limit of 0 and only treats undefined as automatic", () => {
    const fixed = new ChartBuilder(500, 500);
    const categorical = categoricalData();
    if (categorical.categories === undefined) throw new Error("Missing fixture category");
    categorical.categories[0].objects = [{ x_axis: { xlimit_u: 0 } }, {}, {}];
    fixed.update(dataView(categorical));
    expect(fixed.instance.plotProperties.xAxis.upper).toBe(0);
    fixed.destroy();

    const automatic = new ChartBuilder(500, 500);
    automatic.update(dataView(categoricalData()));
    expect(automatic.instance.plotProperties.xAxis.upper).toBeCloseTo(110, 10);
    automatic.destroy();
  });
});

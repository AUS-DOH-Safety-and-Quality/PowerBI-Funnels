import { describe, expect, it } from "vitest";
import settingsModel, { defaultSettings } from "../../src/settings";
import settingsClass from "../../src/Classes/settingsClass";

describe("setting definitions", () => {
  it("preserves the local schema and explicit optional defaults", () => {
    expect(Object.keys(settingsModel)).toEqual(Object.keys(defaultSettings));
    expect(Object.keys(settingsModel)).toHaveLength(9);
    expect(defaultSettings.funnel.chart_type).toBe("PR");
    expect(defaultSettings.x_axis.xlimit_tick_rotation).toBe(0);
    expect("xlimit_show" in defaultSettings.x_axis).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(settingsModel.funnel.ll_truncate, "default")).toBe(true);
    expect(Object.prototype.hasOwnProperty.call(defaultSettings.funnel, "ll_truncate")).toBe(true);
    expect(defaultSettings.funnel.ll_truncate).toBeUndefined();
  });

  it("creates independent settings for each visual", () => {
    const first = new settingsClass();
    const second = new settingsClass();
    first.settings.canvas.lower_padding = 40;
    first.settings.labels.label_position = "bottom";
    expect(second.settings.canvas.lower_padding).toBe(10);
    expect(second.settings.labels.label_position).toBe("top");
    expect(defaultSettings.canvas.lower_padding).toBe(10);
    expect(settingsModel.canvas.lower_padding.default).toBe(10);
  });
});

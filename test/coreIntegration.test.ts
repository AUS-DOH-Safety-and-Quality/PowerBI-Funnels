import { pickRows } from "powerbi-visuals-core/data";
import derivedSettingsClass from "../src/Classes/derivedSettingsClass";
import { expect, it } from "vitest";
import { d3, defaultSettings, Visual } from "../src/frontend";
import settingsModel from "../src/settings";
import { createDefaultValues } from "powerbi-visuals-core/settings";
import { buildFormattingModel, readSettingsRows } from "powerbi-visuals-core/powerbi";

it("resolves the frontend and formatting contracts through the installed Core package", () => {
  expect(typeof Visual).toBe("function");
  expect(typeof d3.select).toBe("function");
  const defaults = createDefaultValues(settingsModel);
  expect(defaultSettings).toEqual(defaults);
  const rows = readSettingsRows(settingsModel.canvas, "canvas", defaults.canvas, {
    objects: [{ canvas: { lower_padding: 0, show_errors: false } }]
  }, [0]);
  expect(rows.values[0]).toMatchObject({ lower_padding: 0, show_errors: false });
  const pane = buildFormattingModel(settingsModel, { ...defaults, canvas: rows.values[0] });
  expect(pane.cards[0].uid).toBe("canvas_card_uid");
  expect(pane.cards).toHaveLength(Object.keys(defaultSettings).length);
});


it("uses Core data helpers while retaining Funnel display precision", () => {
  expect(pickRows([10, 20], [1, 5, 0, 1])).toEqual([20, undefined, 10, 20]);
  const settings = createDefaultValues(settingsModel);
  settings.funnel.sig_figs = 2;
  settings.funnel.chart_type = "PR";
  settings.funnel.perc_labels = "Yes";
  const formatter = new derivedSettingsClass(settings).formatValue;
  expect(formatter(12.625, "integer")).toBe("13");
  expect(formatter(12.625, "value")).toBe("12.63%");
  expect(formatter(undefined, "value")).toBe("");
});

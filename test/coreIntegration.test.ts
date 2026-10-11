import { pickRows } from "powerbi-visuals-core/data";
import derivedSettingsClass from "../src/Classes/derivedSettingsClass";
import { expect, it } from "vitest";
import settingsModel, { defaultSettings } from "../src/settings";
import { createDefaultValues } from "powerbi-visuals-core/settings";
import { formattingContractsSuite } from "powerbi-visuals-core/testing";

formattingContractsSuite(settingsModel, defaultSettings);

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

import { derive } from "../src/Classes/settingsClass";
import { expect, it } from "vitest";
import settingsModel, { defaultSettings } from "../src/settings";
import { createDefaultValues } from "powerbi-visuals-core/settings";
import { capabilitiesSuite, formattingContractsSuite } from "powerbi-visuals-core/testing";
import capabilities from "../capabilities.json";

formattingContractsSuite(settingsModel, defaultSettings);
capabilitiesSuite(settingsModel, capabilities);

it("formats counts and percentages with the Funnel display precision", () => {
  const settings = createDefaultValues(settingsModel);
  settings.funnel.sig_figs = 2;
  settings.funnel.chart_type = "PR";
  settings.funnel.perc_labels = "Yes";
  const formatter = derive(settings).formatValue;
  expect(formatter(12.625, "integer")).toBe("13");
  expect(formatter(12.625, "value")).toBe("12.63%");
  expect(formatter(undefined, "value")).toBe("");
});

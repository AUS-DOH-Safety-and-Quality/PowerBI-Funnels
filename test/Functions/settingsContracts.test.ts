import { describe, expect, it } from "vitest";
import settingsClass from "../../src/Classes/settingsClass";
import { readSettingsRows } from "powerbi-visuals-core/powerbi";
import settingsModel, { defaultSettings } from "../../src/settings";
import { categoricalData, dataView } from "../dataViewFixture";

describe("Settings contracts", () => {
  it("preserves zero and false while rejecting non-finite numeric controls", () => {
    const categorical = categoricalData();
    if (categorical.categories === undefined) throw new Error("Missing fixture category");
    categorical.categories[0].objects = [
      { y_axis: { ylimit_sig_figs: 0, ylimit_ticks: false } },
      { y_axis: { ylimit_sig_figs: NaN } }, { y_axis: { ylimit_sig_figs: Infinity } }
    ];
    const result = readSettingsRows(settingsModel.y_axis, "y_axis", defaultSettings.y_axis, categorical.categories[0], [0, 1, 2]);
    expect(result.values?.[0].ylimit_sig_figs).toBe(0);
    expect(result.values?.[0].ylimit_ticks).toBe(false);
    expect(result.validation.messages[0]).toEqual([]);
    expect(result.validation.messages[1]).toHaveLength(1);
    expect(result.validation.messages[2]).toHaveLength(1);
  });

  it("checks supplied optional numbers against descriptor constraints", () => {
    const categorical = categoricalData();
    if (categorical.categories === undefined) throw new Error("Missing fixture category");
    categorical.categories[0].objects = [
      { y_axis: { ylimit_sig_figs: -1 } }, { y_axis: { ylimit_sig_figs: 3 } }, {}
    ];
    const result = readSettingsRows(settingsModel.y_axis, "y_axis", defaultSettings.y_axis, categorical.categories[0], [0, 1, 2]);
    expect(result.values?.[0].ylimit_sig_figs).toBeUndefined();
    expect(result.values?.[1].ylimit_sig_figs).toBe(3);
    expect(result.values?.[2].ylimit_sig_figs).toBeUndefined();
    expect(result.validation.messages[0]).toHaveLength(1);
    expect(result.validation.messages[1]).toEqual([]);
    expect(result.validation.messages[2]).toEqual([]);
    expect(result.validation.status).toBe(0);
  });

  it("rejects an invalid dropdown on all rows and recovers on the next update", () => {
    const categorical = categoricalData();
    if (categorical.categories === undefined) throw new Error("Missing fixture category");
    categorical.categories[0].objects = [
      { funnel: { chart_type: "bad" } }, { funnel: { chart_type: "bad" } }, { funnel: { chart_type: "bad" } }
    ];
    const settings = new settingsClass();
    settings.update(dataView(categorical));
    expect(settings.validationStatus.status).toBe(1);
    settings.update(dataView());
    expect(settings.validationStatus).toEqual({ status: 0, messages: [[], [], []] });
    expect(settings.settings.funnel.chart_type).toBe("PR");
  });

  it("builds only real cards and preserves explicit unset numeric values", () => {
    const settings = new settingsClass();
    const model = settings.getFormattingModel();
    expect(model.cards).toHaveLength(Object.keys(defaultSettings).length - 1);
    let found = false;
    for (let i = 0; i < model.cards.length; i++) {
      const card = model.cards[i];
      expect(card.displayName).toBeTruthy();
      for (let j = 0; j < card.groups.length; j++) {
        const slices = card.groups[j].slices ?? [];
        for (let k = 0; k < slices.length; k++) {
          const slice = slices[k];
          if (slice.uid === "funnel_all_ll_truncate_slice_uid") {
            expect(slice).toMatchObject({ control: { properties: { value: undefined } } });
            found = true;
          }
        }
      }
    }
    expect(found).toBe(true);
  });
});

it("resets settings and warnings when categories disappear or have no rows", () => {
  const settings = new settingsClass();
  settings.settings.canvas.lower_padding = 50;
  settings.update(undefined);
  expect(settings.settings).toEqual(defaultSettings);
  expect(settings.validationStatus).toEqual({ status: 0, messages: [] });
  settings.settings.canvas.lower_padding = 50;
  settings.update(dataView(categoricalData([], [], [])));
  expect(settings.settings).toEqual(defaultSettings);
  expect(settings.validationStatus).toEqual({ status: 0, messages: [] });
});

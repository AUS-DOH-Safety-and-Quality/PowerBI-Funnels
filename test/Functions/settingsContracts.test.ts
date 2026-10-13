import { describe, expect, it } from "vitest";
import { createVisualHost } from "powerbi-visuals-utils-testutils";
import viewModelClass from "../../src/Classes/viewModelClass";
import { defaultSettings } from "../../src/settings";

describe("Settings contracts", () => {
  it("builds only real cards and preserves explicit unset numeric values", () => {
    const model = new viewModelClass(createVisualHost({})).getFormattingModel();
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

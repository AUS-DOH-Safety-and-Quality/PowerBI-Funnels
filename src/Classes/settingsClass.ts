import { SettingsStore, type GroupSettings } from "powerbi-visuals-core/powerbi";
import { deriveScaling, type DerivedScaling } from "powerbi-visuals-core/data";
import settingsModel, { type settingsValueType } from "../settings";
import { orderedBoundsError } from "powerbi-visuals-core/settings";

/** Expected counts are not whole numbers, and percent labels only suit untransformed values */
export function derive(settings: settingsValueType): DerivedScaling {
  const funnel = settings.funnel;
  return deriveScaling(funnel, {
    proportion: funnel.chart_type === "PR",
    wholeCounts: funnel.chart_type !== "SR",
    percentAllowed: funnel.transformation === "none"
  });
}

export type groupSettings = GroupSettings<typeof settingsModel, DerivedScaling>;

export default class settingsClass extends SettingsStore<typeof settingsModel, DerivedScaling> {
  constructor() {
    super(settingsModel, derive, [settings => orderedBoundsError(settings, settings.funnel)]);
  }
}

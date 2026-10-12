import {
  readSettingsGroups, buildFormattingModel, type FormattingItem, type FormattingModel, type SettingsValidation
} from "powerbi-visuals-core/powerbi";
import type powerbi from "powerbi-visuals-api";
import { deriveScaling, type DerivedScaling } from "powerbi-visuals-core/data";
import settingsModel, { type settingsValueType } from "../settings";
import { createDefaultValues, orderedBoundsError } from "powerbi-visuals-core/settings";
import miscFormattingSchema from "../Functions/miscFormattingSchema";

/** Expected counts are not whole numbers, and percent labels only suit untransformed values */
function derive(settings: settingsValueType): DerivedScaling {
  const funnel = settings.funnel;
  return deriveScaling(funnel, {
    proportion: funnel.chart_type === "PR",
    wholeCounts: funnel.chart_type !== "SR",
    percentAllowed: funnel.transformation === "none"
  });
}

export default class settingsClass {
  settings: settingsValueType;
  derivedSettings: DerivedScaling;
  validationStatus: SettingsValidation;
  groupSettings: settingsValueType[] = [];
  /** Each group's rows' own values */
  rowSettings: settingsValueType[][] = [];
  messagePositionByRowIndex = new Map<number, number>();

  update(category: powerbi.DataViewCategoryColumn, groups: readonly (readonly number[])[]): void {
    const result = readSettingsGroups(settingsModel, category, groups, [settings => orderedBoundsError(settings, settings.funnel)]);
    this.groupSettings = result.values;
    this.rowSettings = result.rowValues;
    this.settings = result.values[0];
    this.validationStatus = result.validation;
    this.messagePositionByRowIndex = result.messagePositionByRowIndex;
    this.derivedSettings = derive(this.settings);
  }

  forGroup(index: number): settingsClass {
    const result = new settingsClass(this.groupSettings[index]);
    result.validationStatus = this.validationStatus;
    result.messagePositionByRowIndex = this.messagePositionByRowIndex;
    return result;
  }

  /** The MISC pane, with its group choices, when given them; otherwise the funnel pane */
  public getFormattingModel(miscGroups?: FormattingItem[]): FormattingModel {
    const { misc, ...funnelModel } = settingsModel;
    if (miscGroups === undefined) {
      return buildFormattingModel(funnelModel, this.settings);
    }
    return buildFormattingModel(miscFormattingSchema(miscGroups), this.settings);
  }

  constructor(settings = createDefaultValues(settingsModel)) {
    this.validationStatus = { status: 0, messages: [] };
    this.settings = settings;
    this.derivedSettings = derive(settings);
  }
}

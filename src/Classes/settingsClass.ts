import type powerbi from "powerbi-visuals-api";
import { readSettingsGroups, buildFormattingModel, type FormattingItem, type SettingsValidation } from "powerbi-visuals-core/powerbi";
import settingsModel, { type settingsValueType } from "../settings";
import { createDefaultValues } from "powerbi-visuals-core/settings";
import derivedSettingsClass from "./derivedSettingsClass";
import miscFormattingSchema from "../Functions/miscFormattingSchema";

export default class settingsClass {
  settings: settingsValueType;
  derivedSettings: derivedSettingsClass;
  validationStatus: SettingsValidation;
  groupSettings: settingsValueType[] = [];
  messagePositionByRowIndex = new Map<number, number>();
  miscGroups: FormattingItem[] = [];
  showMisc = false;

  update(inputView: powerbi.DataView | undefined, groups?: readonly (readonly number[])[]): void {
    this.validationStatus = { status: 0, messages: [] };
    const category = inputView?.categorical?.categories?.[0];
    if (category === undefined) {
      this.settings = createDefaultValues(settingsModel);
      this.groupSettings = [];
      this.messagePositionByRowIndex = new Map<number, number>();
    } else {
      if (groups === undefined) {
        const rows = new Array<number>(category.values.length);
        for (let i = 0; i < rows.length; i++) rows[i] = i;
        groups = [rows];
      }
      const result = readSettingsGroups(settingsModel, category, groups);
      this.groupSettings = result.values;
      this.settings = result.values[0] ?? createDefaultValues(settingsModel);
      this.validationStatus = result.validation;
      this.messagePositionByRowIndex = result.messagePositionByRowIndex;
    }
    const selectedGroup = inputView?.metadata?.objects?.misc?.group;
    this.settings.misc.group = typeof selectedGroup === "string" ? selectedGroup : "";
    this.derivedSettings.update(this.settings);
  }

  forGroup(index: number): settingsClass {
    const result = new settingsClass(this.groupSettings[index]);
    result.validationStatus = this.validationStatus;
    result.messagePositionByRowIndex = this.messagePositionByRowIndex;
    return result;
  }

  public getFormattingModel(): powerbi.visuals.FormattingModel {
    // API 5.1 omits the visual's unset numeric values and legacy option shapes.
    const { misc, ...funnelModel } = settingsModel;
    if (!this.showMisc) return buildFormattingModel(funnelModel, this.settings) as powerbi.visuals.FormattingModel;
    return buildFormattingModel(miscFormattingSchema(this.miscGroups), this.settings) as powerbi.visuals.FormattingModel;
  }

  constructor(settings = createDefaultValues(settingsModel)) {
    this.validationStatus = { status: 0, messages: [] };
    this.settings = settings;
    this.derivedSettings = new derivedSettingsClass(this.settings);
  }
}

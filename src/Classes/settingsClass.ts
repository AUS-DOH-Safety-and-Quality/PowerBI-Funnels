import { readSettingsGroups, buildFormattingModel, type FormattingItem, type FormattingModel, type SettingsValidation, type ValidatedDataView } from "powerbi-visuals-core/powerbi";
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

  update(view: ValidatedDataView, groups?: readonly (readonly number[])[]): void {
    if (groups === undefined) {
      const rows = new Array<number>(view.category.values.length);
      for (let i = 0; i < rows.length; i++) {
        rows[i] = i;
      }
      groups = [rows];
    }
    const result = readSettingsGroups(settingsModel, view.category, groups);
    this.groupSettings = result.values;
    this.settings = result.values[0];
    this.validationStatus = result.validation;
    this.messagePositionByRowIndex = result.messagePositionByRowIndex;
    const selectedGroup = view.dataView.metadata.objects?.misc?.group;
    this.settings.misc.group = typeof selectedGroup === "string" ? selectedGroup : "";
    this.derivedSettings.update(this.settings);
  }

  forGroup(index: number): settingsClass {
    const result = new settingsClass(this.groupSettings[index]);
    result.validationStatus = this.validationStatus;
    result.messagePositionByRowIndex = this.messagePositionByRowIndex;
    return result;
  }

  public getFormattingModel(): FormattingModel {
    const { misc, ...funnelModel } = settingsModel;
    if (!this.showMisc) {
      return buildFormattingModel(funnelModel, this.settings);
    }
    return buildFormattingModel(miscFormattingSchema(this.miscGroups), this.settings);
  }

  constructor(settings = createDefaultValues(settingsModel)) {
    this.validationStatus = { status: 0, messages: [] };
    this.settings = settings;
    this.derivedSettings = new derivedSettingsClass(this.settings);
  }
}

import canvasSettings from "./Settings Model/canvasSettings";
import funnelSettings from "./Settings Model/funnelSettings";
import outliersSettings from "./Settings Model/outliersSettings";
import scatterSettings from "./Settings Model/scatterSettings";
import linesSettings from "./Settings Model/linesSettings";
import xAxisSettings from "./Settings Model/xAxisSettings";
import yAxisSettings from "./Settings Model/yAxisSettings";
import labelsSettings from "./Settings Model/labelsSettings";
import { addGetters, type SettingDefaultTypes, type MergeUnions } from "./Settings Model/common";

type RecursivePartial<T> = {
  [P in keyof T]?: T[P] extends object ? RecursivePartial<T[P]> : T[P];
}

const settingsModel = {
  canvas: addGetters(canvasSettings),
  funnel: addGetters(funnelSettings),
  outliers: addGetters(outliersSettings),
  scatter: addGetters(scatterSettings),
  lines: addGetters(linesSettings),
  x_axis: addGetters(xAxisSettings),
  y_axis: addGetters(yAxisSettings),
  labels: addGetters(labelsSettings),

  get defaultValues(): settingsValueType {
    let ret = {} as RecursivePartial<settingsValueType>;
    for (const key in this) {
      if (key === "defaultValues") continue; // to avoid infinite loop
      const currSettings = this[key as settingsModelKeys];
      const currSettingNames: string[] = currSettings.settingNames;
      ret[key as settingsModelKeys] = {};
      for (const setting of currSettingNames) {
        (ret as any)[key as settingsModelKeys][setting] = (currSettings as any)[setting].default;
      }
    }
    return ret as settingsValueType;
  }
};

type settingsModelType = Omit<typeof settingsModel, "defaultValues">;
type settingsModelKeys = keyof settingsModelType;

type settingsValueType = {
  [K in settingsModelKeys]: SettingDefaultTypes<settingsModelType[K]>
}
type settingsValueTypesUnion = settingsValueType[settingsModelKeys];

const defaultSettings: settingsValueType = settingsModel.defaultValues;

type SettingsValueKeys = keyof settingsValueType;
type settingsValueTypesMerged = MergeUnions<settingsValueTypesUnion>;
type SettingsValueNestedKeys = keyof settingsValueTypesMerged;


export {
  defaultSettings, settingsValueType, settingsValueTypesUnion,
  SettingsValueKeys, SettingsValueNestedKeys, settingsValueTypesMerged,
  settingsModelKeys, settingsModelType
};
export default settingsModel;

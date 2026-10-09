import funnelSettings from "./Settings Model/funnelSettings";
import miscSettings from "./Settings Model/miscSettings";
import outliersSettings from "./Settings Model/outliersSettings";
import scatterSettings from "./Settings Model/scatterSettings";
import linesSettings from "./Settings Model/linesSettings";
import downloadSettings from "./Settings Model/downloadSettings";
import {
  createCanvasCard, createLabelsCard, createAxisCard, defineCard, createDefaultValues,
  type SettingsValues, type MergeUnions
} from "powerbi-visuals-core/settings";

const settingsModel = {
  canvas: createCanvasCard(),
  funnel: defineCard(funnelSettings),
  misc: defineCard(miscSettings),
  outliers: defineCard(outliersSettings),
  scatter: defineCard(scatterSettings),
  lines: defineCard(linesSettings),
  x_axis: createAxisCard("x", { tickRotation: 0 }),
  y_axis: createAxisCard("y", { tickRotation: 0 }),
  download_options: defineCard(downloadSettings),
  labels: createLabelsCard()
};

type settingsModelType = typeof settingsModel;
type settingsModelKeys = keyof settingsModelType;
type settingsValueType = SettingsValues<settingsModelType>;
type settingsValueTypesUnion = settingsValueType[settingsModelKeys];

const defaultSettings = createDefaultValues(settingsModel);

type SettingsValueKeys = keyof settingsValueType;
type settingsValueTypesMerged = MergeUnions<settingsValueTypesUnion>;
type SettingsValueNestedKeys = keyof settingsValueTypesMerged;

export {
  defaultSettings, type settingsValueType, type settingsValueTypesUnion,
  type SettingsValueKeys, type SettingsValueNestedKeys, type settingsValueTypesMerged,
  type settingsModelKeys, type settingsModelType
};
export default settingsModel;

import funnelSettings from "./Settings Model/funnelSettings";
import miscSettings from "./Settings Model/miscSettings";
import outliersSettings from "./Settings Model/outliersSettings";
import scatterSettings from "./Settings Model/scatterSettings";
import linesSettings from "./Settings Model/linesSettings";
import {
  createCanvasCard, createLabelsCard, createAxisCard, createDownloadCard, defineCard, createDefaultValues,
  type SettingsValues
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
  download_options: createDownloadCard(),
  labels: createLabelsCard()
};

type settingsValueType = SettingsValues<typeof settingsModel>;

const defaultSettings = createDefaultValues(settingsModel);

export { defaultSettings, type settingsValueType };
export default settingsModel;

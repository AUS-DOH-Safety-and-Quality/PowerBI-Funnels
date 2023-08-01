import type powerbi from "powerbi-visuals-api";
type VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
type ISelectionId = powerbi.visuals.ISelectionId;
import type { SettingsBaseTypedT, scatterSettings } from "../Classes/settingsGroups";


class plotData {
  x: number;
  value: number;
  aesthetics: SettingsBaseTypedT<scatterSettings>;
  // ISelectionId allows the visual to report the selection choice to PowerBI
  identity: ISelectionId;
  // Flag for whether dot should be highlighted by selections in other charts
  highlighted: boolean;
  // Tooltip data to print
  tooltip: VisualTooltipDataItem[];
}

export default plotData;

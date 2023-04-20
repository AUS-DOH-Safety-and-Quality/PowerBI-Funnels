import powerbi from "powerbi-visuals-api";
import DataViewPropertyValue = powerbi.DataViewPropertyValue
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import VisualObjectInstance = powerbi.VisualObjectInstance
import VisualEnumerationInstanceKinds = powerbi.VisualEnumerationInstanceKinds;
import ConstantOrRule = VisualEnumerationInstanceKinds.ConstantOrRule
import dataObject from "./dataObject";
import { dataViewObjects, dataViewWildcard } from "powerbi-visuals-utils-dataviewutils";
import createDataViewWildcardSelector = dataViewWildcard.createDataViewWildcardSelector
import {
  canvasSettings,
  funnelSettings,
  outliersSettings,
  scatterSettings,
  lineSettings,
  xAxisSettings,
  yAxisSettings,
  settingsInData,
  supportsConditionalFormatting
} from "./settingsGroups"
import viewModelObject from "./viewModel";
import extractSetting from "../Functions/extractSetting";
import extractConditionalFormatting from "../Functions/extractConditionalFormatting";

class settingsObject {
  canvas: canvasSettings;
  funnel: funnelSettings;
  scatter: scatterSettings;
  lines: lineSettings;
  x_axis: xAxisSettings;
  y_axis: yAxisSettings;
  outliers: outliersSettings;
  // Specify the names of settings which can be provided as data
  // so that the correct value can be rendered to the settings pane
  settingsInData: string[];

  update(inputView: powerbi.DataView): void {
    let inputObjects: powerbi.DataViewObjects = inputView.metadata.objects;
    // Get the names of all classes in settingsObject which have values to be updated
    let allSettingGroups: string[] = Object.getOwnPropertyNames(this)
                                           .filter(groupName => !(["settingsInData"].includes(groupName)));
    let conditionalFormattingGroups: string[] = Object.keys(supportsConditionalFormatting);
    allSettingGroups.forEach(settingGroup => {
      let condFormatting = conditionalFormattingGroups.includes(settingGroup)
                            ? extractConditionalFormatting(inputView.categorical, settingGroup, this)[0]
                            : null;
      // Get the names of all settings in a given class and
      // use those to extract and update the relevant values
      let settingNames: string[] = Object.getOwnPropertyNames(this[settingGroup]);
      settingNames.forEach(settingName => {
        this[settingGroup][settingName].value
          = condFormatting ? condFormatting[settingName]
                           : extractSetting(inputObjects, settingGroup, settingName,
                                            this[settingGroup][settingName].default)
      })
    })
  }

  /**
   * Function to extract all values for a given settings group, which are then
   * rendered to the Settings pane in PowerBI
   *
   * @param settingGroupName
   * @param inputData
   * @returns An object where each element is the value for a given setting in the named group
   */
  createSettingsEntry(settingGroupName: string, viewModel: viewModelObject): VisualObjectInstanceEnumeration {
    let settingNames: string[] = Object.getOwnPropertyNames(this[settingGroupName]);
    let inputData: dataObject = viewModel.inputData

    let properties: Record<string, DataViewPropertyValue> = Object.fromEntries(
      settingNames.map(settingName => {
        let settingValue: DataViewPropertyValue = this.settingsInData.includes(settingName)
                                                    ? inputData[settingName as keyof dataObject]
                                                    : this[settingGroupName][settingName].value
        return [settingName, settingValue]
      })
    )

    let propertyInstanceKind = supportsConditionalFormatting[settingGroupName]
                                ? Object.fromEntries(Object.keys(supportsConditionalFormatting[settingGroupName]).map(setting => [setting, ConstantOrRule]))
                                : null
    let selector = supportsConditionalFormatting[settingGroupName]
                    ? createDataViewWildcardSelector(dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals)
                    : null
    return [{
      objectName: settingGroupName,
      properties: properties,
      propertyInstanceKind: propertyInstanceKind,
      selector: selector
    }];
  }

  constructor() {
    this.canvas = new canvasSettings();
    this.funnel = new funnelSettings();
    this.scatter = new scatterSettings();
    this.lines = new lineSettings();
    this.x_axis = new xAxisSettings();
    this.y_axis = new yAxisSettings();
    this.outliers = new outliersSettings();
    this.settingsInData = Object.keys(settingsInData);
  }
}

export default settingsObject;

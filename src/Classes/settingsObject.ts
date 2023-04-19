import powerbi from "powerbi-visuals-api";
import DataViewPropertyValue = powerbi.DataViewPropertyValue
import VisualObjectInstanceEnumeration = powerbi.VisualObjectInstanceEnumeration;
import VisualObjectInstance = powerbi.VisualObjectInstance
import VisualEnumerationInstanceKinds = powerbi.VisualEnumerationInstanceKinds;
import dataObject from "./dataObject";
import { dataViewObjects, dataViewWildcard } from "powerbi-visuals-utils-dataviewutils";
import {
  canvasSettings,
  funnelSettings,
  outliersSettings,
  scatterSettings,
  lineSettings,
  xAxisSettings,
  yAxisSettings,
  settingsInData
} from "./settingsGroups"
import viewModelObject from "./viewModel";
import extractSetting from "../Functions/extractSetting";

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

  update(inputObjects: powerbi.DataViewObjects): void {
    // Get the names of all classes in settingsObject which have values to be updated
    let allSettingGroups: string[] = Object.getOwnPropertyNames(this)
                                           .filter(groupName => !(["settingsInData"].includes(groupName)));

    allSettingGroups.forEach(settingGroup => {
      // Get the names of all settings in a given class and
      // use those to extract and update the relevant values
      let settingNames: string[] = Object.getOwnPropertyNames(this[settingGroup]);
      settingNames.forEach(settingName => {
        this[settingGroup][settingName].value = extractSetting(inputObjects, settingGroup, settingName,
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
    let firstSettingObject = {
      [settingNames[0]]: this.settingsInData.includes(settingNames[0])
        ? inputData[settingNames[0] as keyof dataObject]
        : this[settingGroupName][settingNames[0]].value
    };
    let properties: Record<string, DataViewPropertyValue> = settingNames.reduce((previousSetting, currentSetting) => {
      return {
        ...previousSetting,
        ...{
          [currentSetting]: this.settingsInData.includes(currentSetting)
            ? inputData[currentSetting as keyof dataObject]
            : this[settingGroupName][currentSetting].value
        }
      }
    }, firstSettingObject);
    let rtn: VisualObjectInstanceEnumeration = new Array<VisualObjectInstance>();
    if (settingGroupName === "scatter") {
      rtn.push({
        objectName: settingGroupName,
        properties: properties,
        propertyInstanceKind: {
          colour: VisualEnumerationInstanceKinds.ConstantOrRule,
          size: VisualEnumerationInstanceKinds.ConstantOrRule
        },
        selector: dataViewWildcard.createDataViewWildcardSelector(dataViewWildcard.DataViewWildcardMatchingOption.InstancesAndTotals)
      });
    } else {
      rtn.push({
        objectName: settingGroupName,
        properties: properties,
        selector: null
      });
    }
    console.log("rtn: ", rtn);
    return rtn;
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

import powerbi from "powerbi-visuals-api";
import dataObject from "./dataObject";
import { dataViewObjects } from "powerbi-visuals-utils-dataviewutils";
import {
  axispadSettings,
  funnelSettings,
  outliersSettings,
  scatterSettings,
  lineSettings,
  xAxisSettings,
  yAxisSettings
} from "./settingsGroups"

class settingsObject {
  axispad: axispadSettings;
  funnel: funnelSettings;
  scatter: scatterSettings;
  lines: lineSettings;
  x_axis: xAxisSettings;
  y_axis: yAxisSettings;
  outliers: outliersSettings;

  updateSettings(inputObjects: powerbi.DataViewObjects): void {
    let allSettingGroups: string[] = Object.getOwnPropertyNames(this)
                                           .filter(groupName => groupName !== "axispad");
    allSettingGroups.forEach(settingGroup => {
      let settingNames: string[] = Object.getOwnPropertyNames(this[settingGroup]);
      settingNames.forEach(settingName => {
        let method: string = settingName.includes("colour") ? "getFillColor" : "getValue";
        this[settingGroup][settingName].value = dataViewObjects[method](
          inputObjects, {
            objectName: settingGroup,
            propertyName: settingName
          },
          this[settingGroup][settingName].default
        )
      })
    })
  }

  settingInData(settingGroupName: string, settingName: string): boolean {
    let settingsInData: string[] = ["chart_type", "chart_multiplier", "flag_direction", "ylimit_l", "ylimit_u"];
    return settingsInData.includes(settingName);
  }

  returnValues(settingGroupName: string, inputData: dataObject) {
    let settingNames: string[] = Object.getOwnPropertyNames(this[settingGroupName]);
    let firstSettingObject = {
      [settingNames[0]]: this.settingInData(settingGroupName, settingNames[0])
        ? inputData[settingNames[0]]
        : this[settingGroupName][settingNames[0]].value
    };
    return settingNames.reduce((previousSetting, currentSetting) => {
      return {
        ...previousSetting,
        ...{
          [currentSetting]: this.settingInData(settingGroupName, currentSetting)
            ? inputData[currentSetting]
            : this[settingGroupName][currentSetting].value
        }
      }
    }, firstSettingObject);
  }

  constructor() {
    this.axispad = new axispadSettings();
    this.funnel = new funnelSettings();
    this.scatter = new scatterSettings();
    this.lines = new lineSettings();
    this.x_axis = new xAxisSettings();
    this.y_axis = new yAxisSettings();
    this.outliers = new outliersSettings();
  }
}

export default settingsObject;

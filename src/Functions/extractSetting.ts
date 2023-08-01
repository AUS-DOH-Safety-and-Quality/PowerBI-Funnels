import type powerbi from "powerbi-visuals-api"
type DataViewObjects = powerbi.DataViewObjects
import { dataViewObjects } from "powerbi-visuals-utils-dataviewutils";

export default function extractSetting(inputObjects: DataViewObjects,
                        settingsGroup: string,
                        settingName: string,
                        defaultValue?: string | number): string | number {
  if (settingName.includes("colour")) {
    return dataViewObjects.getFillColor(
      inputObjects, {
        objectName: settingsGroup,
        propertyName: settingName
      },
      defaultValue as string | undefined
    )
  } else {
    return dataViewObjects.getValue(
      inputObjects, {
        objectName: settingsGroup,
        propertyName: settingName
      },
      defaultValue
    )
  }
}

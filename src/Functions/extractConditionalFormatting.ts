import powerbi from "powerbi-visuals-api"
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewCategorical = powerbi.DataViewCategorical;
import settingsObject from "../Classes/settingsObject";
import extractSetting from "./extractSetting";

function extractConditionalFormatting(inputView: DataViewCategorical, name: string, inputSettings: settingsObject): Record<string, string | number>[] {
  let inputCategories: DataViewCategoryColumn = (inputView.categories as DataViewCategoryColumn[])[0];
  let inputObjects = (inputCategories.objects as powerbi.DataViewObjects[]);
  let staticSettings = inputSettings[name as keyof typeof inputSettings];
  let settingNames = Object.getOwnPropertyNames(staticSettings)
  return inputObjects.map(inputObject => {
    return Object.fromEntries(
      settingNames.map(settingName => {
        return [
          settingName,
          extractSetting(inputObject, name, settingName, staticSettings[settingName].value)
        ]
      })
    )
  })
}

export default extractConditionalFormatting

import powerbi from "powerbi-visuals-api"
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewCategorical = powerbi.DataViewCategorical;
import settingsObject from "../Classes/settingsObject";
import extractSetting from "./extractSetting";

function extractConditionalFormatting(inputView: DataViewCategorical, name: string, inputSettings: settingsObject): Record<string, string | number>[] {
  let inputCategories: DataViewCategoryColumn = (inputView.categories as DataViewCategoryColumn[])[0];
  let staticSettings = inputSettings[name as keyof typeof inputSettings];
  let settingNames = Object.getOwnPropertyNames(staticSettings)

  let rtn: Record<string, string | number>[] = new Array<Record<string, string | number>>();
  for (let i: number = 0; i < inputCategories.values.length; i++) {
    rtn.push(
      Object.fromEntries(
        settingNames.map(settingName => {
          return [
            settingName,
            extractSetting(inputCategories.objects ? inputCategories.objects[i] : null,
                            name, settingName, staticSettings[settingName].default)
          ]
        })
      )
    )
  }
  return rtn
}

export default extractConditionalFormatting

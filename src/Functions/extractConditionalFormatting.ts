import powerbi from "powerbi-visuals-api"
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import DataViewCategorical = powerbi.DataViewCategorical;
import type { settingsClass } from "../Classes";
import { AllSettingsTypes } from "../Classes/settingsGroups"
import { extractSetting } from "../Functions";


export default function extractConditionalFormatting<SettingsT extends AllSettingsTypes>(inputView: DataViewCategorical, name: string, inputSettings: settingsClass): SettingsT[] {
  const inputCategories: DataViewCategoryColumn = (inputView.categories as DataViewCategoryColumn[])[0];
  const staticSettings = inputSettings[name as keyof typeof inputSettings];
  const settingNames = Object.getOwnPropertyNames(staticSettings)

  const rtn: SettingsT[] = new Array<SettingsT>();
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
      ) as SettingsT
    )
  }
  return rtn
}

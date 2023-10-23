import type powerbi from "powerbi-visuals-api"
type DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
type DataViewCategorical = powerbi.DataViewCategorical;
import type { defaultSettingsType, defaultSettingsKey } from "../Classes";
import { dataViewObjects } from "powerbi-visuals-utils-dataviewutils"
import defaultSettings from "../defaultSettings";

type SettingsTypes = defaultSettingsType[defaultSettingsKey];

export default function extractConditionalFormatting(categoricalView: DataViewCategorical, name: string, inputSettings: defaultSettingsType): SettingsTypes[] {
  if (!(categoricalView?.categories?.at(0)?.objects)) {
    return [null];
  }
  const inputCategories: DataViewCategoryColumn = (categoricalView.categories as DataViewCategoryColumn[])[0];
  const settingNames = Object.keys(defaultSettings[name]);

  return inputCategories.values.map((_, idx) => {
    return Object.fromEntries(
      settingNames.map(settingName => {
        return [
          settingName,
          dataViewObjects.getCommonValue(
            inputCategories.objects[idx] as powerbi.DataViewObjects,
            { objectName: name, propertyName: settingName },
            defaultSettings[name][settingName]
          )
        ]
      })
    ) as SettingsTypes
  });
}

import type powerbi from "powerbi-visuals-api"
type DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
type DataViewCategorical = powerbi.DataViewCategorical;
type DataViewObjects = powerbi.DataViewObjects;
type Fill = powerbi.Fill;
import { default as settingsModel, defaultSettings, type settingsValueTypesUnion, type settingsValueType,
  type SettingsValueKeys, type SettingsValueNestedKeys } from "../settings";
import getNested from "./getNested";
import rep from "./rep";
import between from "./between";
import isNullOrUndefined from "./isNullOrUndefined";

export type SettingsValidationT = { status: number, messages: string[][], error?: string };
export type ConditionalReturnT<T extends settingsValueTypesUnion> = { values: T[], validation: SettingsValidationT }

function getSettingValue<T>(settingObject: DataViewObjects, settingGroup: string, settingName: string, defaultValue: T): T {
  const propertyValue: powerbi.DataViewPropertyValue = settingObject?.[settingGroup]?.[settingName];
  if (isNullOrUndefined(propertyValue)) {
    return defaultValue;
  }
  return (<Fill>propertyValue)?.solid ? (<Fill>propertyValue).solid.color as T
                                      : propertyValue as T;
}

export default function
  extractConditionalFormatting<T extends settingsValueTypesUnion>(categoricalView: DataViewCategorical,
                                                        settingGroupName: string,
                                                        inputSettings: settingsValueType): ConditionalReturnT<T> {
  if (!categoricalView?.categories?.[0]?.values?.length) {
    return { values: null, validation: { status: 0, messages: rep(new Array<string>(), 1) } };
  }
  const inputCategories: DataViewCategoryColumn = (categoricalView.categories as DataViewCategoryColumn[])[0];
  const settingNames = Object.keys(inputSettings[settingGroupName]);

  // Force a deep copy to avoid JS's absurd pass-by-reference handling
  const validationRtn: SettingsValidationT
    = JSON.parse(JSON.stringify({ status: 0, messages: rep([], inputCategories.values.length) }));


  const rtn = inputCategories.values.map((_, idx) => {
    const inpObjects = (inputCategories.objects ? inputCategories.objects[idx] : null) as powerbi.DataViewObjects;
    return Object.fromEntries(
      settingNames.map(settingName => {
        const defaultSetting = defaultSettings[settingGroupName][settingName];

        let extractedSetting = getSettingValue(inpObjects, settingGroupName, settingName, defaultSetting);
        // PBI passes empty string when clearing conditional formatting
        // for dropdown setting using the eraser button, so just reset to default
        extractedSetting = extractedSetting === "" ? defaultSetting : extractedSetting;

        // New API has numeric min/max under 'options' member
        const settingEntry = getNested(settingsModel, settingGroupName as SettingsValueKeys, settingName as SettingsValueNestedKeys);
        const valid = "valid" in settingEntry ? settingEntry.valid : undefined;
        const options = "options" in settingEntry ? settingEntry.options : undefined;
        if (!isNullOrUndefined(extractedSetting)) {
          let message: string = "";
          if (valid && !valid.includes(extractedSetting)) {
            message = `${extractedSetting} is not a valid value for ${settingName}. Valid values are: ${valid.join(", ")}`
          } else if (options && (typeof extractedSetting !== "number" || !Number.isFinite(extractedSetting)
              || !between(extractedSetting, options.minValue?.value, options.maxValue?.value))) {
            message = `${extractedSetting} is not a valid value for ${settingName}. Valid values are between ${options.minValue?.value} and ${options.maxValue?.value}`
          }
          if (message !== "") {
            extractedSetting = defaultSettings[settingGroupName][settingName];
            validationRtn.messages[idx].push(message);
          }
        }
        return [ settingName, extractedSetting ];
      })
    ) as settingsValueTypesUnion
  }) as T[];

  const validationMessages = validationRtn.messages.filter(d => d.length > 0);
  if (!validationRtn.messages.some(d => d.length === 0)) {
    validationRtn.status = 1;
    validationRtn.error = `${validationMessages[0][0]}`;
  }

  return { values: rtn, validation: validationRtn };
}

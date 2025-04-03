import * as powerbi from "powerbi-visuals-api"
type DataView = powerbi.default.DataView;
type DataViewPropertyValue = powerbi.default.DataViewPropertyValue
type VisualObjectInstanceEnumerationObject = powerbi.default.VisualObjectInstanceEnumerationObject;
type VisualObjectInstance = powerbi.default.VisualObjectInstance;
type VisualObjectInstanceContainer = powerbi.default.VisualObjectInstanceContainer;
import { extractConditionalFormatting } from "../Functions";
import { default as defaultSettings, type defaultSettingsType, settingsPaneGroupings,
         type defaultSettingsKeys, type defaultSettingsNestedKeys, type NestedKeysOf } from "../defaultSettings";
import derivedSettingsClass from "./derivedSettingsClass";
import { type ConditionalReturnT, type SettingsValidationT } from "../Functions/extractConditionalFormatting";

export { type defaultSettingsType, type defaultSettingsKeys };

export type optionalSettingsTypes = Partial<{
  [K in keyof typeof defaultSettings]: Partial<defaultSettingsType[K]>;
}>;

export type paneGroupingsNestedKey = "all" | NestedKeysOf<typeof settingsPaneGroupings[keyof typeof settingsPaneGroupings]>;
export type defaultSettingsKey = keyof defaultSettingsType;
export type settingsScalarTypes = number | string | boolean;

/**
 * This is the core class which controls the initialisation and
 * updating of user-settings. Each member is its own class defining
 * the types and default values for a given group of settings.
 *
 * These are defined in the settingsGroups.ts file
 */
export default class settingsClass {
  settings: defaultSettingsType;
  derivedSettings: derivedSettingsClass;
  validationStatus: SettingsValidationT;

  /**
   * Function to read the values from the settings pane and update the
   * values stored in the class.
   *
   * @param inputObjects
   */
  update(inputView: DataView): void {
    this.validationStatus
      = JSON.parse(JSON.stringify({ status: 0, messages: new Array<string[]>(), error: "" }))
    // Get the names of all classes in settingsObject which have values to be updated
    const allSettingGroups: string[] = Object.keys(this.settings);

    allSettingGroups.forEach((settingGroup: defaultSettingsKeys) => {
      const condFormatting: ConditionalReturnT<defaultSettingsType[defaultSettingsKeys]>
        = extractConditionalFormatting(inputView?.categorical, settingGroup, this.settings);

      if (condFormatting.validation.status !== 0) {
        this.validationStatus.status = condFormatting.validation.status;
        this.validationStatus.error = condFormatting.validation.error;
      }

      if (this.validationStatus.messages.length === 0) {
        this.validationStatus.messages = condFormatting.validation.messages;
      } else if (!condFormatting.validation.messages.every(d => d.length === 0)) {
        condFormatting.validation.messages.forEach((message, idx) => {
          if (message.length > 0) {
            this.validationStatus.messages[idx] = this.validationStatus.messages[idx].concat(message)
          }
        });
      }

      // Get the names of all settings in a given class and
      // use those to extract and update the relevant values
      const settingNames: string[] = Object.keys(this.settings[settingGroup]);
      settingNames.forEach((settingName: defaultSettingsNestedKeys) => {
        this.settings[settingGroup][settingName]
          = condFormatting?.values
            ? condFormatting?.values[0][settingName]
            : defaultSettings[settingGroup][settingName]["default"]
      })
    })
    this.derivedSettings.update(this.settings)
  }

  getSettingNames(settingGroupName: defaultSettingsKeys): Record<paneGroupingsNestedKey, defaultSettingsNestedKeys[]> {
    const settingsGrouped: boolean = Object.keys(settingsPaneGroupings)
                                           .includes(settingGroupName);

    return settingsGrouped
        ? JSON.parse(JSON.stringify(settingsPaneGroupings[settingGroupName]))
        : { "all" : Object.keys(this.settings[settingGroupName]) as defaultSettingsNestedKeys[] };
  }

  /**
   * Function to extract all values for a given settings group, which are then
   * rendered to the Settings pane in PowerBI
   *
   * @param settingGroupName
   * @param inputData
   * @returns An object where each element is the value for a given setting in the named group
   */
  createSettingsEntry(settingGroupName: defaultSettingsKeys): VisualObjectInstanceEnumerationObject {
    const paneGroupings: Record<paneGroupingsNestedKey, defaultSettingsNestedKeys[]>
      = this.getSettingNames(settingGroupName);

    const rtnInstances = new Array<VisualObjectInstance>();
    const rtnContainers = new Array<VisualObjectInstanceContainer>();

    Object.keys(paneGroupings).forEach((currKey: paneGroupingsNestedKey, idx) => {
      const props = Object.fromEntries(
        paneGroupings[currKey].map(currSetting => {
          const settingValue: DataViewPropertyValue = this.settings[settingGroupName][currSetting]
          return [currSetting, settingValue]
        })
      );

      type propArray = Array<string | powerbi.default.VisualEnumerationInstanceKinds>;
      const propertyKinds: propArray[] = new Array<propArray>();

      (paneGroupings[currKey]).forEach(setting => {
        if ((typeof this.settings[settingGroupName][setting]) != "boolean") {
          propertyKinds.push([setting, powerbi.default.VisualEnumerationInstanceKinds.ConstantOrRule])
        }
      })

      rtnInstances.push({
        objectName: settingGroupName,
        properties: props,
        propertyInstanceKind: Object.fromEntries(propertyKinds),
        selector: { data: [{ dataViewWildcard: { matchingOption: 0 } }] },
        validValues: Object.fromEntries(Object.keys(defaultSettings[settingGroupName]).map((settingName: defaultSettingsNestedKeys) => {
          return [settingName, defaultSettings[settingGroupName][settingName]?.["valid"]]
        }))
      })

      if (currKey !== "all") {
        rtnInstances[idx].containerIdx = idx
        rtnContainers.push({ displayName: currKey })
      }
    });

    return { instances: rtnInstances, containers: rtnContainers };
  }

  constructor() {
    this.settings = Object.fromEntries(Object.keys(defaultSettings).map((settingGroupName) => {
      return [settingGroupName, Object.fromEntries(Object.keys(defaultSettings[settingGroupName]).map((settingName) => {
        return [settingName, defaultSettings[settingGroupName][settingName]];
      }))];
    })) as defaultSettingsType;
    this.derivedSettings = new derivedSettingsClass();
  }
}

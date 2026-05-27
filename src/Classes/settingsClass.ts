import type powerbi from "powerbi-visuals-api"
type DataView = powerbi.DataView;
import { extractConditionalFormatting, isNullOrUndefined } from "../Functions";
import { default as settingsModel, defaultSettings, type settingsValueType,
  defaultSettingsString, type settingsValueTypesUnion
 } from "../settings";
import derivedSettingsClass from "./derivedSettingsClass";
import { type ConditionalReturnT, type SettingsValidationT } from "../Functions/extractConditionalFormatting";

// Re-declare enum to avoid importing powerbi module everywhere settingsClass is used
const enum VisualEnumerationInstanceKinds {
  Constant = 1 << 0,
  Rule = 1 << 1,
  ConstantOrRule = Constant | Rule,
}

/**
 * This is the core class which controls the initialisation and
 * updating of user-settings. Each member is its own class defining
 * the types and default values for a given group of settings.
 *
 * These are defined in the settingsGroups.ts file
 */
export default class settingsClass {
  settings: settingsValueType;
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

    allSettingGroups.forEach((settingGroup) => {
      const condFormatting: ConditionalReturnT<settingsValueTypesUnion>
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
      settingNames.forEach((settingName) => {
        this.settings[settingGroup][settingName]
          = condFormatting?.values
            ? condFormatting?.values[0][settingName]
            : defaultSettings[settingGroup][settingName]
      })
    })
    this.derivedSettings.update(this.settings)
  }

  public getFormattingModel(): powerbi.visuals.FormattingModel {
    const formattingModel: powerbi.visuals.FormattingModel = {
      cards: []
    };

    for (const curr_card_name in settingsModel) {
      let curr_card: powerbi.visuals.FormattingCard = {
        description: settingsModel[curr_card_name].description,
        displayName: settingsModel[curr_card_name].displayName,
        uid: curr_card_name + "_card_uid",
        groups: [],
        revertToDefaultDescriptors: []
      };

      for (const card_group in settingsModel[curr_card_name].settingsGroups) {
        let curr_group: powerbi.visuals.FormattingGroup = {
          displayName: card_group === "all" ? settingsModel[curr_card_name].displayName : card_group,
          uid: curr_card_name + "_" + card_group + "_uid",
          slices: []
        };

        for (const setting in settingsModel[curr_card_name].settingsGroups[card_group]) {
          curr_card.revertToDefaultDescriptors.push({
            objectName: curr_card_name,
            propertyName: setting
          });

          let curr_slice: powerbi.visuals.FormattingSlice = {
            uid: curr_card_name + "_" + card_group + "_" + setting + "_slice_uid",
            displayName: settingsModel[curr_card_name].settingsGroups[card_group][setting].displayName,
            control: {
              type: settingsModel[curr_card_name].settingsGroups[card_group][setting].type,
              properties: {
                descriptor: {
                  objectName: curr_card_name,
                  propertyName: setting,
                  selector: { data: [{ dataViewWildcard: { matchingOption: 0 } }] },
                  instanceKind: (typeof this.settings[curr_card_name][setting]) != "boolean"
                                ? (<any>VisualEnumerationInstanceKinds.ConstantOrRule as powerbi.VisualEnumerationInstanceKinds)
                                : null
                },
                value: this.valueLookup(curr_card_name, card_group, setting),
                items: settingsModel[curr_card_name].settingsGroups[card_group][setting]?.items,
                options: settingsModel[curr_card_name].settingsGroups[card_group][setting]?.options
              }
            }
          };

          curr_group.slices.push(curr_slice);
        }

        curr_card.groups.push(curr_group);
      }

      formattingModel.cards.push(curr_card);
    }

    return formattingModel;
  }

  valueLookup(settingCardName: string, settingGroupName: string, settingName: string) {
    if (settingName.includes("colour")) {
      return { value: this.settings[settingCardName][settingName] }
    }
    if (!isNullOrUndefined(settingsModel[settingCardName].settingsGroups[settingGroupName][settingName]?.items)) {
      const allItems: powerbi.IEnumMember[] = settingsModel[settingCardName].settingsGroups[settingGroupName][settingName].items;
      const currValue: string = this.settings[settingCardName][settingName];
      return allItems.find(item => item.value === currValue);
    }
    return this.settings[settingCardName][settingName];
  }

  constructor() {
    this.settings = JSON.parse(defaultSettingsString) as settingsValueType;
    this.derivedSettings = new derivedSettingsClass();
  }
}

import type powerbi from "powerbi-visuals-api";
type VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import { extractValues, validateInputData, extractDataColumn, extractConditionalFormatting, rep } from "../Functions"
import { settingsClass, type defaultSettingsType } from "../Classes"
import { type ValidationT } from "./validateInputData";

export type dataObject = {
  keys: { x: number, id: number, label: string }[];
  id: number[];
  numerators: number[];
  denominators: number[];
  highlights: powerbi.PrimitiveValue[];
  anyHighlights: boolean;
  categories: powerbi.DataViewCategoryColumn;
  scatter_formatting: defaultSettingsType["scatter"][];
  label_formatting: defaultSettingsType["labels"][];
  tooltips: VisualTooltipDataItem[][];
  labels: string[];
  warningMessage: string;
  validationStatus: ValidationT;
}

export default function extractInputData(inputView: powerbi.DataViewCategorical, inputSettingsClass: settingsClass): dataObject {
  const inputSettings: defaultSettingsType = inputSettingsClass.settings;
  const numerators: number[] = extractDataColumn<number[]>(inputView, "numerators");
  const denominators: number[] = extractDataColumn<number[]>(inputView, "denominators");
  const keys: string[] = extractDataColumn<string[]>(inputView, "key");
  const labels: string[] = extractDataColumn<string[]>(inputView, "labels");
  let scatter_cond = extractConditionalFormatting<defaultSettingsType["scatter"]>(inputView, "scatter", inputSettings)?.values;
  scatter_cond = scatter_cond === null ? rep(inputSettings.scatter, numerators.length) : scatter_cond;
  let labels_cond = extractConditionalFormatting<defaultSettingsType["labels"]>(inputView, "labels", inputSettings)?.values;
  labels_cond = labels_cond === null ? rep(inputSettings.labels, numerators.length) : labels_cond;
  const tooltips = extractDataColumn<VisualTooltipDataItem[][]>(inputView, "tooltips");
  const highlights: powerbi.PrimitiveValue[] = inputView.values[0].highlights;

  const inputValidStatus: ValidationT = validateInputData(keys, numerators, denominators, inputSettings.funnel.chart_type);
  console.log(inputValidStatus)

  if (inputValidStatus.status !== 0) {
    return {
      keys: null,
      id: null,
      numerators: null,
      denominators: null,
      highlights: null,
      anyHighlights: null,
      categories: null,
      scatter_formatting: null,
      label_formatting: null,
      tooltips: null,
      labels: null,
      warningMessage: inputValidStatus.error,
      validationStatus: inputValidStatus
    }
  }

  const valid_ids: number[] = new Array<number>();
  const valid_keys: { x: number, id: number, label: string }[] = new Array<{ x: number, id: number, label: string }>();
  const removalMessages: string[] = new Array<string>();
  const groupVarName: string = inputView.categories[0].source.displayName;
  const settingsMessages = inputSettingsClass.validationStatus.messages;
  let valid_x: number = 0;
  for (let i: number = 0; i < numerators.length; i++) {
    if (inputValidStatus.messages[i] === "") {
      valid_ids.push(i);
      valid_keys.push({ x: valid_x, id: i, label: keys[i] })
      valid_x += 1;

      if (settingsMessages[i].length > 0) {
        settingsMessages[i].forEach(setting_removal_message => {
          removalMessages.push(
            `Conditional formatting for ${groupVarName} ${keys[i]} ignored due to: ${setting_removal_message}.`
          )}
        );
      }
    } else {
      removalMessages.push(`${groupVarName} ${keys[i]} removed due to: ${inputValidStatus.messages[i]}.`)
    }
  }

  return {
    keys: valid_keys,
    id: valid_ids,
    numerators: extractValues(numerators, valid_ids),
    denominators: extractValues(denominators, valid_ids),
    tooltips: extractValues(tooltips, valid_ids),
    labels: extractValues(labels, valid_ids),
    highlights: extractValues(highlights, valid_ids),
    anyHighlights: highlights != null,
    categories: inputView.categories[0],
    scatter_formatting: extractValues(scatter_cond, valid_ids),
    label_formatting: extractValues(labels_cond, valid_ids),
    warningMessage: removalMessages.length >0 ? removalMessages.join("\n") : "",
    validationStatus: inputValidStatus
  }
}

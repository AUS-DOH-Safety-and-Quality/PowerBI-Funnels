import type powerbi from "powerbi-visuals-api";
type VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import { extractValues, validateInputData, extractDataColumn, extractConditionalFormatting, rep } from "../Functions"
import { type defaultSettingsType } from "../Classes"

export type dataObject = {
  keys: { x: number, id: number, label: string }[];
  id: number[];
  numerators: number[];
  denominators: number[];
  highlights: powerbi.PrimitiveValue[];
  anyHighlights: boolean;
  categories: powerbi.DataViewCategoryColumn;
  scatter_formatting: defaultSettingsType["scatter"][];
  tooltips: VisualTooltipDataItem[][];
  warningMessage: string;
}

export default function extractInputData(inputView: powerbi.DataViewCategorical, inputSettings: defaultSettingsType): dataObject {
  const numerators: number[] = extractDataColumn<number[]>(inputView, "numerators");
  const denominators: number[] = extractDataColumn<number[]>(inputView, "denominators");
  const keys: string[] = extractDataColumn<string[]>(inputView, "key");
  let scatter_cond = extractConditionalFormatting(inputView, "scatter") as defaultSettingsType["scatter"][];
  scatter_cond = scatter_cond[0] === null ? rep(inputSettings.scatter, numerators.length) : scatter_cond;
  const tooltips = extractDataColumn<VisualTooltipDataItem[][]>(inputView, "tooltips");
  const highlights: powerbi.PrimitiveValue[] = inputView.values[0].highlights;

  const inputValidStatus: string[] = validateInputData(keys, numerators, denominators, inputSettings.funnel.chart_type);

  const valid_ids: number[] = new Array<number>();
  const valid_keys: { x: number, id: number, label: string }[] = new Array<{ x: number, id: number, label: string }>();
  const removalMessages: string[] = new Array<string>();
  const groupVarName: string = inputView.categories[0].source.displayName;
  let valid_x: number = 0;
  for (let i: number = 0; i < numerators.length; i++) {
    if (inputValidStatus[i] === "") {
      valid_ids.push(i);
      valid_keys.push({ x: valid_x, id: i, label: keys[i] })
      valid_x += 1;
    } else {
      removalMessages.push(`${groupVarName} ${keys[i]} removed due to: ${inputValidStatus[i]}.`)
    }
  }

  return {
    keys: valid_keys,
    id: valid_ids,
    numerators: extractValues(numerators, valid_ids),
    denominators: extractValues(denominators, valid_ids),
    tooltips: extractValues(tooltips, valid_ids),
    highlights: extractValues(highlights, valid_ids),
    anyHighlights: highlights != null,
    categories: inputView.categories[0],
    scatter_formatting: extractValues(scatter_cond, valid_ids) as defaultSettingsType["scatter"][],
    warningMessage: removalMessages.length >0 ? removalMessages.join("\n") : ""
  }
}

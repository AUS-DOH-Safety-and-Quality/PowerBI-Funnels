import type powerbi from "powerbi-visuals-api";
import { extractValues, checkValidInput, extractDataColumn, extractConditionalFormatting, rep } from "../Functions"
import { type defaultSettingsType } from "../Classes"

export default class dataClass {
  id: number[];
  keys: { x: number, id: number, label: string }[];
  numerator: number[];
  denominator: number[];
  highlights: powerbi.PrimitiveValue[];
  anyHighlights: boolean;
  percentLabels: boolean;
  categories: powerbi.DataViewCategoryColumn;
  scatter_formatting: defaultSettingsType["scatter"][];

  constructor(inputView: powerbi.DataViewCategorical, inputSettings: defaultSettingsType) {
    const numerators: number[] = extractDataColumn<number[]>(inputView, "numerators");
    const denominators: number[] = extractDataColumn<number[]>(inputView, "denominators");
    let scatter_cond = extractConditionalFormatting(inputView, "scatter", inputSettings) as defaultSettingsType["scatter"][];
    scatter_cond = scatter_cond[0] === null ? rep(inputSettings.scatter, numerators.length) : scatter_cond

    const valid_indexes: number[] = new Array<number>();

    for (let i: number = 0; i < denominators.length; i++) {
      if (checkValidInput(numerators[i], denominators[i], inputSettings.funnel.chart_type)) {
        valid_indexes.push(i);
      }
    }

    this.id = valid_indexes;
    this.numerator = extractValues(numerators, valid_indexes);
    this.denominator = extractValues(denominators, valid_indexes);
    this.highlights = inputView.values[0].highlights ? extractValues(inputView.values[0].highlights, valid_indexes) : inputView.values[0].highlights;
    this.anyHighlights = this.highlights ? true : false
    this.percentLabels = (inputSettings.funnel.chart_type === "PR") && (inputSettings.funnel.multiplier === 1 || inputSettings.funnel.multiplier === 100);
    this.categories = inputView.categories[0];
    this.scatter_formatting = extractValues(scatter_cond, valid_indexes) as defaultSettingsType["scatter"][]
  }
}

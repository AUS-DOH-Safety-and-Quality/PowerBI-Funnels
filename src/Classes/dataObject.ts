import powerbi from "powerbi-visuals-api";
import extractValues from "../Functions/extractValues"
import checkValidInput from "../Functions/checkValidInput"
import settingsObject from "./settingsObject"
import plotKey from "./plotKey"
import extractDataColumn from "../Functions/extractDataColumn"
import extractConditionalFormatting from "../Functions/extractConditionalFormatting"
import { conditionalFormattingTypes } from "../Classes/settingsGroups";

class dataObject {
  id: number[];
  keys: plotKey[];
  numerator: number[];
  denominator: number[];
  highlights: powerbi.PrimitiveValue[];
  anyHighlights: boolean;
  percentLabels: boolean;
  chart_type: string;
  multiplier: number;
  flag_direction: string;
  categories: powerbi.DataViewCategoryColumn;
  ylimit_u: number;
  ylimit_l: number;
  scatter_formatting: conditionalFormattingTypes["scatter"][];

  constructor(inputView: powerbi.DataViewCategorical, inputSettings: settingsObject) {
    let numerators: number[] = extractDataColumn<number[]>(inputView, "numerators");
    let denominators: number[] = extractDataColumn<number[]>(inputView, "denominators");

    let chart_type: string = extractDataColumn<string>(inputView, "chart_type", inputSettings);
    let multiplier: number = extractDataColumn<number>(inputView, "multiplier", inputSettings);
    let flag_direction: string = extractDataColumn<string>(inputView, "flag_direction", inputSettings);
    let ylimit_u: number = extractDataColumn<number>(inputView, "ylimit_u", inputSettings);
    let ylimit_l: number = extractDataColumn<number>(inputView, "ylimit_l", inputSettings);

    let scatter_cond = extractConditionalFormatting<conditionalFormattingTypes["scatter"]>(inputView, "scatter", inputSettings)
    console.log("scatter: ", scatter_cond)
    let valid_indexes: number[] = new Array<number>();

    for (let i: number = 0; i < denominators.length; i++) {
      if (checkValidInput(numerators[i], denominators[i], chart_type)) {
        valid_indexes.push(i);
      }
    }

    this.id = valid_indexes;
    this.numerator = extractValues(numerators, valid_indexes);
    this.denominator = extractValues(denominators, valid_indexes);
    this.highlights = inputView.values[0].highlights ? extractValues(inputView.values[0].highlights, valid_indexes) : inputView.values[0].highlights;
    this.anyHighlights = this.highlights ? true : false
    this.percentLabels = (chart_type === "PR") && (multiplier === 1 || multiplier === 100);
    this.chart_type = chart_type;
    this.multiplier = multiplier;
    this.flag_direction = flag_direction.toLowerCase();
    this.ylimit_u = ylimit_u;
    this.ylimit_l = ylimit_l;
    this.categories = inputView.categories[0];
    this.scatter_formatting = extractValues(scatter_cond, valid_indexes)
  }
}

export default dataObject;

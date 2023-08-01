import powerbi from "powerbi-visuals-api";
import extractValues from "../Functions/extractValues"
import checkValidInput from "../Functions/checkValidInput"
import settingsObject from "./settingsObject"
import plotKey from "./plotKey"
import extractDataColumn from "../Functions/extractDataColumn"
import extractConditionalFormatting from "../Functions/extractConditionalFormatting"
import { SettingsBaseTypedT, scatterSettings } from "../Classes/settingsGroups";

class dataObject {
  id: number[];
  keys: plotKey[];
  numerator: number[];
  denominator: number[];
  highlights: powerbi.PrimitiveValue[];
  anyHighlights: boolean;
  percentLabels: boolean;
  categories: powerbi.DataViewCategoryColumn;
  scatter_formatting: SettingsBaseTypedT<scatterSettings>[];

  constructor(inputView: powerbi.DataViewCategorical, inputSettings: settingsObject) {
    const numerators: number[] = extractDataColumn<number[]>(inputView, "numerators");
    const denominators: number[] = extractDataColumn<number[]>(inputView, "denominators");
    const scatter_cond = extractConditionalFormatting<SettingsBaseTypedT<scatterSettings>>(inputView, "scatter", inputSettings)

    const valid_indexes: number[] = new Array<number>();

    for (let i: number = 0; i < denominators.length; i++) {
      if (checkValidInput(numerators[i], denominators[i], inputSettings.funnel.chart_type.value)) {
        valid_indexes.push(i);
      }
    }

    this.id = valid_indexes;
    this.numerator = extractValues(numerators, valid_indexes);
    this.denominator = extractValues(denominators, valid_indexes);
    this.highlights = inputView.values[0].highlights ? extractValues(inputView.values[0].highlights, valid_indexes) : inputView.values[0].highlights;
    this.anyHighlights = this.highlights ? true : false
    this.percentLabels = (inputSettings.funnel.chart_type.value === "PR") && (inputSettings.funnel.multiplier.value === 1 || inputSettings.funnel.multiplier.value === 100);
    this.categories = inputView.categories[0];
    this.scatter_formatting = extractValues(scatter_cond, valid_indexes)
  }
}

export default dataObject;

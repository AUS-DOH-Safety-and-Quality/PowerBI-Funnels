import powerbi from "powerbi-visuals-api";
import extractValues from "../Functions/extractValues"
import checkValidInput from "../Functions/checkValidInput"
import settingsObject from "./settingsObject"
import plotKey from "./plotKey"
import extractDataColumn from "../Functions/extractDataColumn"

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
  ylimit_l: number

  constructor(inputView: powerbi.DataViewCategorical, inputSettings: settingsObject) {
    let keys: string[] = extractDataColumn<string[]>(inputView, "key", inputSettings);
    let numerators: number[] = extractDataColumn<number[]>(inputView, "numerators");
    let denominators: number[] = extractDataColumn<number[]>(inputView, "denominators");

    let data_type_raw: powerbi.DataViewValueColumn = inputView.values.filter(d => d.source.roles.chart_type)[0];
    let multiplier_raw: powerbi.DataViewValueColumn = inputView.values.filter(d => d.source.roles.chart_multiplier)[0];
    let outlier_direction_raw: powerbi.DataViewValueColumn = inputView.values.filter(d => d.source.roles.flag_direction)[0];

    let chart_type: string = extractDataColumn<string>(inputView, "chart_type", inputSettings);
    let multiplier: number = extractDataColumn<number>(inputView, "multiplier", inputSettings);
    let flag_direction: string = extractDataColumn<string>(inputView, "flag_direction", inputSettings);
    let ylimit_u: number = extractDataColumn<number>(inputView, "ylimit_u", inputSettings);
    let ylimit_l: number = extractDataColumn<number>(inputView, "ylimit_l", inputSettings);

    let valid_ids: number[] = new Array<number>();
    let valid_keys: plotKey[] = new Array<plotKey>();

    for (let i: number = 0; i < denominators.length; i++) {
      if(checkValidInput(numerators[i], denominators[i], chart_type)) {
        valid_ids.push(i);
        valid_keys.push({ x: null, id: i, label: keys[i] })
      }
    }
    this.id = valid_ids;
    valid_keys.forEach((d, idx) => { d.x = idx });
    this.numerator = extractValues(numerators, valid_ids);
    this.denominator = extractValues(denominators, valid_ids);
    this.highlights = inputView.values[0].highlights ? extractValues(inputView.values[0].highlights, valid_ids) : inputView.values[0].highlights;
    this.anyHighlights = this.highlights ? true : false
    this.percentLabels = (chart_type === "PR") && (multiplier === 1 || multiplier === 100);
    this.chart_type = chart_type;
    this.multiplier = multiplier;
    this.flag_direction = flag_direction.toLowerCase();
    this.ylimit_u = ylimit_u;
    this.ylimit_l = ylimit_l;
    this.categories = inputView.categories[0];
  }
}

export default dataObject;

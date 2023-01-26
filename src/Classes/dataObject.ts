import powerbi from "powerbi-visuals-api";
import extractValues from "../Functions/extractValues"
import checkValidInput from "../Functions/checkValidInput"
import settingsObject from "./settingsObject"

class dataObject {
  id: number[];
  numerator: number[];
  denominator: number[];
  highlights: powerbi.PrimitiveValue[];
  anyHighlights: boolean;
  data_type: string;
  multiplier: number;
  flag_direction: string;
  categories: powerbi.DataViewCategoryColumn;
  ylimit_u: number;
  ylimit_l: number

  constructor(inputView?: powerbi.DataViewCategorical, inputSettings?: settingsObject) {
    if (!inputView && !inputSettings) {
      this.id = <number[]>null;
      this.numerator = <number[]>null;
      this.denominator = <number[]>null;
      this.data_type = <string>null;
      this.multiplier = <number>null;
      this.flag_direction = <string>null;
      this.categories = <powerbi.DataViewCategoryColumn>null;
      this.ylimit_u = <number>null;
      this.ylimit_l = <number>null;
      return;
    }
    let numerator_raw: powerbi.DataViewValueColumn = inputView.values.filter(d => d.source.roles.numerator)[0];
    let denominator: number[] = <number[]>inputView.values.filter(d => d.source.roles.denominator)[0].values;

    let data_type_raw: powerbi.DataViewValueColumn = inputView.values.filter(d => d.source.roles.chart_type)[0];
    let multiplier_raw: powerbi.DataViewValueColumn = inputView.values.filter(d => d.source.roles.chart_multiplier)[0];
    let outlier_direction_raw: powerbi.DataViewValueColumn = inputView.values.filter(d => d.source.roles.flag_direction)[0];

    let y_axis_upper_limit_raw: powerbi.DataViewValueColumn = inputView.values.filter(d => d.source.roles.ylimit_u)[0];
    let y_axis_lower_limit_raw: powerbi.DataViewValueColumn = inputView.values.filter(d => d.source.roles.ylimit_l)[0];

    let numerator: number[] = <number[]>numerator_raw.values;
    let data_type: string = data_type_raw ? <string>data_type_raw.values[0] : inputSettings.funnel.chart_type.value;
    let multiplier: number = multiplier_raw ? <number>multiplier_raw.values[0] : inputSettings.funnel.multiplier.value;
    let flag_direction: string = outlier_direction_raw ? <string>outlier_direction_raw.values[0] : inputSettings.outliers.flag_direction.value;
    let ylimit_u: number = y_axis_upper_limit_raw ? <number>y_axis_upper_limit_raw.values[0] : inputSettings.y_axis.ylimit_u.value;
    let ylimit_l: number = y_axis_lower_limit_raw ? <number>y_axis_lower_limit_raw.values[0] : inputSettings.y_axis.ylimit_l.value;
    let valid_ids: number[] = new Array<number>();

    for (let i: number = 0; i < denominator.length; i++) {
      if(checkValidInput(numerator[i], denominator[i], data_type)) {
        valid_ids.push(i);
      }
    }
    this.id = valid_ids;
    this.numerator = extractValues(numerator, valid_ids);
    this.denominator = extractValues(denominator, valid_ids);
    this.highlights = numerator_raw.highlights;
    this.anyHighlights = this.highlights ? true : false
    this.data_type = data_type;
    this.multiplier = (data_type === "PR" && multiplier == 1) ? 100 : multiplier;
    this.flag_direction = flag_direction.toLowerCase();
    this.ylimit_u = ylimit_u;
    this.ylimit_l = ylimit_l;
    this.categories = inputView.categories[0];
  }
}

export default dataObject;

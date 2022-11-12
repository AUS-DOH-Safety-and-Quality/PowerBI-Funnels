import powerbi from "powerbi-visuals-api";
import dataArray from "../Classes/dataArray";
import checkValidInput from "./checkValidInput"
import extractValues from "./extractValues"
import settingsObject from "../Classes/settingsObject"

function extractInputData(inputView: powerbi.DataViewCategorical,
                          inputSettings: settingsObject): dataArray {
  let numerator_raw: powerbi.DataViewValueColumn = inputView.values.filter(d => d.source.roles.numerator)[0];
  let denominator: number[] = <number[]>inputView.values.filter(d => d.source.roles.denominator)[0].values;

  let data_type_raw: powerbi.DataViewValueColumn = inputView.values.filter(d => d.source.roles.chart_type)[0];
  let multiplier_raw: powerbi.DataViewValueColumn = inputView.values.filter(d => d.source.roles.chart_multiplier)[0];
  
  let y_axis_upper_limit_raw: powerbi.DataViewValueColumn = inputView.values.filter(d => d.source.roles.y_axis_upper_limit)[0];
  let y_axis_lower_limit_raw: powerbi.DataViewValueColumn = inputView.values.filter(d => d.source.roles.y_axis_lower_limit)[0];

  let numerator: number[] = <number[]>numerator_raw.values;
  let data_type: string = data_type_raw ? <string>data_type_raw.values[0] : inputSettings.funnel.data_type.value;
  let multiplier: number = multiplier_raw ? <number>multiplier_raw.values[0] : inputSettings.funnel.multiplier.value;
  let ylimit_u: number = y_axis_upper_limit_raw ? <number>y_axis_upper_limit_raw.values[0] : inputSettings.axis.ylimit_u.value;
  let ylimit_l: number = y_axis_lower_limit_raw ? <number>y_axis_lower_limit_raw.values[0] : inputSettings.axis.ylimit_l.value;
  let valid_ids: number[] = new Array<number>();

  for (let i: number = 0; i < denominator.length; i++) {
    if(checkValidInput(numerator[i], denominator[i], data_type)) {
      valid_ids.push(i);
    }
  }

  return new dataArray({
    id: valid_ids,
    numerator: extractValues(numerator, valid_ids),
    denominator: extractValues(denominator, valid_ids),
    highlights: numerator_raw.highlights,
    data_type: data_type,
    multiplier: multiplier,
    ylimit_u: ylimit_u,
    ylimit_l: ylimit_l,
    categories: inputView.categories[0],
    transform_text: inputSettings.funnel.transformation.value,
    dot_colour: [inputSettings.scatter.colour.value],
    odAdjust: inputSettings.funnel.od_adjust.value
  });
}

export default extractInputData;

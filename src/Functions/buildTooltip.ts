import { at } from "powerbi-visuals-core/util";
import type powerbi from "powerbi-visuals-api";
type VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import settingsModel, { type settingsValueType } from "../settings";
import type { limitData } from "../Classes";
import type { dataObject } from "./extractInputData";
import getTransformation from "../Funnel Calculations/getTransformation";
import { valueTooltips, limitTooltips, appendPatternTooltips } from "powerbi-visuals-core/powerbi";
import type { DerivedScaling } from "powerbi-visuals-core/data";

const valueLabel: Readonly<Record<settingsValueType["funnel"]["chart_type"], string>> = {
  "PR" : "Proportion",
  "SR" : "Standardised Ratio",
  "RC" : "Rate"
}

export default function buildTooltip(index: number,
                                      limits: Readonly<limitData>,
                                      outliers: { readonly two_sigma: boolean, readonly three_sigma: boolean },
                                      inputData: dataObject,
                                      inputSettings: settingsValueType,
                                      derivedSettings: DerivedScaling): VisualTooltipDataItem[] {
  const data_type = inputSettings.funnel.chart_type;
  const multiplier: number = derivedSettings.multiplier;
  const transform_text = inputSettings.funnel.transformation;
  const transform: (x: number) => number = getTransformation(transform_text);

  const group: string = at(inputData.keys, index).label;
  const numerator: number = at(inputData.numerators, index);
  const denominator: number = at(inputData.denominators, index);

  const ratio: number = transform((numerator / denominator) * multiplier);
  const formatValues = derivedSettings.formatValue;

  const tooltip: VisualTooltipDataItem[] = new Array<VisualTooltipDataItem>();
  if (inputSettings.funnel.ttip_show_group) {
    tooltip.push({
      displayName: inputSettings.funnel.ttip_label_group,
      value: group
    });
  }
  tooltip.push(...valueTooltips(inputSettings.funnel, { value: ratio, numerator, denominator }, valueLabel[data_type], formatValues));
  tooltip.push(...limitTooltips(inputSettings.lines, limits, formatValues, true));

  if (transform_text !== "none") {
    const transformations = settingsModel.funnel.settingsGroups.all.transformation.items;
    for (let i = 0; i < transformations.length; i++) {
      const transformation = at(transformations, i);
      if (transformation.value === transform_text) {
        tooltip.push({
          displayName: "Plot Scaling",
          value: transformation.displayName
        });
      }
    }
  }
  const patterns: string[] = new Array<string>();
  if (outliers.three_sigma) {
    patterns.push("Three Sigma Outlier")
  }
  if (outliers.two_sigma) {
    patterns.push("Two Sigma Outlier")
  }
  appendPatternTooltips(tooltip, patterns, at(inputData.tooltips, index));
  return tooltip;
}

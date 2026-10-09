import type powerbi from "powerbi-visuals-api";
type VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import type { settingsValueType } from "../settings";
import type { limitData, derivedSettingsClass } from "../Classes";
import type { dataObject } from "./extractInputData";
import getTransformation from "../Funnel Calculations/getTransformation";
import { valueTooltips, limitTooltips, appendPatternTooltips } from "powerbi-visuals-core/powerbi";

const valueLabel: Record<string, string> = {
  "PR" : "Proportion",
  "SR" : "Standardised Ratio",
  "RC" : "Rate"
}

export default function buildTooltip(index: number,
                                      calculatedLimits: limitData[],
                                      outliers: { two_sigma: boolean, three_sigma: boolean },
                                      inputData: dataObject,
                                      inputSettings: settingsValueType,
                                      derivedSettings: derivedSettingsClass): VisualTooltipDataItem[] {
  const data_type: string = inputSettings.funnel.chart_type;
  const multiplier: number = derivedSettings.multiplier;
  const transform_text: string = inputSettings.funnel.transformation;
  const transform: (x: number) => number = getTransformation(transform_text);

  const group: string = inputData.keys[index].label;
  const numerator: number = inputData.numerators[index];
  const denominator: number = inputData.denominators[index];

  const limits = calculatedLimits.find(d => d.denominators === denominator);
  if (limits === undefined) throw new Error("Missing limits for an observed denominator.");

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
    tooltip.push({
      displayName: "Plot Scaling",
      value: transform_text
    });
  }
  const patterns: string[] = new Array<string>();
  if (outliers.three_sigma) {
    patterns.push("Three Sigma Outlier")
  }
  if (outliers.two_sigma) {
    patterns.push("Two Sigma Outlier")
  }
  appendPatternTooltips(tooltip, patterns, inputData.tooltips?.[index]);
  return tooltip;
}

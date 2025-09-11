import type powerbi from "powerbi-visuals-api";
type VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
import type { limitData, defaultSettingsType, derivedSettingsClass } from "../Classes";
import { type dataObject } from "../Functions";
import getTransformation from "../Funnel Calculations/getTransformation";

export default function buildTooltip(index: number,
                                      calculatedLimits: limitData[],
                                      outliers: { two_sigma: boolean, three_sigma: boolean },
                                      inputData: dataObject,
                                      inputSettings: defaultSettingsType,
                                      derivedSettings: derivedSettingsClass): VisualTooltipDataItem[] {
  const data_type: string = inputSettings.funnel.chart_type;
  const multiplier: number = derivedSettings.multiplier;
  const transform_text: string = inputSettings.funnel.transformation;
  const transform: (x: number) => number = getTransformation(transform_text);

  const group: string = inputData.keys[index].label;
  const numerator: number = inputData.numerators[index];
  const denominator: number = inputData.denominators[index];

  const limits: limitData = calculatedLimits.filter(d => d.denominators === denominator && d.ll99 !== null && d.ul99 !== null)[0];

  const ratio: number = transform((numerator / denominator) * multiplier);
  const suffix: string = derivedSettings.percentLabels ? "%" : "";

  const prop_labels: boolean = derivedSettings.percentLabels;
  const sig_figs: number = inputSettings.funnel.sig_figs;
  const valueLabel: Record<string, string> = {
    "PR" : "Proportion",
    "SR" : "Standardised Ratio",
    "RC" : "Rate"
  }

  const tooltip: VisualTooltipDataItem[] = new Array<VisualTooltipDataItem>();
  if (inputSettings.funnel.ttip_show_group) {
    tooltip.push({
      displayName: inputSettings.funnel.ttip_label_group,
      value: group
    })
  }
  if (inputSettings.funnel.ttip_show_value) {
    const ttip_label_value: string = inputSettings.funnel.ttip_label_value;
    tooltip.push({
      displayName: ttip_label_value === "Automatic" ? valueLabel[data_type] : ttip_label_value,
      value: ratio.toFixed(sig_figs) + suffix
    })
  }
  if(inputSettings.funnel.ttip_show_numerator && !(numerator === null || numerator === undefined)) {
    tooltip.push({
      displayName: inputSettings.funnel.ttip_label_numerator,
      value: (numerator).toFixed(prop_labels ? 0 : sig_figs)
    })
  }
  if(inputSettings.funnel.ttip_show_denominator && !(denominator === null || denominator === undefined)) {
    tooltip.push({
      displayName: inputSettings.funnel.ttip_label_denominator,
      value: (denominator).toFixed(prop_labels ? 0 : sig_figs)
    })
  }
  ["68", "95", "99"].forEach(limit => {
    if (inputSettings.lines[`ttip_show_${limit}`] && inputSettings.lines[`show_${limit}`]) {
      tooltip.push({
        displayName: `Upper ${inputSettings.lines[`ttip_label_${limit}`]}`,
        value: (limits[`ul${limit}`]).toFixed(sig_figs) + suffix
      })
    }
  })
  if (inputSettings.lines.show_target && inputSettings.lines.ttip_show_target) {
    tooltip.push({
      displayName: inputSettings.lines.ttip_label_target,
      value: (limits.target).toFixed(sig_figs) + suffix
    })
  }
  if (inputSettings.lines.show_alt_target && inputSettings.lines.ttip_show_alt_target && !(limits.alt_target === null || limits.alt_target === undefined)) {
    tooltip.push({
      displayName: inputSettings.lines.ttip_label_alt_target,
      value: (limits.alt_target).toFixed(sig_figs) + suffix
    })
  }
  ["68", "95", "99"].forEach(limit => {
    if (inputSettings.lines[`ttip_show_${limit}`] && inputSettings.lines[`show_${limit}`]) {
      tooltip.push({
        displayName: `Lower ${inputSettings.lines[`ttip_label_${limit}`]}`,
        value: (limits[`ll${limit}`]).toFixed(sig_figs) + suffix
      })
    }
  })

  if (transform_text !== "none") {
    tooltip.push({
      displayName: "Plot Scaling",
      value: transform_text
    })
  }
  if (outliers.two_sigma || outliers.three_sigma) {
    const patterns: string[] = new Array<string>();
    if (outliers.three_sigma) {
      patterns.push("Three Sigma Outlier")
    }
    if (outliers.two_sigma) {
      patterns.push("Two Sigma Outlier")
    }
    tooltip.push({
      displayName: "Pattern(s)",
      value: patterns.join("\n")
    })
  }

  if (inputData.tooltips.length > 0) {
    inputData.tooltips[index].forEach(customTooltip => tooltip.push(customTooltip));
  }

  return tooltip;
}

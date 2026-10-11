import { type settingsValueType } from "../settings"
import { createValueFormatter, resolvePercentScaling, type ValueFormatter } from "powerbi-visuals-core/data";

export default class derivedSettingsClass {
  multiplier: number
  percentLabels: boolean
  formatValue: ValueFormatter

  constructor(inputSettings: settingsValueType) {
    const values = this.calculate(inputSettings);
    this.multiplier = values.multiplier;
    this.percentLabels = values.percentLabels;
    this.formatValue = values.formatValue;
  }

  update(inputSettings: settingsValueType) {
    const values = this.calculate(inputSettings);
    this.multiplier = values.multiplier;
    this.percentLabels = values.percentLabels;
    this.formatValue = values.formatValue;
  }

  private calculate(inputSettings: settingsValueType) {
    const funnel = inputSettings.funnel;
    const scaling = resolvePercentScaling(funnel.chart_type === "PR", funnel.perc_labels, funnel.multiplier);
    const percentLabels: boolean = scaling.percentLabels && funnel.transformation === "none";
    // Expected counts are not whole numbers
    const formatValue = createValueFormatter(funnel.sig_figs, funnel.chart_type === "SR" ? funnel.sig_figs : 0,
                                             percentLabels ? "%" : "");
    return { multiplier: scaling.multiplier, percentLabels, formatValue };
  }
}

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
    const scaling = resolvePercentScaling(inputSettings.funnel.chart_type === "PR",
                                          inputSettings.funnel.perc_labels, inputSettings.funnel.multiplier);
    const formatValue = createValueFormatter(inputSettings.funnel.sig_figs, 0, scaling.percentLabels ? "%" : "");
    return { multiplier: scaling.multiplier, percentLabels: scaling.percentLabels, formatValue };
  }
}

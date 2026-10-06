import { type settingsValueType } from "../settings"

export default class derivedSettingsClass {
  multiplier: number
  percentLabels: boolean

  constructor(inputSettings: settingsValueType) {
    const values = this.calculate(inputSettings);
    this.multiplier = values.multiplier;
    this.percentLabels = values.percentLabels;
  }

  update(inputSettings: settingsValueType) {
    const values = this.calculate(inputSettings);
    this.multiplier = values.multiplier;
    this.percentLabels = values.percentLabels;
  }

  private calculate(inputSettings: settingsValueType) {
    const chartType: string = inputSettings.funnel.chart_type;
    const pChartType: boolean = ["PR"].includes(chartType);
    const percentSettingString: string = inputSettings.funnel.perc_labels;
    let multiplier: number = inputSettings.funnel.multiplier;
    let percentLabels: boolean;

    if (percentSettingString === "Yes") {
      multiplier = 100
    }

    if (pChartType) {
      multiplier = multiplier === 1 ? 100 : multiplier
    }

    if (percentSettingString === "Automatic") {
      percentLabels = pChartType && multiplier === 100;
    } else {
      percentLabels = percentSettingString === "Yes";
    }

    return { multiplier, percentLabels };
  }
}

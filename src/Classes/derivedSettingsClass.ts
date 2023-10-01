import { defaultSettingsType } from "./settingsClass"

export default class derivedSettingsClass {
  multiplier: number
  percentLabels: boolean

  update(inputSettings: defaultSettingsType) {
    const chartType: string = inputSettings.funnel.chart_type;
    const pChartType: boolean = ["PR"].includes(chartType);
    let multiplier: number = inputSettings.funnel.multiplier;

    if (pChartType) {
      multiplier = multiplier === 1 ? 100 : multiplier
    }

    this.multiplier = multiplier
    this.percentLabels = pChartType && multiplier === 100;
  }
}

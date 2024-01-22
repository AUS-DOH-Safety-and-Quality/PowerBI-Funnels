import * as d3 from "../D3 Plotting Functions/D3 Modules";
import type powerbi from "powerbi-visuals-api";
type VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
type IVisualHost = powerbi.extensibility.visual.IVisualHost;
type VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
type ISelectionId = powerbi.visuals.ISelectionId;
import { chartClass, settingsClass, type limitData, plotPropertiesClass, type defaultSettingsType } from "../Classes"
import { extractInputData, buildTooltip, type dataObject, checkFlagDirection } from "../Functions";
import * as chartObjects from "../Chart Types"
import getTransformation from "../Funnel Calculations/getTransformation";
import two_sigma from "../Outlier Flagging/two_sigma"
import three_sigma from "../Outlier Flagging/three_sigma"

export type lineData = {
  x: number;
  line_value: number;
  group: string;
}

export type plotData = {
  x: number;
  value: number;
  group_text: string;
  aesthetics: defaultSettingsType["scatter"];
  // ISelectionId allows the visual to report the selection choice to PowerBI
  identity: ISelectionId;
  // Flag for whether dot should be highlighted by selections in other charts
  highlighted: boolean;
  // Tooltip data to print
  tooltip: VisualTooltipDataItem[];
}

export default class viewModelClass {
  inputData: dataObject;
  inputSettings: settingsClass;
  chartBase: chartClass;
  calculatedLimits: limitData[];
  plotPoints: plotData[];
  groupedLines: [string, lineData[]][];
  plotProperties: plotPropertiesClass;
  firstRun: boolean;

  constructor() {
    this.inputData = <dataObject>null;
    this.inputSettings = new settingsClass();
    this.chartBase = null;
    this.calculatedLimits = null;
    this.plotPoints = new Array<plotData>();
    this.groupedLines = new Array<[string, lineData[]]>();
    this.plotProperties = new plotPropertiesClass();
    this.firstRun = true
  }

  update(options: VisualUpdateOptions, host: IVisualHost) {
    // Only re-construct data and re-calculate limits if they have changed
    if (options.type === 2 || this.firstRun) {
      const chart_type: string = this.inputSettings.settings.funnel.chart_type

      this.inputData = extractInputData(options.dataViews[0].categorical, this.inputSettings.settings);

      this.chartBase = new chartObjects[chart_type](this.inputData, this.inputSettings);
      this.calculatedLimits = this.chartBase.getLimits();

      this.plotPoints = this.getScatterData(host);
      this.groupedLines = this.getGroupedLines();
    }

    this.plotProperties.update(
      options,
      this.plotPoints,
      this.inputData,
      this.inputSettings.settings,
      this.inputSettings.derivedSettings
    )
    this.firstRun = false;
  }

  getScatterData(host: IVisualHost): plotData[] {
    const plotPoints = new Array<plotData>();
    const transform_text: string = this.inputSettings.settings.funnel.transformation;
    const transform: (x: number) => number = getTransformation(transform_text);
    const target: number = this.chartBase.getTarget({ transformed: false });
    const multiplier: number = this.inputSettings.derivedSettings.multiplier;
    const data_type: string = this.inputSettings.settings.funnel.chart_type;
    const flag_two_sigma: boolean = this.inputSettings.settings.outliers.two_sigma;
    const flag_three_sigma: boolean = this.inputSettings.settings.outliers.three_sigma;

    for (let i: number = 0; i < this.inputData.id.length; i++) {
      const original_index: number = this.inputData.id[i];
      const numerator: number = this.inputData.numerators[i];
      const denominator: number = this.inputData.denominators[i];
      const ratio: number = (numerator / denominator);
      const limits_impl: limitData[] = this.calculatedLimits.filter(d => d.denominators === denominator && d.ll99 !== null && d.ul99 !== null);
      const limits: limitData = limits_impl.length > 0 ? limits_impl[0] : this.calculatedLimits.filter(d => d.denominators === denominator)[0];
      const aesthetics: defaultSettingsType["scatter"] = this.inputData.scatter_formatting[i]
      const two_sigma_outlier: string = flag_two_sigma ? two_sigma(ratio, limits) : "none";
      const three_sigma_outlier: string = flag_three_sigma ? three_sigma(ratio, limits) : "none";
      const category: string = (typeof this.inputData.categories.values[original_index] === "number") ?
                              (this.inputData.categories.values[original_index]).toString() :
                              <string>(this.inputData.categories.values[original_index]);
      const flagSettings = {
        process_flag_type: this.inputSettings.settings.outliers.process_flag_type,
        improvement_direction: this.inputSettings.settings.outliers.improvement_direction
      }
      if (two_sigma_outlier !== "none") {
        const two_sigma_flag: string = checkFlagDirection(two_sigma_outlier, flagSettings)
        aesthetics.colour = this.inputSettings.settings.outliers["two_sigma_colour_" + two_sigma_flag];
        aesthetics.scatter_text_colour = aesthetics.colour;
      }

      if (three_sigma_outlier !== "none") {
        const three_sigma_flag: string = checkFlagDirection(three_sigma_outlier, flagSettings)
        aesthetics.colour = this.inputSettings.settings.outliers["three_sigma_colour_" + three_sigma_flag];
        aesthetics.scatter_text_colour = aesthetics.colour;
      }

      plotPoints.push({
        x: denominator,
        value: transform(ratio * multiplier),
        group_text: category,
        aesthetics: aesthetics,
        identity: host.createSelectionIdBuilder()
                      .withCategory(this.inputData.categories, original_index)
                      .createSelectionId(),
        highlighted: this.inputData.highlights ? (this.inputData.highlights[i] ? true : false) : false,
        tooltip: buildTooltip({
          group: category,
          numerator: numerator,
          denominator: denominator,
          target: target,
          transform_text: transform_text,
          transform: transform,
          limits: limits,
          data_type: data_type,
          multiplier: multiplier,
          two_sigma_outlier: two_sigma_outlier !== "none",
          three_sigma_outlier: three_sigma_outlier !== "none",
          sig_figs: this.inputSettings.settings.funnel.sig_figs,
          userTooltips: this.inputData.tooltips[i]
        })
      })
    }
    return plotPoints;
  }

  getGroupedLines(): [string, lineData[]][] {
    const multiplier: number = this.inputSettings.derivedSettings.multiplier;
    const transform: (x: number) => number = getTransformation(this.inputSettings.settings.funnel.transformation);

    const target: number = this.chartBase.getTarget({ transformed: false });
    const alt_target: number = this.inputSettings.settings.funnel.alt_target;

    const labels: string[] = ["ll99", "ll95", "ul95", "ul99", "target", "alt_target"];

    const formattedLines: lineData[] = new Array<lineData>();
    this.calculatedLimits.forEach(limits => {
      limits.target = target;
      limits.alt_target = alt_target;
      labels.forEach(label => {
          formattedLines.push({
            x: limits.denominators,
            line_value: limits[label] ? transform(limits[label] * multiplier) : null,
            group: label
          })
      })
    })
    return d3.groups(formattedLines, d => d.group);
  }
}

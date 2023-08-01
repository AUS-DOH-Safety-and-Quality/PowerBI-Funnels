import * as d3 from "../D3 Plotting Functions/D3 Modules";
import powerbi from "powerbi-visuals-api";
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
type VisualTooltipDataItem = powerbi.extensibility.VisualTooltipDataItem;
type ISelectionId = powerbi.visuals.ISelectionId;
import { chartClass, settingsClass, dataClass, type limitData, plotPropertiesClass } from "../Classes"
import checkInvalidDataView from "../Functions/checkInvalidDataView"
import * as chartObjects from "../Chart Types"
import getTransformation from "../Funnel Calculations/getTransformation";
import two_sigma from "../Outlier Flagging/two_sigma"
import three_sigma from "../Outlier Flagging/three_sigma"
import { buildTooltip } from "../Functions"
import { SettingsBaseTypedT, scatterSettings } from "./settingsGroups";

export type lineData = {
  x: number;
  line_value: number;
  group: string;
}

export type plotData = {
  x: number;
  value: number;
  aesthetics: SettingsBaseTypedT<scatterSettings>;
  // ISelectionId allows the visual to report the selection choice to PowerBI
  identity: ISelectionId;
  // Flag for whether dot should be highlighted by selections in other charts
  highlighted: boolean;
  // Tooltip data to print
  tooltip: VisualTooltipDataItem[];
}

export default class viewModelClass {
  inputData: dataClass;
  inputSettings: settingsClass;
  chartBase: chartClass;
  calculatedLimits: limitData[];
  plotPoints: plotData[];
  groupedLines: [string, lineData[]][];
  plotProperties: plotPropertiesClass;
  firstRun: boolean;

  getScatterData(host: IVisualHost): plotData[] {
    const plotPoints = new Array<plotData>();
    const transform_text: string = this.inputSettings.funnel.transformation.value;
    const transform: (x: number) => number = getTransformation(transform_text);
    const target: number = this.chartBase.getTarget({ transformed: false });
    const multiplier: number = this.inputSettings.funnel.multiplier.value;
    const data_type: string = this.inputSettings.funnel.chart_type.value;
    const flag_two_sigma: boolean = this.inputSettings.outliers.two_sigma.value;
    const flag_three_sigma: boolean = this.inputSettings.outliers.three_sigma.value;
    const flag_direction: string = this.inputSettings.outliers.flag_direction.value;
    const two_sigma_colour: string = this.inputSettings.outliers.two_sigma_colour.value;
    const three_sigma_colour: string = this.inputSettings.outliers.three_sigma_colour.value;

    for (let i: number = 0; i < this.inputData.id.length; i++) {
      const original_index: number = this.inputData.id[i];
      const numerator: number = this.inputData.numerator[i];
      const denominator: number = this.inputData.denominator[i];
      const ratio: number = (numerator / denominator);
      const limits_impl: limitData[] = this.calculatedLimits.filter(d => d.denominator === denominator && d.ll99 !== null && d.ul99 !== null);
      const limits: limitData = limits_impl.length > 0 ? limits_impl[0] : this.calculatedLimits.filter(d => d.denominator === denominator)[0];
      const aesthetics: SettingsBaseTypedT<scatterSettings> = this.inputData.scatter_formatting[i]
      const two_sigma_outlier: boolean = flag_two_sigma ? two_sigma(ratio, flag_direction, limits) : false;
      const three_sigma_outlier: boolean = flag_three_sigma ? three_sigma(ratio, flag_direction, limits) : false;
      const category: string = (typeof this.inputData.categories.values[original_index] === "number") ?
                              (this.inputData.categories.values[original_index]).toString() :
                              <string>(this.inputData.categories.values[original_index]);
      if (two_sigma_outlier) {
        aesthetics.colour = two_sigma_colour;
      }

      if (three_sigma_outlier) {
        aesthetics.colour = three_sigma_colour
      }

      plotPoints.push({
        x: denominator,
        value: transform(ratio * multiplier),
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
          two_sigma_outlier: two_sigma_outlier,
          three_sigma_outlier: three_sigma_outlier,
          sig_figs: this.inputSettings.funnel.sig_figs.value
        })
      })
    }
    return plotPoints;
  }

  getGroupedLines(): [string, lineData[]][] {
    const multiplier: number = this.inputSettings.funnel.multiplier.value;
    const transform: (x: number) => number = getTransformation(this.inputSettings.funnel.transformation.value);

    const target: number = this.chartBase.getTarget({ transformed: false });
    const alt_target: number = this.inputSettings.funnel.alt_target.value;

    const labels: string[] = ["ll99", "ll95", "ul95", "ul99", "target", "alt_target"];

    const formattedLines: lineData[] = new Array<lineData>();
    this.calculatedLimits.forEach(limits => {
      limits.target = target;
      limits.alt_target = alt_target;
      labels.forEach(label => {
          formattedLines.push({
            x: limits.denominator,
            line_value: limits[label] ? transform(limits[label] * multiplier) : null,
            group: label
          })
      })
    })
    return d3.groups(formattedLines, d => d.group);
  }

  update(args: { options: VisualUpdateOptions;
                  host: IVisualHost; }) {
    if (this.firstRun) {
      this.inputSettings = new settingsClass();
    }
    this.inputSettings.update(args.options.dataViews[0]);

    if (checkInvalidDataView(args.options.dataViews)) {
      this.inputData = <dataClass>null;
      this.chartBase = null;
      this.calculatedLimits = null;
      this.plotPoints = new Array<plotData>();
      this.groupedLines = new Array<[string, lineData[]]>();
    } else {
      const dv: powerbi.DataView[] = args.options.dataViews;
      const chart_type: string = this.inputSettings.funnel.chart_type.value

      this.inputData = new dataClass(dv[0].categorical, this.inputSettings);

      this.chartBase = new chartObjects[chart_type as keyof typeof chartObjects]({ inputData: this.inputData,
                                                      inputSettings: this.inputSettings });

      this.calculatedLimits = this.chartBase.getLimits();

      this.plotPoints = this.getScatterData(args.host);
      this.groupedLines = this.getGroupedLines();
    }

    if (this.firstRun) {
      this.plotProperties = new plotPropertiesClass();
    }
    this.plotProperties.update({
      options: args.options,
      plotPoints: this.plotPoints,
      calculatedLimits: this.calculatedLimits,
      inputData: this.inputData,
      inputSettings: this.inputSettings
    })
    this.firstRun = false;
  }

  constructor() {
    this.inputData = <dataClass>null;
    this.inputSettings = <settingsClass>null;
    this.chartBase = null;
    this.calculatedLimits = null;
    this.plotPoints = new Array<plotData>();
    this.groupedLines = new Array<[string, lineData[]]>();
    this.plotProperties = <plotPropertiesClass>null;
    this.firstRun = true
  }
}

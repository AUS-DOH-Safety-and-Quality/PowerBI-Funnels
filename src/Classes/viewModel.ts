import * as d3 from "d3";
import powerbi from "powerbi-visuals-api";
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import chartObject from "./chartObject"
import settingsObject from "./settingsObject";
import checkInvalidDataView from "../Functions/checkInvalidDataView"
import initialiseChartObject from "../Chart Types/initialiseChartObject"
import dataObject from "./dataObject";
import limitData from "./limitData";
import lineData from "./lineData"
import axisLimits from "./axisLimits"
import plotData from "./plotData"
import getTransformation from "../Funnel Calculations/getTransformation";
import two_sigma from "../Outlier Flagging/two_sigma"
import three_sigma from "../Outlier Flagging/three_sigma"
import buildTooltip from "../Functions/buildTooltip"

class viewModelObject {
  inputData: dataObject;
  inputSettings: settingsObject;
  chartBase: chartObject;
  calculatedLimits: limitData[];
  scatterDots: plotData[];
  groupedLines: [string, lineData[]][];
  axisLimits: axisLimits;
  anyHighlights: boolean;

  getScatterData(host: IVisualHost): plotData[] {
    let plotPoints = new Array<plotData>();
    let transform_text: string = this.inputSettings.funnel.transformation.value;
    let transform: (x: number) => number = getTransformation(transform_text);
    let target: number = this.chartBase.getTarget({ transformed: false });
    let multiplier: number = this.inputData.multiplier;
    let data_type: string = this.inputData.data_type;
    let flag_two_sigma: boolean = this.inputSettings.outliers.two_sigma.value;
    let flag_three_sigma: boolean = this.inputSettings.outliers.three_sigma.value;
    let flag_direction: string = this.inputData.flag_direction;
    let two_sigma_colour: string = this.inputSettings.outliers.two_sigma_colour.value;
    let three_sigma_colour: string = this.inputSettings.outliers.three_sigma_colour.value;

    for (let i: number = 0; i < this.inputData.id.length; i++) {
      let numerator: number = this.inputData.numerator[i];
      let denominator: number = this.inputData.denominator[i];
      let ratio: number = (numerator / denominator);
      let limits_impl: limitData[] = this.calculatedLimits.filter(d => d.denominator === denominator && d.ll99 !== null && d.ul99 !== null);
      let limits: limitData = limits_impl.length > 0 ? limits_impl[0] : this.calculatedLimits.filter(d => d.denominator === denominator)[0];
      let dot_colour: string = this.inputSettings.scatter.colour.value;
      let two_sigma_outlier: boolean = flag_two_sigma ? two_sigma(ratio, flag_direction, limits) : false;
      let three_sigma_outlier: boolean = flag_three_sigma ? three_sigma(ratio, flag_direction, limits) : false;
      let category: string = (typeof this.inputData.categories.values[i] === "number") ?
                              (this.inputData.categories.values[i]).toString() :
                              <string>(this.inputData.categories.values[i]);
      if (two_sigma_outlier) {
        dot_colour = two_sigma_colour;
      }

      if (three_sigma_outlier) {
        dot_colour = three_sigma_colour
      }

      plotPoints.push({
        x: denominator,
        value: transform(ratio * multiplier),
        colour: dot_colour,
        identity: host.createSelectionIdBuilder()
                      .withCategory(this.inputData.categories, this.inputData.id[i])
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
          three_sigma_outlier: three_sigma_outlier
        })
      })
    }
    return plotPoints;
  };

  getGroupedLines(): [string, lineData[]][] {
    let multiplier: number = this.inputData.multiplier;
    let transform: (x: number) => number = getTransformation(this.inputSettings.funnel.transformation.value);

    let target: number = this.chartBase.getTarget({ transformed: false });
    let alt_target: number = this.inputSettings.funnel.alt_target.value;

    let labels: string[] = ["ll99", "ll95", "ul95", "ul99", "target", "alt_target"];

    let formattedLines: lineData[] = new Array<lineData>();
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

  constructor(args: { options: VisualUpdateOptions;
                      inputSettings: settingsObject;
                      host: IVisualHost; }) {
    let dv: powerbi.DataView[] = args.options.dataViews;
    if (checkInvalidDataView(dv)) {
      this.inputData = <dataObject>null;
      this.inputSettings = args.inputSettings;
      this.chartBase = null;
      this.calculatedLimits = null;
      this.scatterDots = <plotData[]>null;
      this.groupedLines = <[string, lineData[]][]>null;
      this.axisLimits = null;
      this.anyHighlights = null;
      return;
    }

    this.inputData = new dataObject(dv[0].categorical, args.inputSettings);
    console.log("Updated data")

    this.inputSettings = args.inputSettings;

    this.anyHighlights = this.inputData.highlights ? true : false;

    this.chartBase = initialiseChartObject({ inputData: this.inputData,
                                             inputSettings: this.inputSettings });
    console.log("Initialised chart")

    this.calculatedLimits = this.chartBase.getLimits();
    console.log("Calculated limits")

    this.axisLimits = new axisLimits({ inputData: this.inputData,
                                       inputSettings: this.inputSettings,
                                       calculatedLimits: this.calculatedLimits });
    console.log("Initialised axis limits")

    this.scatterDots = this.getScatterData(args.host);
    console.log("Initialised scatter data")

    this.groupedLines = this.getGroupedLines();
    console.log("Grouped lines")
  }
};

export default viewModelObject;

import * as d3 from "d3";
import powerbi from "powerbi-visuals-api";
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import chartObject from "./chartObject"
import settingsObject from "./settingsObject";
import extractInputData from "../Data Preparation/extractInputData";
import checkInvalidDataView from "../Data Preparation/checkInvalidDataView"
import initialiseChartObject from "../Chart Types/initialiseChartObject"
import dataArray from "./dataArray";
import limitData from "./limitData";
import lineData from "./lineData"
import axisLimits from "./axisLimits"
import scatterDotsObject from "./scatterDotsObject"

type nestReturnT = {
  key: string;
  values: any;
  value: undefined;
}

class viewModelObject {
  inputData: dataArray;
  inputSettings: settingsObject;
  chartBase: chartObject;
  calculatedLimits: limitData[];
  scatterDots: scatterDotsObject[];
  groupedLines: nestReturnT[];
  axisLimits: axisLimits;
  anyHighlights: boolean;

  getScatterData(): scatterDotsObject[] {
    return this.inputData.id.map((i, idx) => {
      let colour: string = this.inputData.dot_colour.length == 1 ?
        this.inputData.dot_colour[0] :
        this.inputData.dot_colour[idx];
      let denominator: number = this.inputData.denominator[idx];
      let limits: limitData = this.calculatedLimits.filter(d => d.denominator === denominator)[0];

      return new scatterDotsObject({
        category: (typeof this.inputData.categories.values[i] === "number") ?
                    (this.inputData.categories.values[i]).toString() :
                    <string>(this.inputData.categories.values[i]),
        numerator: this.inputData.numerator[idx],
        denominator: denominator,
        limits: limits,
        colour: colour,
        highlighted: this.inputData.highlights ? (this.inputData.highlights[i] ? true : false) : false,
        data_type: this.inputData.data_type,
        multiplier: this.inputData.multiplier,
        target: this.chartBase.getTarget({ transformed: false }),
        transform_text: this.inputData.transform_text,
        transform: this.inputData.transform,
        prop_labels: this.inputData.prop_labels
      });
    });
  };

  getGroupedLines(): nestReturnT[] {
    let multiplier: number = this.inputData.multiplier;
    let transform: (x: number) => number = this.inputData.transform;

    let target: number = this.chartBase.getTarget({ transformed: false });
    let alt_target: number = this.inputSettings.funnel.alt_target.value;
    let colours = {
      l99: this.inputSettings.lines.colour_99.value,
      l95: this.inputSettings.lines.colour_95.value,
      u95: this.inputSettings.lines.colour_95.value,
      u99: this.inputSettings.lines.colour_99.value,
      target: this.inputSettings.lines.colour_target.value,
      alt_target: this.inputSettings.lines.colour_alt_target.value
    }
    let widths = {
      l99: this.inputSettings.lines.width_99.value,
      l95: this.inputSettings.lines.width_95.value,
      u95: this.inputSettings.lines.width_95.value,
      u99: this.inputSettings.lines.width_99.value,
      target: this.inputSettings.lines.width_target.value,
      alt_target: this.inputSettings.lines.width_alt_target.value
    }

    let labels: string[] = ["ll99", "ll95", "ul95", "ul99", "target", "alt_target"];

    let formattedLines: lineData[] = new Array<lineData>();
    this.calculatedLimits.forEach(limits => {
      limits.target = target;
      limits.alt_target = alt_target;
      labels.forEach(label => {
        formattedLines.push({
          x: limits.denominator,
          group: label,
          line_value: transform(limits[label] * multiplier),
          colour: colours[label],
          width: widths[label]
        });
      })
    })
    return d3.nest()
              .key(function(d: lineData) { return d.group; })
              .entries(formattedLines)
  }

  constructor(args: { options: VisualUpdateOptions;
                      inputSettings: settingsObject;
                      host: IVisualHost; }) {
    let dv: powerbi.DataView[] = args.options.dataViews;
    if (checkInvalidDataView(dv)) {
      this.inputData = new dataArray({});
      this.inputSettings = args.inputSettings;
      this.chartBase = null;
      this.calculatedLimits = null;
      this.scatterDots = [new scatterDotsObject({ empty: true })];
      this.groupedLines = [{ key: null, value: null, values: new lineData() }];
      this.axisLimits = null;
      this.anyHighlights = null;
      return;
    }

    this.inputData = extractInputData(dv[0].categorical,
                                      args.inputSettings);

    this.inputSettings = args.inputSettings;

    this.anyHighlights = this.inputData.highlights ? true : false;

    this.chartBase = initialiseChartObject({ inputData: this.inputData,
                                             inputSettings: this.inputSettings });

    this.calculatedLimits = this.chartBase.getLimits();

    this.axisLimits = new axisLimits({ inputData: this.inputData,
                                       inputSettings: this.inputSettings,
                                       calculatedLimits: this.calculatedLimits });

    this.scatterDots = this.getScatterData();
    this.scatterDots.forEach((scatter, idx) => {
      scatter.identity = args.host
                              .createSelectionIdBuilder()
                              .withCategory(this.inputData.categories,
                                            this.inputData.id[idx])
                              .createSelectionId()
    });

    this.groupedLines = this.getGroupedLines();
  }
};

export default viewModelObject;

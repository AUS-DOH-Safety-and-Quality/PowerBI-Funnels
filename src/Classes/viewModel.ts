import * as d3 from "d3";
import powerbi from "powerbi-visuals-api";
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import chartObject from "./chartObject"
import settingsObject from "./settingsObject";
import extractInputData from "../Data Preparation/extractInputData";
import checkInvalidDataView from "../Data Preparation/checkInvalidDataView"
import initialiseChartObject from "../Chart Types/initialiseChartObject"
import { dataArray, limitData, lineData, axisLimits, nestReturnT } from "./Interfaces"
import { scatterDotsObject } from "./scatterDotsObject"

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

      return new scatterDotsObject({
        category: (typeof this.inputData.categories.values[i] === "number") ?
                    (this.inputData.categories.values[i]).toString() :
                    <string>(this.inputData.categories.values[i]),
        numerator: this.inputData.numerator[idx],
        denominator: this.inputData.denominator[idx],
        limits: this.calculatedLimits[idx],
        colour: colour,
        highlighted: this.inputData.highlights ? (this.inputData.highlights[i] ? true : false) : false,
        data_type: this.inputData.data_type,
        multiplier: this.inputData.multiplier,
        target: this.chartBase.getTarget({ transformed: false }),
        transform_text: this.inputData.transform_text,
        transform: this.inputData.transform
      });
    });
  };

  getFormattedLines(): lineData[] {
    let formattedLines: lineData[];
    this.calculatedLimits.forEach(limits => {
      formattedLines.push({
        x: limits.denominator,
        group: "ll99",
        line_value: limits.ll99,
        colour: this.inputSettings.lines.colour_99.value,
        width: this.inputSettings.lines.width_99.value
      });
      formattedLines.push({
        x: limits.denominator,
        group: "ll95",
        line_value: limits.ll95,
        colour: this.inputSettings.lines.colour_95.value,
        width: this.inputSettings.lines.width_95.value
      });
      formattedLines.push({
        x: limits.denominator,
        group: "ul95",
        line_value: limits.ul95,
        colour: this.inputSettings.lines.colour_95.value,
        width: this.inputSettings.lines.width_95.value
      });
      formattedLines.push({
        x: limits.denominator,
        group: "ul99",
        line_value: limits.ul99,
        colour: this.inputSettings.lines.colour_99.value,
        width: this.inputSettings.lines.width_99.value
      });
      formattedLines.push({
        x: limits.denominator,
        group: "target",
        line_value: this.chartBase.getTarget({ transformed: false }),
        colour: this.inputSettings.lines.colour_target.value,
        width: this.inputSettings.lines.width_target.value
      });
      formattedLines.push({
        x: limits.denominator,
        group: "alt_target",
        line_value: this.inputSettings.funnel.alt_target.value,
        colour: this.inputSettings.lines.colour_alt_target.value,
        width: this.inputSettings.lines.width_alt_target.value
      });
    })

    return formattedLines;
  };

  getGroupedLines(): nestReturnT[] {
    let formattedLines: lineData[] =
      this.getFormattedLines()
          .filter(d => {
            d.x >= this.axisLimits.x.lower &&
            d.x <= this.axisLimits.x.upper &&
            d.line_value >= this.axisLimits.y.lower &&
            d.line_value <= this.axisLimits.y.upper
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
      return;
    }

    this.inputData = extractInputData(dv[0].categorical,
                                      args.inputSettings);
    this.inputSettings = args.inputSettings;
    this.anyHighlights = this.inputData.highlights.length > 0;

    this.chartBase = initialiseChartObject(this.inputData);
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

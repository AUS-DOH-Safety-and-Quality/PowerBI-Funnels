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
import scatterDotsObject from "./scatterDotsObject"
import getTransformation from "../Funnel Calculations/getTransformation";

type nestReturnT = {
  key: string;
  values: any;
  value: undefined;
}

class viewModelObject {
  inputData: dataObject;
  inputSettings: settingsObject;
  chartBase: chartObject;
  calculatedLimits: limitData[];
  scatterDots: scatterDotsObject[];
  groupedLines: [string, lineData[]][];
  axisLimits: axisLimits;
  anyHighlights: boolean;

  getScatterData(): scatterDotsObject[] {
    return this.inputData.id.map((i, idx) => {
      let colour: string = this.inputSettings.scatter.colour.value
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
        transform_text: this.inputSettings.funnel.transformation.value,
        transform: getTransformation(this.inputSettings.funnel.transformation.value)
      });
    });
  };

  getGroupedLines(): [string, lineData[]][] {
    let multiplier: number = this.inputData.multiplier;
    let transform: (x: number) => number = getTransformation(this.inputSettings.funnel.transformation.value);

    let target: number = this.chartBase.getTarget({ transformed: false });
    let alt_target: number = this.inputSettings.funnel.alt_target.value;
    let colours = {
      ll99: this.inputSettings.lines.colour_99.value,
      ll95: this.inputSettings.lines.colour_95.value,
      ul95: this.inputSettings.lines.colour_95.value,
      ul99: this.inputSettings.lines.colour_99.value,
      target: this.inputSettings.lines.colour_target.value,
      alt_target: this.inputSettings.lines.colour_alt_target.value
    }
    let widths = {
      ll99: this.inputSettings.lines.width_99.value,
      ll95: this.inputSettings.lines.width_95.value,
      ul95: this.inputSettings.lines.width_95.value,
      ul99: this.inputSettings.lines.width_99.value,
      target: this.inputSettings.lines.width_target.value,
      alt_target: this.inputSettings.lines.width_alt_target.value
    }

    let labels: string[] = ["ll99", "ll95", "ul95", "ul99", "target", "alt_target"];

    let formattedLines: lineData[] = new Array<lineData>();
    this.calculatedLimits.forEach(limits => {
      limits.target = target;
      limits.alt_target = alt_target;
      labels.forEach(label => {
        if(!(limits[label] === null)) {
          formattedLines.push({
            x: limits.denominator,
            group: label,
            line_value: transform(limits[label] * multiplier),
            colour: colours[label],
            width: widths[label]
          });
        }
      })
    })
    let grouped = d3.groups(formattedLines, d => d.group);
    console.log("grouped: ", grouped)
    return grouped;
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
      this.scatterDots = [new scatterDotsObject({ empty: true })];
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

    this.scatterDots = this.getScatterData();
    console.log("Initialised scatter data")
    this.scatterDots.forEach((scatter, idx) => {
      scatter.identity = args.host
                              .createSelectionIdBuilder()
                              .withCategory(this.inputData.categories,
                                            this.inputData.id[idx])
                              .createSelectionId()
    });
    console.log("Initialised scatter identities")

    this.groupedLines = this.getGroupedLines();
    console.log("Grouped lines")
  }
};

export default viewModelObject;

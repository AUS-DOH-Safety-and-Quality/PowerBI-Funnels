import * as d3 from "d3";
import powerbi from "powerbi-visuals-api";
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import plotData from "./plotData";
import limitData from "./limitData";
import dataObject from "./dataObject";
import settingsObject from "./settingsObject";
import { divide } from "../Functions/BinaryFunctions";

type axisProperties = {
  lower: number,
  upper: number,
  start_padding: number,
  end_padding: number,
  colour: string,
  ticks: boolean,
  tick_size: string,
  tick_font: string,
  tick_colour: string,
  tick_count: number,
  label: string,
  label_size: string,
  label_font: string,
  label_colour: string
};

class plotPropertiesClass {
  width: number;
  height: number;
  displayPlot: boolean;
  xAxis: axisProperties;
  yAxis: axisProperties;
  xScale: d3.ScaleLinear<number, number, never>;
  yScale: d3.ScaleLinear<number, number, never>;

  // Separate function so that the axis can be re-calculated on changes to padding
  initialiseScale() {
    this.xScale = d3.scaleLinear()
                    .domain([this.xAxis.lower, this.xAxis.upper])
                    .range([this.xAxis.start_padding,
                            this.width - this.xAxis.end_padding]);

    this.yScale = d3.scaleLinear()
                            .domain([this.yAxis.lower, this.yAxis.upper])
                            .range([this.height - this.yAxis.end_padding,
                                    this.yAxis.start_padding]);
  }

  update(args: { options: VisualUpdateOptions,
                  plotPoints: plotData[],
                  calculatedLimits: limitData[],
                  inputData: dataObject,
                  inputSettings: settingsObject }) {

    // Get the width and height of plotting space
    this.width = args.options.viewport.width;
    this.height = args.options.viewport.height;
    this.displayPlot = args.plotPoints
      ? args.plotPoints.length > 1
      : null;


    // Axis & label padding is based on the browser default font size of 16px,
    //    so need to scale accordingly if a different font size is used
    let browserFontSize: number = Number(window.getComputedStyle(document.body).getPropertyValue('font-size').match(/\d+/)[0]);
    let fontScaling: number = browserFontSize / 16;

    // Map the default pixel sizes for each text label, based on browser default so scaled
    // https://careerkarma.com/blog/css-font-size/
    let fontSizeMap = {
      "xx-small" : 9 * fontScaling,
      "x-small" : 10 * fontScaling,
      "small" : 13 * fontScaling,
      "medium" : 16 * fontScaling,
      "large" : 18 * fontScaling,
      "x-large" : 24 * fontScaling,
      "xx-large" : 32 * fontScaling
    };

    // Only scale padding for label if a label is actually present
    let xLabelSize: string = args.inputSettings.x_axis.xlimit_label_size.value;
    let xLabelPadding: number = args.inputSettings.x_axis.xlimit_label.value ? fontSizeMap[xLabelSize] : 0;
    let yLabelSize: string = args.inputSettings.y_axis.ylimit_label_size.value;
    let yLabelPadding: number = args.inputSettings.y_axis.ylimit_label.value ? fontSizeMap[yLabelSize] : 0;

    let xTickSize: string = args.inputSettings.x_axis.xlimit_tick_size.value;
    let yTickSize: string = args.inputSettings.y_axis.ylimit_tick_size.value;
    let xTicksCount: number = args.inputSettings.x_axis.xlimit_tick_count.value;
    let yTicksCount: number = args.inputSettings.y_axis.ylimit_tick_count.value;

    let xLowerLimit: number = args.inputSettings.x_axis.xlimit_l.value;
    let xUpperLimit: number = args.inputSettings.x_axis.xlimit_u.value;

    if (args.inputData) {
      xUpperLimit = xUpperLimit ? xUpperLimit : d3.max(args.inputData.denominator) * 1.1;
    }

    this.xAxis = {
      lower: xLowerLimit ? xLowerLimit : 0,
      upper: xUpperLimit,
      start_padding: args.inputSettings.canvas.left_padding.value + fontSizeMap[xTickSize] + xLabelPadding,
      end_padding: args.inputSettings.canvas.right_padding.value,
      colour: args.inputSettings.x_axis.xlimit_colour.value,
      ticks: (xTicksCount !== null) ? (xTicksCount > 0) : args.inputSettings.x_axis.xlimit_ticks.value,
      tick_size: xTickSize,
      tick_font: args.inputSettings.x_axis.xlimit_tick_font.value,
      tick_colour: args.inputSettings.x_axis.xlimit_tick_colour.value,
      tick_count: args.inputSettings.x_axis.xlimit_tick_count.value,
      label: args.inputSettings.x_axis.xlimit_label.value,
      label_size: args.inputSettings.x_axis.xlimit_label_size.value,
      label_font: args.inputSettings.x_axis.xlimit_label_font.value,
      label_colour: args.inputSettings.x_axis.xlimit_label_colour.value
    };

    let yLowerLimit: number = args.inputSettings.y_axis.ylimit_l.value;
    let yUpperLimit: number = args.inputSettings.y_axis.ylimit_u.value;

    if (args.inputData) {
      let multiplier: number = args.inputSettings.funnel.multiplier.value
      let maxRatio: number = d3.max(divide(args.inputData.numerator, args.inputData.denominator));
      yUpperLimit = yUpperLimit ? yUpperLimit : maxRatio * multiplier
    }

    this.yAxis = {
      lower: yLowerLimit ? yLowerLimit : 0,
      upper: yUpperLimit,
      start_padding: args.inputSettings.canvas.upper_padding.value,
      end_padding: args.inputSettings.canvas.lower_padding.value + fontSizeMap[yTickSize] + yLabelPadding,
      colour: args.inputSettings.y_axis.ylimit_colour.value,
      ticks: (yTicksCount !== null) ? (yTicksCount > 0) : args.inputSettings.y_axis.ylimit_ticks.value,
      tick_size: yTickSize,
      tick_font: args.inputSettings.y_axis.ylimit_tick_font.value,
      tick_colour: args.inputSettings.y_axis.ylimit_tick_colour.value,
      tick_count: args.inputSettings.y_axis.ylimit_tick_count.value,
      label: args.inputSettings.y_axis.ylimit_label.value,
      label_size: args.inputSettings.y_axis.ylimit_label_size.value,
      label_font: args.inputSettings.y_axis.ylimit_label_font.value,
      label_colour: args.inputSettings.y_axis.ylimit_label_colour.value
    };
    this.initialiseScale();
  }
}

export default plotPropertiesClass
export { axisProperties }

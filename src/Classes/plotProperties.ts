import * as d3 from "../D3 Plotting Functions/D3 Modules";
import type powerbi from "powerbi-visuals-api";
type VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import plotData from "./plotData";
import limitData from "./limitData";
import dataObject from "./dataObject";
import settingsObject from "./settingsObject";
import { divide, max } from "../Functions/";

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
    const browserFontSize: number = Number(window.getComputedStyle(document.body).getPropertyValue('font-size').match(/\d+/)[0]);
    const fontScaling: number = browserFontSize / 16;

    // Map the default pixel sizes for each text label, based on browser default so scaled
    // https://careerkarma.com/blog/css-font-size/
    const fontSizeMap: Record<string, number> = {
      "xx-small" : 9 * fontScaling,
      "x-small" : 10 * fontScaling,
      "small" : 13 * fontScaling,
      "medium" : 16 * fontScaling,
      "large" : 18 * fontScaling,
      "x-large" : 24 * fontScaling,
      "xx-large" : 32 * fontScaling
    };

    // Only scale padding for label if a label is actually present
    const xLabelSize: string = args.inputSettings.x_axis.xlimit_label_size.value;
    const xLabelPadding: number = args.inputSettings.x_axis.xlimit_label.value ? fontSizeMap[xLabelSize] : 0;
    const yLabelSize: string = args.inputSettings.y_axis.ylimit_label_size.value;
    const yLabelPadding: number = args.inputSettings.y_axis.ylimit_label.value ? fontSizeMap[yLabelSize] : 0;

    const xTickSize: string = args.inputSettings.x_axis.xlimit_tick_size.value;
    const yTickSize: string = args.inputSettings.y_axis.ylimit_tick_size.value;
    const xTicksCount: number = args.inputSettings.x_axis.xlimit_tick_count.value;
    const yTicksCount: number = args.inputSettings.y_axis.ylimit_tick_count.value;

    const xLowerLimit: number = args.inputSettings.x_axis.xlimit_l.value;
    let xUpperLimit: number = args.inputSettings.x_axis.xlimit_u.value;

    if (args.inputData) {
      xUpperLimit = xUpperLimit ? xUpperLimit : max(args.inputData.denominator) * 1.1;
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

    const yLowerLimit: number = args.inputSettings.y_axis.ylimit_l.value;
    let yUpperLimit: number = args.inputSettings.y_axis.ylimit_u.value;

    if (args.inputData) {
      const multiplier: number = args.inputSettings.funnel.multiplier.value
      const maxRatio: number = max(divide(args.inputData.numerator, args.inputData.denominator));
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

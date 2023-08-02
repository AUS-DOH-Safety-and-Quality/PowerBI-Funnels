import * as d3 from "../D3 Plotting Functions/D3 Modules";
import type powerbi from "powerbi-visuals-api";
type VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import type { plotData, limitData, dataClass, defaultSettingsType } from "../Classes";
import { divide, max } from "../Functions";

export type axisProperties = {
  lower: number,
  upper: number,
  start_padding: number,
  end_padding: number,
  colour: string,
  ticks: boolean,
  tick_size: string,
  tick_font: string,
  tick_colour: string,
  tick_rotation: number,
  tick_count: number,
  label: string,
  label_size: string,
  label_font: string,
  label_colour: string
};

export default class plotPropertiesClass {
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
                            .range([this.height - this.yAxis.start_padding,
                                    this.yAxis.end_padding]);
  }

  update(args: { options: VisualUpdateOptions,
                  plotPoints: plotData[],
                  calculatedLimits: limitData[],
                  inputData: dataClass,
                  inputSettings: defaultSettingsType }) {

    // Get the width and height of plotting space
    this.width = args.options.viewport.width;
    this.height = args.options.viewport.height;
    this.displayPlot = args.plotPoints
      ? args.plotPoints.length > 1
      : null;

    const xTickSize: number = args.inputSettings.x_axis.xlimit_tick_size;
    const yTickSize: number = args.inputSettings.y_axis.ylimit_tick_size;
    const xTicksCount: number = args.inputSettings.x_axis.xlimit_tick_count;
    const yTicksCount: number = args.inputSettings.y_axis.ylimit_tick_count;

    const xLowerLimit: number = args.inputSettings.x_axis.xlimit_l;
    let xUpperLimit: number = args.inputSettings.x_axis.xlimit_u;

    if (args.inputData) {
      xUpperLimit = xUpperLimit ? xUpperLimit : max(args.inputData.denominator) * 1.1;
    }

    this.xAxis = {
      lower: xLowerLimit ? xLowerLimit : 0,
      upper: xUpperLimit,
      start_padding: args.inputSettings.canvas.left_padding,
      end_padding: args.inputSettings.canvas.right_padding,
      colour: args.inputSettings.x_axis.xlimit_colour,
      ticks: (xTicksCount !== null) ? (xTicksCount > 0) : args.inputSettings.x_axis.xlimit_ticks,
      tick_size: `${xTickSize}px`,
      tick_font: args.inputSettings.x_axis.xlimit_tick_font,
      tick_colour: args.inputSettings.x_axis.xlimit_tick_colour,
      tick_rotation: args.inputSettings.x_axis.xlimit_tick_rotation,
      tick_count: args.inputSettings.x_axis.xlimit_tick_count,
      label: args.inputSettings.x_axis.xlimit_label,
      label_size: `${args.inputSettings.x_axis.xlimit_label_size}px`,
      label_font: args.inputSettings.x_axis.xlimit_label_font,
      label_colour: args.inputSettings.x_axis.xlimit_label_colour
    };

    const yLowerLimit: number = args.inputSettings.y_axis.ylimit_l;
    let yUpperLimit: number = args.inputSettings.y_axis.ylimit_u;

    if (args.inputData) {
      const multiplier: number = args.inputSettings.funnel.multiplier
      const maxRatio: number = max(divide(args.inputData.numerator, args.inputData.denominator));
      yUpperLimit = yUpperLimit ? yUpperLimit : maxRatio * multiplier
    }

    this.yAxis = {
      lower: yLowerLimit ? yLowerLimit : 0,
      upper: yUpperLimit,
      start_padding: args.inputSettings.canvas.lower_padding,
      end_padding: args.inputSettings.canvas.upper_padding,
      colour: args.inputSettings.y_axis.ylimit_colour,
      ticks: (yTicksCount !== null) ? (yTicksCount > 0) : args.inputSettings.y_axis.ylimit_ticks,
      tick_size: `${yTickSize}px`,
      tick_font: args.inputSettings.y_axis.ylimit_tick_font,
      tick_colour: args.inputSettings.y_axis.ylimit_tick_colour,
      tick_rotation: args.inputSettings.y_axis.ylimit_tick_rotation,
      tick_count: args.inputSettings.y_axis.ylimit_tick_count,
      label: args.inputSettings.y_axis.ylimit_label,
      label_size: `${args.inputSettings.y_axis.ylimit_label_size}px`,
      label_font: args.inputSettings.y_axis.ylimit_label_font,
      label_colour: args.inputSettings.y_axis.ylimit_label_colour
    };
    this.initialiseScale();
  }
}

import * as d3 from "../D3 Plotting Functions/D3 Modules";
import type powerbi from "powerbi-visuals-api";
type VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import type { plotData, defaultSettingsType, derivedSettingsClass } from "../Classes";
import { divide, max, type dataObject } from "../Functions";

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

  update(options: VisualUpdateOptions,
        plotPoints: plotData[],
        inputData: dataObject,
        inputSettings: defaultSettingsType,
        derivedSettings: derivedSettingsClass) {

    // Get the width and height of plotting space
    this.width = options.viewport.width;
    this.height = options.viewport.height;
    this.displayPlot = plotPoints
      ? plotPoints.length > 1
      : null;

    const xTickSize: number = inputSettings.x_axis.xlimit_tick_size;
    const yTickSize: number = inputSettings.y_axis.ylimit_tick_size;
    const xTicksCount: number = inputSettings.x_axis.xlimit_tick_count;
    const yTicksCount: number = inputSettings.y_axis.ylimit_tick_count;

    const xLowerLimit: number = inputSettings.x_axis.xlimit_l;
    let xUpperLimit: number = inputSettings.x_axis.xlimit_u;

    if (inputData) {
      xUpperLimit = xUpperLimit ? xUpperLimit : max(inputData.denominators) * 1.1;
    }

    this.xAxis = {
      lower: xLowerLimit ?? 0,
      upper: xUpperLimit,
      start_padding: inputSettings.canvas.left_padding,
      end_padding: inputSettings.canvas.right_padding,
      colour: inputSettings.x_axis.xlimit_colour,
      ticks: (xTicksCount !== null) ? (xTicksCount > 0) : inputSettings.x_axis.xlimit_ticks,
      tick_size: `${xTickSize}px`,
      tick_font: inputSettings.x_axis.xlimit_tick_font,
      tick_colour: inputSettings.x_axis.xlimit_tick_colour,
      tick_rotation: inputSettings.x_axis.xlimit_tick_rotation,
      tick_count: inputSettings.x_axis.xlimit_tick_count,
      label: inputSettings.x_axis.xlimit_label,
      label_size: `${inputSettings.x_axis.xlimit_label_size}px`,
      label_font: inputSettings.x_axis.xlimit_label_font,
      label_colour: inputSettings.x_axis.xlimit_label_colour
    };

    const yLowerLimit: number = inputSettings.y_axis.ylimit_l;
    let yUpperLimit: number = inputSettings.y_axis.ylimit_u;

    if (inputData) {
      const maxRatio: number = max(divide(inputData.numerators, inputData.denominators));
      yUpperLimit ??= maxRatio * derivedSettings.multiplier
    }

    this.yAxis = {
      lower: yLowerLimit ?? 0,
      upper: yUpperLimit,
      start_padding: inputSettings.canvas.lower_padding,
      end_padding: inputSettings.canvas.upper_padding,
      colour: inputSettings.y_axis.ylimit_colour,
      ticks: (yTicksCount !== null) ? (yTicksCount > 0) : inputSettings.y_axis.ylimit_ticks,
      tick_size: `${yTickSize}px`,
      tick_font: inputSettings.y_axis.ylimit_tick_font,
      tick_colour: inputSettings.y_axis.ylimit_tick_colour,
      tick_rotation: inputSettings.y_axis.ylimit_tick_rotation,
      tick_count: inputSettings.y_axis.ylimit_tick_count,
      label: inputSettings.y_axis.ylimit_label,
      label_size: `${inputSettings.y_axis.ylimit_label_size}px`,
      label_font: inputSettings.y_axis.ylimit_label_font,
      label_colour: inputSettings.y_axis.ylimit_label_colour
    };
    this.initialiseScale();
  }
}

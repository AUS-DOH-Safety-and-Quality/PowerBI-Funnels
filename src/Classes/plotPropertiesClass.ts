import type powerbi from "powerbi-visuals-api";
type VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import type { settingsValueType } from "../settings";
import type { plotData, viewModelClass } from "../Classes";
import type { dataObject } from "../Functions/extractInputData";
import { max, scaleLinear, type LinearScale } from "powerbi-visuals-core/math";
import { type colourPaletteType } from "./viewModelClass";
import type { AxisLabelAlign } from "powerbi-visuals-core/rendering";

export type axisProperties = {
  lower: number,
  upper: number,
  start_padding: number,
  end_padding: number,
  colour: string,
  ticks: boolean,
  tick_marks: boolean,
  tick_size: string,
  tick_font: string,
  tick_colour: string,
  tick_rotation: number,
  tick_count: number,
  label: string,
  label_size: string,
  label_font: string,
  label_colour: string,
  label_style: string,
  label_align: AxisLabelAlign,
  grid_show: boolean,
  grid_colour: string,
  grid_width: number
};

export default class plotPropertiesClass {
  width: number;
  height: number;
  displayPlot: boolean;
  xAxis: axisProperties;
  yAxis: axisProperties;
  xScale: LinearScale = scaleLinear();
  yScale: LinearScale = scaleLinear();

  // Separate function so that the axis can be re-calculated on changes to padding
  initialiseScale(svgWidth: number, svgHeight: number): void {
    this.xScale = scaleLinear()
                    .domain([this.xAxis.lower, this.xAxis.upper])
                    .range([this.xAxis.start_padding,
                            svgWidth - this.xAxis.end_padding]);
    this.yScale = scaleLinear()
                    .domain([this.yAxis.lower, this.yAxis.upper])
                    .range([svgHeight - this.yAxis.start_padding,
                            this.yAxis.end_padding]);
  }

  constructor(options: VisualUpdateOptions, viewModel: viewModelClass, inputData: dataObject) {

    const plotPoints: plotData[] = viewModel.plotPoints;
    const inputSettings: settingsValueType = viewModel.inputSettings.settings;
    const colorPalette: colourPaletteType = viewModel.colourPalette;

    // Get the width and height of plotting space
    this.width = options.viewport.width;
    this.height = options.viewport.height;
    this.displayPlot = plotPoints.length > 0;

    const xTickSize: number = inputSettings.x_axis.xlimit_tick_size;
    const yTickSize: number = inputSettings.y_axis.ylimit_tick_size;
    const xTicksCount: number = inputSettings.x_axis.xlimit_tick_count;
    const yTicksCount: number = inputSettings.y_axis.ylimit_tick_count;

    const xLowerLimit = inputSettings.x_axis.xlimit_l;
    const xUpperLimit = inputSettings.x_axis.xlimit_u ?? max(inputData.denominators) * 1.1;
    const leftLabelPadding: number = inputSettings.y_axis.ylimit_label
                                      ? inputSettings.y_axis.ylimit_label_size
                                      : 0;

    const lowerLabelPadding: number = inputSettings.x_axis.xlimit_label
                                      ? inputSettings.x_axis.xlimit_label_size + 20
                                      : 0;
    this.xAxis = {
      lower: xLowerLimit ?? 0,
      upper: xUpperLimit,
      start_padding: inputSettings.canvas.left_padding + leftLabelPadding,
      end_padding: inputSettings.canvas.right_padding,
      colour: colorPalette.isHighContrast ? colorPalette.foregroundColour : inputSettings.x_axis.xlimit_colour,
      ticks: inputSettings.x_axis.xlimit_ticks && xTicksCount !== 0,
      tick_marks: inputSettings.x_axis.xlimit_tick_marks,
      tick_size: `${xTickSize}px`,
      tick_font: inputSettings.x_axis.xlimit_tick_font,
      tick_colour: colorPalette.isHighContrast ? colorPalette.foregroundColour : inputSettings.x_axis.xlimit_tick_colour,
      tick_rotation: inputSettings.x_axis.xlimit_tick_rotation,
      tick_count: inputSettings.x_axis.xlimit_tick_count,
      label: inputSettings.x_axis.xlimit_label,
      label_size: `${inputSettings.x_axis.xlimit_label_size}px`,
      label_font: inputSettings.x_axis.xlimit_label_font,
      label_colour: colorPalette.isHighContrast ? colorPalette.foregroundColour : inputSettings.x_axis.xlimit_label_colour,
      label_style: inputSettings.x_axis.xlimit_label_style,
      label_align: inputSettings.x_axis.xlimit_label_align,
      grid_show: inputSettings.x_axis.xlimit_grid_show,
      grid_colour: colorPalette.isHighContrast ? colorPalette.foregroundColour : inputSettings.x_axis.xlimit_grid_colour,
      grid_width: inputSettings.x_axis.xlimit_grid_width
    };

    const yLowerLimit = inputSettings.y_axis.ylimit_l;
    let yUpperLimit = inputSettings.y_axis.ylimit_u;
    if (yUpperLimit === undefined) {
      // Automatic bound follows the plotted (transformed and scaled) values
      yUpperLimit = -Infinity;
      for (let i = 0; i < plotPoints.length; i++) {
        yUpperLimit = Math.max(yUpperLimit, plotPoints[i].value);
      }
    }

    this.yAxis = {
      lower: yLowerLimit ?? 0,
      upper: yUpperLimit,
      start_padding: inputSettings.canvas.lower_padding + lowerLabelPadding,
      end_padding: inputSettings.canvas.upper_padding,
      colour: colorPalette.isHighContrast ? colorPalette.foregroundColour : inputSettings.y_axis.ylimit_colour,
      ticks: inputSettings.y_axis.ylimit_ticks && yTicksCount !== 0,
      tick_marks: inputSettings.y_axis.ylimit_tick_marks,
      tick_size: `${yTickSize}px`,
      tick_font: inputSettings.y_axis.ylimit_tick_font,
      tick_colour: colorPalette.isHighContrast ? colorPalette.foregroundColour : inputSettings.y_axis.ylimit_tick_colour,
      tick_rotation: inputSettings.y_axis.ylimit_tick_rotation,
      tick_count: inputSettings.y_axis.ylimit_tick_count,
      label: inputSettings.y_axis.ylimit_label,
      label_size: `${inputSettings.y_axis.ylimit_label_size}px`,
      label_font: inputSettings.y_axis.ylimit_label_font,
      label_colour: colorPalette.isHighContrast ? colorPalette.foregroundColour : inputSettings.y_axis.ylimit_label_colour,
      label_style: inputSettings.y_axis.ylimit_label_style,
      label_align: inputSettings.y_axis.ylimit_label_align,
      grid_show: inputSettings.y_axis.ylimit_grid_show,
      grid_colour: colorPalette.isHighContrast ? colorPalette.foregroundColour : inputSettings.y_axis.ylimit_grid_colour,
      grid_width: inputSettings.y_axis.ylimit_grid_width
    };
    this.initialiseScale(options.viewport.width, options.viewport.height);
  }
}

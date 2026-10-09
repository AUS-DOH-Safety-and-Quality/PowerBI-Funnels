import type powerbi from "powerbi-visuals-api";
type VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import type { settingsValueType } from "../settings";
import type { plotData, viewModelClass } from "../Classes";
import type { dataObject } from "../Functions/extractInputData";
import { max, scaleLinear, type LinearScale } from "powerbi-visuals-core/math";
import type { ColourPalette } from "powerbi-visuals-core/powerbi";
import { axisPropertiesFromSettings, type AxisProperties } from "powerbi-visuals-core/rendering";

export default class plotPropertiesClass {
  width: number;
  height: number;
  displayPlot: boolean;
  xAxis: AxisProperties;
  yAxis: AxisProperties;
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
    const colorPalette: ColourPalette = viewModel.colourPalette;

    // Get the width and height of plotting space
    this.width = options.viewport.width;
    this.height = options.viewport.height;
    this.displayPlot = plotPoints.length > 0;

    const xLowerLimit = inputSettings.x_axis.xlimit_l;
    const xUpperLimit = inputSettings.x_axis.xlimit_u ?? max(inputData.denominators) * 1.1;
    const leftLabelPadding: number = inputSettings.y_axis.ylimit_label
                                      ? inputSettings.y_axis.ylimit_label_size
                                      : 0;

    const lowerLabelPadding: number = inputSettings.x_axis.xlimit_label
                                      ? inputSettings.x_axis.xlimit_label_size
                                      : 0;
    this.xAxis = axisPropertiesFromSettings("x", inputSettings.x_axis, colorPalette, {
      lower: xLowerLimit ?? 0,
      upper: xUpperLimit,
      start_padding: inputSettings.canvas.left_padding + leftLabelPadding,
      end_padding: inputSettings.canvas.right_padding
    });

    const yLowerLimit = inputSettings.y_axis.ylimit_l;
    let yUpperLimit = inputSettings.y_axis.ylimit_u;
    if (yUpperLimit === undefined) {
      // Automatic bound follows the plotted (transformed and scaled) values
      yUpperLimit = -Infinity;
      for (let i = 0; i < plotPoints.length; i++) {
        yUpperLimit = Math.max(yUpperLimit, plotPoints[i].value);
      }
    }

    this.yAxis = axisPropertiesFromSettings("y", inputSettings.y_axis, colorPalette, {
      lower: yLowerLimit ?? 0,
      upper: yUpperLimit,
      start_padding: inputSettings.canvas.lower_padding + lowerLabelPadding,
      end_padding: inputSettings.canvas.upper_padding
    });
    this.initialiseScale(options.viewport.width, options.viewport.height);
  }
}

import * as d3 from "d3";
import { divide, multiply } from "../Functions/BinaryFunctions"
import limitData from "./limitData";
import settingsObject from "./settingsObject";
import dataObject from "./dataObject"

class axisLimits {
  x: {
    lower: number,
    upper: number,
    padding: number,
    end_padding: number,
    ticks: boolean,
    tick_size: string,
    tick_font: string,
    label: string,
    label_size: string,
    label_font: string
  };
  y: {
    lower: number,
    upper: number,
    padding: number,
    end_padding: number,
    ticks: boolean,
    tick_size: string,
    tick_font: string,
    label: string,
    label_size: string,
    label_font: string
  }

  constructor(args: { inputData: dataObject,
                      inputSettings: settingsObject,
                      calculatedLimits: limitData[] }) {
    let maxRatio: number = d3.max(divide(args.inputData.numerator,
                                         args.inputData.denominator));
    let multiplier: number = args.inputData.multiplier;

    let xLowerInput: number = args.inputSettings.x_axis.xlimit_l.value;
    let xUpperInput: number = args.inputSettings.x_axis.xlimit_u.value;
    let yLowerInput: number = args.inputData.ylimit_l;
    let yUpperInput: number = args.inputData.ylimit_u;

    // Axis & label padding is based on the browser default font size of 16px,
    //    so need to scale accordingly if a different font size is used
    let browserFontSize: number = Number(window.getComputedStyle(document.body).getPropertyValue('font-size').match(/\d+/)[0]);
    let fontScaling: number = browserFontSize / 16;

    // Map the default pixel sizes for each text label, based on browser default
    //    so scaled
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

    let xPadding: number = args.inputSettings.axispad.x.padding.value;
    let xTickSize: string = args.inputSettings.x_axis.xlimit_tick_size.value;

    let yPadding: number = args.inputSettings.axispad.y.padding.value;
    let yTickSize: string = args.inputSettings.y_axis.ylimit_tick_size.value;

    this.x = {
      lower: xLowerInput ? xLowerInput : 0,
      upper: xUpperInput ? xUpperInput : d3.max(args.inputData.denominator) * 1.1,
      padding: xPadding + fontSizeMap[xTickSize] + xLabelPadding,
      end_padding: args.inputSettings.axispad.x.end_padding.value,
      ticks: args.inputSettings.x_axis.xlimit_ticks.value,
      tick_size: xTickSize,
      tick_font: args.inputSettings.x_axis.xlimit_tick_font.value,
      label: args.inputSettings.x_axis.xlimit_label.value,
      label_size: args.inputSettings.x_axis.xlimit_label_size.value,
      label_font: args.inputSettings.x_axis.xlimit_label_font.value
    };

    this.y = {
      lower: yLowerInput ? yLowerInput : 0,
      upper: yUpperInput ? yUpperInput : maxRatio * multiplier,
      padding: yPadding + fontSizeMap[yTickSize] + yLabelPadding,
      end_padding: args.inputSettings.axispad.y.end_padding.value,
      ticks: args.inputSettings.y_axis.ylimit_ticks.value,
      tick_size: yTickSize,
      tick_font: args.inputSettings.y_axis.ylimit_tick_font.value,
      label: args.inputSettings.y_axis.ylimit_label.value,
      label_size: args.inputSettings.y_axis.ylimit_label_size.value,
      label_font: args.inputSettings.y_axis.ylimit_label_font.value
    };
  }
}

export default axisLimits;

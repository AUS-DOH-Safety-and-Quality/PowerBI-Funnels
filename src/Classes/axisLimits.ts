import * as d3 from "d3";
import { divide } from "../Function Broadcasting/BinaryFunctions"
import limitData from "./limitData";
import settingsObject from "./settingsObject";
import dataArray from "./dataArray"

class axisLimits {
  x: {
    lower: number,
    upper: number,
    padding: number
  };
  y: {
    lower: number,
    upper: number,
    padding: number
  }

  constructor(args: { inputData: dataArray,
                      inputSettings: settingsObject,
                      calculatedLimits: limitData[] }) {
    let maxRatio: number = d3.max(divide(args.inputData.numerator,
                                         args.inputData.denominator));
    let xLowerInput: number = args.inputSettings.axis.xlimit_l.value;
    let xUpperInput: number = args.inputSettings.axis.xlimit_u.value;
    let yLowerInput: number = args.inputSettings.axis.ylimit_l.value;
    let yUpperInput: number = args.inputSettings.axis.ylimit_u.value;
    let multiplier: number = args.inputData.multiplier;

    this.x = {
      lower: xLowerInput ? xLowerInput : 0,
      upper: xUpperInput ? xUpperInput : d3.max(args.inputData.denominator) * 1.1,
      padding: args.inputSettings.axispad.x.padding.value
    };

    this.y = {
      lower: yLowerInput ? yLowerInput : args.inputData.transform(0),
      upper: yUpperInput ? yUpperInput : args.inputData.transform(maxRatio * multiplier),
      padding: args.inputSettings.axispad.y.padding.value
    };
  }
}

export default axisLimits;

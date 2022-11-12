import * as d3 from "d3";
import chartObject from "../Classes/chartObject"
import dataObject from "../Classes/dataObject";
import limitArguments from "../Classes/limitArgs";
import settingsObject from "../Classes/settingsObject";
import winsorise from "../Functions/winsorise";
import { sqrt, inv, asin, square } from "../Functions/UnaryFunctions"
import { multiply, divide } from "../Functions/BinaryFunctions"

let prSE = function(inputData: dataObject): number[] {
  let denominator: number[] = inputData.denominator;
  return inv(multiply(2, sqrt(denominator)));
}

let prTarget = function(inputData: dataObject): number {
  let numerator: number[] = inputData.numerator;
  let denominator: number[] = inputData.denominator;
  return d3.sum(numerator) / d3.sum(denominator);
}

let prTargetTransformed = function(inputData: dataObject): number {
  return Math.asin(Math.sqrt(prTarget(inputData)));
}

let prY = function(inputData: dataObject): number[] {
  let numerator: number[] = inputData.numerator;
  let denominator: number[] = inputData.denominator;
  return asin(sqrt(divide(numerator, denominator)));
}

let prLimit = function(args: limitArguments) {
  let target: number = args.target_transformed;
  let q: number = args.q;
  let SE: number = args.SE;
  let tau2: number = args.tau2;
  let limit_transformed: number = target + q * sqrt(square(SE) + tau2);
  let limit: number = square(Math.sin(limit_transformed));

  return winsorise(limit, {lower: 0, upper: 1})
}

class prFunnelObject extends chartObject {
  constructor(args: { inputData: dataObject,
                      inputSettings: settingsObject }) {
    super({
      seFunction: prSE,
      seFunctionOD: prSE,
      targetFunction: prTarget,
      targetFunctionTransformed: prTargetTransformed,
      yFunction: prY,
      limitFunction: prLimit,
      limitFunctionOD: prLimit,
      inputData: args.inputData,
      inputSettings: args.inputSettings
    });
  }
}

export default prFunnelObject;

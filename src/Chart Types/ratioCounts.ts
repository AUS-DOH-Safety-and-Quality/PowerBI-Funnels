import * as d3 from "d3";
import chartObject from "../Classes/chartObject"
import dataObject from "../Classes/dataObject";
import limitArguments from "../Classes/limitArgs";
import winsorise from "../Functions/winsorise";
import { sqrt, log, exp, square } from "../Functions/UnaryFunctions"
import { add, divide } from "../Functions/BinaryFunctions"
import settingsObject from "../Classes/settingsObject";

let rcSE = function(inputData: dataObject): number[] {
  let numerator: number[] = inputData.numerator ? inputData.numerator : inputData.denominator;
  let denominator: number[] = inputData.denominator;

  return sqrt(
    add(divide(numerator, square(add(numerator, 0.5))),
        divide(denominator, square(add(denominator, 0.5))))
  );
}

let rcTarget = function(inputData: dataObject): number {
  let numerator: number[] = inputData.numerator;
  let denominator: number[] = inputData.denominator;
  return d3.sum(numerator) / d3.sum(denominator);
}

let rcTargetTransformed = function(inputData: dataObject): number {
  let numerator: number[] = inputData.numerator;
  let denominator: number[] = inputData.denominator;
  return log(d3.sum(numerator)) - log(d3.sum(denominator));
}

let rcY = function(inputData: dataObject): number[] {
  let numerator: number[] = inputData.numerator;
  let denominator: number[] = inputData.denominator;
  return log(divide(add(numerator, 0.5), add(denominator, 0.5)));
}

let rcLimit = function(args: limitArguments): number {
  let target: number = args.target_transformed;
  let q: number = args.q;
  let SE: number = args.SE;
  let tau2: number = args.tau2;
  let limit_transformed: number = target + q * sqrt(square(SE) + tau2);
  let limit: number = exp(limit_transformed);

  return winsorise(limit, {lower: 0});
}

class rcFunnelObject extends chartObject {
  constructor(args: { inputData: dataObject,
                      inputSettings: settingsObject }) {
    super({
      seFunction: rcSE,
      seFunctionOD: rcSE,
      targetFunction: rcTarget,
      targetFunctionTransformed: rcTargetTransformed,
      yFunction: rcY,
      limitFunction: rcLimit,
      limitFunctionOD: rcLimit,
      inputData: args.inputData,
      inputSettings: args.inputSettings
    });
  }
}

export default rcFunnelObject;

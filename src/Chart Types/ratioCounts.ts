import * as d3 from "d3";
import chartObject from "../Classes/chartObject"
import dataObject from "../Classes/dataObject";
import limitArguments from "../Classes/limitArgs";
import winsorise from "../Functions/winsorise";
import { sqrt, log, exp, square } from "../Functions/UnaryFunctions"
import { add, divide } from "../Functions/BinaryFunctions"
import settingsObject from "../Classes/settingsObject";

const rcSE = function(inputData: dataObject): number[] {
  const numerator: number[] = inputData.numerator ? inputData.numerator : inputData.denominator;
  const denominator: number[] = inputData.denominator;

  return sqrt(
    add(divide(numerator, square(add(numerator, 0.5))),
        divide(denominator, square(add(denominator, 0.5))))
  );
}

const rcTarget = function(inputData: dataObject): number {
  const numerator: number[] = inputData.numerator;
  const denominator: number[] = inputData.denominator;
  return d3.sum(numerator) / d3.sum(denominator);
}

const rcTargetTransformed = function(inputData: dataObject): number {
  const numerator: number[] = inputData.numerator;
  const denominator: number[] = inputData.denominator;
  return log(d3.sum(numerator)) - log(d3.sum(denominator));
}

const rcY = function(inputData: dataObject): number[] {
  const numerator: number[] = inputData.numerator;
  const denominator: number[] = inputData.denominator;
  return log(divide(add(numerator, 0.5), add(denominator, 0.5)));
}

const rcLimit = function(args: limitArguments): number {
  const target: number = args.target_transformed;
  const q: number = args.q;
  const SE: number = args.SE;
  const tau2: number = args.tau2;
  const limit_transformed: number = target + q * sqrt(square(SE) + tau2);
  const limit: number = exp(limit_transformed);

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

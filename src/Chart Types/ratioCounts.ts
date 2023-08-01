import chartObject, { limitArgs } from "../Classes/chartObject"
import dataObject from "../Classes/dataObject";
import { sum, add, divide, sqrt, log, exp, square, winsorise } from "../Functions"
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
  return sum(numerator) / sum(denominator);
}

const rcTargetTransformed = function(inputData: dataObject): number {
  const numerator: number[] = inputData.numerator;
  const denominator: number[] = inputData.denominator;
  return log(sum(numerator)) - log(sum(denominator));
}

const rcY = function(inputData: dataObject): number[] {
  const numerator: number[] = inputData.numerator;
  const denominator: number[] = inputData.denominator;
  return log(divide(add(numerator, 0.5), add(denominator, 0.5)));
}

const rcLimit = function(args: limitArgs): number {
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

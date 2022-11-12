import * as stats from '@stdlib/stats/base/dists';
import chartObject from "../Classes/chartObject"
import dataObject from '../Classes/dataObject';
import limitArguments from '../Classes/limitArgs';
import settingsObject from '../Classes/settingsObject';
import winsorise from '../Functions/winsorise';
import { sqrt, inv, square } from "../Functions/UnaryFunctions"
import { multiply, divide } from "../Functions/BinaryFunctions"

let smrSE = function(inputData: dataObject): number[] {
  return [];
}

let smrSEOD = function(inputData: dataObject): number[] {
  let denominator: number[] = inputData.denominator;
  return inv(multiply(2, sqrt(denominator)));
}

let smrTarget = function(inputData: dataObject): number {
  return 1;
}

let smrY = function(inputData: dataObject): number[] {
  let numerator: number[] = inputData.numerator;
  let denominator: number[] = inputData.denominator;
  return sqrt(divide(numerator, denominator));
}

let smrLimitOD = function(args: limitArguments) {
  let target: number = args.target_transformed;
  let q: number = args.q;
  let SE: number = args.SE;
  let tau2: number = args.tau2;
  let limit_transformed: number = target + q * sqrt(square(SE) + tau2);
  let limit: number = square(limit_transformed);

  return winsorise(limit, {lower: 0})
}

let smrLimit = function(args: limitArguments) {
  let q: number = args.q;
  let denominator: number = args.denominator;
  let p: number = stats.normal.cdf(q, 0, 1);
  let is_upper: boolean = p > 0.5;
  let offset: number = is_upper ? 1 : 0;

  let limit: number = (stats.chisquare.quantile(p, 2 * (denominator + offset)) / 2.0)
                        / denominator;

  return winsorise(limit, {lower: 0})
}

class smrFunnelObject extends chartObject {
  constructor(args: { inputData: dataObject,
                      inputSettings: settingsObject }) {
    super({
      seFunction: smrSE,
      seFunctionOD: smrSEOD,
      targetFunction: smrTarget,
      targetFunctionTransformed: smrTarget,
      yFunction: smrY,
      limitFunction: smrLimit,
      limitFunctionOD: smrLimitOD,
      inputData: args.inputData,
      inputSettings: args.inputSettings
    });
  }
}

export default smrFunnelObject;

import * as d3 from "d3";
import * as stats from '@stdlib/stats/base/dists';
import limitObject from "../Classes/limitObject"
import { dataArray, limitArguments } from "../Classes/Interfaces"
import { sqrt, inv, asin, square } from "../Helper Functions/UnaryBroadcasting"
import { multiply, divide } from "../Helper Functions/BinaryBroadcasting"

let smrSE = function(inputData: dataArray): number[] {
  return [];
}

let smrSEOD = function(inputData: dataArray): number[] {
  let denominator: number[] = inputData.denominator;
  return inv(multiply(2, sqrt(denominator)));
}

let smrTarget = function(inputData: dataArray): number {
  return 1;
}

let smrY = function(inputData: dataArray): number[] {
  let numerator: number[] = inputData.numerator;
  let denominator: number[] = inputData.denominator;
  return sqrt(divide(numerator, denominator));
}

let smrLimitOD = function(args: limitArguments) {
  let target: number = args.target;
  let q: number = args.q;
  let SE: number = args.SE;
  let tau2: number = args.tau2;
  let limit_transformed: number = target + q * sqrt(square(SE) + tau2);
  let limit: number = square(limit_transformed);

  if (limit < 0.0) {
    return 0.0;
  } else {
    return limit;
  }
}

let smrLimit = function(args: limitArguments) {
  let q: number = args.q;
  let denominator: number = args.denominator;
  let p: number = stats.normal.cdf(q, 0, 1);
  let is_upper: boolean = p > 0.5;
  let offset: number = is_upper ? 1 : 0;

  let limit: number = (stats.chisquare.quantile(p, 2 * (denominator + offset)) / 2.0)
                        / denominator;

  if (limit < 0.0) {
    return 0.0;
  } else {
    return limit;
  }
}

let smrFunnelObject = new limitObject({
  seFunction: smrSE,
  seFunctionOD: smrSEOD,
  targetFunction: smrTarget,
  targetFunctionOD: smrTarget,
  yFunction: smrY,
  limitFunction: smrLimit,
  limitFunctionOD: smrLimitOD
});

export default smrFunnelObject;

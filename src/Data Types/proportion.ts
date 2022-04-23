import * as d3 from "d3";
import limitObject from "../Classes/limitObject"
import { dataArray, limitArguments } from "../Classes/Interfaces"
import { sqrt, inv, asin, square } from "../Helper Functions/UnaryBroadcasting"
import { multiply, divide } from "../Helper Functions/BinaryBroadcasting"

let prSE = function(inputData: dataArray): number[] {
  let denominator: number[] = inputData.denominator;
  return inv(multiply(2, sqrt(denominator)));
}

let prTarget = function(inputData: dataArray): number {
  let numerator: number[] = inputData.numerator;
  let denominator: number[] = inputData.denominator;
  return d3.sum(numerator) / d3.sum(denominator);
}

let prTargetOD = function(inputData: dataArray): number {
  let numerator: number[] = inputData.numerator;
  let denominator: number[] = inputData.denominator;
  let ratio: number = d3.sum(numerator) / d3.sum(denominator);
  return Math.asin(Math.sqrt(ratio));
}

let prY = function(inputData: dataArray): number[] {
  let numerator: number[] = inputData.numerator;
  let denominator: number[] = inputData.denominator;
  return asin(sqrt(divide(numerator, denominator)));
}

let prLimit = function(args: limitArguments) {
  let target: number = args.target;
  let q: number = args.q;
  let SE: number = args.SE;
  let tau2: number = args.tau2;
  let limit_transformed: number = target + q * sqrt(square(SE) + tau2);
  let limit: number = square(Math.sin(limit_transformed));

  if (limit > 1.0) {
    return 1.0;
  } else if (limit < 0.0) {
    return 0.0;
  } else {
    return limit;
  }
}

let prFunnelObject = new limitObject({
  seFunction: prSE,
  seFunctionOD: prSE,
  targetFunction: prTarget,
  targetFunctionOD: prTargetOD,
  yFunction: prY,
  limitFunction: prLimit,
  limitFunctionOD: prLimit
});

export default prFunnelObject;

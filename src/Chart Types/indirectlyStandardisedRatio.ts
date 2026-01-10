import { chartClass, type limitArgs, type settingsClass } from "../Classes"
import { winsorise, sqrt,
          inv, square, multiply, divide, type dataObject } from '../Functions';
import chisqQuantile from "../Functions/chisqQuantile";

const smrSE = function(inputData: dataObject): number[] {
  return [];
}

const smrSEOD = function(inputData: dataObject): number[] {
  const denominators: number[] = inputData.denominators;
  return inv(multiply(2, sqrt(denominators)));
}

const smrTarget = function(inputData: dataObject): number {
  return 1;
}

const smrY = function(inputData: dataObject): number[] {
  const numerators: number[] = inputData.numerators;
  const denominators: number[] = inputData.denominators;
  return sqrt(divide(numerators, denominators));
}

const smrLimitOD = function(args: limitArgs) {
  const target: number = args.target_transformed;
  const q: number = args.q;
  const SE: number = args.SE;
  const tau2: number = args.tau2;
  const limit_transformed: number = target + q * sqrt(square(SE) + tau2);
  const limit: number = square(limit_transformed);

  return winsorise(limit, {lower: 0})
}

const smrLimit = function(args: limitArgs) {
  const denominators: number = args.denominators;
  const p: number = args.p;
  const is_upper: boolean = p > 0.5;
  const offset: number = is_upper ? 1 : 0;

  const limit: number = (chisqQuantile(p, 2 * (denominators + offset)) / 2.0)
                        / denominators;

  return winsorise(limit, {lower: 0})
}

export default class smrFunnelClass extends chartClass {
  constructor(inputData: dataObject, inputSettings: settingsClass) {
    super({
      seFunction: smrSE,
      seFunctionOD: smrSEOD,
      targetFunction: smrTarget,
      targetFunctionTransformed: smrTarget,
      yFunction: smrY,
      limitFunction: smrLimit,
      limitFunctionOD: smrLimitOD,
      inputData: inputData,
      inputSettings: inputSettings
    });
  }
}

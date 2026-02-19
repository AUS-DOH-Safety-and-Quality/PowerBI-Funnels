import { chartClass, type limitArgs, type settingsClass } from "../Classes"
import { winsorise, sqrt,
          inv, square, multiply, divide, type dataObject } from '../Functions';
import chisqCDF from "../Functions/chisqCDF";
import chisqQuantile from "../Functions/chisqQuantile";
import normalQuantile from "../Functions/normalQuantile";

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

const smrZ = function(inputData: dataObject, zScores: number[], seOD: number[], odAdjust: boolean, tau2: number) {
  if (odAdjust) {
    const n: number = zScores.length;
    let rtn: number[] = new Array<number>(n);
    for (let i: number = 0; i < n; i++) {
      // Scale z-score to od-adjusted scale, by first un-standardising using the SE
      // and then re-standardising using the OD-adjusted variance
      rtn[i] = (zScores[i] * seOD[i]) / Math.sqrt(Math.pow(seOD[i], 2) + tau2);
    }
    return rtn;
  } else {
    const numerators: number[] = inputData.numerators;
    const denominators: number[] = inputData.denominators;
    const n: number = numerators.length;
    let rtn: number[] = new Array<number>(n);
    // Un-adjusted limits are exact limits, using the relationship between the Poisson and
    // Chi-Square distributions. To map the values to z-scores, we simply use the Chi-Square CDF
    // and Standard-normal quantile functions
    for (let i: number = 0; i < n; i++) {
      const ratio: number = numerators[i] / denominators[i];
      const offset: number = ratio > 1 ? 1 : 0;
      const log_p: number = chisqCDF(ratio * 2 * denominators[i], 2 * (denominators[i] + offset), true, true);
      rtn[i] = normalQuantile(log_p, 0, 1, true, true)
    }
    return rtn;
  }
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
      zFunction: smrZ,
      limitFunction: smrLimit,
      limitFunctionOD: smrLimitOD,
      inputData: inputData,
      inputSettings: inputSettings
    });
  }
}

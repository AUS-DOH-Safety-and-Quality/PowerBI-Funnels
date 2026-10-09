import { chartClass, type limitArgs, type settingsClass } from "../Classes"
import type { dataObject } from "../Functions/extractInputData";
import { clamp, chisqCDF, chisqQuantile, normalQuantile } from "powerbi-visuals-core/math";

const smrSE = function(inputData: dataObject): number[] {
  return [];
}

const smrSEOD = function(inputData: dataObject, plottingDenominators?: readonly number[]): number[] {
  const denominators: readonly number[] = plottingDenominators ?? inputData.denominators;
  const n: number = denominators.length;
  const result: number[] = new Array<number>(n);
  for (let i: number = 0; i < n; i++) {
    result[i] = 1.0 / (2 * Math.sqrt(denominators[i]));
  }
  return result;
}

const smrTarget = function(inputData: dataObject): number {
  return 1;
}

const smrY = function(inputData: dataObject): number[] {
  const numerators: readonly number[] = inputData.numerators;
  const denominators: readonly number[] = inputData.denominators;
  const n: number = numerators.length;
  const result: number[] = new Array<number>(n);
  for (let i: number = 0; i < n; i++) {
    result[i] = Math.sqrt(numerators[i] / denominators[i]);
  }
  return result;
}

const smrZ = function(inputData: dataObject, zScores: number[], seOD: number[], odAdjust: boolean, tau2: number) {
  if (odAdjust) {
    const n: number = zScores.length;
    const rtn: number[] = new Array<number>(n);
    for (let i: number = 0; i < n; i++) {
      // Scale z-score to od-adjusted scale, by first un-standardising using the SE
      // and then re-standardising using the OD-adjusted variance
      rtn[i] = (zScores[i] * seOD[i]) / Math.sqrt(Math.pow(seOD[i], 2) + tau2);
    }
    return rtn;
  } else {
    const numerators: readonly number[] = inputData.numerators;
    const denominators: readonly number[] = inputData.denominators;
    const n: number = numerators.length;
    const rtn: number[] = new Array<number>(n);
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
  if (args.SE === undefined) throw new Error("Adjusted standardised-ratio limits require a standard error.");
  const target: number = args.target_transformed;
  const q: number = args.q;
  const SE: number = args.SE;
  const tau2: number = args.tau2;
  const limit_transformed: number = target + q * Math.sqrt(Math.pow(SE, 2) + tau2);
  const limit: number = Math.pow(limit_transformed, 2);

  return clamp(limit, 0, undefined);
}

const smrLimit = function(args: limitArgs) {
  const denominators: number = args.denominators;
  const p: number = args.p;
  const is_upper: boolean = p > 0.5;
  const offset: number = is_upper ? 1 : 0;

  const limit: number = (chisqQuantile(p, 2 * (denominators + offset)) / 2.0)
                        / denominators;

  return clamp(limit, 0, undefined);
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

import { chartClass, type limitArgs, type groupSettings } from "../Classes"
import type { dataObject } from "../Functions/extractInputData";
import adjustZScores from "../Funnel Calculations/adjustZScores";
import { clamp, chisqCDF, chisqQuantile, normalQuantile } from "powerbi-visuals-core/math";

/** Only the overdispersion adjustment uses the SE; the exact limits come from the chi-squared quantile */
const smrSE = function(inputData: dataObject, plottingDenominators?: readonly number[]): number[] {
  const denominators: readonly number[] = plottingDenominators ?? inputData.denominators;
  const n: number = denominators.length;
  const result: number[] = new Array<number>(n);
  for (let i: number = 0; i < n; i++) {
    result[i] = 1.0 / (2 * Math.sqrt(denominators[i]));
  }
  return result;
}

const smrTarget = function(): number {
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

/**
 * Un-adjusted limits are exact via the Poisson/chi-square relationship, so z-scores
 * map through the chi-square CDF and the standard normal quantile
 */
const smrZ = function(inputData: dataObject): number[] {
  const numerators: readonly number[] = inputData.numerators;
  const denominators: readonly number[] = inputData.denominators;
  const n: number = numerators.length;
  const rtn: number[] = new Array<number>(n);
  for (let i: number = 0; i < n; i++) {
    const ratio: number = numerators[i] / denominators[i];
    const offset: number = ratio > 1 ? 1 : 0;
    const log_p: number = chisqCDF(ratio * 2 * denominators[i], 2 * (denominators[i] + offset), true, true);
    rtn[i] = normalQuantile(log_p, 0, 1, true, true)
  }
  return rtn;
}

const smrLimitOD = function(args: limitArgs): number {
  const target: number = args.target_transformed;
  const q: number = args.q;
  const SE: number = args.SE;
  const tau2: number = args.tau2;
  const limit_transformed: number = target + q * Math.sqrt(Math.pow(SE, 2) + tau2);
  // Below zero the square folds back above it instead of reaching 0
  return Math.pow(clamp(limit_transformed, 0, undefined), 2);
}

const smrLimit = function(args: limitArgs): number {
  const denominators: number = args.denominators;
  const p: number = args.p;
  const is_upper: boolean = p > 0.5;
  const offset: number = is_upper ? 1 : 0;

  const limit: number = (chisqQuantile(p, 2 * (denominators + offset)) / 2.0)
                        / denominators;

  return clamp(limit, 0, undefined);
}

export default class smrFunnelClass extends chartClass {
  constructor(inputData: dataObject, inputSettings: groupSettings) {
    super({
      seFunction: smrSE,
      targetFunction: smrTarget,
      targetFunctionTransformed: smrTarget,
      yFunction: smrY,
      zFunction: smrZ,
      zFunctionOD: adjustZScores,
      limitFunction: smrLimit,
      limitFunctionOD: smrLimitOD,
      inputData: inputData,
      inputSettings: inputSettings
    });
  }
}

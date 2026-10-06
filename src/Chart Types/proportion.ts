import { chartClass, type limitArgs, type settingsClass } from "../Classes"
import type { dataObject } from "../Functions/extractInputData";
import { sum, clamp } from "powerbi-visuals-core/math";

const prSE = function(inputData: dataObject, plottingDenominators?: readonly number[]): number[] {
  const denominators: readonly number[] = plottingDenominators ?? inputData.denominators;
  const n: number = denominators.length;
  const result: number[] = new Array<number>(n);
  for (let i: number = 0; i < n; i++) {
    result[i] = 1.0 / (2 * Math.sqrt(denominators[i]));
  }
  return result;
}

const prTarget = function(inputData: dataObject): number {
  const numerators: readonly number[] = inputData.numerators;
  const denominators: readonly number[] = inputData.denominators;
  return sum(numerators) / sum(denominators);
}

const prTargetTransformed = function(inputData: dataObject): number {
  return Math.asin(Math.sqrt(prTarget(inputData)));
}

const prY = function(inputData: dataObject): number[] {
  const numerators: readonly number[] = inputData.numerators;
  const denominators: readonly number[] = inputData.denominators;
  const n: number = numerators.length;
  const result: number[] = new Array<number>(n);
  for (let i: number = 0; i < n; i++) {
    result[i] = Math.asin(Math.sqrt(numerators[i] / denominators[i]));
  }
  return result;
}

const prZ = function(inputData: dataObject, zScores: number[], seOD: number[], odAdjust: boolean, tau2: number) {
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
    // Non-adjusted limits are equivalent to adjusted limits with tau2 = 0, so
    // return as-as
    return zScores;
  }
}

const prLimit = function(args: limitArgs) {
  if (args.SE === undefined) throw new Error("Proportion limits require a standard error.");
  const target: number = args.target_transformed;
  const q: number = args.q;
  const SE: number = args.SE;
  const tau2: number = args.tau2;
  const limit_transformed: number = target + q * Math.sqrt(Math.pow(SE, 2) + tau2);
  const limit: number = Math.pow(Math.sin(limit_transformed), 2);

  return clamp(limit, 0, 1);
}

export default class prFunnelClass extends chartClass {
  constructor(inputData: dataObject, inputSettings: settingsClass) {
    super({
      seFunction: prSE,
      seFunctionOD: prSE,
      targetFunction: prTarget,
      targetFunctionTransformed: prTargetTransformed,
      yFunction: prY,
      zFunction: prZ,
      limitFunction: prLimit,
      limitFunctionOD: prLimit,
      inputData: inputData,
      inputSettings: inputSettings
    });
  }
}

import { chartClass, type limitArgs, type groupSettings, type zArgs } from "../Classes"
import type { dataObject } from "../Functions/extractInputData";
import adjustZScores from "../Funnel Calculations/adjustZScores";
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

/** Un-adjusted limits are the adjusted limits with tau2 = 0, so the z-scores are unchanged */
const prZ = function(_inputData: dataObject, args: zArgs) {
  return args.zScores;
}

const prLimit = function(args: limitArgs) {
  const target: number = args.target_transformed;
  const q: number = args.q;
  const SE: number = args.SE;
  const tau2: number = args.tau2;
  const limit_transformed: number = target + q * Math.sqrt(Math.pow(SE, 2) + tau2);
  // Outside [0, pi/2] the squared sine folds back instead of reaching 0 or 1
  return Math.pow(Math.sin(clamp(limit_transformed, 0, Math.PI / 2)), 2);
}

export default class prFunnelClass extends chartClass {
  constructor(inputData: dataObject, inputSettings: groupSettings) {
    super({
      seFunction: prSE,
      targetFunction: prTarget,
      targetFunctionTransformed: prTargetTransformed,
      yFunction: prY,
      zFunction: prZ,
      zFunctionOD: adjustZScores,
      limitFunction: prLimit,
      inputData: inputData,
      inputSettings: inputSettings
    });
  }
}

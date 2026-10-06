import { chartClass, type limitArgs, type settingsClass } from "../Classes"
import type { dataObject } from "../Functions/extractInputData";
import { sum, clamp } from "powerbi-visuals-core/math";

const rcSE = function(inputData: dataObject, plottingDenominators?: readonly number[]): number[] {
  const numerators: readonly number[] = inputData.numerators;
  const denominators: readonly number[] = plottingDenominators ?? inputData.denominators;
  // TODO: Revisit the target-based plotting approximation after the Core refactor.
  const target: number | undefined = plottingDenominators === undefined ? undefined : rcTarget(inputData);
  const result: number[] = new Array<number>(denominators.length);

  for (let i: number = 0; i < denominators.length; i++) {
    const denominator: number = denominators[i];
    const numerator: number = target === undefined ? numerators[i] : target * denominator;
    result[i] = Math.sqrt(
      numerator / Math.pow(numerator + 0.5, 2) + denominator / Math.pow(denominator + 0.5, 2)
    );
  }
  return result;
}

const rcTarget = function(inputData: dataObject): number {
  const numerators: readonly number[] = inputData.numerators;
  const denominators: readonly number[] = inputData.denominators;
  return sum(numerators) / sum(denominators);
}

const rcTargetTransformed = function(inputData: dataObject): number {
  const numerators: readonly number[] = inputData.numerators;
  const denominators: readonly number[] = inputData.denominators;
  return Math.log(sum(numerators)) - Math.log(sum(denominators));
}

const rcY = function(inputData: dataObject): number[] {
  const numerators: readonly number[] = inputData.numerators;
  const denominators: readonly number[] = inputData.denominators;
  const n: number = numerators.length;
  const result: number[] = new Array<number>(n);
  for (let i: number = 0; i < n; i++) {
    result[i] = Math.log((numerators[i] + 0.5) / (denominators[i] + 0.5));
  }
  return result;
}

const rcZ = function(inputData: dataObject, zScores: number[], seOD: number[], odAdjust: boolean, tau2: number) {
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

const rcLimit = function(args: limitArgs): number {
  if (args.SE === undefined) throw new Error("Ratio-of-counts limits require a standard error.");
  const target: number = args.target_transformed;
  const q: number = args.q;
  const SE: number = args.SE;
  const tau2: number = args.tau2;
  const limit_transformed: number = target + q * Math.sqrt(Math.pow(SE, 2) + tau2);
  const limit: number = Math.exp(limit_transformed);

  return clamp(limit, 0, undefined);
}

export default class rcFunnelClass extends chartClass {

  constructor(inputData: dataObject, inputSettings: settingsClass) {
    super({
      seFunction: rcSE,
      seFunctionOD: rcSE,
      targetFunction: rcTarget,
      targetFunctionTransformed: rcTargetTransformed,
      yFunction: rcY,
      zFunction: rcZ,
      limitFunction: rcLimit,
      limitFunctionOD: rcLimit,
      inputData: inputData,
      inputSettings: inputSettings
    });
  }
}

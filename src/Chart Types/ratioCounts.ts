import { chartClass, type limitArgs, type groupSettings, type zArgs } from "../Classes"
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

/** Scored like the plotted limits, so z-scores agree with the flags; the +0.5 counts only estimate tau2 */
const rcZ = function(inputData: dataObject, args: zArgs): number[] {
  const numerators: readonly number[] = inputData.numerators;
  const denominators: readonly number[] = inputData.denominators;
  const target: number = rcTargetTransformed(inputData);
  const SE: number[] = rcSE(inputData, denominators);
  const result: number[] = new Array<number>(numerators.length);
  for (let i: number = 0; i < numerators.length; i++) {
    result[i] = (Math.log(numerators[i] / denominators[i]) - target) / Math.sqrt(Math.pow(SE[i], 2) + args.tau2);
  }
  return result;
}

const rcLimit = function(args: limitArgs): number {
  const target: number = args.target_transformed;
  const q: number = args.q;
  const SE: number = args.SE;
  const tau2: number = args.tau2;
  const limit_transformed: number = target + q * Math.sqrt(Math.pow(SE, 2) + tau2);
  const limit: number = Math.exp(limit_transformed);

  return clamp(limit, 0, undefined);
}

export default class rcFunnelClass extends chartClass {

  constructor(inputData: dataObject, inputSettings: groupSettings) {
    super({
      seFunction: rcSE,
      seFunctionOD: rcSE,
      targetFunction: rcTarget,
      targetFunctionTransformed: rcTargetTransformed,
      yFunction: rcY,
      zFunction: rcZ,
      zFunctionOD: rcZ,
      limitFunction: rcLimit,
      limitFunctionOD: rcLimit,
      inputData: inputData,
      inputSettings: inputSettings
    });
  }
}

import { chartClass, type limitArgs, type settingsClass } from "../Classes"
import winsorise from "../Functions/winsorise";
import type { dataObject } from "../Functions/extractInputData";
import sum from "../Functions/sum";

const rcSE = function(inputData: dataObject): number[] {
  const numerators: number[] = inputData.numerators ? inputData.numerators : inputData.denominators;
  const denominators: number[] = inputData.denominators;

  const n: number = numerators.length;
  const result: number[] = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    result[i] = Math.sqrt(numerators[i] / Math.pow(numerators[i] + 0.5, 2)
      + denominators[i] / Math.pow(denominators[i] + 0.5, 2));
  }
  return result;
}

const rcTarget = function(inputData: dataObject): number {
  const numerators: number[] = inputData.numerators;
  const denominators: number[] = inputData.denominators;
  return sum(numerators) / sum(denominators);
}

const rcTargetTransformed = function(inputData: dataObject): number {
  const numerators: number[] = inputData.numerators;
  const denominators: number[] = inputData.denominators;
  return Math.log(sum(numerators)) - Math.log(sum(denominators));
}

const rcY = function(inputData: dataObject): number[] {
  const numerators: number[] = inputData.numerators;
  const denominators: number[] = inputData.denominators;
  const n: number = numerators.length;
  const result: number[] = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    result[i] = Math.log((numerators[i] + 0.5) / (denominators[i] + 0.5));
  }
  return result;
}

const rcZ = function(inputData: dataObject, zScores: number[], seOD: number[], odAdjust: boolean, tau2: number) {
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
    // Non-adjusted limits are equivalent to adjusted limits with tau2 = 0, so
    // return as-as
    return zScores;
  }
}

const rcLimit = function(args: limitArgs): number {
  const target: number = args.target_transformed;
  const q: number = args.q;
  const SE: number = args.SE;
  const tau2: number = args.tau2;
  const limit_transformed: number = target + q * Math.sqrt(SE * SE + tau2);
  const limit: number = Math.exp(limit_transformed);

  return winsorise(limit, {lower: 0});
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

import { chartClass, type limitArgs, type settingsClass } from "../Classes"
import { sum, sqrt, inv, asin, square, multiply, divide, winsorise, type dataObject } from "../Functions"

const prSE = function(inputData: dataObject): number[] {
  const denominators: number[] = inputData.denominators;
  return inv(multiply(2, sqrt(denominators)));
}

const prTarget = function(inputData: dataObject): number {
  const numerators: number[] = inputData.numerators;
  const denominators: number[] = inputData.denominators;
  return sum(numerators) / sum(denominators);
}

const prTargetTransformed = function(inputData: dataObject): number {
  return Math.asin(Math.sqrt(prTarget(inputData)));
}

const prY = function(inputData: dataObject): number[] {
  const numerators: number[] = inputData.numerators;
  const denominators: number[] = inputData.denominators;
  return asin(sqrt(divide(numerators, denominators)));
}

const prZ = function(inputData: dataObject, zScores: number[], seOD: number[], odAdjust: boolean, tau2: number) {
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

const prLimit = function(args: limitArgs) {
  const target: number = args.target_transformed;
  const q: number = args.q;
  const SE: number = args.SE;
  const tau2: number = args.tau2;
  const limit_transformed: number = target + q * sqrt(square(SE) + tau2);
  const limit: number = square(Math.sin(limit_transformed));

  return winsorise(limit, {lower: 0, upper: 1})
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

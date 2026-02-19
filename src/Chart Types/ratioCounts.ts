import { chartClass, type limitArgs, type settingsClass } from "../Classes"
import { sum, add, divide, sqrt, log, exp, square, winsorise, type dataObject } from "../Functions"

const rcSE = function(inputData: dataObject): number[] {
  const numerators: number[] = inputData.numerators ? inputData.numerators : inputData.denominators;
  const denominators: number[] = inputData.denominators;

  return sqrt(
    add(divide(numerators, square(add(numerators, 0.5))),
        divide(denominators, square(add(denominators, 0.5))))
  );
}

const rcTarget = function(inputData: dataObject): number {
  const numerators: number[] = inputData.numerators;
  const denominators: number[] = inputData.denominators;
  return sum(numerators) / sum(denominators);
}

const rcTargetTransformed = function(inputData: dataObject): number {
  const numerators: number[] = inputData.numerators;
  const denominators: number[] = inputData.denominators;
  return log(sum(numerators)) - log(sum(denominators));
}

const rcY = function(inputData: dataObject): number[] {
  const numerators: number[] = inputData.numerators;
  const denominators: number[] = inputData.denominators;
  return log(divide(add(numerators, 0.5), add(denominators, 0.5)));
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
  const limit_transformed: number = target + q * sqrt(square(SE) + tau2);
  const limit: number = exp(limit_transformed);

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

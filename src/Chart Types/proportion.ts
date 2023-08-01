import { chartClass, type limitArgs, type dataClass, type settingsClass } from "../Classes"
import { sum, sqrt, inv, asin, square, multiply, divide, winsorise } from "../Functions"

const prSE = function(inputData: dataClass): number[] {
  const denominator: number[] = inputData.denominator;
  return inv(multiply(2, sqrt(denominator)));
}

const prTarget = function(inputData: dataClass): number {
  const numerator: number[] = inputData.numerator;
  const denominator: number[] = inputData.denominator;
  return sum(numerator) / sum(denominator);
}

const prTargetTransformed = function(inputData: dataClass): number {
  return Math.asin(Math.sqrt(prTarget(inputData)));
}

const prY = function(inputData: dataClass): number[] {
  const numerator: number[] = inputData.numerator;
  const denominator: number[] = inputData.denominator;
  return asin(sqrt(divide(numerator, denominator)));
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

class prFunnelObject extends chartClass {
  constructor(args: { inputData: dataClass,
                      inputSettings: settingsClass }) {
    super({
      seFunction: prSE,
      seFunctionOD: prSE,
      targetFunction: prTarget,
      targetFunctionTransformed: prTargetTransformed,
      yFunction: prY,
      limitFunction: prLimit,
      limitFunctionOD: prLimit,
      inputData: args.inputData,
      inputSettings: args.inputSettings
    });
  }
}

export default prFunnelObject;

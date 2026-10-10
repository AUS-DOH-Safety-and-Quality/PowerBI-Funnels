import type { dataObject } from "../Functions/extractInputData";
import type { zArgs } from "../Classes";

/** Un-standardises with the SE, then re-standardises with the overdispersion-adjusted variance */
export default function adjustZScores(_inputData: dataObject, args: zArgs): number[] {
  const zScores: readonly number[] = args.zScores;
  const SE: readonly number[] = args.SE;
  const result: number[] = new Array<number>(zScores.length);
  for (let i: number = 0; i < zScores.length; i++) {
    result[i] = (zScores[i] * SE[i]) / Math.sqrt(Math.pow(SE[i], 2) + args.tau2);
  }
  return result;
}

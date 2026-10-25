import { at } from "powerbi-visuals-core/util";
import type { dataObject } from "../Functions/extractInputData";
import type { zArgs } from "../Classes";

/** Un-standardises with the SE, then re-standardises with the overdispersion-adjusted variance */
export default function adjustZScores(_inputData: dataObject, args: zArgs): number[] {
  const zScores: readonly number[] = args.zScores;
  const SE: readonly number[] = args.SE;
  const result: number[] = new Array<number>(zScores.length);
  for (let i: number = 0; i < zScores.length; i++) {
    const se: number = at(SE, i);
    result[i] = (at(zScores, i) * se) / Math.sqrt(Math.pow(se, 2) + args.tau2);
  }
  return result;
}

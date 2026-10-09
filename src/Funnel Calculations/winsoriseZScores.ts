import { clamp, quantile } from "powerbi-visuals-core/math";

/**
 * Winsorise unadjusted z-scores to remove influence of
 *    extreme observations prior to assessing/correcting
 *    for dispersion.
 *
 * @param z
 * @returns
 */
export default function winsoriseZScores(z: readonly number[]): number[] {
  const z_sorted: readonly number[] = [...z].sort(function(a, b){ return a - b; });
  const lower_z: number | undefined = quantile(z_sorted, 0.1);
  const upper_z: number | undefined = quantile(z_sorted, 0.9);
  const n: number = z.length;
  const result: number[] = new Array<number>(n);
  for (let i: number = 0; i < n; i++) {
    result[i] = clamp(z[i], lower_z, upper_z);
  }
  return result;
}

import { clamp, quantile } from "powerbi-visuals-core/math";

/** Clamps z-scores to their 10th-90th percentiles so outlying units don't drive the dispersion estimate. */
export default function winsoriseZScores(z: readonly number[]): number[] {
  const z_sorted: readonly number[] = [...z].sort((a, b) => a - b);
  const lower_z: number = quantile(z_sorted, 0.1);
  const upper_z: number = quantile(z_sorted, 0.9);
  const n: number = z.length;
  const result: number[] = new Array<number>(n);
  for (let i: number = 0; i < n; i++) {
    result[i] = clamp(z[i], lower_z, upper_z);
  }
  return result;
}

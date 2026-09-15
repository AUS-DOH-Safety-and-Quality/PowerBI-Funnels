/**
 * Generate (un-adjusted) z-scores using transformed
 * observations and standard errors
 *
 * @param y
 * @param SE
 * @param target
 * @returns
 */
export default function getZScores(y: number[], SE: number[], target: number): number[] {
  const n: number = y.length;
  const rtn: Array<number> = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    rtn[i] = (y[i] - target) / SE[i];
  }
  return rtn;
}

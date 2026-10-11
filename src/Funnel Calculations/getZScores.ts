/** Un-adjusted z-scores of the transformed observations. */
export default function getZScores(y: readonly number[], SE: readonly number[], target: number): number[] {
  const n: number = y.length;
  const result: number[] = new Array<number>(n);
  for (let i: number = 0; i < n; i++) {
    result[i] = (y[i] - target) / SE[i];
  }
  return result;
}

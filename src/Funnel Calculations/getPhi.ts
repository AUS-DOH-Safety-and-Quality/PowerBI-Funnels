/**
 * Estimate the dispersion ratio of the observed responses using
 *    winsorised z-scores
 *
 * @param z_adj
 * @returns
 */
export default function getPhi(z_adj: readonly number[]): number {
  let total: number = 0;
  for (let i: number = 0; i < z_adj.length; i++) {
    total += Math.pow(z_adj[i], 2);
  }
  return total / z_adj.length;
}

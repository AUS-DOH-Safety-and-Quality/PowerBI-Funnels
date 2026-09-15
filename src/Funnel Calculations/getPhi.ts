/**
 * Estimate the dispersion ratio of the observed responses using
 *    winsorised z-scores
 *
 * @param z_adj
 * @returns
 */
export default function getPhi(z_adj: number[]): number {
  let sq_sum: number = 0;
  let n: number = z_adj.length;

  for (let i = 0; i < n; i++) {
    sq_sum += z_adj[i] * z_adj[i];
  }
  return sq_sum / n;
}

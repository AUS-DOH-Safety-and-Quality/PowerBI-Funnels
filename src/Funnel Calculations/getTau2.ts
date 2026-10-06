/**
 * Estimate the between-unit variance to adjust control limits
 *     by, using the DerSimonian & Laird Method-of-Moments estimator.
 *     If the dispersion ratio is not sufficiently large enough to warrant
 *     adjustment then this is fixed to zero.
 *
 * @param phi   - Sample dispersion ratio
 * @param SE    - Array of standard errors for each unit
 * @returns
 */
function getTau2(phi: number, SE: readonly number[]): number {
  const N: number = SE.length;
  // Check for sufficient dispersion
  if (N * phi < N - 1) { return 0.0; }

  // Accumulate inverse-variance weights and their squares
  let w_sum: number = 0;
  let w_sq_sum: number = 0;
  for (let i: number = 0; i < N; i++) {
    const w: number = 1.0 / Math.pow(SE[i], 2);
    w_sum += w;
    w_sq_sum += Math.pow(w, 2);
  }

  // Estimate variance
  const tau_num: number = (N * phi) - (N - 1.0);
  const tau_denom: number = w_sum - (w_sq_sum / w_sum);
  return tau_num / tau_denom;
}

export default getTau2;

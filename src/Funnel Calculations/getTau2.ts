/**
 * Between-unit variance by the DerSimonian & Laird method-of-moments estimator;
 * zero when phi shows no overdispersion.
 */
function getTau2(phi: number, SE: readonly number[]): number {
  const N: number = SE.length;
  if (N * phi < N - 1) {
    return 0.0;
  }

  let w_sum: number = 0;
  let w_sq_sum: number = 0;
  for (let i: number = 0; i < N; i++) {
    const w: number = 1.0 / Math.pow(SE[i], 2);
    w_sum += w;
    w_sq_sum += Math.pow(w, 2);
  }

  const tau_num: number = (N * phi) - (N - 1.0);
  const tau_denom: number = w_sum - (w_sq_sum / w_sum);
  return tau_num / tau_denom;
}

export default getTau2;

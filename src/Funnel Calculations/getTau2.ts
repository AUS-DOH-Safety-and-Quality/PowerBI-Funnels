import * as rmath from "lib-r-math.js";

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
function getTau2(phi: number, SE: number[]): number {
    let N: number = SE.length;
    // Check for sufficient dispersion
    if (N * phi < N - 1) { return 0.0; }

    // Construct sample weights (inverse variances)
    let w: number[] = SE.map(d => d*d).map(d => 1.0 / d);
    let w_sq: number[] = w.map(d => d*d);
    let w_sum: number  = rmath.R.sum(w);
    let w_sq_sum: number = rmath.R.sum(w_sq);

    // Estimate variance
    let tau_num: number = (N * phi) - (N - 1.0);
    let tau_denom: number = w_sum - (w_sq_sum / w_sum);
    return tau_num / tau_denom;
}

export default getTau2;
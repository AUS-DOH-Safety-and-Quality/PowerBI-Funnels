import poissonDensity from "./poissonDensity";
import lgamma from "./lgamma";

/**
 * Computes the Poisson density for the previous value (x_plus_1 - 1).
 *
 * The implementation is adapted from the dpois_raw function in R's source code.
 *
 * @param x_plus_1 The value x + 1 for which to compute the Poisson density.
 * @param lambda The rate parameter of the Poisson distribution.
 * @param log_p If true, returns the log of the density; otherwise, returns the density.
 * @returns The Poisson density or its logarithm for the previous value.
 */
export default function poissonDensityPrev(x_plus_1: number, lambda: number, log_p: boolean): number {
  const M_cutoff: number = 3.196577161300664E18;
  if (!Number.isFinite(lambda)) {
    return log_p ? Number.NEGATIVE_INFINITY : 0;
  }
  if (x_plus_1 > 1) {
    return poissonDensity(x_plus_1 - 1, lambda, log_p);
  }

  let rtn: number;
  if (lambda > Math.abs(x_plus_1 - 1) * M_cutoff) {
    rtn = -lambda - lgamma(x_plus_1);
  } else {
    const d: number = poissonDensity(x_plus_1, lambda, true);
    rtn = d + Math.log(x_plus_1) - Math.log(lambda);
  }
  return log_p ? rtn : Math.exp(rtn);
}

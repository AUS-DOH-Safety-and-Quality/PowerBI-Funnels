import poissonDensity from "./poissonDensity";
import { lgamma } from "powerbi-visuals-core/math";

/**
 * Computes the Poisson density for the previous value (x_plus_1 - 1).
 *
 * The implementation is adapted from the dpois_wrap function in R's source code.
 *
 * @param x_plus_1 The value x + 1 for which to compute the Poisson density.
 * @param lambda The rate parameter of the Poisson distribution.
 * @param log_p If true, returns the log of the density; otherwise, returns the density.
 * @returns The Poisson density or its logarithm for the previous value.
 */
export default function poissonDensityPrev(x_plus_1: number, lambda: number, log_p: boolean): number {
  if (!Number.isFinite(lambda)) {
    return log_p ? Number.NEGATIVE_INFINITY : 0;
  }

  if (x_plus_1 > 1) {
    return poissonDensity(x_plus_1 - 1, lambda, log_p);
  }

  // Cutoff for when lambda is very large relative to |x|
  const M_cutoff: number = 3.196577161300664E18;

  if (lambda > Math.abs(x_plus_1 - 1) * M_cutoff) {
    const rtn: number = -lambda - lgamma(x_plus_1);
    return log_p ? rtn : Math.exp(rtn);
  }

  // f(x) = f(x+1) * (x+1) / lambda, scaled in the requested space as R does.
  const d: number = poissonDensity(x_plus_1, lambda, log_p);
  return log_p ? d + Math.log(x_plus_1 / lambda) : d * (x_plus_1 / lambda);
}

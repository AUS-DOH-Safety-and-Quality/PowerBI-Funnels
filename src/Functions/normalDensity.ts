import { LOG_SQRT_TWO_PI, ONE_DIV_SQRT_TWO_PI } from "./Constants";
import ldexp from "./ldexp";

/**
 * Calculates the probability density function (PDF) of the normal distribution.
 *
 * The implementation is adapted from the dnorm function in R's source code.
 *
 * @param x The point at which to evaluate the density.
 * @param mu The mean of the normal distribution.
 * @param sigma The standard deviation of the normal distribution.
 * @param log_p If true, returns the log of the density.
 * @returns The probability density or log-density at the given point.
 */
export default function normalDensity(x: number, mu: number, sigma: number,
                                      log_p: boolean = false): number {
  if (Number.isNaN(x) || Number.isNaN(mu) || Number.isNaN(sigma)) {
    return x + mu + sigma;
  }
  if (sigma < 0) {
    return Number.NaN;
  }
  const zeroBound: number = log_p ? Number.NEGATIVE_INFINITY : 0;
  if (!Number.isFinite(sigma)) {
    return zeroBound;
  }
  if (!Number.isFinite(x) && mu == x) {
    return Number.NaN;
  }
  if (sigma == 0) {
    return (x == mu) ? Number.POSITIVE_INFINITY : zeroBound;
  }

  const z: number = (x - mu) / sigma;

  if (!Number.isFinite(z)) {
    return zeroBound;
  }

  const absZ: number = Math.abs(z);
  if (absZ >= 2 * Math.sqrt(Number.MAX_VALUE)) {
    return zeroBound;
  }

  if (log_p) {
    return -(LOG_SQRT_TWO_PI + 0.5 * absZ * absZ + Math.log(sigma));
  }

  if (absZ < 5) {
    return ONE_DIV_SQRT_TWO_PI * Math.exp(-0.5 * absZ * absZ) / sigma;
  }

  // Point at which algorithm underflows
  if (absZ > 38.56804181549334 ) {
    return 0;
  }

  let x1: number = ldexp(Math.trunc(ldexp(absZ, 16)), -16);
  let x2: number = absZ - x1;
  return ONE_DIV_SQRT_TWO_PI / sigma
          * (Math.exp(-0.5 * x1 * x1) * Math.exp((-0.5 * x2 - x1) * x2));
}

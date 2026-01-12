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
  // Handle NaN inputs
  if (Number.isNaN(x) || Number.isNaN(mu) || Number.isNaN(sigma)) {
    return x + mu + sigma;
  }

  // Negative standard deviation is invalid
  if (sigma < 0) {
    return Number.NaN;
  }

  const zeroBound: number = log_p ? Number.NEGATIVE_INFINITY : 0;

  // Infinite sigma means density is 0 everywhere
  if (!Number.isFinite(sigma)) {
    return zeroBound;
  }

  // Handle infinity - infinity case
  if (!Number.isFinite(x) && mu == x) {
    return Number.NaN;
  }

  // Degenerate case: point mass at mu
  if (sigma == 0) {
    return (x == mu) ? Number.POSITIVE_INFINITY : zeroBound;
  }

  // Standardize: z = (x - mu) / sigma
  const z: number = (x - mu) / sigma;

  if (!Number.isFinite(z)) {
    return zeroBound;
  }

  const absZ: number = Math.abs(z);

  // Check for potential overflow in z²
  if (absZ >= 2 * Math.sqrt(Number.MAX_VALUE)) {
    return zeroBound;
  }

  // Compute density: f(x) = (1 / (sigma * sqrt(2*pi))) * exp(-z²/2)
  // In log scale: log(f) = -log(sqrt(2*pi)) - log(sigma) - z²/2
  if (log_p) {
    return -(LOG_SQRT_TWO_PI + 0.5 * absZ * absZ + Math.log(sigma));
  }

  // For small |z|, direct computation is stable
  if (absZ < 5) {
    return ONE_DIV_SQRT_TWO_PI * Math.exp(-0.5 * absZ * absZ) / sigma;
  }

  // Underflow threshold: exp(-z²/2) underflows for |z| > 38.57
  if (absZ > 38.56804181549334 ) {
    return 0;
  }

  // For larger |z|, split z to avoid precision loss in z²
  // z = x1 + x2 where x1 has limited precision
  // exp(-z²/2) = exp(-x1²/2) * exp((-x2/2 - x1) * x2)
  let x1: number = ldexp(Math.trunc(ldexp(absZ, 16)), -16);
  let x2: number = absZ - x1;
  return ONE_DIV_SQRT_TWO_PI / sigma
          * (Math.exp(-0.5 * x1 * x1) * Math.exp((-0.5 * x2 - x1) * x2));
}

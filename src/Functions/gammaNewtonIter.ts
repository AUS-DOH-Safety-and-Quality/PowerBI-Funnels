import gammaCDF from "./gammaCDF";
import gammaDensity from "./gammaDensity";

/**
 * Performs Newton-Raphson iterations to refine the estimate of the quantile function
 * for the gamma distribution.
 *
 * The below code was adapted from the qgamma function in R's source code.
 *
 * @param ch Initial estimate of quantile
 * @param p Probability value
 * @param alpha Shape parameter
 * @param scale Scale parameter
 * @param lower_tail Logical; if true, probabilities are P[X ≤ x], otherwise, P[X > x]
 * @param log_p Logical; if true, probabilities p are given as log(p)
 * @param max_it_Newton Maximum number of Newton-Raphson iterations
 * @param EPS_N Convergence tolerance for Newton-Raphson iterations
 * @returns Refined estimate of the quantile
 */
export default function gammaNewtonIter(ch: number, p: number, alpha: number, scale: number,
                                        lower_tail: boolean, log_p: boolean,
                                        max_it_Newton: number, EPS_N: number): number {
  // Convert chi-squared estimate to gamma scale: x = (scale * ch) / 2
  let x: number = 0.5 * scale * ch;

  // If no iterations requested, return the initial estimate
  if (max_it_Newton === 0) {
    return x;
  }

  // Work in log scale for better numerical precision
  if (!log_p) {
    p = Math.log(p);
    log_p = true;
  }

  let p_: number;  // Current CDF value at x

  // Handle x = 0 edge case
  if (x === 0) {
    const _1_p: number = 1. + 1e-7;  // Tolerance factor (upper)
    const _1_m: number = 1. - 1e-7;  // Tolerance factor (lower)
    x = Number.MIN_VALUE;
    p_ = gammaCDF(x, alpha, scale, lower_tail, log_p);
    // Check if p is so small that the quantile is effectively 0
    if ((lower_tail && p_ > p * _1_p) || (!lower_tail && p_ < p * _1_m)) {
      return 0;
    }
  } else {
    p_ = gammaCDF(x, alpha, scale, lower_tail, log_p);
  }

  // If CDF is -infinity (log scale), quantile is 0
  if (p_ === Number.NEGATIVE_INFINITY) {
    return 0;
  }

  const zeroBound: number = log_p ? Number.NEGATIVE_INFINITY : 0;

  // Newton-Raphson iteration loop
  // Update rule: x_{n+1} = x_n - (F(x_n) - p) / f(x_n)
  // where F is the CDF and f is the PDF (density)
  for (let i = 1; i <= max_it_Newton; i++) {
    const p1: number = p_ - p;  // Residual: F(x) - p

    // Check convergence: |F(x) - p| < epsilon * |p|
    if(Math.abs(p1) < Math.abs(EPS_N * p)) {
      break;
    }

    // Compute density (derivative of CDF) for Newton step
    const g: number = gammaDensity(x, alpha, scale, log_p);
    if (g === zeroBound) {
      break;  // Density is 0, cannot continue
    }

    // Compute Newton step: delta = (F(x) - p) / f(x)
    // In log scale: delta = (p_ - p) * exp(p_ - g)
    let t = log_p ? p1 * Math.exp(p_ - g) : p1 / g;
    t = lower_tail ? x - t : x + t;  // Apply step in correct direction

    // Evaluate CDF at new point
    p_ = gammaCDF(t, alpha, scale, lower_tail, log_p);

    // Check if we are making progress; stop if not improving
    const absDiff: number = Math.abs(p_ - p);
    const absP1: number = Math.abs(p1);
    if (absDiff > absP1 || (i > 1 && absDiff === absP1)) {
      break;
    }
    x = t;
  }

  return x;
}

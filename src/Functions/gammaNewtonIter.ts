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
  let x: number = 0.5 * scale * ch;
  if (max_it_Newton === 0) {
    return x;
  }

  let p_: number;

  if (!log_p) {
    p = Math.log(p);
    log_p = true;
  }

  if (x === 0) {
    const _1_p: number = 1. + 1e-7;
    const _1_m: number = 1. - 1e-7;
    x = Number.MIN_VALUE;
    p_ = gammaCDF(x, alpha, scale, lower_tail, log_p);
    if (( lower_tail && p_ > p * _1_p) || (!lower_tail && p_ < p * _1_m)) {
      return 0;
    }
  } else {
    p_ = gammaCDF(x, alpha, scale, lower_tail, log_p);
  }

  if (p_ === Number.NEGATIVE_INFINITY) {
    return 0;
  }

  const zeroBound: number = log_p ? Number.NEGATIVE_INFINITY : 0;
  for (let i = 1; i <= max_it_Newton; i++) {
    const p1: number = p_ - p;
    if(Math.abs(p1) < Math.abs(EPS_N * p)) {
      break;
    }
    const g: number = gammaDensity(x, alpha, scale, log_p);
    if (g === zeroBound) {
      break;
    }
    let t = log_p ? p1 * Math.exp(p_ - g) : p1 / g;
    t = lower_tail ? x - t : x + t;
    p_ = gammaCDF(t, alpha, scale, lower_tail, log_p);
    const absDiff: number = Math.abs(p_ - p);
    const absP1: number = Math.abs(p1);
    if (absDiff > absP1 || (i > 1 && absDiff === absP1)) {
      break;
    }
    x = t;
  }

  return x;
}

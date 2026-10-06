import { lgamma1p, stirlingError, DBL_MIN } from "powerbi-visuals-core/math";
import binomialDeviance from "./binomialDeviance";
import { TWO_PI, SQRT_TWO_PI } from "./Constants";

/**
 * Calculates the Poisson density function for a given continuous x and lambda.
 *
 * The implementation is adapted from the dpois_raw function in R's source code.
 *
 * @param x The point at which to evaluate the density.
 * @param lambda The rate parameter of the Poisson distribution.
 * @param log_p If true, probabilities p are given as log(p).
 * @returns The value of the Poisson density function at x.
 */
export default function poissonDensity(x: number, lambda: number, log_p: boolean): number {
  const zeroBound: number = log_p ? Number.NEGATIVE_INFINITY : 0;

  // Handle degenerate case: lambda = 0 is a point mass at x = 0
  if (lambda === 0) {
    return (x === 0) ? (log_p ? 0 : 1) : zeroBound ;
  }

  // Invalid inputs
  if (!Number.isFinite(lambda) || x < 0) {
    return zeroBound;
  }

  // For very small x relative to lambda, use limit: f(x) ≈ exp(-lambda)
  if (x <= lambda * DBL_MIN) {
    return log_p ? -lambda : Math.exp(-lambda);
  }

  // For very small lambda relative to x, use direct formula
  // f(x) = exp(-lambda + x*log(lambda) - log(Gamma(x+1)))
  if (lambda < x * DBL_MIN) {
    if (!Number.isFinite(x)) {
      return zeroBound;
    }

    const rtn: number = -lambda + x * Math.log(lambda) -lgamma1p(x);
    return log_p ? rtn : Math.exp(rtn);
  }

  // General case: use Stirling's approximation for improved precision
  // f(x) = exp(-stirlingError(x) - binomialDeviance(x, lambda)) / sqrt(2*pi*x)
  // This formulation avoids catastrophic cancellation for x ≈ lambda
  let {yh, yl} = binomialDeviance(x, lambda);
  yl += stirlingError(x);

  // R's x_LRG = 2^1023 / pi: beyond it 2*pi*x overflows, so use sqrt(2*pi) * sqrt(x)
  const Lrg_x: boolean = (x >= 2.86111748575702815380240589208115399625e307);
  const r: number = Lrg_x ? SQRT_TWO_PI * Math.sqrt(x)
                          : TWO_PI * x;

  return log_p ? -yl - yh - (Lrg_x ? Math.log(r) : 0.5 * Math.log(r))
                : Math.exp(-yl) * Math.exp(-yh) / (Lrg_x ? r : Math.sqrt(r));
}

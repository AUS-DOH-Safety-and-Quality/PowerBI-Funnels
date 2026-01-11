import lgamma1p from "./lgamma1p";
import stirlingError from "./stirlingError";
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
  if (lambda === 0) {
    return (x === 0) ? (log_p ? 0 : 1) : zeroBound ;
  }

  if (!Number.isFinite(lambda) || x < 0) {
    return zeroBound;

  }
  if (x <= lambda * Number.MIN_VALUE) {
    return log_p ? -lambda : Math.exp(-lambda);
  }
  if (lambda < x * Number.MIN_VALUE) {
    if (!Number.isFinite(x)) {
      return zeroBound;
    }

    const rtn: number = -lambda + x * Math.log(lambda) -lgamma1p(x);
    return log_p ? rtn : Math.exp(rtn);
  }


  let {yh, yl} = binomialDeviance(x, lambda);
  yl += stirlingError(x);
  let Lrg_x: boolean = (x >= Number.MAX_VALUE);
  let r: number = Lrg_x ? SQRT_TWO_PI * Math.sqrt(x)
                        : TWO_PI * x;
  return log_p ? -yl - yh - (Lrg_x ? Math.log(r) : 0.5 * Math.log(r))
                : Math.exp(-yl) * Math.exp(-yh) / (Lrg_x ? r : Math.sqrt(r));
}

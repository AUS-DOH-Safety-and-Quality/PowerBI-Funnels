import poissonDensity from "./poissonDensity";

/**
 * Calculates the gamma density function.
 *
 * The below code was adapted from the dgamma function in R's source code.
 *
 * @param x The point at which to evaluate the density.
 * @param shape The shape parameter of the gamma distribution.
 * @param scale The scale parameter of the gamma distribution.
 * @param log_p If true, probabilities p are given as log(p).
 * @returns The value of the gamma density function at x.
 */
export default function gammaDensity(x: number, shape: number, scale: number, log_p: boolean): number {
  if (Number.isNaN(x) || Number.isNaN(shape) || Number.isNaN(scale)) {
    return x + shape + scale;
  }
  if (shape < 0 || scale <= 0) {
    return Number.NaN;
  }
  const zeroBound: number = log_p ? Number.NEGATIVE_INFINITY : 0;
  if (x < 0) {
    return zeroBound;
  }
  if (shape === 0) {
    return (x === 0) ? Number.POSITIVE_INFINITY : zeroBound;
  }
  if (x === 0) {
    if (shape < 1) {
      return Number.POSITIVE_INFINITY;
    }
    if (shape > 1) {
      return zeroBound;
    }
    return log_p ? -Math.log(scale) : 1 / scale;
  }

  let pr: number;
  if (shape < 1) {
    pr = poissonDensity(shape, x / scale, log_p);

    if (log_p) {
      const shapeDivX: number = shape / x;
      const offset: number = Number.isFinite(shapeDivX)
                              ? Math.log(shapeDivX)
                              : Math.log(shape) - Math.log(x);
      return pr + offset
    } else {
      return pr * shape / x;
    }
  }
  /* else  shape >= 1 */
  pr = poissonDensity(shape - 1, x / scale, log_p);
  return log_p ? pr - Math.log(scale) : pr / scale;
}

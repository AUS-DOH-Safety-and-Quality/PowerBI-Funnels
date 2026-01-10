import dpois_raw from "./dpois_raw";

export default function dgamma(x: number, shape: number, scale: number, log_p: boolean): number {
  if (Number.isNaN(x) || Number.isNaN(shape) || Number.isNaN(scale))
    return x + shape + scale;
  if (shape < 0 || scale <= 0) {
    return Number.NaN;
  }
  if (x < 0)
    return (log_p ? Number.NEGATIVE_INFINITY : 0.);
  if (shape == 0) /* point mass at 0 */
    return (x == 0) ? Number.POSITIVE_INFINITY
                    : (log_p ? Number.NEGATIVE_INFINITY : 0.);
  if (x == 0) {
    if (shape < 1) return Number.POSITIVE_INFINITY;
    if (shape > 1) return (log_p ? Number.NEGATIVE_INFINITY : 0.);
    /* else */
    return log_p ? -Math.log(scale) : 1 / scale;
  }

  let pr: number;
  if (shape < 1) {
    pr = dpois_raw(shape, x/scale, log_p);
    return (
        log_p/* NB: currently *always*  shape/x > 0  if shape < 1:
          * -- overflow to Inf happens, but underflow to 0 does NOT : */
        ? pr + (Number.isFinite(shape/x)
          ? Math.log(shape/x)
          : /* shape/x overflows to +Inf */ Math.log(shape) - Math.log(x))
        : pr*shape / x);
  }
  /* else  shape >= 1 */
  pr = dpois_raw(shape-1, x/scale, log_p);
  return log_p ? pr - Math.log(scale) : pr/scale;
}

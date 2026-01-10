import gammaCDFImpl from "./gammaCDFImpl";

/**
 * Calculates the cumulative distribution function (CDF) of the gamma distribution.
 *
 * The implementation is adapted from the pgamma function in R's source code.
 *
 * @param x The quantile at which to evaluate the CDF.
 * @param alpha The shape parameter of the gamma distribution.
 * @param scale The scale parameter of the gamma distribution.
 * @param lower_tail If true, probabilities are P[X ≤ x], otherwise, P[X > x].
 * @param log_p If true, probabilities p are given as log(p).
 * @returns The cumulative probability up to x for the gamma distribution with given parameters.
 */
export default function gammaCDF(x: number, alpha: number, scale: number,
                                  lower_tail: boolean = true,
                                  log_p: boolean = false): number {
  if (Number.isNaN(x) || Number.isNaN(alpha) || Number.isNaN(scale)) {
    return x + alpha + scale;
  }
  if(alpha < 0 || scale <= 0) {
    return Number.NaN;
  }
  x /= scale;
  if (Number.isNaN(x)) {
    return x;
  }
  if (alpha === 0) {
    const zeroBoundLower: number = log_p ? Number.NEGATIVE_INFINITY : 0;
    const zeroBoundUpper: number = log_p ? 0 : 1;
    return (x <= 0) ? (lower_tail ? zeroBoundLower : zeroBoundUpper)
                    : (lower_tail ? zeroBoundUpper : zeroBoundLower);
  }
  return gammaCDFImpl(x, alpha, lower_tail, log_p);
}

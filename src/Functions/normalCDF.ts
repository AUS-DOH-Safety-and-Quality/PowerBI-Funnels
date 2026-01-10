import normalCDFImpl from "./normalCDFImpl";

/**
 * Normal cumulative distribution function (CDF).
 *
 * The below code was adapted from the pnorm function in R's source code.
 *
 * @param x Point at which to evaluate the CDF
 * @param mu Mean of the normal distribution
 * @param sigma SD of the normal distribution
 * @param lower_tail If true, probabilities are P[X ≤ x], otherwise, P[X > x]
 * @param log_p If true, probabilities p are given as log(p)
 * @returns The cumulative probability up to x for the standard normal distribution.
 */
export default function normalCDF(x: number, mu: number, sigma: number,
                                  lower_tail: boolean = true,
                                  log_p: boolean = false): number {
  if (Number.isNaN(x) || Number.isNaN(mu) || Number.isNaN(sigma)) {
    return x + mu + sigma;
  }
  if (!Number.isFinite(x) && mu == x) {
    return Number.NaN;
  }
  const zeroBoundLower: number = (lower_tail ? (log_p ? Number.NEGATIVE_INFINITY : 0) : (log_p ? 0 : 1));
  const zeroBoundUpper: number = (lower_tail ? (log_p ? 0 : 1) : (log_p ? Number.NEGATIVE_INFINITY : 0));
  if (sigma <= 0) {
    if(sigma < 0) {
      Number.NaN;
    }
    return (x < mu) ? zeroBoundLower : zeroBoundUpper;
  }
  let p: number = (x - mu) / sigma;
  if (!Number.isFinite(p)) {
    return (x < mu) ? zeroBoundLower : zeroBoundUpper;
  }
  return normalCDFImpl(p, lower_tail, log_p);
}

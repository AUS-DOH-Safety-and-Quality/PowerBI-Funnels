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
  // Handle NaN inputs: propagate NaN
  if (Number.isNaN(x) || Number.isNaN(mu) || Number.isNaN(sigma)) {
    return x + mu + sigma;
  }

  // Handle infinity - infinity case (indeterminate form)
  if (!Number.isFinite(x) && mu == x) {
    return Number.NaN;
  }

  // Precompute boundary values for edge cases
  const zeroBoundLower: number = (lower_tail ? (log_p ? Number.NEGATIVE_INFINITY : 0) : (log_p ? 0 : 1));
  const zeroBoundUpper: number = (lower_tail ? (log_p ? 0 : 1) : (log_p ? Number.NEGATIVE_INFINITY : 0));

  // Validate sigma: must be positive
  // If sigma = 0, distribution is a point mass at mu
  if (sigma <= 0) {
    if (sigma < 0) {
      return Number.NaN;
    }
    // sigma === 0: step function at mu
    return (x < mu) ? zeroBoundLower : zeroBoundUpper;
  }

  // Standardize: z = (x - mu) / sigma transforms N(mu, sigma) to N(0, 1)
  let p: number = (x - mu) / sigma;

  // Handle overflow in standardization
  if (!Number.isFinite(p)) {
    return (x < mu) ? zeroBoundLower : zeroBoundUpper;
  }

  // Delegate to implementation for standard normal N(0, 1)
  return normalCDFImpl(p, lower_tail, log_p);
}

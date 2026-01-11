import gammaQuantile from "./gammaQuantile";

/**
 * Calculates the quantile function for the chi-squared distribution.
 *
 * This function uses the relationship between the chi-squared distribution
 * and the gamma distribution to compute the quantile.
 *
 * @param p Probability value
 * @param df Degrees of freedom (nu) parameter
 * @param lower_tail If true, probabilities are P[X ≤ x], otherwise, P[X > x]
 * @param log_p If true, probabilities p are given as log(p)
 * @returns The quantile corresponding to the given probability
 */
export default function chisqQuantile(p: number, df: number,
                                      lower_tail: boolean = true,
                                      log_p: boolean = false): number {
  return gammaQuantile(p, 0.5 * df, 2.0, lower_tail, log_p);
}

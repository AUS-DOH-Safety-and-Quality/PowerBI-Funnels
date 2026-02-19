import gammaCDF from "./gammaCDF";

/**
 * Calculates the cumulative distribution function (CDF) for the chi-squared distribution.
 *
 * This function uses the relationship between the chi-squared distribution
 * and the gamma distribution to compute the CDF.
 *
 * @param x The quantile at which to evaluate the CDF.
 * @param df Degrees of freedom (nu) parameter
 * @param lower_tail If true, probabilities are P[X ≤ x], otherwise, P[X > x]
 * @param log_p If true, probabilities p are given as log(p)
 * @returns The quantile corresponding to the given probability
 */
export default function chisqCDF(x: number, df: number,
                                      lower_tail: boolean = true,
                                      log_p: boolean = false): number {
  // Chi-squared distribution is a special case of the gamma distribution:
  // If X ~ chi-squared(df), then X ~ Gamma(shape = df/2, scale = 2)
  return gammaCDF(x, 0.5 * df, 2.0, lower_tail, log_p);
}

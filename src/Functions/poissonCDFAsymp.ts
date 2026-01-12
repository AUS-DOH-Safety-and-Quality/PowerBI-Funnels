import log1pmx from "./log1pmx";
import normalCDF from "./normalCDF";
import normalDensity from "./normalDensity";

/**
 * Asymptotic expansion for the Poisson CDF for large lambda and x
 *
 * The below code was adapted from the ppois_asymp function in R's source code.
 *
 * @param x Point at which to evaluate the CDF
 * @param lambda Rate parameter of the Poisson distribution
 * @param lower_tail If true, probabilities are P[X ≤ x], otherwise, P[X > x]
 * @param log_p If true, probabilities p are given as log(p)
 * @returns The cumulative probability up to x for the Poisson distribution with given parameters.
 */
export default function poissonCDFAsymp(x: number, lambda: number,
                                        lower_tail: boolean, log_p: boolean): number {
  // Coefficients for asymptotic expansion
  // These are derived from the Edgeworth expansion of the Poisson distribution
  const coefs_a: readonly number[] = [
    -1e99, /* placeholder used for 1-indexing */
    2/3.,
    -4/135.,
    8/2835.,
    16/8505.,
    -8992/12629925.,
    -334144/492567075.,
    698752/1477701225.
  ];

  const coefs_b: readonly number[] = [
    -1e99, /* placeholder */
    1/12.,
    1/288.,
    -139/51840.,
    -571/2488320.,
    163879/209018880.,
    5246819/75246796800.,
    -534703531/902961561600.
  ];

  let elfb: number, elfb_term: number;
  let res12: number, res1_term: number, res1_ig: number, res2_term: number, res2_ig: number;
  let dfm: number, pt_: number, s2pt: number, f: number, np: number;
  let i: number;

  // Compute deviation from mean
  dfm = lambda - x;

  // pt_ is related to the relative deviation: -log(1 + (lambda-x)/x) + (lambda-x)/x
  pt_ = -log1pmx(dfm / x);

  // s2pt is the signed square root: sqrt(2 * x * pt_)
  // This transforms the Poisson to approximate normal
  s2pt = Math.sqrt(2 * x * pt_);
  if (dfm < 0) {
    s2pt = -s2pt;  // Preserve sign based on deviation direction
  }

  // Compute the correction terms using asymptotic series
  res12 = 0;
  res1_ig = res1_term = Math.sqrt(x);
  res2_ig = res2_term = s2pt;
  for (i = 1; i < 8; i++) {
    res12 += res1_ig * coefs_a[i];
    res12 += res2_ig * coefs_b[i];
    res1_term *= pt_ / i;
    res2_term *= 2 * pt_ / (2 * i + 1);
    res1_ig = res1_ig / x + res1_term;
    res2_ig = res2_ig / x + res2_term;
  }

  // Compute the leading factor for the expansion
  elfb = x;
  elfb_term = 1;
  for (i = 1; i < 8; i++) {
    elfb += elfb_term * coefs_b[i];
    elfb_term /= x;
  }
  if (!lower_tail) {
    elfb = -elfb;
  }

  // f is the correction factor to apply to the normal approximation
  // f is the correction factor to apply to the normal approximation
  f = res12 / elfb;

  // Get base normal CDF at the transformed point
  np = normalCDF(s2pt, 0, 1, !lower_tail, log_p);

  // Apply correction to normal approximation
  if (log_p) {
    let i_tail: boolean = !lower_tail;
    let n_d_over_p: number;  // Ratio of normal density to probability

    // Handle sign for tail computation
    if (s2pt < 0) {
      s2pt = -s2pt;
      i_tail = !i_tail;
    }

    // For large s2pt in the correct tail, use asymptotic expansion
    // This avoids computing exp(np) which could underflow
    if (s2pt > 10 && !i_tail) {
      // Asymptotic expansion: phi(x)/Phi(x) ≈ x / (1 + 1/x² - 1/x⁴ + ...)
      let term: number = 1 / s2pt;
      let sum: number = term;
      let x2: number = s2pt * s2pt;
      let i: number = 1;

      while (Math.abs(term) > Number.EPSILON * sum) {
        term *= -i / x2;
        sum += term;
        i += 2;
      }

      n_d_over_p = 1 / sum;
    } else {
      // Direct computation for moderate values
      let d: number = normalDensity(s2pt, 0, 1, false);
      n_d_over_p =  d / Math.exp(np);
    }

    // log(P) = log(Phi(s2pt)) + log(1 + f * phi(s2pt)/Phi(s2pt))
    return np + Math.log1p(f * n_d_over_p);
  } else {
    // Non-log case: P = Phi(s2pt) + f * phi(s2pt)
    return np + f * normalDensity(s2pt, 0, 1, log_p);
  }
}

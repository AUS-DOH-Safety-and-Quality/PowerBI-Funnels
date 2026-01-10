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

  dfm = lambda - x;
  pt_ = -log1pmx(dfm / x);
  s2pt = Math.sqrt(2 * x * pt_);
  if (dfm < 0) {
    s2pt = -s2pt;
  }

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

  elfb = x;
  elfb_term = 1;
  for (i = 1; i < 8; i++) {
    elfb += elfb_term * coefs_b[i];
    elfb_term /= x;
  }
  if (!lower_tail) {
    elfb = -elfb;
  }

  f = res12 / elfb;

  np = normalCDF(s2pt, 0, 1, !lower_tail, log_p);

  if (log_p) {
    let i_tail: boolean = !lower_tail;
    let n_d_over_p: number;

    if (s2pt < 0) {
      s2pt = -s2pt;
      i_tail = !i_tail;
    }

    if (s2pt > 10 && !i_tail) {
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
      let d: number = normalDensity(s2pt, 0, 1, false);
      n_d_over_p =  d / Math.exp(np);
    }

    return np + Math.log1p(f * n_d_over_p);
  } else {
    return np + f * normalDensity(s2pt, 0, 1, log_p);
  }
}

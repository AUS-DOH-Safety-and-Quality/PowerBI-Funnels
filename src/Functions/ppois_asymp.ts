import log1pmx from "./log1pmx";
import pnorm from "./pnorm";
import dnorm from "./dnorm";
import dpnorm from "./dpnorm";

export default function ppois_asymp(x: number, lambda: number, lower_tail: boolean, log_p: boolean): number {
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
  /* If lambda is large, the distribution is highly concentrated
      about lambda.  So representation error in x or lambda can lead
      to arbitrarily large values of pt_ and hence divergence of the
      coefficients of this approximation.
  */
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
  if (!lower_tail) elfb = -elfb;

  f = res12 / elfb;

  np = pnorm(s2pt, 0.0, 1.0, !lower_tail, log_p);

  if (log_p) {
    let n_d_over_p = dpnorm(s2pt, !lower_tail, np);
    return np + Math.log1p(f * n_d_over_p);
  } else {
    let nd = dnorm(s2pt, 0., 1., log_p);
    return np + f * nd;
  }
}

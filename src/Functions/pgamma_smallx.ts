import dpois_raw from "./dpois_raw";
import lgamma1p from "./lgamma1p";
import R_Log1_Exp from "./R_Log1_Exp";

export default function pgamma_smallx(x: number, alph: number, lower_tail: boolean, log_p: boolean): number {
  let sum: number = 0, c: number = alph, n: number = 0, term: number = 1;

    /*
     * Relative to 6.5.29 all terms have been multiplied by alph
     * and the first, thus being 1, is omitted.
     */

  while (Math.abs(term) > Number.EPSILON * Math.abs(sum)) {
    n++;
    c *= -x / n;
    term = c / (alph + n);
    sum += term;
  };

  if (lower_tail) {
    let f1: number = log_p ? Math.log1p(sum) : 1 + sum;
    let f2: number;
    if (alph > 1) {
      f2 = dpois_raw(alph, x, log_p);
      f2 = log_p ? f2 + x : f2 * Math.exp(x);
    } else if (log_p) {
      f2 = alph * Math.log(x) - lgamma1p(alph);
    } else {
      f2 = Math.pow(x, alph) / Math.exp(lgamma1p(alph));
    }
    return log_p ? f1 + f2 : f1 * f2;
  } else {
    let lf2: number = alph * Math.log(x) - lgamma1p(alph);

    if (log_p) {
      return R_Log1_Exp(Math.log1p(sum) + lf2);
    } else {
      let f1m1: number = sum;
      let f2m1: number = Math.expm1(lf2);
      return -(f1m1 + f2m1 + f1m1 * f2m1);
    }
  }
}

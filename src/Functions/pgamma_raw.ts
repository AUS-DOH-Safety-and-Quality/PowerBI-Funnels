import pgamma_smallx from "./pgamma_smallx";
import dpois_wrap from "./dpois_wrap";
import pd_upper_series from "./pd_upper_series";
import pd_lower_cf from "./pd_lower_cf";
import pd_lower_series from "./pd_lower_series";
import ppois_asymp from "./ppois_asymp";

export default function pgamma_raw(x: number,  alph: number, lower_tail: boolean, log_p: boolean): number {
/* Here, assume that  (x,alph) are not NA  &  alph > 0 . */

  let res: number;
  if (x <= 0) {
    return (lower_tail ? (log_p ? Number.NEGATIVE_INFINITY : 0.) : (log_p ? 0. : 1.));
  }

  if (x >= Number.POSITIVE_INFINITY) {
    return (lower_tail ? (log_p ? 0. : 1.) : (log_p ? Number.NEGATIVE_INFINITY : 0.));
  }

  if (x < 1) {
    res = pgamma_smallx(x, alph, lower_tail, log_p);
  } else if (x <= alph - 1 && x < 0.8 * (alph + 50)) {
    /* incl. large alph compared to x */
    let sum: number = pd_upper_series(x, alph, log_p);/* = x/alph + o(x/alph) */
    let d: number = dpois_wrap(alph, x, log_p);
    if (!lower_tail) {
      res = log_p ? ((d + sum) > Math.LN2 ? Math.log(-Math.expm1(d + sum)) : Math.log1p(-Math.exp(d + sum))) : 1 - d * sum;
    } else {
      res = log_p ? sum + d : sum * d;
    }
  } else if (alph - 1 < x && alph < 0.8 * (x + 50)) {
    /* incl. large x compared to alph */
    let sum: number;
    let d: number = dpois_wrap(alph, x, log_p);
    if (alph < 1) {
      if (x * Number.EPSILON > 1 - alph) {
        sum = (log_p ? 0 : 1);
      } else {
        let f: number = pd_lower_cf(alph, x - (alph - 1)) * x / alph;
        /* = [alph/(x - alph+1) + o(alph/(x-alph+1))] * x/alph = 1 + o(1) */
        sum = log_p ? Math.log(f) : f;
      }
    } else {
      sum = pd_lower_series(x, alph - 1);/* = (alph-1)/x + o((alph-1)/x) */
      sum = log_p ? Math.log1p(sum) : 1 + sum;
    }

    if (!lower_tail) {
      res = log_p ? sum + d : sum * d;
    } else {
      res = log_p ? ((d + sum) > Math.LN2 ? Math.log(-Math.expm1(d + sum)) : Math.log1p(-Math.exp(d + sum))) : 1 - d * sum;
    }
  } else { /* x >= 1 and x fairly near alph. */
    res = ppois_asymp(alph - 1, x, !lower_tail, log_p);
  }

  /*
    * We lose a fair amount of accuracy to underflow in the cases
    * where the final result is very close to DBL_MIN.   In those
    * cases, simply redo via log space.
    */
  if (!log_p && res < Number.MIN_VALUE / Number.EPSILON) {
    /* with(.Machine, double.xmin / double.eps) #|-> 1.002084e-292 */
    return Math.exp(pgamma_raw(x, alph, lower_tail, true));
  }

  return res;
}

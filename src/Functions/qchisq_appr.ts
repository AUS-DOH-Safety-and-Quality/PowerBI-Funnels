import lgamma1p from "./lgamma1p";
import qnorm from "./qnorm";

export default function qchisq_appr(p: number, nu: number, g: number, lower_tail: boolean, log_p: boolean, tol: number) {
  const C7: number  = 4.67;
  const C8: number  = 6.66;
  const C9: number  = 6.73;
  const C10: number  = 13.32;

  let alpha: number, a: number, c: number, ch: number, p1: number;
  let p2: number, q: number, t: number, x: number;

  if (Number.isNaN(p) || Number.isNaN(nu))
    return p + nu;
  if ( (log_p && p > 0) || (!log_p && (p < 0 || p > 1)) )
    return Number.NaN;
  if (nu <= 0)
    return Number.NaN;

  alpha = 0.5 * nu;/* = [pq]gamma() shape */
  c = alpha-1;

  if (nu < (-1.24)*(p1 = (lower_tail? (log_p ? (p) : Math.log(p)) : (log_p ? ((p) > -Math.LN2 ? Math.log(-Math.expm1(p)) : Math.log1p(-Math.exp(p))) : Math.log1p(-p))))) {  /* for small chi-squared */
    /* log(alpha) + g = log(alpha) + log(gamma(alpha)) =
    *        = log(alpha*gamma(alpha)) = lgamma(alpha+1) suffers from
    *  catastrophic cancellation when alpha << 1
    */
    let lgam1pa: number = (alpha < 0.5) ? lgamma1p(alpha) : (Math.log(alpha) + g);
    ch = Math.exp((lgam1pa + p1)/alpha + Math.LN2);

  } else if(nu > 0.32) {  /*  using Wilson and Hilferty estimate */

    x = qnorm(p, 0, 1, lower_tail, log_p);
    p1 = 2./(9*nu);
    ch = nu*Math.pow(x*Math.sqrt(p1) + 1-p1, 3);

    /* approximation for p tending to 1: */
    if( ch > 2.2*nu + 6 )
        ch = -2*((lower_tail? (log_p ? ((p) > -Math.LN2 ? Math.log(-Math.expm1(p)) : Math.log1p(-Math.exp(p))) : Math.log1p(-p)): (log_p ? (p) : Math.log(p))) - c*Math.log(0.5*ch) + g);
  } else { /* "small nu" : 1.24*(-log(p)) <= nu <= 0.32 */
    ch = 0.4;
    a = (lower_tail? (log_p ? ((p) > -Math.LN2 ? Math.log(-Math.expm1(p)) : Math.log1p(-Math.exp(p))) : Math.log1p(-p)): (log_p ? (p) : Math.log(p))) + g + c*Math.LN2;

    while (Math.abs(q - ch) > tol * Math.abs(ch)) {
      q = ch;
      p1 = 1. / (1+ch*(C7+ch));
      p2 = ch*(C9+ch*(C8+ch));
      t = -0.5 +(C7+2*ch)*p1 - (C9+ch*(C10+3*ch))/p2;
      ch -= (1- Math.exp(a+0.5*ch)*p2*p1)/t;
    }
  }

  return ch;
}

import { TWO_PI } from "./Constants";
import ldexp from "./ldexp";

export default function qnorm(p: number, mu: number, sigma: number, lower_tail: boolean, log_p: boolean) {
  let p_: number, q: number, r: number, val: number;

  if (Number.isNaN(p) || Number.isNaN(mu) || Number.isNaN(sigma)) {
    return p + mu + sigma;
  }

  if (log_p) {
    if (p > 0) return Number.NaN;
    if(p == 0)
      return lower_tail ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
    if (p == Number.NEGATIVE_INFINITY)
      return lower_tail ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
  } else {
    if(p < 0 || p > 1) return Number.NaN;
    if(p == 0) return lower_tail ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY;
    if(p == 1) return lower_tail ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
  }

  if(sigma  < 0)  return Number.NaN;
  if(sigma == 0)  return mu;

  p_ = (log_p ? (lower_tail ? Math.exp(p) : - Math.expm1(p)) : (lower_tail ? (p) : (0.5 - (p) + 0.5)));/* real lower_tail prob. p */
  q = p_ - 0.5;


/*-- use AS 241 --- */
/* double ppnd16_(double *p, long *ifault)*/
/*      ALGORITHM AS241  APPL. STATIST. (1988) VOL. 37, NO. 3

        Produces the normal deviate Z corresponding to a given lower
        tail area of P; Z is accurate to about 1 part in 10**16.

        (original fortran code used PARAMETER(..) for the coefficients
         and provided hash codes for checking them...)
*/
  if (Math.abs(q) <= .425) {/* |p~ - 0.5| <= .425  <==> 0.075 <= p~ <= 0.925 */
    r = .180625 - q * q; // = .425^2 - q^2  >= 0
    val =
      q * (((((((r * 2509.0809287301226727 +
                  33430.575583588128105) * r + 67265.770927008700853) * r +
                45921.953931549871457) * r + 13731.693765509461125) * r +
              1971.5909503065514427) * r + 133.14166789178437745) * r +
            3.387132872796366608)
      / (((((((r * 5226.495278852854561 +
                28729.085735721942674) * r + 39307.89580009271061) * r +
              21213.794301586595867) * r + 5394.1960214247511077) * r +
            687.1870074920579083) * r + 42.313330701600911252) * r + 1.);
  } else { /* closer than 0.075 from {0,1} boundary :
      *  r := log(p~);  p~ = min(p, 1-p) < 0.075 :  */
    let lp: number;
    if(log_p && ((lower_tail && q <= 0) || (!lower_tail && q > 0))) {
        lp = p;
    } else {
        lp = Math.log( (q > 0) ? (log_p ? (lower_tail ? -Math.expm1(p) : Math.exp(p)) : (lower_tail ? (0.5 - (p) + 0.5) : (p))) /* 1-p */ : p_ /* = R_DT_Iv(p) ^=  p */);
    }
    // r = sqrt( - log(min(p,1-p)) )  <==>  min(p, 1-p) = exp( - r^2 ) :
    r = Math.sqrt(-lp);
    if (r <= 5.) { /* <==> min(p,1-p) >= exp(-25) ~= 1.3888e-11 */
      r += -1.6;
      val = (((((((r * 7.7454501427834140764e-4 +
                  .0227238449892691845833) * r + .24178072517745061177) *
                r + 1.27045825245236838258) * r +
              3.64784832476320460504) * r + 5.7694972214606914055) *
            r + 4.6303378461565452959) * r +
            1.42343711074968357734)
          / (((((((r *
                    1.05075007164441684324e-9 + 5.475938084995344946e-4) *
                  r + .0151986665636164571966) * r +
                  .14810397642748007459) * r + .68976733498510000455) *
                r + 1.6763848301838038494) * r +
              2.05319162663775882187) * r + 1.);
    } else if(r <= 27) { /* p is very close to  0 or 1: r in (5, 27] :
    *  r >   5 <==> min(p,1-p)  < exp(-25) = 1.3888..e-11
    *  r <= 27 <==> min(p,1-p) >= exp(-27^2) = exp(-729) ~= 2.507972e-317
    * i.e., we are just barely in the range where min(p, 1-p) has not yet underflowed to zero.
    */
      // Wichura, p.478: minimax rational approx R_3(t) is for 5 <= t <= 27  (t :== r)
      r += -5.;
      val = (((((((r * 2.01033439929228813265e-7 +
                  2.71155556874348757815e-5) * r +
                .0012426609473880784386) * r + .026532189526576123093) *
              r + .29656057182850489123) * r +
              1.7848265399172913358) * r + 5.4637849111641143699) *
            r + 6.6579046435011037772)
          / (((((((r *
                    2.04426310338993978564e-15 + 1.4215117583164458887e-7)*
                  r + 1.8463183175100546818e-5) * r +
                  7.868691311456132591e-4) * r + .0148753612908506148525)
                * r + .13692988092273580531) * r +
              .59983220655588793769) * r + 1.);
    } else { // r > 27: p is *really* close to 0 or 1 .. practically only when log_p =TRUE
      if (r >= 6.4e8) { // p is *very extremely* close to 0 or 1
        // Using the asymptotical formula ("0-th order"): qn = sqrt(2*s)
        val = r * Math.SQRT2;
      } else {
        let s2 = -ldexp(lp, 1), // = -2*lp = 2s
        x2 = s2 - Math.log(TWO_PI * s2); // = xs_1
        // if(r >= 36000.)  # <==> s >= 36000^2   use x2 = xs_1  above
        if(r < 36000.) {
          x2 = s2 - Math.log(TWO_PI * x2) - 2./(2. + x2); // == xs_2
          if(r < 840.) { // 27 < r < 840
            x2 = s2 - Math.log(TWO_PI * x2) + 2*Math.log1p(- (1 - 1/(4 + x2))/(2. + x2)); // == xs_3
            if(r < 109.) { // 27 < r < 109
              x2 = s2 - Math.log(TWO_PI * x2) + 2*Math.log1p(- (1 - (1 - 5/(6 + x2))/(4. + x2))/(2. + x2)); // == xs_4
              if(r < 55.) { // 27 < r < 55
                x2 = s2 - Math.log(TWO_PI * x2) + 2*Math.log1p(- (1 - (1 - (5 - 9/(8. + x2))/(6. + x2))/(4. + x2))/(2. + x2)); // == xs_5
              }
            }
          }
        }
        val = Math.sqrt(x2);
      }
    }
    if (q < 0.0)
      val = -val;
  }
  return mu + sigma * val;
}

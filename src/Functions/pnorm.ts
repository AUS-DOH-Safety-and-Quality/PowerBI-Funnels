import { SQRT_THIRTY_TWO, ONE_DIV_SQRT_TWO_PI } from "./Constants";
import ldexp from "./ldexp";

function pnorm_both(x: number, i_tail: number, log_p: boolean): {cum: number, ccum: number} {
/* i_tail in {0,1,2} means: "lower", "upper", or "both" :
   if(lower) return  *cum := P[X <= x]
   if(upper) return *ccum := P[X >  x] = 1 - P[X <= x]
*/
  const a: readonly number[] = [
    2.2352520354606839287,
    161.02823106855587881,
    1067.6894854603709582,
    18154.981253343561249,
    0.065682337918207449113
  ];
  const b: readonly number[] = [
    47.20258190468824187,
    976.09855173777669322,
    10260.932208618978205,
    45507.789335026729956
  ];
  const c: readonly number[] = [
    0.39894151208813466764,
    8.8831497943883759412,
    93.506656132177855979,
    597.27027639480026226,
    2494.5375852903726711,
    6848.1904505362823326,
    11602.651437647350124,
    9842.7148383839780218,
    1.0765576773720192317e-8
  ];
  const d: readonly number[] = [
    22.266688044328115691,
    235.38790178262499861,
    1519.377599407554805,
    6485.558298266760755,
    18615.571640885098091,
    34900.952721145977266,
    38912.003286093271411,
    19685.429676859990727
  ];
  const p: readonly number[] = [
    0.21589853405795699,
    0.1274011611602473639,
    0.022235277870649807,
    0.001421619193227893466,
    2.9112874951168792e-5,
    0.02307344176494017303
  ];
  const q: readonly number[] = [
    1.28426009614491121,
    0.468238212480865118,
    0.0659881378689285515,
    0.00378239633202758244,
    7.29751555083966205e-5
  ];

  let xden: number, xnum: number, temp: number, del: number, eps: number, xsq: number, y: number;
  let i: number, lower: boolean, upper: boolean;

  if(Number.isNaN(x)) {
    return {cum: x, ccum: x};
  }

  /* Consider changing these : */
  eps = Number.EPSILON * 0.5;

  /* i_tail in {0,1,2} =^= {lower, upper, both} */
  lower = i_tail != 1;
  upper = i_tail != 0;
  let cum: number = 0;
  let ccum: number = 0;

  y = Math.abs(x);
  if (y <= 0.67448975) { /* qnorm(3/4) = .6744.... -- earlier had 0.66291 */
    if (y > eps) {
      xsq = x * x;
      xnum = a[4] * xsq;
      xden = xsq;
      for (i = 0; i < 3; ++i) {
        xnum = (xnum + a[i]) * xsq;
        xden = (xden + b[i]) * xsq;
      }
    } else {
      xnum = xden = 0.0;
    }

    temp = x * (xnum + a[3]) / (xden + b[3]);
    if (lower) {
      cum = 0.5 + temp;
    }
    if (upper) {
      ccum = 0.5 - temp;
    }
    if (log_p) {
      if(lower) {
        cum = Math.log(cum);
      }
      if(upper) {
        ccum = Math.log(ccum);
      }
    }
  } else if (y <= SQRT_THIRTY_TWO) {

    /* Evaluate pnorm for 0.674.. = qnorm(3/4) < |x| <= sqrt(32) ~= 5.657 */

    xnum = c[8] * y;
    xden = y;
    for (i = 0; i < 7; ++i) {
      xnum = (xnum + c[i]) * y;
      xden = (xden + d[i]) * y;
    }
    temp = (xnum + c[7]) / (xden + d[7]);

    xsq = ldexp(Math.trunc(ldexp(y, 4)), -4);
    del = (y - xsq) * (y + xsq);
    if(log_p) {
      cum = (-xsq * ldexp(xsq, -1)) -ldexp(del, -1) + Math.log(temp);
      if((lower && x > 0.) || (upper && x <= 0.)) {
        ccum = Math.log1p(-Math.exp(-xsq * ldexp(xsq, -1)) * Math.exp(-ldexp(del, -1)) * temp);
      }
    } else {
      cum = Math.exp(-xsq * ldexp(xsq, -1)) * Math.exp(-ldexp(del, -1)) * temp;
      ccum = 1.0 - cum;
    }
    if (x > 0.) {
      temp = cum;
      if (lower) {
        cum = ccum;
      }
      ccum = temp;
    }
  /* else    |x| > sqrt(32) = 5.657 :
  * the next two case differentiations were really for lower=T, log=F
  * Particularly   *not*  for  log_p !

  * Cody had (-37.5193 < x  &&  x < 8.2924) ; R originally had y < 50
  *
  * Note that we do want symmetry(0), lower/upper -> hence use y
  */
  } else if((log_p && y < 1e170) || (lower && -38.4674 < x  &&  x < 8.2924) || (upper && -8.2924  < x  &&  x < 38.4674)) {
    /* Evaluate pnorm for x in (-37.5, -5.657) union (5.657, 37.5) */
    xsq = 1.0 / (x * x); /* (1./x)*(1./x) might be better */
    xnum = p[5] * xsq;
    xden = xsq;
    for (i = 0; i < 4; ++i) {
      xnum = (xnum + p[i]) * xsq;
      xden = (xden + q[i]) * xsq;
    }
    temp = xsq * (xnum + p[4]) / (xden + q[4]);
    temp = (ONE_DIV_SQRT_TWO_PI - temp) / y;

    xsq = ldexp(Math.trunc(ldexp(x, 4)), -4);
    del = (x - xsq) * (x + xsq);
    if (log_p) {
      cum = (-xsq * ldexp(xsq, -1)) -ldexp(del, -1) + Math.log(temp);
      if ((lower && x > 0.) || (upper && x <= 0.)) {
        ccum = Math.log1p(-Math.exp(-xsq * ldexp(xsq, -1)) * Math.exp(-ldexp(del, -1)) * temp);
      }
    } else {
      cum = Math.exp(-xsq * ldexp(xsq, -1)) * Math.exp(-ldexp(del, -1)) * temp;
      ccum = 1.0 - cum;
    }
    if (x > 0.) {
      temp = cum;
      if (lower) {
        cum = ccum;
      }
      ccum = temp;
    }
  } else { /* large |x| such that probs are 0 or 1 */
    if(x > 0) {
      cum = (log_p ? 0. : 1.);
      ccum = (log_p ? Number.NEGATIVE_INFINITY : 0.);
    } else {
      cum = (log_p ? Number.NEGATIVE_INFINITY : 0.);
      ccum = (log_p ? 0. : 1.);
    }
  }

  return {cum: cum, ccum: ccum};
}

export default function pnorm(x: number, mu: number, sigma: number, lower_tail: boolean, log_p: boolean): number {
  let p: number, cp: number;

  /* Note: The structure of these checks has been carefully thought through.
    * For example, if x == mu and sigma == 0, we get the correct answer 1.
    */
  if(Number.isNaN(x) || Number.isNaN(mu) || Number.isNaN(sigma))
    return x + mu + sigma;
  if(!Number.isFinite(x) && mu == x) return Number.NaN;/* x-mu is NaN */
  if (sigma <= 0) {
    if(sigma < 0) Number.NaN;;
      /* sigma = 0 : */
      return (x < mu) ? (lower_tail ? (log_p ? Number.NEGATIVE_INFINITY : 0.) : (log_p ? 0. : 1.))
                      : (lower_tail ? (log_p ? 0. : 1.) : (log_p ? Number.NEGATIVE_INFINITY : 0.));
  }
  p = (x - mu) / sigma;
  if(!Number.isFinite(p))
    return (x < mu) ? (lower_tail ? (log_p ? Number.NEGATIVE_INFINITY : 0.) : (log_p ? 0. : 1.))
                    : (lower_tail ? (log_p ? 0. : 1.) : (log_p ? Number.NEGATIVE_INFINITY : 0.));
  x = p;

  ({cum: p, ccum: cp} = pnorm_both(x, (lower_tail ? 0 : 1), log_p));

  return(lower_tail ? p : cp);
}

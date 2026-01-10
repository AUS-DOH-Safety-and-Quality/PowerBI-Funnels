import lgamma from "./lgamma";
import gammaCDFImpl from "./gammaCDFImpl";
import gammaNewtonIter from "./gammaNewtonIter";
import qchisq_appr from "./qchisq_appr";

export default function qgamma(p: number, alpha: number, scale: number, lower_tail: boolean, log_p: boolean): number {
  const EPS1: number = 1e-2;/* accuracy of AS 241 */
  const EPS2: number = 5e-7/* final precision of AS 91 */
  const EPS_N: number = 1e-15/* precision of Newton step / iterations */

  const MAXIT: number = 1000/* was 20 */
  const pMIN: number = 1e-100   /* was 0.000002 = 2e-6 */
  const pMAX: number = (1-1e-14)/* was (1-1e-12) and 0.999998 = 1 - 2e-6 */

  const i420: number = 1 / 420;
  const i2520: number = 1 / 2520;
  const i5040: number = 1 / 5040;

  let p_: number, a: number, b: number, c: number, g: number, ch: number, ch0: number, p1: number;
  let p2: number, q: number, s1: number, s2: number, s3: number, s4: number, s5: number, s6: number, t: number, x: number;
  let i: number, max_it_Newton: number = 1;

  if (Number.isNaN(p) || Number.isNaN(alpha) || Number.isNaN(scale)) {
    return p + alpha + scale;
  }
  if (log_p) {
    if(p > 0) return Number.NaN;
    if(p == 0) return lower_tail ? Number.POSITIVE_INFINITY : 0;
    if (p == Number.NEGATIVE_INFINITY) return lower_tail ? 0 : Number.POSITIVE_INFINITY;
  } else {
    if(p < 0 || p > 1) return Number.NaN;
    if(p == 0) return lower_tail ? 0 : Number.POSITIVE_INFINITY;
    if(p == 1) return lower_tail ? Number.POSITIVE_INFINITY : 0;
  }

  if (alpha < 0 || scale <= 0) return Number.NaN;

  if (alpha == 0) /* all mass at 0 : */ return 0.;

  if (alpha < 1e-10) {
      /* Warning seems unnecessary now: */
    max_it_Newton = 7;/* may still be increased below */
  }

  p_ = (log_p ? (lower_tail ? Math.exp(p) : - Math.expm1(p)) : (lower_tail ? (p) : (0.5 - (p) + 0.5)))
  g = lgamma(alpha);

  ch = qchisq_appr(p, 2*alpha, g, lower_tail, log_p, EPS1);

  if (!Number.isFinite(ch)) {
    /* forget about all iterations! */
    max_it_Newton = 0;
    return gammaNewtonIter(ch, p, alpha, scale, lower_tail, log_p, max_it_Newton, EPS_N);
  }

  if (ch < EPS2) {/* Corrected according to AS 91; MM, May 25, 1999 */
    max_it_Newton = 20;
    return gammaNewtonIter(ch, p, alpha, scale, lower_tail, log_p, max_it_Newton, EPS_N);
  }

  /* FIXME: This (cutoff to {0, +Inf}) is far from optimal
    * -----  when log_p or !lower_tail, but NOT doing it can be even worse */
  if (p_ > pMAX || p_ < pMIN) {
    /* did return ML_POSINF or 0.;  much better: */
    max_it_Newton = 20;
    return gammaNewtonIter(ch, p, alpha, scale, lower_tail, log_p, max_it_Newton, EPS_N);
  }

  c = alpha-1;
  s6 = (120+c*(346+127*c)) * i5040; /* used below, is "const" */

  ch0 = ch;/* save initial approx. */
  for(i=1; i <= MAXIT; i++ ) {
    q = ch;
    p1 = 0.5*ch;
    p2 = p_ - gammaCDFImpl(p1, alpha, true, false);

    if (!Number.isFinite(p2) || ch <= 0) {
      ch = ch0;
      max_it_Newton = 27;
      return gammaNewtonIter(ch, p, alpha, scale, lower_tail, log_p, max_it_Newton, EPS_N);
    }/*was  return ML_NAN;*/

    t = p2 * Math.exp(alpha * Math.LN2 + g + p1 - c * Math.log(ch));
    b = t/ch;
    a = 0.5*t - b*c;
    s1 = (210+ a*(140+a*(105+a*(84+a*(70+60*a))))) * i420;
    s2 = (420+ a*(735+a*(966+a*(1141+1278*a)))) * i2520;
    s3 = (210+ a*(462+a*(707+932*a))) * i2520;
    s4 = (252+ a*(672+1182*a) + c*(294+a*(889+1740*a))) * i5040;
    s5 = (84+2264*a + c*(1175+606*a)) * i2520;

    ch += t*(1+0.5*t*s1-b*c*(s1-b*(s2-b*(s3-b*(s4-b*(s5-b*s6))))));
    if (Math.abs(q - ch) < EPS2*ch) {
      return gammaNewtonIter(ch, p, alpha, scale, lower_tail, log_p, max_it_Newton, EPS_N);
    }
    if(Math.abs(q - ch) > 0.1*ch) {/* diverging? -- also forces ch > 0 */
      if (ch < q) {
        ch = 0.9 * q;
       } else {
        ch = 1.1 * q;
       }
    }
  }
  return gammaNewtonIter(ch, p, alpha, scale, lower_tail, log_p, max_it_Newton, EPS_N);
}

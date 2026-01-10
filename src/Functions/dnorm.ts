import { LOG_SQRT_TWO_PI, ONE_DIV_SQRT_TWO_PI } from "./Constants";
import ldexp from "./ldexp";

export default function dnorm(x: number, mu: number, sigma: number, log_p: boolean): number {
  if (Number.isNaN(x) || Number.isNaN(mu) || Number.isNaN(sigma)) {
    return x + mu + sigma;
  }
  if (sigma < 0) {
    return Number.NaN;
  }
  if (!Number.isFinite(sigma)) {
    return (log_p ? Number.NEGATIVE_INFINITY : 0.);
  }
  if (!Number.isFinite(x) && mu == x) {
    return Number.NaN;/* x-mu is NaN */
  }
  if (sigma == 0) {
    return (x == mu) ? Number.POSITIVE_INFINITY : (log_p ? Number.NEGATIVE_INFINITY : 0.);
  }

  x = (x - mu) / sigma;

  if (!Number.isFinite(x)) {
    return (log_p ? Number.NEGATIVE_INFINITY : 0.);
  }

  x = Math.abs(x);
  if (x >= 2 * Math.sqrt(Number.MAX_VALUE)) {
    return (log_p ? Number.NEGATIVE_INFINITY : 0.);
  }
  if (log_p) {
    return -(LOG_SQRT_TWO_PI + 0.5 * x * x + Math.log(sigma));
  }
    //  M_1_SQRT_2PI = 1 / sqrt(2 * pi)

  // more accurate, less fast :
  if (x < 5) {
    return ONE_DIV_SQRT_TWO_PI * Math.exp(-0.5 * x * x) / sigma;
  }

  /* ELSE:

    * x*x  may lose upto about two digits accuracy for "large" x
    * Morten Welinder's proposal for PR#15620
    * https://bugs.r-project.org/show_bug.cgi?id=15620

    * -- 1 --  No hoop jumping when we underflow to zero anyway:

    *  -x^2/2 <         log(2)*.Machine$double.min.exp  <==>
    *     x   > sqrt(-2*log(2)*.Machine$double.min.exp) =IEEE= 37.64031
    * but "thanks" to denormalized numbers, underflow happens a bit later,
    *  effective.D.MIN.EXP <- with(.Machine, double.min.exp + double.ulp.digits)
    * for IEEE, DBL_MIN_EXP is -1022 but "effective" is -1074
    * ==> boundary = sqrt(-2*log(2)*(.Machine$double.min.exp + .Machine$double.ulp.digits))
    *              =IEEE=  38.58601
    * [on one x86_64 platform, effective boundary a bit lower: 38.56804]
    */
  if (x > Math.sqrt(-2*Math.LN2*(-1021 + 1 - 53))) {
    return 0;
  }

    /* Now, to get full accuracy, split x into two parts,
     *  x = x1+x2, such that |x2| <= 2^-16.
     * Assuming that we are using IEEE doubles, that means that
     * x1*x1 is error free for x<1024 (but we have x < 38.6 anyway).

     * If we do not have IEEE this is still an improvement over the naive formula.
     */
  let x1: number = ldexp( Math.trunc(ldexp(x, 16)), -16);
  let x2: number = x - x1;
  return ONE_DIV_SQRT_TWO_PI / sigma * (Math.exp(-0.5 * x1 * x1) * Math.exp( (-0.5 * x2 - x1) * x2 ) );
}

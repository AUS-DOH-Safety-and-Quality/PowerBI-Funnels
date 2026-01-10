import pgamma_raw from "./pgamma_raw";

export default function pgamma(x: number, alph: number, scale: number, lower_tail: boolean, log_p: boolean): number {
  if (Number.isNaN(x) || Number.isNaN(alph) || Number.isNaN(scale))
    return x + alph + scale;
  if(alph < 0. || scale <= 0.)
    return Number.NaN;
  x /= scale;
  if (Number.isNaN(x)) /* eg. original x = scale = +Inf */
    return x;
  if(alph == 0.) /* limit case; useful e.g. in pnchisq() */
    return (x <= 0) ? (lower_tail ? (log_p ? Number.NEGATIVE_INFINITY : 0.) : (log_p ? 0. : 1.))
                    : (lower_tail ? (log_p ? 0. : 1.) : (log_p ? Number.NEGATIVE_INFINITY : 0.)); /* <= assert  pgamma(0,0) ==> 0 */
  return pgamma_raw(x, alph, lower_tail, log_p);
}

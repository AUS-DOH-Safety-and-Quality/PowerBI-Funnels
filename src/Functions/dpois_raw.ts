import lgamma from "./lgamma";
import stirlerr from "./stirlerr";
import ebd0 from "./ebd0";
import { TWO_PI, SQRT_TWO_PI } from "./Constants";

export default function dpois_raw(x: number, lambda: number, log_p: boolean): number {
  const x_LRG: number = 2.86111748575702815380240589208115399625e+307;
  /*       x >= 0 ; integer for dpois(), but not e.g. for pgamma()!
      lambda >= 0
  */
  if (lambda == 0) return( (x == 0) ? (log_p ? 0. : 1.) : (log_p ? Number.NEGATIVE_INFINITY : 0.) );
  if (!Number.isFinite(lambda)) return (log_p ? Number.NEGATIVE_INFINITY : 0.); // including for the case where  x = lambda = +Inf
  if (x < 0) return( (log_p ? Number.NEGATIVE_INFINITY : 0.) );
  if (x <= lambda * Number.MIN_VALUE) {
    return((log_p ? (-lambda) : Math.exp(-lambda)) );
  }
  if (lambda < x * Number.MIN_VALUE) {
    if (!Number.isFinite(x)) { // lambda < x = +Inf
      return (log_p ? Number.NEGATIVE_INFINITY : 0.);
    }
    // else
    return((log_p ? (-lambda + x*Math.log(lambda) -lgamma(x+1)) : Math.exp(-lambda + x*Math.log(lambda) -lgamma(x+1))));
  }

  // R <= 4.0.x  had   return(R_D_fexp( M_2PI*x, -stirlerr(x)-bd0(x,lambda) ));
  let {yh, yl} = ebd0(x, lambda);
  yl += stirlerr(x);
  let Lrg_x: boolean = (x >= x_LRG); //really large x  <==>  2*pi*x  overflows
  let r: number = Lrg_x ? SQRT_TWO_PI * Math.sqrt(x) // sqrt(.): avoid overflow for very large x
                        : TWO_PI * x;
  return log_p ? -yl - yh - (Lrg_x ? Math.log(r) : 0.5 * Math.log(r))
                : Math.exp(-yl) * Math.exp(-yh) / (Lrg_x ? r : Math.sqrt(r));
}

import dpois_raw from "./dpois_raw";
import lgamma from "./lgamma";

export default function dpois_wrap(x_plus_1: number, lambda: number, log_p: boolean): number {
  const M_cutoff: number = 3.196577161300664E18;
  if (!Number.isFinite(lambda))
    return (log_p ? Number.NEGATIVE_INFINITY : 0.);
  if (x_plus_1 > 1)
    return dpois_raw(x_plus_1 - 1, lambda, log_p);
  if (lambda > Math.abs(x_plus_1 - 1) * M_cutoff) {
    return (log_p ? (-lambda - lgamma(x_plus_1)) : Math.exp(-lambda - lgamma(x_plus_1)));
  } else {
    let d = dpois_raw(x_plus_1, lambda, log_p);
    return log_p
        ? d + Math.log (x_plus_1 / lambda)
        : d * (x_plus_1 / lambda);
  }
}

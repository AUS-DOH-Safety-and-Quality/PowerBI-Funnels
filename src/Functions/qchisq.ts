import qgamma from "./qgamma";

export default function qchisq(p: number, df: number, lower_tail: boolean = true, log_p: boolean = false): number {
  return qgamma(p, 0.5 * df, 2.0, lower_tail, log_p);
}

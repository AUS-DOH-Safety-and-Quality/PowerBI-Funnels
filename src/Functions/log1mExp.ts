/**
 * Numerically stable computation of log(1 - exp(x))
 *
 * @param x Value to compute log(1 - exp(x)) for
 * @returns log(1 - exp(x))
 */
export default function log1mExp(x: number): number {
  return (x > -Math.LN2) ? Math.log(-Math.expm1(x)) : Math.log1p(-Math.exp(x));
}

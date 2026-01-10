export default function R_Log1_Exp(x: number): number {
  return ((x) > -Math.LN2 ? Math.log(-Math.expm1(x)) : Math.log1p(-Math.exp(x)))
}

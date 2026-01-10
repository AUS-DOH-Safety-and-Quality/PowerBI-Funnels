import pd_lower_cf from './pd_lower_cf';

export default function pd_lower_series(lambda: number, y: number): number {
  let term: number = 1, sum: number = 0;
  while (y >= 1 && term > sum * Number.EPSILON) {
    term *= y / lambda;
    sum += term;
    y--;
  }
    /* sum =  \sum_{n=0}^ oo  y*(y-1)*...*(y - n) / lambda^(n+1)
     *     =  y/lambda * (1 + \sum_{n=1}^Inf  (y-1)*...*(y-n) / lambda^n)
     *     ~  y/lambda + o(y/lambda)
     */

  if (y != Math.floor(y)) {
    /*
    * The series does not converge as the terms start getting
    * bigger (besides flipping sign) for y < -lambda.
    */
    let f: number;

    /* FIXME: in quite few cases, adding  term*f  has no effect (f too small)
    *    and is unnecessary e.g. for pgamma(4e12, 121.1) */
    f = pd_lower_cf(y, lambda + 1 - y);

    sum += term * f;
  }

  return sum;
}

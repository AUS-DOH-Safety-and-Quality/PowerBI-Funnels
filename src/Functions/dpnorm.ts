import dnorm from "./dnorm";

export default function dpnorm(x: number, lower_tail: boolean, lp: number): number {
  if (x < 0) {
    x = -x;
    lower_tail = !lower_tail;
  }

  if (x > 10 && !lower_tail) {
    let term: number = 1 / x;
    let sum: number = term;
    let x2: number = x * x;
    let i: number = 1;

    while (Math.abs(term) > Number.EPSILON * sum) {
      term *= -i / x2;
      sum += term;
      i += 2;
    }

    return 1 / sum;
  } else {
    let d: number = dnorm(x, 0., 1., false);
    return d / Math.exp(lp);
  }
}

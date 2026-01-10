export default function pd_upper_series(x: number, y: number, log_p: boolean): number {
  let term: number = x / y;
  let sum: number = term;

  while (term > Number.EPSILON * sum) {
    y++;
    term *= x / y;
    sum += term;
  }

  return log_p ? Math.log(sum) : sum;
}

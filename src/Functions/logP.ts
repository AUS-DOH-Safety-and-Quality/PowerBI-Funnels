import log1mExp from "./log1mExp";

/**
 * Return the probability or its complement in log scale
 *
 * @param p Probability in log scale if log_p is true
 * @param lower_tail Whether to return the lower tail probability
 * @param log_p Whether the probability is given in log scale
 * @returns The probability or its complement in log scale
 */
export default function logP(p: number, lower_tail: boolean, log_p: boolean): number {
  if (lower_tail) {
    return log_p ? p : Math.log(p);
  }

  return log_p ? log1mExp(p) : Math.log1p(-p);
}

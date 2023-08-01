import { square, sum } from "../Functions"

/**
 * Estimate the dispersion ratio of the observed responses using
 *    winsorised z-scores
 *
 * @param z_adj
 * @returns
 */
export default function getPhi(z_adj: number[]): number {
  return sum(square(z_adj)) / z_adj.length;
}

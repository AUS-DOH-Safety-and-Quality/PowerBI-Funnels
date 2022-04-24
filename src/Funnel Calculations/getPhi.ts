import * as d3 from "d3";
import { square } from "../Function Broadcasting/UnaryFunctions"

/**
 * Estimate the dispersion ratio of the observed responses using
 *    winsorised z-scores
 *
 * @param z_adj
 * @returns
 */
function getPhi(z_adj: number[]): number {
  return d3.sum(square(z_adj)) / z_adj.length;
}

export default getPhi;

import * as d3 from "d3";
import winsorise from "../Data Preparation/winsorise"

/**
 * Winsorise unadjusted z-scores to remove influence of
 *    extreme observations prior to assessing/correcting
 *    for dispersion.
 *
 * @param z
 * @returns
 */
function winsoriseZScores(z: number[]): number[] {
  let z_sorted: number[] = z.sort(function(a, b){ return a - b; });
  let lower_z: number = d3.quantile(z_sorted, 0.1);
  let upper_z: number = d3.quantile(z_sorted, 0.9);

  return winsorise(z, {lower: lower_z, upper: upper_z});
}

export default winsoriseZScores;

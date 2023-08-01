import * as d3 from "../D3 Plotting Functions/D3 Modules";
import winsorise from "../Functions/winsorise"

/**
 * Winsorise unadjusted z-scores to remove influence of
 *    extreme observations prior to assessing/correcting
 *    for dispersion.
 *
 * @param z
 * @returns
 */
function winsoriseZScores(z: number[]): number[] {
  const z_sorted: number[] = z.sort(function(a, b){ return a - b; });
  const lower_z: number = d3.quantile(z_sorted, 0.1);
  const upper_z: number = d3.quantile(z_sorted, 0.9);

  return winsorise(z, {lower: lower_z, upper: upper_z});
}

export default winsoriseZScores;

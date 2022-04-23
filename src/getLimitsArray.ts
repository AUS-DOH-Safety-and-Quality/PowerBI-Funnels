import * as stats from '@stdlib/stats/base/dists';
import * as d3 from "d3";
import getTarget from "./Funnel Calculations/getTarget";
import getSE from "./Funnel Calculations/getSE";
import getY from "./Funnel Calculations/getY";
import getZScore from "./Funnel Calculations/getZScore";
import winsoriseZScore from "./Funnel Calculations/winsoriseZScore";
import getPhi from "./Funnel Calculations/getPhi";
import getTau2 from "./Funnel Calculations/getTau2";
import getLimit from "./Funnel Calculations/getLimit";
import { divide } from "./Helper Functions/BinaryBroadcasting"
import { seq } from "./Helper Functions/Utilities"
import { dataArray } from "./Interfaces"


/**
 * Function for generating an array of control limit arrays. Proportion and
 *   indirectly standardised ratios are currently supported. Overdispersion-
 *   adjusted limits can be requested, or automatically applied if determined
 *   necessary by the methods outlined in Spiegelhalter et al. (2012).
 *
 * If unadjusted limits are requested, then the following methods are used:
 *      - Proportion:          Normal approximation to the Binomial
 *      - Standardised Ratio:  Exact Poisson limits using the quantile function
 *                                 of the Chi-Squared distribution
 *
 * If overdispersion-adjusted limits are requested, then the additive random effects
 *    adjustment outlined in Spiegelhalter et al. (2012) is applied.
 *
 *  Spiegelhalter, D. J., Sherlaw-Johnson, C., Bardsley, M., Blunt, I., Wood, C., & Grigg,O. (2012).
 *      Statistical methods for healthcare regulation: Rating, screening and surveillance. Journal
 *      of the Royal Statistical Society: Series A (Statistics in Society) ,175, 1-47.
 *      doi: 10.1111/j.1467-985X.2011.01010.x
 *
 * @param numerator        - Numerator array (e.g., observed deaths)
 * @param denominator      - Denominator array (e.g., expected deaths)
 * @param maxDenominator   - Largest denominator in array
 * @param data_type        - Whether to generate Proportion ("PR") or ratio ("SR") limits
 * @param od_adjust        - Whether to adjust for overdispersion ("auto", "yes", "no")
 * @returns Array of control limit arrays and unadjusted target value for plotting
 */
function getLimitsArray(data_array_filtered: dataArray, maxDenominator: number,
                        data_type: string, od_adjust: string): number[][] {
    // Series of steps to estimate dispersion ratio (phi) and
    //    between-hospital variance (tau2). These are are used to
    //    test and adjust for overdispersion
  let target_od: number = getTarget(data_array_filtered, data_type, true);
  let SE: number[] = getSE(data_array_filtered, data_type, true);
  let y: number[] = getY(data_array_filtered, data_type);
  let z: number[] = getZScore(y, SE, target_od);
  let z_adj: number[] = winsoriseZScore(z);
  let phi: number = getPhi(z_adj);
  let tau2: number = getTau2(phi, SE);

  // Specify the intervals for the limits: 95% and 99.8%
  // TODO(Andrew): Allow user to specify
  let qs: number[] = [0.001, 0.025, 0.975, 0.999].map(p => stats.normal.quantile(p, 0, 1));

  // Generate sequence of values to calculate limits for, specifying that the
  //   limits should extend past the maximum observed denominator by 10% (for clarity)
  let x_range: number[] = seq(1, maxDenominator + maxDenominator*0.1,
                              maxDenominator*0.01).concat(data_array_filtered.denominator);
  let x_range_array: dataArray = {
    id: [],
    numerator: x_range,
    denominator: x_range
  }

  // Converting od_adjust option to boolean. Uses the
  //   estimate of between-unit variance (tau2) to determine whether to
  //   adjust if user wants auto-adjustment
  // tau2 is fixed to zero if the dispersion test is not met
  //    so a value greater than 0 indicates sufficient dispersion
  let od_bool: boolean = (od_adjust == "auto") ? (tau2 > 0) : (od_adjust == "yes");

  let target: number = getTarget(data_array_filtered, data_type, od_bool);

  // Estimate the associated standard error for each denominator value
  let se_range: number[]  = getSE(x_range_array, data_type, od_bool, target);
  let limitsArray: number[][] = getLimit(qs, target, x_range, se_range, tau2, od_bool, data_type).sort((a,b) => a[0] - b[0]);

  // Filtering to handle non-monotonic limits
  limitsArray.map((d,idx) => {
    if(idx < limitsArray.length-1) {
      if(d[1] > limitsArray[idx+1][1]) {
        d[1] = -9999
      }
      if(d[2] > limitsArray[idx+1][2]) {
        d[2] = -9999
      }
      if(d[3] < limitsArray[idx+1][3]) {
        d[3] = -9999
      }
      if(d[4] < limitsArray[idx+1][4]) {
        d[4] = -9999
      }
    }
  })

  let maxRatio: number = d3.max(divide(data_array_filtered.numerator,
                                       data_array_filtered.denominator))

  // For each interval, generate the limit values and sort by ascending order of denominator.
  //    The unadjusted target line is also returned for later plotting.
  return limitsArray.concat([getTarget(data_array_filtered, data_type, false),maxRatio]);
}

export default getLimitsArray;

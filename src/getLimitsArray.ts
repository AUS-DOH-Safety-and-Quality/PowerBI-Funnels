import * as mathjs from "mathjs";
import * as rmath from "lib-r-math.js";
import getTarget from "../src/Funnel Calculations/getTarget";
import getSE from "./Funnel Calculations/getSE";
import getY from "./Funnel Calculations/getY";
import getZScore from "./Funnel Calculations/getZScore";
import winsoriseZScore from "./Funnel Calculations/winsoriseZScore";
import getPhi from "./Funnel Calculations/getPhi";
import getTau2 from "./Funnel Calculations/getTau2";
import getLimit from "./Funnel Calculations/getLimit";

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
function getLimitsArray(numerator: number[], denominator: number[], maxDenominator: number, data_type: string, od_adjust: string) {
    
     // Series of steps to estimate dispersion ratio (phi) and
     //    between-hospital variance (tau2). These are are used to
     //    test and adjust for overdispersion
    let target_od = getTarget(numerator, denominator, data_type, true);
    
    var SE: number[];
    if (data_type == "RC") {
        SE = getSE(numerator, data_type, true, 0, denominator);
    } else {
        SE = getSE(numerator, data_type, true);
    }
    let y = getY(numerator, denominator, data_type);
    let z = getZScore(y, SE, target_od);
    let z_adj = winsoriseZScore(z);
    let phi = getPhi(z_adj);
    let tau2 = getTau2(phi, SE);

    // Specify the intervals for the limits: 95% and 99.8%
    // TODO(Andrew): Allow user to specify
    let qs = rmath.Normal().qnorm([0.001, 0.025, 0.975, 0.999]);

    // Generate sequence of values to calculate limits for, specifying that the
    //   limits should extend past the maximum observed denominator by 10% (for clarity)
    let x_range = rmath.R.seq()()(1, maxDenominator + maxDenominator*0.1, 
                                  maxDenominator*0.01);

    // Converting od_adjust option to boolean. Uses the 
    //   estimate of between-unit variance (tau2) to determine whether to
    //   adjust if user wants auto-adjustment

        // tau2 is fixed to zero if the dispersion test is not met
        //    so a value greater than 0 indicates sufficient dispersion
    var od_bool: boolean = (od_adjust == "auto") ? (tau2 > 0) : (od_adjust == "yes");

    // If unadjusted limits for proportion data are requested then
    //    the unadjusted target line is needed for estimating the
    //    standard errors.
    let target = getTarget(numerator, denominator, data_type, od_bool);
    
    
    // Estimate the associated standard error for each denominator value
    var se_range: number[];
    if (data_type == "RC") {
        se_range = getSE(x_range, data_type, od_bool, 0, x_range);
    } else {
        se_range = getSE(x_range, data_type, od_bool, target);
    }
    let limitsArray = getLimit(qs, target, x_range, se_range, tau2, od_bool, data_type).sort((a,b) => a[0] - b[0]);

    // For each interval, generate the limit values and sort by ascending order of denominator.
    //    The unadjusted target line is also returned for later plotting.
    return limitsArray.concat([getTarget(numerator, denominator, data_type, false)]);
}

export default getLimitsArray;
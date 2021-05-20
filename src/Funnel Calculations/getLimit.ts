import * as rmath from "lib-r-math.js";
import { prop_limit } from "./limitFunctions";
import { smr_limit } from "./limitFunctions";
import { rc_limit } from "./limitFunctions";
import { mn_limit } from "./limitFunctions";

/**
 * Function to generate control limits, either adjusted or un-adjusted.
 *    Adjusted control limits are generated using an additive random
 *    effects adjustment to the normal approximation for each data type.
 * 
 * Unadjusted limits are given by the normal approximation for proportion
 *     data and by the quantiles of the Chi-Squared distribution for
 *     standardised ratio data.
 * 
 * As limits given by the normal approximation can exceed possible values
 *     (e.g., proportions greater than 1 or negative counts) they are
 *     truncated before being returned.
 * 
 * @param q 
 * @param target 
 * @param denominator 
 * @param SE 
 * @param tau2 
 * @param od_adjust 
 * @param data_type 
 * @returns An array where each entry is a two-dimensional array containing
 *              the denominator and the associated standard error
 */
function getLimit(qs: number[], target: number, denominator: number[], SE: number[],
                  tau2: number, od_adjust: boolean, data_type: string):number[][] {
    var limitFunction;

    if (data_type == "PR") {
        limitFunction = prop_limit;
    } else if (data_type == "SR") {
        limitFunction = smr_limit;
    } else if (data_type == "RC") {
        limitFunction = rc_limit;
    } else if (data_type == "mean") {
        limitFunction = mn_limit;
    }

    return denominator.map(
        (d, idx) =>
            [d].concat(
                qs.map(
                    q => limitFunction(q, target, SE[idx], tau2, od_adjust, d))
                )
        );
}

export default getLimit;
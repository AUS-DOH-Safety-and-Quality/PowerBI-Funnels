import * as rmath from "lib-r-math.js";
import truncateLimits from "../Funnel Calculations/truncateLimits"

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
 * @returns 
 */
function getLimit(q: number, target: number, denominator: number[], SE: number[],
                  tau2: number, od_adjust: boolean, data_type: string):number[][] {
    let limits: number[][];

    if (data_type == "PR") {
        if (od_adjust) {
            limits =  SE.map(
                (d, idx) => [denominator[idx],
                             Math.pow(Math.sin(target + q * Math.sqrt(Math.pow(d,2) + tau2)), 2)]
            );
        } else {
            limits = SE.map(
                (d, idx) => [denominator[idx],
                             target + q * d]
            );
        }
    } else if (data_type == "SR") {
        if(od_adjust) {
            limits = SE.map(
                (d, idx) => [denominator[idx],
                             target + q * Math.sqrt(Math.pow(d,2) + tau2)]
            );
        } else {
            let p = rmath.Normal().pnorm(q);
            let is_upper = p > 0.5;
            let offset = is_upper ? 1 : 0;
            limits = denominator.map(
                d => [d,
                      (rmath.ChiSquared().qchisq(p, 2 * (d + offset)) / 2.0) / d]
            );
        }
    }

    return truncateLimits(limits, data_type);
}

export default getLimit;
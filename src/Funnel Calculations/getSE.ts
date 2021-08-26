import * as d3 from "d3";
import { elt_multiply } from "./HelperFunctions"
import { elt_divide } from "./HelperFunctions"
import { all_equal } from "./HelperFunctions"
import { subtract } from "./HelperFunctions"
import { sqrt } from "./HelperFunctions"
import { pow } from "./HelperFunctions"

/**
 * Function to generate standard errors needed for constructing
 *    funnel plot control limits by the normal approximation.
 * 
 * If overdispersion-adjusted limits are required, then the 
 *    standard error for both proportion and standardised ratio
 *    data is given by the inverse square-root of the denominator:
 *      
 *      SE = \frac{1}{2\sqrt{D}}
 * 
 * If unadjusted limits for proportion data are required, then the
 *    standard error is given by:
 *  
 *      r = \frac{\sum N}{\sum D}
 *      SE = \sqrt{\frac{r*(1-r)}{D}}
 * 
 * If unadjusted limits for standardised ratio data are required then
 *    an empty array is returned, as the quantiles of a chi-squared
 *    distribution are used for exact Poisson limits rather than normal
 *    approximation via SE.
 * 
 * @param denominator  - Denominator value to calculate SE for
 * @param data_type    - Data type ("PR","SR")
 * @param adjusted     - Whether the SE is for OD-adjustment (bool)
 * Optional:
 * @param target       - If unadjusted PR limits are requested then
 *                          the target value is needed
 * @returns 
 */
function getSE(data_array: { numerator: number[]; denominator: number[]; sd: number[]; }, 
               data_type: string, adjusted: boolean, target?: number): number[] {
    if (data_type == "PR") {
        if (adjusted) {
            return data_array.denominator.map(d => 1.0 / (2.0 * Math.sqrt(d)));
        } else {
            let se_num: number = target*(1-(target));
            return data_array.denominator.map(d => Math.sqrt(se_num / d));
        }
    } else if (data_type == "SR") {
        if (adjusted) {
            return data_array.denominator.map(d => 1.0 / (2.0 * Math.sqrt(d)));
        } else {
            return [];
        }
    } else if (data_type = "RC") {
        return data_array.denominator.map(
            (d,idx) => Math.sqrt(
                d/Math.pow(d+0.5,2) + data_array.numerator[idx]/Math.pow(data_array.numerator[idx]+0.5,2)
                )
        )
    } else if (data_type = "mean") {
        let sd: number[] = data_array.sd;
        let n: number[] = data_array.denominator;
        let m: number[] = data_array.numerator;
        // If calculating SE for limits, use average SD
        if(all_equal(n, m)) {
          let average_sd: number = d3.sum(sd) / d3.sum(n);
          return elt_divide(average_sd, sqrt(n));
        }
    
        return elt_divide(sd, sqrt(n));
    }
}

export default getSE;
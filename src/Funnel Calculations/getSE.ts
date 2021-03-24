
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
function getSE(denominator, data_type, adjusted, target?) {
    // Adjusted SE is the same, but branching for clarity
    if (data_type == "PR") {
        if (adjusted) {
            return denominator.map(d => 1.0 / (2.0 * Math.sqrt(d)));
        } else {
            let se_num = target*(1-(target));
            return denominator.map(d => Math.sqrt(se_num / d));
        }
    } else if (data_type == "SR") {
        if (adjusted) {
            return denominator.map(d => 1.0 / (2.0 * Math.sqrt(d)));
        } else {
            return [];
        }
    }
}

export default getSE;
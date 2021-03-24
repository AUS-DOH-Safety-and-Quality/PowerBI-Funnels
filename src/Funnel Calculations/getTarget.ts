import * as d3 from "d3";

/**
 * Function for generating the 'target' value for funnel plots. If
 *    the target value will be subsequently used in overdispersion
 *    adjustment, then the transformed target can be returned instead.
 * 
 * The following transformed targets are used:
 *    - Standardised Ratio: Square-root (still results in 1)
 *    - Proportion: Inverse-sine
 * 
 * @param numerator     - Numerator array (e.g., observed deaths)
 * @param denominator   - Denominator array (e.g., expected deaths)
 * @param type          - Data type ("SR", "PR")
 * @param transformed   - Whether a transformed target is needed
 * @returns             - Target value
 */
function getTarget(numerator, denominator, type, transformed) {
    if (type == "SR") {
        return 1.0;
    } else if (type == "PR") {
        let ratio = d3.sum(numerator) / d3.sum(denominator);
        if (transformed) {
            return Math.asin(Math.sqrt(ratio));
        } else {
            return ratio;
        }
    }
}

export default getTarget;
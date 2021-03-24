
/**
 * Function to apply variance-stabilising transform to outcome
 *    prior to calculating z-scores. The following transforms are
 *    used:
 *      - Proportion: Inverse-sine
 *      - Standardised Ratio: Square-root
 * 
 * @param numerator 
 * @param denominator 
 * @param data_type 
 * @returns 
 */
function getY(numerator, denominator, data_type) {
    if (data_type == "PR") {
        return numerator.map(
            (d, idx) => Math.asin(Math.sqrt(d / denominator[idx]))
        );
    } else if (data_type == "SR") {
        return numerator.map(
            (d, idx) => Math.sqrt(d / denominator[idx])
        );
    }
}

export default getY;
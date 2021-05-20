
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
function getY(data_array, data_type: string): number[] {
    let numerator: number[] = data_array.numerator;
    let denominator: number[] = data_array.denominator;
    if (data_type == "PR") {
        return numerator.map(
            (d, idx) => Math.asin(Math.sqrt(d / denominator[idx]))
        );
    } else if (data_type == "SR") {
        return numerator.map(
            (d, idx) => Math.sqrt(d / denominator[idx])
        );
    } else if (data_type == "RC") {
        return numerator.map(
            (d,idx) => Math.log(d+0.5) - Math.log(denominator[idx]+0.5)
        )
    }
}

export default getY;
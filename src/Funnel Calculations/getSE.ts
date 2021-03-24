
function getSE(denominator, data_type, adjusted, target?) {
    // Adjusted SE is the same, but branching for clarity
    if (data_type == "PR") {
        if (adjusted) {
            return denominator.map(d => 1.0 / (2.0 * Math.sqrt(d)));
        } else {
            return denominator.map(d => Math.sqrt(target*(1-(target)) / d));
        }
    } else if (data_type == "SR") {
        if (adjusted) {
            return denominator.map(d => 1.0 / (2.0 * Math.sqrt(d)));
        } else {
            // Unadjusted SE doesn't exist, as quantiles of a chi-squared
            //   distribution are used for exact Poisson limits rather
            //   than normal approximation via SE
            return [];
        }
    }
}

export default getSE;
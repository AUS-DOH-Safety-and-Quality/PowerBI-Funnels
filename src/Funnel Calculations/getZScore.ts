
/**
 * Generate (un-adjusted) z-scores using transformed
 * observations and standard errors
 * 
 * @param y 
 * @param SE 
 * @param target 
 * @returns 
 */
function getZScore(y, SE, target) {
    return y.map(
        (d, idx) => (d - target) / SE[idx]
    );
}

export default getZScore;
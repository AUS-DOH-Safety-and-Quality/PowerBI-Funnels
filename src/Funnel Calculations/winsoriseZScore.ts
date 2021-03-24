import * as mathjs from "mathjs";

/**
 * Winsorise unadjusted z-scores to remove influence of
 *    extreme observations prior to assessing/correcting
 *    for dispersion.
 * 
 * @param z 
 * @returns 
 */
function winsoriseZScore(z: number[]) {
    let lower_z = +mathjs.quantileSeq(z, 0.1);
    let upper_z = +mathjs.quantileSeq(z, 0.9);
    return z.map(d => {if (d < lower_z) {
        return lower_z;
    } else if (d > upper_z) {
        return upper_z;
    } else {
        return d;
    }});
}

export default winsoriseZScore;
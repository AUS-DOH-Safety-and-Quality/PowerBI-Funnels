import * as mathjs from "mathjs";

function winsoriseZScore(z) {
    let lower_z = mathjs.quantileSeq(z, 0.1);
    let upper_z = mathjs.quantileSeq(z, 0.9);
    return z.map(d => {if (d < lower_z) {
        return lower_z;
    } else if (d > upper_z) {
        return upper_z;
    } else {
        return d;
    }});
}

export default winsoriseZScore;
import * as d3 from "d3";

function getTarget(numerator, denominator, type, adjusted) {
    if (type == "SR") {
        return 1.0;
    } else if (type == "PR") {
        let ratio = d3.sum(numerator) / d3.sum(denominator);
        if (adjusted) {
            return Math.asin(Math.sqrt(ratio));
        } else {
            return ratio;
        }
    }
}

export default getTarget;
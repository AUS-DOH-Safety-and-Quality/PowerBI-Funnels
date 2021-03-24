import * as mathjs from "mathjs";
import * as rmath from "lib-r-math.js";
import getTarget from "../src/Funnel Calculations/getTarget";
import getSE from "./Funnel Calculations/getSE";
import getY from "./Funnel Calculations/getY";
import getZScore from "./Funnel Calculations/getZScore";
import winsoriseZScore from "./Funnel Calculations/winsoriseZScore";
import getPhi from "./Funnel Calculations/getPhi";
import getTau2 from "./Funnel Calculations/getTau2";
import getLimit from "./Funnel Calculations/getLimit";

function getLimitsArray(numerator, denominator, maxDenominator, data_type, od_adjust) {
    let target_od = getTarget(numerator, denominator, data_type, true);
    let SE = getSE(numerator, data_type, true);
    let y = getY(numerator, denominator, data_type);
    let z = getZScore(y, SE, target_od);
    let z_adj = winsoriseZScore(z);
    let phi = getPhi(z_adj);
    let tau2 = getTau2(phi, SE);

    let q99 = rmath.Normal().qnorm([0.001, 0.999]);
    let q95 = rmath.Normal().qnorm([0.025, 0.975]);

    let x_range = rmath.R.seq()()(1, maxDenominator + maxDenominator*0.1, 0.5);

    if(od_adjust == "auto") {
        if(tau2 > 0) {
            od_adjust = true;
        } else {
            od_adjust = false;
        }
    } else if (od_adjust == "yes") {
        od_adjust = true;
    } else {
        od_adjust = false;
    }

    let target = getTarget(numerator, denominator, data_type, od_adjust);
    let se_range = getSE(x_range, data_type, od_adjust, target);

    return [
            getLimit(q99[0], target, x_range, se_range, tau2, od_adjust, data_type).sort((a,b) => a[0] - b[0]),
            getLimit(q95[0], target, x_range, se_range, tau2, od_adjust, data_type).sort((a,b) => a[0] - b[0]),
            getLimit(q95[1], target, x_range, se_range, tau2, od_adjust, data_type).sort((a,b) => a[0] - b[0]),
            getLimit(q99[1], target, x_range, se_range, tau2, od_adjust, data_type).sort((a,b) => a[0] - b[0]),
            getTarget(numerator, denominator, data_type, false)
    ];
}

export default getLimitsArray;
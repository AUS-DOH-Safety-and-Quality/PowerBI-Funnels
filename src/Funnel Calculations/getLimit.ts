import * as rmath from "lib-r-math.js";

function getLimit(q, target, denominator, SE, tau2, od_adjust, data_type) {
    var limits;

    if (data_type == "PR") {
        if (od_adjust) {
            limits =  SE.map(
                (d, idx) => [denominator[idx],
                             Math.pow(Math.sin(target + q * Math.sqrt(Math.pow(d,2) + tau2)), 2)]
            );
        } else {
            limits = SE.map(
                (d, idx) => [denominator[idx],
                             target + q * d]
            );
        }
        return limits.map(d => {
            if (d[1] > 1.0) {
                return [d[0], 1.0];
            } else if (d[1] < 0.0) {
                return [d[0], 0.0];
            } else {
                return d;
            }
        });
    } else if (data_type == "SR") {
        if(od_adjust) {
            limits = SE.map(
                (d, idx) => [denominator[idx],
                             target + q * Math.sqrt(Math.pow(d,2) + tau2)]
            );
        } else {
            let p = rmath.Normal().pnorm(q);
            let is_upper = p > 0.5;
            let offset = is_upper ? 1 : 0;
            limits = denominator.map(
                d => [d,
                      (rmath.ChiSquared().qchisq(p, 2 * (d + offset)) / 2.0) / d]
            );
        }
        return limits.map(d => {
            if (d[1] < 0.0) {
                return [d[0], 0.0];
            } else {
                return d;
            }
        });
    }
}

export default getLimit;
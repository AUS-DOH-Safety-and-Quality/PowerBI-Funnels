import * as rmath from "lib-r-math.js";

function prop_limit(q, target, SE, tau2, od_adjust, denominator) {
    var limit: number;
    if (od_adjust) {
        limit = Math.pow(Math.sin(target + q * Math.sqrt(Math.pow(SE,2) + tau2)), 2)
    } else {
        limit = target + q * SE;
    }

    if (limit > 1.0) {
        return 1.0;
    } else if (limit < 0.0) {
        return 0.0;
    } else {
        return limit;
    }
}

function smr_limit(q, target, SE, tau2, od_adjust, denominator) {
    var limit: number;
    if (od_adjust) {
        limit = target + q * Math.sqrt(Math.pow(SE,2) + tau2);
    } else {
        let p = rmath.Normal().pnorm(q);
        let is_upper = p > 0.5;
        let offset = is_upper ? 1 : 0;

        limit = (rmath.ChiSquared().qchisq(p, 2 * (denominator + offset)) / 2.0)
                / denominator;
    }

    if (limit < 0.0) {
        return 0.0;
    } else {
        return limit;
    }
}

function rc_limit(q, target, SE, tau2, od_adjust, denominator) {
    var limit: number;
    if (od_adjust) {
        limit = Math.exp(target + q * Math.sqrt(Math.pow(SE,2) + tau2));
    } else {
        limit = Math.exp(Math.log(target) + q * SE);
    }

    if (limit < 0.0) {
        return 0.0;
    } else {
        return limit;
    }
}

function mn_limit(q, target, SE, tau2, od_adjust, denominator) {
    var limit: number;
    if (od_adjust) {
        limit = target + q * Math.sqrt(Math.pow(SE,2) + tau2);
    } else {
        limit = target + q * SE;
    }

    if (limit < 0.0) {
        return 0.0;
    } else {
        return limit;
    }
}

export { prop_limit }
export { smr_limit }
export { rc_limit }
export { mn_limit }
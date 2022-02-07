import * as stats from '@stdlib/stats/base/dists';

function prop_limit(q: number, target: number, SE: number, tau2: number,
                    od_adjust: boolean, denominator: number): number {
    var limit: number;
    if (od_adjust) {
        limit = Math.pow(Math.sin(target + q * Math.sqrt(Math.pow(SE, 2) + tau2)), 2)
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

function smr_limit(q: number, target: number, SE: number, tau2: number,
                   od_adjust: boolean, denominator: number): number {
    var limit: number;
    if (od_adjust) {
        limit = target + q * Math.sqrt(Math.pow(SE,2) + tau2);
    } else {
        let p: number = stats.normal.cdf(q, 0, 1);
        let is_upper: boolean = p > 0.5;
        let offset: number = is_upper ? 1 : 0;

        limit = (stats.chisquare.quantile(p, 2 * (denominator + offset)) / 2.0)
                / denominator;
    }

    if (limit < 0.0) {
        return 0.0;
    } else {
        return limit;
    }
}

function rc_limit(q: number, target: number, SE: number, tau2: number,
                  od_adjust: boolean, denominator: number): number {
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

function mn_limit(q: number, target: number, SE: number, tau2: number,
                  od_adjust: boolean, denominator: number): number {
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
import * as rmath from "lib-r-math.js";

function getTau2(phi, SE) {
    let N = SE.length;
    if (N * phi < N - 1) { return 0.0; }
    let w = SE.map(d => d*d).map(d => 1.0 / d);
    let w_sq = w.map(d => d*d);
    let w_sum = rmath.R.sum(w);
    let w_sq_sum = rmath.R.sum(w_sq);
    let tau_num = (N * phi) - (N - 1.0);
    let tau_denom = w_sum - (w_sq_sum / w_sum);
    return tau_num / tau_denom;
}

export default getTau2;
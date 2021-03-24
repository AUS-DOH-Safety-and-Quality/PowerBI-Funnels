function truncateLimits(limits, data_type) {
    if (data_type == "PR") {
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
        return limits.map(d => {
            if (d[1] < 0.0) {
                return [d[0], 0.0];
            } else {
                return d;
            }
        });
    }
}

export default truncateLimits;
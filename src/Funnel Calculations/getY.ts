function getY(numerator, denominator, data_type) {
    if (data_type == "PR") {
        return numerator.map(
            (d, idx) => Math.asin(Math.sqrt(d / denominator[idx]))
        );
    } else if (data_type == "SR") {
        return numerator.map(
            (d, idx) => Math.sqrt(d / denominator[idx])
        );
    }
}

export default getY;